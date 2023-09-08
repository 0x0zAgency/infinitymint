const { run, ethers, deployments, getChainId } = require('hardhat');
const Controller = require('../src/Controller');
const { delay, getContract } = require('../src/helpers');
const Gems = require('../src/Gems');
const ipfsController = require('../src/ipfsController');

/**
 * Main
 * @returns
 */
async function main() {
    //read temp projectFile
    let tempProjectFile = JSON.parse(
        Controller.readInformation('./.temp_project')
    );

    //get settings for this contract
    let contractSettings = Controller.getContractConfig(
        tempProjectFile.modules.controller
    );

    await Gems.loadMods();

    if (tempProjectFile.mods !== undefined) {
        console.log('\n> Enabling Gems 💎\n'.cyan);
        Gems.enableMods(tempProjectFile.mods);
    }

    //ethers deployment helpers
    let { get, deploy } = deployments;
    //VERY GREASY HACK
    let oldDeploy = deploy;
    deploy = async (name, options) => {
        name = getFullyQualifiedName(name);
        return await oldDeploy(name, options);
    };

    let accounts = await ethers.getSigners(); //accounts
    const chainId = await getChainId(); //chain id

    //If no linker just assume default linker
    if (tempProjectFile.modules.linker === undefined)
        tempProjectFile.modules.linker = 'InfinityMintLinker';

    //create new ethers classes so we can talk to everything
    let storageContract;
    let erc721Contract;
    let assetContract;
    let randomContract;
    let linkerContract;

    //get the contract addresses
    storageContract = await getContract('InfinityMintStorage');
    erc721Contract = await getContract('InfinityMint');
    assetContract = await getContract(
        tempProjectFile.modules.svg || tempProjectFile.modules.controller
    );
    randomContract = await getContract(tempProjectFile.modules.random);
    linkerContract = await getContract(tempProjectFile.modules.linker);

    if (
        !Controller.deployConfig.copyContent ||
        Controller.deployConfig.useLocalAndIPFSContent
    ) {
        Controller.log('- initializing web3.storage');

        if (
            Controller.deployConfig.ipfs.apiKey === undefined ||
            Controller.deployConfig.ipfs.apiKey.length === 0
        )
            throw new Error(
                'IPFS API key is not defined in environment variables'
            );

        ipfsController.createInstance(Controller.deployConfig.ipfs.apiKey);
    }

    //initialize these things
    if (tempProjectFile.stages === undefined) tempProjectFile.states = {};

    if (tempProjectFile.errors === undefined) tempProjectFile.errors = {};

    if (tempProjectFile.names === undefined) tempProjectFile.names = [];

    //make export folders
    try {
        console.log('\n> Making folders for export\n'.cyan);
        let module = await Controller.getVersionModule();
        module.makeFolders();
    } catch (error) {
        console.log('ERROR: failed to make folders'.red);
        console.log(error);
        console.log('continuing in two seconds...');
        await delay(2);
    }

    // Actual code and stuff begins
    //TODO: Replace with GUID
    if (tempProjectFile.id === undefined)
        tempProjectFile.id = Math.floor(Math.random() * 10000);

    tempProjectFile.paths = {
        ...tempProjectFile.paths,
        ...(tempProjectFile.paths.indexes || {}),
    };

    if (tempProjectFile.paths.indexes !== undefined)
        delete tempProjectFile.paths.indexes;

    if (contractSettings.setupModule == undefined)
        throw new Error(
            'contract settings for ' +
                tempProjectFile.modules.controller +
                ' are bad'
        );

    //define links
    if (tempProjectFile.links === undefined) {
        Controller.log(
            '- project links undefined in project file adding default'
        );
        tempProjectFile.links = [
            ...(Controller.deployConfig.addDefaultLinks
                ? Controller.deployConfig.defaultLinks
                : []),
        ];
        //add default links
    }

    //add default options to all of the links
    if (
        tempProjectFile.links.length !== 0 &&
        tempProjectFile.links instanceof Array === true
    )
        tempProjectFile.links = tempProjectFile.links.map((link) => {
            return {
                ...Controller.deployConfig.defaultLinks[0],
                key: null,
                deployFakeContract: false,
                deployable: false,
                args: [],
                ...link,
            };
        });

    if (
        Object.keys(tempProjectFile.paths).filter((key) => key !== 'default')
            .length === 0
    )
        throw new Error('No paths in project');

    //read tx receipts from
    Controller.loadReceipts();
    Controller.loadIPFSCache();

    /**
     * Random number contract
     */

    if (tempProjectFile.stages['random'] !== true) {
        console.log('\n> Configuring Random Contract\n'.magenta);
        Controller.log('- Calling setup');
        let tx = await randomContract.setup(
            InfinityMint.address,
            InfinityMintStorage.address,
            AssetModule.address
        );
        await tx.wait();
        Controller.log(' ☻ Success'.green);

        //add to stages
        tempProjectFile.stages['random'] = true;
        console.log('[✔️] Passed');
    }

    //select which set up script to go with
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    //if we have assets, then the Controller is going to upload those assets to IPFS for us and add them to
    //the contract for us and set them up
    try {
        if (tempProjectFile.stages['assets'] != true) {
            if (
                tempProjectFile.errors !== undefined &&
                tempProjectFile.errors['assets']
            ) {
                Controller.log('- Resetting assets due to previous error');
                await assetContract.resetAssets();
            }

            if (
                tempProjectFile.assets !== undefined &&
                Object.keys(tempProjectFile.assets).length !== 0
            ) {
                tempProjectFile = await Controller.uploadAssets(
                    tempProjectFile,
                    assetContract
                );

                if (tempProjectFile === null || tempProjectFile === undefined)
                    throw new Error('tempProjectFile is null');
            }

            tempProjectFile.stages['assets'] = true;

            if (tempProjectFile.errors['assets'] !== undefined)
                delete tempProjectFile.errors['assets'];
        }
    } catch (error) {
        if (tempProjectFile.errors == undefined) tempProjectFile.errors = {};

        tempProjectFile.errors['assets'] = {
            message: error.message,
            stack: error.stack,
        };

        //select which set up script to go with
        Controller.log('- Writing temp_uri');
        Controller.writeInformation(tempProjectFile, './.temp_project');
        throw error;
    }

    //Write temp_uri to save progress
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    //if we have paths, then the Controller is going to upload those paths to IPFS for us and add them to
    //the contract
    if (tempProjectFile.stages['setupScript'] !== true) {
        let script = contractSettings.setupModule;
        let module;
        try {
            console.log('- importing ' + './setups/' + script);
            module = await require('./setups/' + script);
            module = module.default || module;
        } catch (error) {
            console.log('bad module probably not found');
            console.log(error);
            throw error;
        }

        //select which set up script to go with
        Controller.log('- Writing temp_uri');
        Controller.writeInformation(tempProjectFile, './.temp_project');

        //call it
        console.log(
            (
                '\n> Calling setup script for ' +
                tempProjectFile.modules.controller +
                ' => ' +
                script +
                '\n'
            ).cyan
        );
        try {
            tempProjectFile = await module.bind(this)({
                tempProjectFile: tempProjectFile,
                assetContract: assetContract,
                erc721Contract: erc721Contract,
                storageContract: storageContract,
            });
            //add to stages
            tempProjectFile.stages['setupScript'] = true;
            console.log('[✔️] Passed');
        } catch (error) {
            console.log('failed setup script');
            console.error(error);

            if (tempProjectFile.errors['setupScript'] === undefined)
                tempProjectFile['setupScript'] = {};

            tempProjectFile['setupScript'] = {
                message: error.message,
                stack: error.stack,
            };

            //select which set up script to go with
            Controller.log('- Writing temp_uri');
            Controller.writeInformation(tempProjectFile, './.temp_project');

            //save it
            throw error;
        }
    }

    //select which set up script to go with
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['content'] !== true) {
        console.log(
            '\n> Processing extra path content (background images, tunes, etc)\n'
                .magenta
        );

        if (tempProjectFile.deployment.matchedMode) tempProjectFile.names = [];

        let paths = Object.keys(tempProjectFile.paths)
            .filter((key) => key !== 'default')
            .map((key) => tempProjectFile.paths[key]);
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];

            if (tempProjectFile.deployment.matchedMode) {
                Controller.log('- adding ' + path.name);
                tempProjectFile.names.push(path.name);
            }

            if (path.content !== undefined) {
                let content = Object.values(path.content);
                let keys = Object.keys(path.content);
                content = content.map((value, index) => {
                    if (
                        value === undefined ||
                        value === null ||
                        typeof value === 'object'
                    )
                        return {};

                    let extension = value.split('.').pop().toLowerCase();
                    return {
                        pathId: path.pathId,
                        fileName: value,
                        contentIndex: index,
                        key: keys[index],
                        extension: extension,
                        type: extension,
                        ipfsFileName: `${index}_${keys[index]}`,
                    };
                });

                let finalContent = {};
                for (let i = 0; i < content.length; i++) {
                    let obj = content[i];

                    if (obj.fileName === undefined) continue;

                    obj.paths = await Controller.uploadObject(
                        obj,
                        obj.ipfsFileName
                    );

                    //set IPFS URL in path if we are IPFS
                    if (obj.paths.ipfs === true) {
                        obj.paths.ipfsURL =
                            Controller.deployConfig.ipfs.publicGateway +
                            `${obj.paths.cid}/${obj.ipfsFileName}${
                                obj.paths.extension.length === 0
                                    ? ''
                                    : '.' + obj.paths.extension
                            }`;
                        console.log('- set IPFS url to ' + obj.paths.ipfsURL);
                    }

                    finalContent[obj.key] = obj;
                }

                paths[i].content = finalContent;
            } else {
                Controller.log(
                    '- skipping path ' + path.pathId + ' as no content'
                );
            }
        }

        tempProjectFile.paths = {
            ...paths,
            default: { ...(tempProjectFile.paths?.default || {}) },
        };
        tempProjectFile.stages['content'] = true;
        console.log('[✔️] Passed');
    }

    //select which set up script to go with
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.names !== undefined) {
        //if length of the names array is less than 50
        if (
            tempProjectFile.names.length <
            (Controller.deployConfig.nameChunkSize || 10)
        ) {
            tx = await assetContract.setNames(tempProjectFile.names);
            tx = await tx.wait();
            Controller.logTx(tx);
        } else {
            //will upload names in lots of 50
            let left = [...tempProjectFile.names].reverse();
            while (left.length !== 0) {
                let selection = [];
                for (
                    let i = 0;
                    i < (Controller.deployConfig.nameChunkSize || 10);
                    i++
                ) {
                    if (left.length === 0) break;
                    selection.push(left.pop());
                }

                Controller.log(
                    '- setting chunk of names size ' +
                        selection.length +
                        ' with ' +
                        left.length +
                        ' names left'
                );
                tx = await assetContract.combineNames(selection);
                tx = await tx.wait();
                Controller.logTx(tx);
            }
        }
    } else Controller.log('names are not defined in object URI');
    Controller.log(' ☻ Success'.green);

    if (tempProjectFile.stages['modifyProject'] != true) {
        console.log(
            '\n> Modifying project file with additional information\n'.magenta
        );

        Controller.log(
            '- Adding contract addresses from deploy info to project file'
        );
        let deployInfo = Controller.readInformation('./.deployInfo', true);
        tempProjectFile.contracts = {
            ...deployInfo.contracts,
        };
        tempProjectFile.project = Controller.deployConfig.project;
        tempProjectFile.deployTime = Date.now();
        tempProjectFile.deployer = accounts[0].address;
        tempProjectFile.approved = [...(tempProjectFile.approved || [])];

        //if we are ganache add the ganache accounts to the approved
        if (parseInt(chainId) === 1337)
            tempProjectFile.approved = [
                ...tempProjectFile.approved,
                ...accounts.map((account) => account.address),
            ];

        //remove duplicates
        tempProjectFile.approved = tempProjectFile.approved.filter(
            (val) =>
                tempProjectFile.approved.filter((val2) => val == val2)
                    .length === 1
        );
        tempProjectFile.stages['modifyProject'] = true;
        console.log('[✔️] Passed');
    }

    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['permissions'] !== true) {
        console.log('\n> Setting Contract Permissions\n'.magenta);

        let result = await Controller.executeNodeScript(
            'scripts/setPermissions.js'
        );

        if (result !== 0) throw new Error('Failed permissions');

        tempProjectFile.stages['permissions'] = true;
        console.log('[✔️] Passed');
    }

    //write to save stage progress
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (!Controller.deployConfig.skipWalletSetApproved) {
        if (tempProjectFile.stages['setApproved'] != true) {
            console.log('\n> Approving Admins\n'.magenta);
            let result = await Controller.executeNodeScript(
                'scripts/setApproved.js'
            );

            if (result !== 0) {
                console.log(
                    'CRITICAL WARNING: Failed to approve wallets on main ERC721, re-run this command at a later date...'
                        .red
                );
                await delay(5);
                Controller.log('Continuing in 5 seconds...'.red);
                await delay(5);
            }

            Controller.log(' ☻ Success'.green);
            tempProjectFile.stages['setApproved'] = true;
        }
    }

    //write to save stage progress
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    let mods = Gems.getScriptMethods();

    if (tempProjectFile.stages['setup_mods'] === undefined) {
        if (mods.length !== 0) {
            console.log('\n> Calling Setup For Gems 💎\n'.magenta);
            let projectFile = await Controller.getProjectFile();

            for (let i = 0; i < mods.length; i++) {
                let value = mods[i];
                try {
                    if (
                        tempProjectFile.stages['setup_mod_' + value.mod] ===
                        undefined
                    ) {
                        console.log(('[💎] Refining ' + value.mod + '\n').gray);
                        let result = await value.method.bind(this, {
                            get,
                            accounts,
                            tempProjectFile: tempProjectFile,
                            projectFile,
                            deployer: tempProjectFile.deployer,
                            getAssetControllerAddress: () => {
                                return tempProjectFile.contracts[
                                    tempProjectFile.modules.controller
                                ];
                            },
                            getMinterAddress: () => {
                                return tempProjectFile.contracts[
                                    tempProjectFile.modules.minter
                                ];
                            },
                            liveDeployments: { ...tempProjectFile.contracts },
                            ethers,
                            chainId,
                        })();

                        if (result !== null && typeof result === 'object')
                            tempProjectFile = {
                                ...tempProjectFile,
                                ...result,
                                links: result.links,
                            };

                        console.log(`\n[💎] Refinement Successful\n`.cyan);
                        tempProjectFile.stages['setup_mod_' + value.mod] = true;
                    }
                    Controller.log('- Writing temp_uri');
                    Controller.writeInformation(
                        tempProjectFile,
                        './.temp_project'
                    );
                } catch (error) {
                    if (tempProjectFile.errors === undefined)
                        tempProjectFile.errors = {};

                    tempProjectFile.errors['setup_mod_' + value.mod] = {
                        message: error.message,
                        stack: error.stack,
                    };

                    //write tempUI with stage progress incase we fail
                    Controller.log('- Writing temp_uri');
                    Controller.writeInformation(
                        tempProjectFile,
                        './.temp_project'
                    );
                    console.log(`failed to deploy mod [${value.mod}]: `.red);
                    throw error;
                }
            }
        }

        tempProjectFile.stages['setup_mods'] = true;
        console.log('[✔️] Passed');
    }

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (
        tempProjectFile.links === undefined ||
        typeof tempProjectFile.links !== 'object' ||
        Object.values(tempProjectFile.links).length === 0
    ) {
        console.log(
            'WARNING: ERC721 Token Links are empty which is not good as you should have some default ones like sticker and wallet, please double check this okay for your config'
                .red
        );
        console.log('skipping linker setup in 2 seconds...'.gray);
        await delay(2);
    } else if (tempProjectFile.stages['setupLinker'] !== true) {
        try {
            if (Controller.deployConfig.assertWalletAndStickerIndex) {
                console.log('\n> Checking project links\n'.magenta);
                if (
                    tempProjectFile.links[0] === undefined ||
                    tempProjectFile.links[0].key !== 'wallet'
                )
                    throw new Error(
                        'link index 0 is not wallet or undefined and assetWalletAndStickerIndex is toggled'
                    );

                if (
                    tempProjectFile.links[1] === undefined ||
                    tempProjectFile.links[1].key !== 'stickers'
                )
                    throw new Error(
                        'link index 1 is not stickers or undefined and assetWalletAndStickerIndex is toggled'
                    );
            }

            console.log('\n> Setting up ERC721 Linker Contract\n'.magenta);
            if (tempProjectFile.errors['setupLinker'] !== undefined) {
                let tx = await linkerContract.clearLinks();
                Controller.logTx(await tx.wait());
                Controller.log(' ☻ Success'.green);
            }

            Controller.log('- Writing temp_uri');
            Controller.writeInformation(tempProjectFile, './.temp_project');
            let result = await Controller.executeNodeScript(
                'scripts/deployLinker.js',
                ['false']
            );

            if (result !== 0) throw new Error('failed to deploy linker');
            else {
                tempProjectFile = Controller.readInformation(
                    './.temp_project',
                    true
                ); //read tempURI again incase linker changed stuff
                Controller.log(' ☻ Success'.green);

                //rebuild link array to object be based on keys of links
                let tempLink = {};
                tempProjectFile.links.forEach((link) => {
                    tempLink[link.key] = { ...link };
                });
                tempProjectFile.links = tempLink;
                tempProjectFile.stages['setupLinker'] = true;
                console.log('[✔️] Passed');
            }
        } catch (error) {
            if (tempProjectFile.errors === undefined)
                tempProjectFile.errors = {};

            tempProjectFile.errors['setupLinker'] = {
                message: error.message,
                stack: error.stack,
            };

            //write tempUI with stage progress incase we fail
            Controller.log('- Writing temp_uri');
            Controller.writeInformation(tempProjectFile, './.temp_project');
            throw error;
        }
    }

    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    //if our chain is ganache lets try and deploy the mock sticker and wallet contracts so we get ABIs :)
    if (tempProjectFile.stages['deployFakeContracts'] !== true) {
        if (parseInt(chainId) === 1337) {
            console.log('\n> Deploying Fake Contracts\n'.magenta);
            let result = await Controller.executeNodeScript(
                'scripts/deployFakeContracts.js',
                [],
                false
            );

            if (result !== 0) {
                console.log(
                    'WARNING: Failed to deploy fake contracts this is critical and must be done at least once... please run the command node scripts/deployFakeContracts.js again in the future before you deploy to production.'
                        .red
                );
                await delay(5);
                console.log('Continuing in 5 seconds...'.red);
                await delay(5);
            } else Controller.log(' ☻ Success'.green);
        } else {
            console.log('\n> Skipped Fake Contracts'.orange);
        }
        Controller.log('- Reading temp_uri and setting as project file');
        tempProjectFile = JSON.parse(
            Controller.readInformation('./.temp_project')
        ); //read again after
        tempProjectFile.stages['deployFakeContracts'] = true;
    }

    //write tempUI so set project script can set it
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    //copy mod files into the react repository
    if (tempProjectFile.stages['copyMods'] !== true) {
        console.log('\n> Copying Mods Into React Folder\n'.magenta);
        await Controller.executeNodeScript('scripts/copyMods.js');
        Controller.log(' ☻ Success'.green);

        Controller.log('- Reading temp_uri and setting as temp project file');
        tempProjectFile = JSON.parse(
            Controller.readInformation('./.temp_project')
        );
        tempProjectFile.stages['copyMods'] = true;
    }

    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['copyScripts'] !== true) {
        console.log('\n> Copying Assets & Styles Into React\n'.magenta);
        await Controller.copyScripts(
            tempProjectFile.modules.controller,
            false,
            tempProjectFile.modules.renderScript
        );
        Controller.log(' ☻ Success'.green);

        tempProjectFile.stages['copyScripts'] = true;
        console.log('[✔️] Passed');
    }

    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');
    if (tempProjectFile.stages['copyContent'] !== true) {
        if (Controller.deployConfig.copyContent) {
            console.log('\n> Copying assets into react folder\n'.magenta);
            let result = await Controller.executeNodeScript(
                'scripts/copyFiles.js'
            );

            if (result !== 0) {
                console.log(
                    'CRITICAL WARNING: Failed to copy over files, rerun the command at a later date. Assets/Paths might not load on reacts end.'
                        .red
                );
                await delay(5);
                Controller.log('Continuing in 5 seconds...'.red);
                await delay(5);
            } else {
                Controller.log(' ☻ Success'.green);
            }
        }
        //read the project file again after both copy methods
        Controller.log('- Reading temp_uri and setting as temp project file');
        tempProjectFile = Controller.readInformation('./.temp_project', true);

        tempProjectFile.stages['copyContent'] = true;
    }

    //finallyl, c
    try {
        Controller.log(' ☻ Success'.green);
        Controller.log('- Copying project file and ABI to React Project');
        await Controller.copyBuild(tempProjectFile);
    } catch (error) {
        Controller.log('FAILURE TO COPY BUILD'.red);
        console.log(error);
    }

    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');
    //finally, set the project on chain
    if (tempProjectFile.stages['setProject'] !== true) {
        console.log('\n> Setting project file on chain\n'.magenta);

        let result = await Controller.executeNodeScript(
            'scripts/setProject.js'
        );

        if (result !== 0) {
            console.log(
                'CRITICAL WARNING: Failed to set project, re-run this command at a later date...'
                    .red
            );
            await delay(5);
            Controller.log('Continuing in 5 seconds...'.red);
            await delay(5);
        }
        console.log('[✔️] Passed');
    }

    tempProjectFile = { ...tempProjectFile, stages: {}, errors: {} };
    //write the final file locally
    Controller.log('- writing deployed project to projects folder');
    Controller.writeInformation(
        tempProjectFile,
        './projects/' + Controller.deployConfig.project.split('.')[0] + '.json'
    );
    Controller.log(' ☻ Success'.green);

    Controller.log('- Saving Settings');
    Controller.saveSettings();

    //save tx receipts to file
    Controller.saveReceipts();
    Controller.log(' ☻ Success'.green);
    Controller.log('\n > Setup Complete\n'.magenta);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
