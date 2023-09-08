const { run, ethers, deployments, getChainId } = require('hardhat');
const Controller = require('../../../src/Controller');
const Gems = require('../../../src/Gems');
const { v4: uuidv4 } = require('uuid');

const rollbackDeployments = (path) => {
    //add the end copy back the parents shit
    console.log('- Reintroducing parent contracts to deployment folder');
    files = Controller.getFileSystem()
        .readdirSync('./temp/cloneMachine/', {
            withFileTypes: true,
        })
        .filter((file) => !file.isDirectory())
        .map((file) => file.name);
    files.forEach((file) => {
        console.log(
            '- copying /temp/cloneMachine/' + file + ' back to ' + path + file
        );
        Controller.getFileSystem().copyFileSync(
            './temp/cloneMachine/' + file,
            path + file
        );
    });
};

const deployMods = async (
    cloneProjectFile,
    projectFile,
    deployInfo,
    contracts,
    get,
    deploy,
    deployer,
    chainId
) => {
    let mods = Gems.getDeployMethods();

    if (mods.length !== 0) {
        console.log('\n> Deploying Gems 💎\n'.magenta);
        let deployedMods = {};

        cloneProjectFile.deployedMods = {};
        for (let i = 0; i < mods.length; i++) {
            let value = mods[i];

            if (
                (Gems.mods[value.mod].manifest?.disabled || []).filter(
                    (mod) => mod == value.mod
                ).length !== 0
            ) {
                console.log('- Mod is disabled to cloneMachine skipping');
                continue;
            }

            console.log(
                (' -> Calling deploy method for ' + value.mod + '\n').cyan
            );
            deployedMods[value.mod] = await value.method.bind(this, {
                get: get,
                deploy: deploy,
                log: (msg) => console.log(msg),
                cloneProjectFile: cloneProjectFile,
                projectFile: projectFile,
                deployer: deployer,
                deployments: deployments,
                liveDeployments: {
                    InfinityMint: contracts['InfinityMint'].address,
                    InfinityMintApi: contracts['InfinityMintApi'].address,
                    InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
                    InfinityMintStorage:
                        contracts['InfinityMintStorage'].address,
                    InfinityMintValues: deployInfo.contracts.InfinityMintValues,
                    InfinityMintProject:
                        deployInfo.contracts.InfinityMintProject,
                    InfinityMintLinker: contracts['InfinityMintLinker'].address,
                    InfinityMintAsset: deployInfo.contracts.InfinityMintAsset,
                    InfinityMintRoyalty:
                        contracts['InfinityMintRoyalty'].address,
                    InfinityMintRandomNumber:
                        deployInfo.contracts.InfinityMintRandomNumber,
                },
                ethers: ethers,
                chainId: chainId,
            })();

            if (
                deployedMods[value.mod] === undefined ||
                deployedMods[value.mod] === null
            ) {
                Controller.log(
                    '- mod ' +
                        value.mod +
                        ' did not return any deployed contracts'
                );
                cloneProjectFile.deployedMods[value.mod] = {
                    ...Gems.mods[value.mod],
                    contracts: {},
                    receipts: [],
                };
            } else {
                let contracts = {};
                if (deployedMods[value.mod] instanceof Array === true) {
                    deployedMods[value.mod].forEach((mod) => {
                        contracts[mod.contractName] = mod.address;
                    });
                } else {
                    contracts[deployedMods[value.mod].contractName] =
                        deployedMods[value.mod].address;
                }

                let receipts =
                    deployedMods[value.mod] instanceof Array !== true
                        ? [deployedMods[value.mod]]
                        : deployedMods[value.mod];
                receipts = receipts.map((receipt) => {
                    return {
                        ...receipt,
                        abi: {},
                        bytecode: 0x0,
                        deployedBytecode: 0x0,
                        evm: {},
                        solcInput: '',
                        metadata: '',
                    };
                });
                cloneProjectFile.deployedMods[value.mod] = {
                    ...Gems.mods[value.mod],
                    contracts: contracts,
                    receipts: receipts,
                };
            }

            console.log('[💎] Gem Deployed: ' + value.mod);
            cloneProjectFile.contracts = {
                ...cloneProjectFile.contracts,
                ...contracts[deployedMods[value.mod].contractName],
            };
        }
    }
};

const setupMods = async (
    cloneProjectFile,
    projectFile,
    deployInfo,
    contracts,
    get,
    deploy,
    deployer,
    chainId,
    accounts
) => {
    let mods = Gems.getScriptMethods();

    //get the abis for all the contracts in our system
    let abis = {
        InfinityMint: await ethers.getContractFactory('InfinityMint'),
        InfinityMintStorage: await ethers.getContractFactory(
            'InfinityMintStorage'
        ),
        AssetModule: await ethers.getContractFactory(
            cloneProjectFile.modules.svg || cloneProjectFile.modules.controller
        ),
        RandomModule: await ethers.getContractFactory(
            cloneProjectFile.modules.random
        ),
        RoyaltyModule: await ethers.getContractFactory(
            cloneProjectFile.modules.royalty ||
                cloneProjectFile.modules.royalties
        ),
        InfinityMinter: await ethers.getContractFactory(
            cloneProjectFile.modules.minter
        ),
        InfinityMintLinker: await ethers.getContractFactory(
            cloneProjectFile.modules.linker ||
                cloneProjectFile.modules.factory ||
                'InfinityMintLinker'
        ),
    };

    if (mods.length !== 0) {
        console.log('\n> Calling Setup For Gems 💎\n'.magenta);

        for (let i = 0; i < mods.length; i++) {
            let value = mods[i];

            if (
                (Gems.mods[value.mod].manifest?.disabled || []).filter(
                    (mod) => mod == value.mod
                ).length !== 0
            ) {
                console.log('- Mod is disabled to cloneMachine skipping');
                continue;
            }
            console.log(('[💎] Refining ' + value.mod + '\n').gray);
            let result = await value.method.bind(this, {
                get: get,
                accounts: accounts,
                tempProjectFile: cloneProjectFile,
                projectFile: projectFile,
                deployer: cloneProjectFile.deployer,
                getAssetControllerAddress: () => {
                    return cloneProjectFile.contracts[
                        cloneProjectFile.modules.controller
                    ];
                },
                getMinterAddress: () => {
                    return cloneProjectFile.contracts[
                        cloneProjectFile.modules.minter
                    ];
                },
                liveDeployments: {
                    ...cloneProjectFile.contracts,
                    InfinityMint: contracts['InfinityMint'].address,
                    InfinityMintApi: contracts['InfinityMintApi'].address,
                    InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
                    InfinityMintStorage:
                        contracts['InfinityMintStorage'].address,
                    InfinityMintValues: deployInfo.contracts.InfinityMintValues,
                    InfinityMintLinker: contracts['InfinityMintLinker'].address,
                    InfinityMintProject:
                        deployInfo.contracts.InfinityMintProject,
                    InfinityMintAsset:
                        deployInfo.contracts[projectFile.modules.controller],
                    InfinityMintRoyalty:
                        contracts['InfinityMintRoyalty'].address,
                    InfinityMintRandomNumber:
                        deployInfo.contracts[projectFile.modules.random],
                },
                abis: abis,
                ethers: ethers,
                chainId: chainId,
            })();

            if (result !== null && typeof result === 'object')
                cloneProjectFile = {
                    ...cloneProjectFile,
                    ...result,
                    links: result.links,
                };

            console.log(`\n[💎] Refinement Successful\n`.cyan);
            Controller.log('- Writing temp_uri');
            Controller.writeInformation(cloneProjectFile, './.temp_project');
        }
    }
};

const Script = async ({
    args,
    deployedProject,
    undeployedProject,
    get,
    deploy,
    deployer,
}) => {
    let accounts = await ethers.getSigners(); //accounts
    let clones = deployedProject.clones || [];
    let deployInfo = Controller.readInformation(
        './deployments/' + Controller.defaultNetwork + '/.deployInfo',
        true
    );
    let path = './deployments/' + Controller.defaultNetwork + '/';
    let cloneId = clones.length;

    console.log('> Saving current deployments');
    if (!Controller.getFileSystem().existsSync('./temp/cloneMachine/'))
        Controller.getFileSystem().mkdirSync('./temp/cloneMachine/');

    let files = Controller.getFileSystem()
        .readdirSync(path, {
            withFileTypes: true,
        })
        .filter((file) => !file.isDirectory())
        .map((file) => file.name);
    files.forEach((file) => {
        console.log('- copying temporary backup of ' + path + file);
        Controller.getFileSystem().copyFileSync(
            path + file,
            './temp/cloneMachine/' + file
        );
    });

    try {
        console.log('> Deploying clone #' + cloneId);

        //these files will be cleared each time
        let cloneFiles = [
            'InfinityMintLinker.json',
            'InfinityMintStorage.json',
            'InfinityMintApi.json',
            'InfinityMint.json',
            `${deployedProject.modules.royalty}.json`,
            `${deployedProject.modules.minter}.json`,
        ];

        let cloneDeployInfo = {
            ...deployInfo,
            isChild: true,
            childProject: deployInfo.project + `_clone_${cloneId}`,
            cloneId: cloneId,
        };

        console.log('\n> Deleting non-kept contracts from deployments'.cyan);
        //deploying storage controller
        cloneFiles.forEach((file) => {
            if (Controller.getFileSystem().existsSync(path + file)) {
                console.log('- Deleting ' + path + file);
                Controller.getFileSystem().unlinkSync(path + file);
            }
        });

        console.log('> Deleting all gem contracts from parent folder');
        files = Controller.getFileSystem()
            .readdirSync(path, {
                withFileTypes: true,
            })
            .filter(
                (file) =>
                    !file.isDirectory() &&
                    file.name.indexOf('Mod_') !== -1 &&
                    file.name.indexOf('Mod_CloneMachineOracle') === -1
            )
            .map((file) => file.name)
            .forEach((file) => {
                if (Controller.getFileSystem().existsSync(path + file)) {
                    console.log('- Deleting mod file ' + path + file);
                    Controller.getFileSystem().unlinkSync(path + file);
                }
            });

        let cloneProject = { ...deployedProject };
        cloneProject.parentProject = deployInfo.project;
        cloneProject.parent = {
            ...deployedProject,
            deployInfo: { ...deployInfo },
        };
        cloneProject.isChild = true;
        cloneProject.cloneId = cloneId;
        cloneProject.id = uuidv4();
        cloneProject.links = Object.values(deployedProject.links);
        console.log('- writing fake .temp_project');
        Controller.writeInformation(cloneProject, './.temp_project');

        let contracts = {};

        console.log('\n> Deploying InfinityMintStorage');
        contracts['InfinityMintStorage'] = await deploy('InfinityMintStorage', {
            from: deployer,
            log: true,
            libraries: {
                InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(
            contracts['InfinityMintStorage'].receipt,
            'Clone InfinityMintStorage Contract'
        );
        console.log('☻ Success ☻\n'.green);

        console.log('\n> Deploying ' + deployedProject.modules.royalty.cyan);
        contracts['InfinityMintRoyalty'] = await deploy(
            deployedProject.modules.royalty ||
                deployedProject.modules.royalties,
            {
                from: deployer,
                log: true,
                args: [deployInfo.contracts.InfinityMintValues],
                libraries: {
                    InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
                },
                waitConfirmations:
                    Controller.deployConfig.networks[Controller.defaultNetwork]
                        .confirmations,
            }
        );
        Controller.logTx(
            contracts['InfinityMintRoyalty'].receipt,
            'InfinityMintStorage Contract'
        );
        console.log('☻ Success ☻\n'.green);

        console.log('\n> Setting up royalty controller'.cyan);
        let result = await Controller.executeNodeScript(
            'scripts/setupRoyalty.js',
            [],
            true
        );
        if (result !== 0) throw new Error('failed setup royalty');
        console.log('☻ Success ☻\n'.green);

        console.log('\n> Deploying ' + deployedProject.modules.minter.cyan);
        contracts['InfinityMinter'] = await deploy(
            deployedProject.modules.minter,
            {
                from: deployer,
                log: true,
                args: [
                    deployInfo.contracts.InfinityMintValues,
                    contracts['InfinityMintStorage'].address, //storage contract address,
                    deployInfo.contracts[deployedProject.modules.controller],
                    deployInfo.contracts[deployedProject.modules.random],
                ],
                libraries: {
                    InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
                },
                waitConfirmations:
                    Controller.deployConfig.networks[Controller.defaultNetwork]
                        .confirmations,
            }
        );
        Controller.logTx(
            contracts['InfinityMinter'].receipt,
            'InfinityMinter Contract'
        );
        console.log('☻ Success ☻\n'.green);

        console.log('\n> Deploying ERC721'.cyan);
        contracts['InfinityMint'] = await deploy('InfinityMint', {
            from: deployer,
            log: true,
            args: [
                deployedProject?.description?.token || 'Unknown', //the token name,
                deployedProject?.description?.tokenSymbol || '?', //the tokens symbol,
                contracts['InfinityMintStorage'].address, //storage contract address,
                deployInfo.contracts.InfinityMintValues,
                contracts['InfinityMinter'].address,
                contracts['InfinityMintRoyalty'].address,
            ],
            libraries: {
                InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(contracts['InfinityMint'].receipt);
        console.log('☻ Success ☻\n'.green);

        console.log('\n> Deploying API Contract'.cyan);
        contracts['InfinityMintApi'] = await deploy('InfinityMintApi', {
            from: deployer,
            log: true,
            args: [
                contracts['InfinityMint'].address,
                contracts['InfinityMintStorage'].address, //storage contract address,
                deployInfo.contracts[deployedProject.modules.controller],
                deployInfo.contracts.InfinityMintValues,
                contracts['InfinityMintRoyalty'].address,
            ],
            libraries: {
                InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(
            contracts['InfinityMintApi'].receipt,
            'InfinityMintApi Contract'
        );
        console.log('☻ Success ☻\n'.green);

        contracts['InfinityMintLinker'] = await deploy('InfinityMintLinker', {
            from: deployer,
            log: true,
            args: [
                contracts['InfinityMintStorage'].address, //storage contract address,
                contracts['InfinityMint'].address,
            ],
            libraries: {
                InfinityMintUtil: deployInfo.contracts.InfinityMintUtil,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(
            contracts['InfinityMintLinker'].receipt,
            'InfinityMintLinker Contract'
        );
        console.log('☻ Success ☻\n'.green);

        //enable mods
        Gems.enableMods(undeployedProject.mods);

        //deploy mods
        await deployMods(
            cloneProject,
            deployedProject,
            deployInfo,
            contracts,
            get,
            deploy,
            deployer,
            deployInfo.chainId
        );
        //then set up the mods
        await setupMods(
            cloneProject,
            deployedProject,
            deployInfo,
            contracts,
            get,
            deploy,
            deployer,
            deployInfo.chainId,
            accounts
        );

        /**
         * Approve with parent here
         */
        result = await Controller.executeNodeScript(
            'scripts/setPermissions.js',
            [],
            true
        );
        if (result !== 0) throw new Error('failed to set permissions');

        /**
         * Set Approved with here
         */
        result = await Controller.executeNodeScript(
            'scripts/setApproved.js',
            [],
            true
        );
        if (result !== 0) throw new Error('failed to set approved addresses');

        /**
         * SETUP MODS HERE
         */

        console.log('\n> Setting up linker'.cyan);
        console.log('- writing fake .temp_project');
        Controller.writeInformation(cloneProject, './.temp_project');
        result = await Controller.executeNodeScript(
            'scripts/deployLinker.js',
            ['false'],
            true
        );
        if (result !== 0) throw new Error('failed to deploy linker');
        cloneProject = Controller.readInformation('./.temp_project', true); //read tempURI again incase linker changed stuff
        Controller.log(' ☻ Success'.green);

        Object.keys(contracts).map(
            (contract) =>
                (cloneDeployInfo.contracts[contract] =
                    contracts[contract].address)
        );
        cloneDeployInfo.contracts[deployedProject.modules.minter] =
            cloneDeployInfo.contracts['InfinityMinter'];
        cloneDeployInfo.contracts[deployedProject.modules.royalty] =
            cloneDeployInfo.contracts['InfinityMintRoyalty'];
        cloneDeployInfo.deployer = deployer;
        cloneDeployInfo.id = cloneDeployInfo.id + '#' + cloneId;
        cloneProject.contracts = cloneDeployInfo.contracts;

        /**
         *  Register with oracle
         */
        console.log('- registering with oracle');
        let abis = {
            Oracle: await ethers.getContractFactory('Mod_CloneMachineOracle'),
            ERC721: await ethers.getContractFactory('InfinityMint'),
            Royalty: await ethers.getContractFactory(
                deployedProject.modules.royalty
            ),
        };

        let oracleAddress = deployedProject.contracts['Mod_CloneMachineOracle'];
        let oracleContract = new ethers.Contract(
            oracleAddress,
            abis.Oracle.interface,
            accounts[0]
        );

        let minter = new ethers.Contract(
            cloneProject.contracts['InfinityMint'],
            abis.Oracle.interface,
            accounts[0]
        );

        let royalty = new ethers.Contract(
            cloneProject.contracts[deployedProject.modules.royalty],
            abis.Oracle.interface,
            accounts[0]
        );

        console.log(
            '- setting oracle contract (' +
                oracleAddress +
                ') as temporary owner of erc721 clone'
        );
        let tx = await minter.transferOwnership(oracleAddress);
        Controller.logTx(await tx.wait());
        console.log('☻ Success ☻\n'.green);

        console.log(
            '- setting oracle contract (' +
                oracleAddress +
                ') as temporary owner of royalty contract clone'
        );
        tx = await royalty.transferOwnership(oracleAddress);
        Controller.logTx(await tx.wait());
        console.log('☻ Success ☻\n'.green);

        console.log(
            '- registering ' + cloneId + ' to oracle for later distribution'
        );
        tx = await oracleContract.addPermissions(cloneId, [
            cloneProject.contracts['InfinityMint'],
            cloneProject.contracts[deployedProject.modules.royalty],
        ]);
        Controller.logTx(await tx.wait());
        console.log('☻ Success ☻\n'.green);

        /**
         * Finish Setup
         */

        if (
            !Controller.getFileSystem().existsSync(
                './temp/cloneMachine/' + Controller.deployConfig.project + '/'
            )
        )
            Controller.getFileSystem().mkdirSync(
                './temp/cloneMachine/' + Controller.deployConfig.project + '/'
            );

        let tempCloneFolder =
            './temp/cloneMachine/' +
            Controller.deployConfig.project +
            '/' +
            cloneId +
            '/';
        if (!Controller.getFileSystem().existsSync(tempCloneFolder))
            Controller.getFileSystem().mkdirSync(tempCloneFolder);

        if (!Controller.getFileSystem().existsSync('./projects/clones/'))
            Controller.getFileSystem().mkdirSync('./projects/clones/');

        console.log('\n> Copying contracts to temp clone folder'.cyan);
        //deploying storage controller
        files = Controller.getFileSystem()
            .readdirSync(path, {
                withFileTypes: true,
            })
            .filter((file) => !file.isDirectory())
            .map((file) => file.name);
        files.forEach((file) => {
            console.log('- copying clone to ' + tempCloneFolder + file);
            Controller.getFileSystem().copyFileSync(
                path + file,
                tempCloneFolder + file
            );
        });

        //make clone .deployInfo
        console.log('- writing clones .deployInfo');
        Controller.writeInformation(
            cloneDeployInfo,
            tempCloneFolder + '.deployInfo'
        );

        console.log(
            '- writing clone project file to /projects/clones/' +
                cloneDeployInfo.childProject +
                '.json'
        );
        delete cloneProject.clones;
        cloneProject.project = cloneDeployInfo.childProject;
        Controller.writeInformation(
            cloneProject,
            './projects/clones/' + cloneDeployInfo.childProject + '.json'
        );

        clones.push(cloneDeployInfo);
        //save the project file
        deployedProject.clones = clones;

        console.log('- saving project file');
        Controller.writeInformation(
            deployedProject,
            './projects/' + Controller.deployConfig.project + '.json'
        );

        if (Controller.getFileSystem().existsSync('./.temp_project')) {
            console.log('- deleting fake .temp_project');
            Controller.getFileSystem().unlinkSync('./.temp_project');
        }
    } catch (error) {
        console.error(error);
        if (Controller.getFileSystem().existsSync('./.temp_project')) {
            console.log('- deleting fake .temp_project');
            Controller.getFileSystem().unlinkSync('./.temp_project');
        }
        throw new Error('bad');
    } finally {
        rollbackDeployments(path);
    }

    console.log(('\n> Finished Deploying clone #' + cloneId).cyan);
    console.log(
        'It is advised that you run the setProject.js script to update the website about the existence of new clones'
            .yellow
    );
};

Script.name = 'New Clone';
Script.description = 'Clones the parent minter.';
Script.requireDeployment = true;
Script.allowCount = true; //will execute the script x amount of times
Script.verifyContext = true; //will ensure that when this script is execute the current select project matches the deployed project and the network matches the deployed projects network
Script.parameters = {
    useCloneOracle: true,
    receiver: 'address', //if clone oracle is true the clone will have its permissions transfered to the CloneMachineOracle
};
module.exports = Script;
