const { parse } = require('svg-parser');
const Controller = require('../src/Controller');
const Gems = require('../src/Gems');
const { v4: uuidv4 } = require('uuid');
const { getFullyQualifiedName } = require('../src/helpers');

//simple delay promise
const delay = (seconds = 2) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, 1000 * seconds);
    });
};

module.exports = async ({
    getNamedAccounts,
    deployments,
    ethers,
    getChainId,
}) => {
    let { deploy, log, get } = deployments;

    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();

    //load InfinityMint mods
    await Gems.loadMods();

    let tempProjectFile = await Controller.getProjectFile();

    let InfinityMintUtil;
    let InfinityMintApi;
    let InfinityMintLinker;
    let InfinityMintRoyalty;
    let InfinityMintAsset;
    let InfinityMintStorage;
    let InfinityMinter;
    let InfinityMint;
    let InfinityMintValues;
    let InfinityMintProject;
    let InfinityMintRandomNumber;

    log(
        `
        ██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗
        ██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝
        ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝ 
        ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝  
        ██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║   
        ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝   
        Releasing The Cats!!  ███╗   ███╗██╗███╗   ██╗████████╗
        Thank You Mom!        ████╗ ████║██║████╗  ██║╚══██╔══╝
        by: 0x0zAgency        ██╔████╔██║██║██╔██╗ ██║   ██║   
        2023                  ██║╚██╔╝██║██║██║╚██╗██║   ██║   
                              ██║ ╚═╝ ██║██║██║ ╚████║   ██║   
        MIT LICENSE           ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝   
                                                               
        
    Version ${Controller.version}
    Deploy Script
    `.yellow
    );

    log(
        `DEPLOYING PROJECT: ${Controller.deployConfig.project} to ${
            Controller.defaultNetwork
        } ${new Date(Date.now()).toDateString()} at ${new Date(
            Date.now()
        ).toTimeString()}`.white.bgYellow
    );
    await delay(1);

    if (tempProjectFile.mods !== undefined) {
        console.log('\n> Enabling Infinity💎Gems\n'.cyan);
        Gems.enableMods(tempProjectFile.mods);
    }

    //load receipts incase of redeploy
    Controller.loadReceipts();

    let usingOld = false;

    if (
        !Controller.isEnvTrue('FORCE_DEPLOYMENT') &&
        Controller.getFileSystem().existsSync('./.temp_project')
    ) {
        let object = JSON.parse(Controller.readInformation('./.temp_project'));

        if (
            object?.network?.chainId !== undefined &&
            parseInt(object.network.chainId) !== parseInt(chainId)
        ) {
            console.log('\nNote:'.yellow.underline);
            console.log(
                (
                    'We found a previous temp uri but it not the right chain id. (is chain id ' +
                    object.network.chainId +
                    ' and you are ' +
                    chainId +
                    ')\nDo you want continue where it left off, anyway?'
                ).yellow
            );
            let result = await Controller.newQuestion('continue? y/n: ');
            if (result.toLowerCase()[0] !== 'y') {
                delete object.stages;
            }
        }

        if (
            object?.network?.chainId === undefined ||
            object.stages === undefined
        ) {
            console.log('ERROR'.underline.red);
            console.log('Cannot continue with previous build. ');
        } else if (parseInt(chainId) !== 1337) {
            console.log(
                '\nInfinity Mint has found a previous deployment which seems to have failed to launch. Would you like to try it again?\n'
                    .cyan
            );
            let result = await Controller.newQuestion('continue? y/n: ');
            if (result.toLowerCase()[0] !== 'n') {
                tempProjectFile = { ...object };
                usingOld = true;
            }
        } else if (parseInt(chainId) === 1337) {
            console.log('- attempting to redeploy from previous attempt');
            tempProjectFile = { ...object };
            usingOld = true;
        }
    }

    if (
        Controller.defaultNetwork !== 'ganache' &&
        !usingOld &&
        Controller.getFileSystem().existsSync(
            './deployments/' + Controller.defaultNetwork + '/'
        )
    ) {
        console.log(
            (
                "WARNING:\n Previous deployment for network '" +
                Controller.defaultNetwork +
                "' already exists. Copy the folder somewhere safe to make a backup of it and then delete it to continue."
            ).red
        );

        if (Controller.isEnvTrue('FORCE_DEPLOYMENT')) {
            console.log(
                '- force deployment mode is true so deleting deployment'
            );
            Controller.getFileSystem().rmdirSync(
                './deployments/' + Controller.defaultNetwork + '/',
                {
                    force: true,
                    recursive: true,
                }
            );
        } else {
            let result = await Controller.newQuestion('continue? y/n: ');
            if (result.toLowerCase()[0] !== 'y') {
                console.log('not continuing...');
                process.exit(1);
            }

            if (
                Controller.getFileSystem().existsSync(
                    './deployments/' + Controller.defaultNetwork + '/'
                )
            )
                throw new Error(
                    'folder /deployments/' +
                        Controller.defaultNetwork +
                        '/ still exists'
                );
        }
    }

    if (tempProjectFile.errors === undefined) tempProjectFile.errors = {};

    Controller.log('- Getting Network');
    tempProjectFile.network = await ethers.provider.getNetwork();
    if (tempProjectFile.network.chainId === 1337)
        tempProjectFile.network.name = 'ganache';

    // Actual code and stuff begins
    if (tempProjectFile.id === undefined) tempProjectFile.id = uuidv4();

    //writes the temp uri and initializes it to the value of project file
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages === undefined) tempProjectFile.stages = {};

    if (Controller.settings.reactLocation === '') {
        console.log(
            '\n\n! WARNING: REACT LOCATION IS EMPTY (BUILDS WILL NOT BE COPIED) !'
                .red
        );
        console.log(
            '\n! Run node scripts/settings.js to set a react repository for this project !\n\n'
                .red
        );
        await delay(5);
    }

    if (tempProjectFile.modules.renderScript === undefined)
        tempProjectFile.modules.renderScript =
            Controller.getContractConfig(tempProjectFile.modules.controller)
                ?.defaultRenderScript || 'Default';

    if (
        tempProjectFile.modules.renderScript.length === 0 ||
        tempProjectFile.modules.renderScript === null
    )
        tempProjectFile.modules.renderScript =
            tempProjectFile.modules.controller;

    if (
        parseInt(chainId) === 1337 &&
        Controller.defaultNetwork.toLowerCase() === 'ganache' &&
        Controller.getFileSystem().existsSync(
            `./ temp / ${Controller.deployConfig.project}_${Controller.defaultNetwork}_receipts.json`
        )
    ) {
        try {
            console.log(
                ' - Deleting previous tx receipts file since we are ganache'
            );
            Controller.getFileSystem().unlinkSync(
                `./ temp / ${Controller.deployConfig.project}_${Controller.defaultNetwork}_receipts.json`
            );
        } catch (error) {
            console.log('Unlink failed');
            console.log(error);
        }
    }

    if (
        !Controller.isEnvTrue('FORCE_DEPLOYMENT') &&
        Controller.deployConfig.networks[Controller.defaultNetwork].showGas
    ) {
        console.log(
            `\nEstimated SAFE gas price for ${Controller.defaultNetwork}:`.green
                .underline
        );
        console.log(
            '\n\t' +
                (
                    Controller.deployConfig.networks[Controller.defaultNetwork]
                        .gasPrice /
                        1e9 +
                    'gwei'
                ).white.bgGreen
        );
        console.log(
            "\nIs this an acceptable GAS price? If it isn't, control-c to break!"
                .magenta
        );

        console.log("\n Or press any key to continue...".green.underline)

        let result = await Controller.newQuestion('continue? y/n: ');
        if (result.toLowerCase()[0] !== 'y') {
            throw new Error('The gas price is not acceptable. Run updateGasAndPrices.js in the VIEW SCRIPTS menu.'.magenta);
        }
    }

    if (
        !Controller.isEnvTrue('FORCE_DEPLOYMENT') &&
        parseInt(chainId) !== 1337
    ) {
        //check required things for non ganache deployment
        try {
            if (
                Controller.deployConfig.ipfs?.apiKey === null ||
                Controller.deployConfig.ipfs?.apiKey === undefined ||
                Controller.deployConfig.ipfs?.apiKey.replace(/ /g, '')
                    .length === 0
            ) {
                console.log(
                    'WARNING: NO IPFS KEY DETECTED! You might run into an error with this deployment if you do not have a valid IPFS key. Its best to make sure that your key is valid by first using it in a test environment. Do not deploy with out testing your web3.storage api key'
                        .red
                );
                console.log(
                    '\nYou can continue if you like. It is advised that you do not continue and follow the IPFS tutorial on localhost first.'
                );
                let result = await Controller.newQuestion('Continue? y/n: ');
                if (result.toLowerCase()[0] !== 'y') {
                    console.log('not continuing...');
                    process.exit(1);
                }
            }

            let file = Controller.getFileSystem().readFileSync(
                './temp/' +
                    Controller.deployConfig.project +
                    '_ganache_receipts.json'
            );
            file = JSON.parse(file);

            if (file._final === undefined) {
                throw new Error(
                    'bad receipt file, if you had to reattempt deployment on ganache. Please do a fully successful ganache deployment before running.'
                );
            }

            let gasPrice =
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .gasPrice;
            let totalCost = file._final.totalGas * (gasPrice / 1e9).toFixed(3);
            console.log(
                `\nTotal cost of deployment to ${
                    Controller.defaultNetwork
                } (at ${(gasPrice / 1e9).toFixed(3)}gwei):`.yellow
            );
            console.log(`\t ${totalCost / 1e9} `.yellow);
            console.log(
                `\nWe advise you have the following in your wallet to deploy ${
                    Controller.defaultNetwork
                } (at ${(gasPrice / 1e9).toFixed(3)}gwei):`.green.underline
            );
            console.log(
                `\n\t` +
                    ` ${((totalCost / 1e9) * 1.33).toFixed(2)} `.white.bgGreen
            );
            console.log(
                `\nBased on your GANACHE deployment which used: ${file._final.totalGas}gas`
                    .dim
            );
            console.log(
                `real world cost of: $${
                    ((totalCost / 1e9) * 1.33).toFixed(2) *
                    (Controller.deployConfig.networks[Controller.defaultNetwork]
                        ?.tokenPrice?.usd || 1)
                }`.dim
            );

            if (
                (Controller.deployConfig.networks[Controller.defaultNetwork]
                    ?.tokenPrice?.usd || 1) === 1
            )
                console.log(
                    'Note: Real time costs will vary...'.yellow.underline
                );

            console.log(
                `Please verify that you have enough gas in `.red +
                    `${deployer}`.underline +
                    ` on ${Controller.defaultNetwork} to continue, we will wait for your key press...`
                        .red
            );
            let result = await Controller.newQuestion('continue? y/n: ');
            if (result.toLowerCase()[0] !== 'y') {
                console.log('not continuing...');
                process.exit(1);
            }
        } catch (error) {
            console.log(error);
            console.log(
                '! WARNING ! We cannot estimate how much this deployment will cost!\nPlease fully deploy your project successfully on GANACHE first. Would you like to continue anyway?'
                    .red
            );
            let result = await Controller.newQuestion('Continue? y/n: ');
            if (result.toLowerCase()[0] !== 'y') {
                console.log('not continuing...');
                process.exit(1);
            }
        }

        //if we are using seeded random module
        if (tempProjectFile.modules.random.toLowerCase() === 'seededrandom') {
            console.log(
                (
                    "! WARNING ! Random Module is set to 'SeededRandom' and we are trying to deploy to a non ganache chain. SeededRandom is only meant " +
                    'for testing purposes to produce similar randomisation results each time. As such, it is unadvised that you use this outside of local environments due to ' +
                    "its predictability. Please either change the module to 'UnsafeRandom' or continue..."
                ).red
            );

            let result = await Controller.newQuestion('continue? y/n: ');
            if (result.toLowerCase()[0] !== 'y') {
                console.log('not continuing...');
                process.exit(1);
            }
        }
    }

    let checkFiles = await Controller.executeNodeScript(
        'scripts/checkFiles.js'
    );
    if (checkFiles !== 0) throw new Error('Failed checkFiles');

    if (tempProjectFile.stages['values'] !== true) {
        //deploy globals
        log('+ deploying InfinityMintValues'.magenta);
        InfinityMintValues = await deploy('InfinityMintValues', {
            contract: getFullyQualifiedName('InfinityMintValues'),
            from: deployer,
            log: true,
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(
            InfinityMintValues.receipt,
            'InfinityMintValues Contract'
        );
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['values'] = true;
    } else InfinityMintValues = await get('InfinityMintValues');

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    //can just continue on the event of failure
    try {
        if (tempProjectFile.stages['setupValues'] !== true) {
            //Setup values
            log('+ Running scripts/setupValues.js\n'.magenta);

            let result = await Controller.executeNodeScript(
                'scripts/setupValues.js'
            );
            if (result !== 0) throw new Error('failed setupValues');

            log('☻ Success ☻\n'.green);
            tempProjectFile.stages['setupValues'] = true;

            if (tempProjectFile.errors['setupValues'] !== undefined)
                delete tempProjectFile.errors['setupValues'];
        }
    } catch (error) {
        if (tempProjectFile.errors === undefined) tempProjectFile.errors = {};

        tempProjectFile.errors['setupValues'] = error;
        Controller.log('- Writing temp_uri');
        Controller.writeInformation(tempProjectFile, './.temp_project');

        throw error;
    }

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['util'] != true) {
        //deploy util
        log('+ deploying InfinityMintUtil'.magenta);
        InfinityMintUtil = await deploy('InfinityMintUtil', {
            contract: getFullyQualifiedName('InfinityMintUtil'),
            from: deployer,
            log: true,
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(InfinityMintUtil.receipt, 'InfinityMintUtil Contract');
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['util'] = true;
    } else InfinityMintUtil = await get('InfinityMintUtil');

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['storage'] != true) {
        //deploy storage
        log('+ deploying InfinityMintStorage'.magenta);
        InfinityMintStorage = await deploy('InfinityMintStorage', {
            contract: getFullyQualifiedName('InfinityMintStorage'),
            from: deployer,
            log: true,
            libraries: {
                InfinityMintUtil: InfinityMintUtil.address,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(
            InfinityMintStorage.receipt,
            'InfinityMintStorage Contract'
        );
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['storage'] = true;
    } else InfinityMintStorage = await get('InfinityMintStorage');

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['projectContract'] != true) {
        //deploy project contract which holds infinity mint deployed projects and allows them to be updated
        log('+ deploying InfinityMintProject'.magenta);
        InfinityMintProject = await deploy('InfinityMintProject', {
            contract: getFullyQualifiedName('InfinityMintProject'),
            from: deployer,
            log: true,
            libraries: {
                InfinityMintUtil: InfinityMintUtil.address,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(
            InfinityMintProject.receipt,
            'InfinityMintProject Contract'
        );
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['projectContract'] = true;
    } else InfinityMintProject = await get('InfinityMintProject');

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['royalty'] != true) {
        //deploy royalty module
        log(
            (
                '+ deploying ' +
                (tempProjectFile.modules.royalty ||
                    tempProjectFile.modules.royalties)
            ).magenta
        );
        InfinityMintRoyalty = await deploy(
            tempProjectFile.modules.royalty ||
                tempProjectFile.modules.royalties,
            {
                contract: getFullyQualifiedName(
                    tempProjectFile.modules.royalty ||
                        tempProjectFile.modules.royalties,
                    'royalty/'
                ),
                from: deployer,
                log: true,
                args: [InfinityMintValues.address],
                libraries: {
                    InfinityMintUtil: InfinityMintUtil.address,
                },
                waitConfirmations:
                    Controller.deployConfig.networks[Controller.defaultNetwork]
                        .confirmations,
            }
        );
        Controller.logTx(
            InfinityMintRoyalty.receipt,
            'InfinityMintRoyalty Contract'
        );
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['royalty'] = true;
    } else
        InfinityMintRoyalty = await get(
            tempProjectFile.modules.royalty || tempProjectFile.modules.royalties
        );

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    try {
        if (tempProjectFile.stages['setupRoyalty'] != true) {
            //setup royalty
            log('+ Running scripts/setupRoyalty.js\n'.magenta);
            let result = await Controller.executeNodeScript(
                'scripts/setupRoyalty.js'
            );
            if (result !== 0) throw new Error('failed setup royalty');

            log('☻ Success ☻\n'.green);

            tempProjectFile.stages['setupRoyalty'] = true;

            if (tempProjectFile.errors['setupRoyalty'] !== undefined)
                delete tempProjectFile.errors['setupRoyalty'];
        }
    } catch (error) {
        if (tempProjectFile.errors === undefined) tempProjectFile.errors = {};

        tempProjectFile.errors['setupRoyalty'] = error;
        Controller.log('- Writing temp_uri');
        Controller.writeInformation(tempProjectFile, './.temp_project');

        throw error;
    }

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['deployAssets'] !== true) {
        //deploy svg module
        log(
            (
                '+ deploying ' +
                (tempProjectFile.modules.svg ||
                    tempProjectFile.modules.controller)
            ).magenta
        );
        InfinityMintAsset = await deploy(
            tempProjectFile.modules.svg || tempProjectFile.modules.controller,
            {
                contract: getFullyQualifiedName(
                    tempProjectFile.modules.svg ||
                        tempProjectFile.modules.controller,
                    'assets/'
                ),
                from: deployer,
                log: true,
                args: [
                    tempProjectFile?.description?.defaultName ||
                        tempProjectFile?.description?.token ||
                        'Unknown',
                    InfinityMintValues.address,
                ],
                libraries: {
                    InfinityMintUtil: InfinityMintUtil.address,
                },
                waitConfirmations:
                    Controller.deployConfig.networks[Controller.defaultNetwork]
                        .confirmations,
            }
        );
        Controller.logTx(
            InfinityMintAsset.receipt,
            'InfinityMintAsset Contract'
        );
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['deployAssets'] = true;
    } else
        InfinityMintAsset = await get(
            tempProjectFile.modules.svg || tempProjectFile.modules.controller
        );

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['random'] != true) {
        //deploy random number
        let seedNumber =
            tempProjectFile.deployment?.seedNumber ||
            Controller.deployConfig.seedNumber ||
            Date.now() + 200;
        log(
            (
                '+ deploying ' +
                tempProjectFile.modules.random +
                ' with seed number ' +
                seedNumber
            ).magenta
        );
        InfinityMintRandomNumber = await deploy(
            tempProjectFile.modules.random,
            {
                contract: getFullyQualifiedName(
                    tempProjectFile.modules.random,
                    'random/'
                ),
                from: deployer,
                log: true,
                args: [seedNumber, InfinityMintValues.address],
                libraries: {
                    InfinityMintUtil: InfinityMintUtil.address,
                },
                waitConfirmations:
                    Controller.deployConfig.networks[Controller.defaultNetwork]
                        .confirmations,
            }
        );
        Controller.logTx(
            InfinityMintRandomNumber.receipt,
            'InfinityMintRandomNumber Contract'
        );
        log('☻ Success ☻\n'.green);

        tempProjectFile.stages['random'] = true;
    } else InfinityMintRandomNumber = await get(tempProjectFile.modules.random);

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['minter'] !== true) {
        //deploy InfinityMinter
        log(('+ deploying ' + tempProjectFile.modules.minter).magenta);
        InfinityMinter = await deploy(tempProjectFile.modules.minter, {
            contract: getFullyQualifiedName(
                tempProjectFile.modules.minter,
                'minter/'
            ),
            from: deployer,
            log: true,
            args: [
                InfinityMintValues.address,
                InfinityMintStorage.address, //storage contract address,
                InfinityMintAsset.address,
                InfinityMintRandomNumber.address,
            ],
            libraries: {
                InfinityMintUtil: InfinityMintUtil.address,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(InfinityMinter.receipt, 'InfinityMinter Contract');
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['minter'] = true;
    } else InfinityMinter = await get(tempProjectFile.modules.minter);

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['erc721'] !== true) {
        //deploy ERC721
        log('+ deploying InfinityMint (ERC721)'.magenta);
        InfinityMint = await deploy('InfinityMint', {
            contract: getFullyQualifiedName('InfinityMint'),
            from: deployer,
            log: true,
            args: [
                tempProjectFile?.description?.token || 'Unknown', //the token name,
                tempProjectFile?.description?.tokenSymbol || '?', //the tokens symbol,
                InfinityMintStorage.address, //storage contract address,
                InfinityMintValues.address,
                InfinityMinter.address,
                InfinityMintRoyalty.address,
            ],
            libraries: {
                InfinityMintUtil: InfinityMintUtil.address,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(InfinityMint.receipt);
        log('☻ Success ☻\n'.green);

        tempProjectFile.stages['erc721'] = true;
    } else InfinityMint = await get('InfinityMint');

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['api'] != true) {
        //deploy kazoo
        log('+ deploying InfinityMintApi'.magenta);
        InfinityMintApi = await deploy('InfinityMintApi', {
            contract: getFullyQualifiedName('InfinityMintApi'),
            from: deployer,
            log: true,
            args: [
                InfinityMint.address,
                InfinityMintStorage.address, //storage contract address,
                InfinityMintAsset.address,
                InfinityMintValues.address,
                InfinityMintRoyalty.address,
            ],
            libraries: {
                InfinityMintUtil: InfinityMintUtil.address,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(InfinityMintApi.receipt, 'InfinityMintApi Contract');
        log('☻ Success ☻\n'.green);
        tempProjectFile.stages['api'] = true;
    } else InfinityMintApi = await get('InfinityMintApi');

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    if (tempProjectFile.stages['factory'] != true) {
        //deploy kazoo
        log('+ deploying InfinityMintLinker'.magenta);
        InfinityMintLinker = await deploy('InfinityMintLinker', {
            contract: getFullyQualifiedName('InfinityMintLinker'),
            from: deployer,
            log: true,
            args: [
                InfinityMintStorage.address, //storage contract address,
                InfinityMint.address,
            ],
            libraries: {
                InfinityMintUtil: InfinityMintUtil.address,
            },
            waitConfirmations:
                Controller.deployConfig.networks[Controller.defaultNetwork]
                    .confirmations,
        });
        Controller.logTx(
            InfinityMintLinker.receipt,
            'InfinityMintLinker Contract'
        );
        log('☻ Success ☻\n'.green);

        tempProjectFile.stages['factory'] = true;
    } else InfinityMintLinker = await get('InfinityMintLinker');

    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    let mods = Gems.getDeployMethods();
    if (tempProjectFile.stages['mods'] === undefined) {
        if (mods.length !== 0) {
            console.log('\n> Deploying Gems 💎\n'.magenta);
            let projectFile = await Controller.getProjectFile();
            let deployedMods = {};

            tempProjectFile.deployedMods = {};
            for (let i = 0; i < mods.length; i++) {
                let value = mods[i];
                try {
                    if (
                        tempProjectFile.stages['mod_' + value.mod] === undefined
                    ) {
                        console.log(
                            (
                                ' -> Calling deploy method for ' +
                                value.mod +
                                '\n'
                            ).cyan
                        );
                        deployedMods[value.mod] = await value.method.bind(
                            this,
                            {
                                get: get,
                                deploy: deploy,
                                log: log,
                                tempProjectFile: tempProjectFile,
                                projectFile: projectFile,
                                deployer: deployer,
                                deployments: deployments,
                                liveDeployments: {
                                    InfinityMint: InfinityMint.address,
                                    InfinityMintApi: InfinityMintApi.address,
                                    InfinityMintUtil: InfinityMintUtil.address,
                                    InfinityMintStorage:
                                        InfinityMintStorage.address,
                                    InfinityMintLinker:
                                        InfinityMintLinker.address,
                                    InfinityMintValues:
                                        InfinityMintValues.address,
                                    InfinityMintProject:
                                        InfinityMintProject.address,
                                    InfinityMintAsset:
                                        InfinityMintAsset.address,
                                    InfinityMintRoyalty:
                                        InfinityMintRoyalty.address,
                                    InfinityMintRandomNumber:
                                        InfinityMintRandomNumber.address,
                                    [projectFile.modules.controller]:
                                        InfinityMintAsset.address,
                                    [projectFile.modules.royalty]:
                                        InfinityMintRoyalty.address,
                                    [projectFile.modules.random]:
                                        InfinityMintRandomNumber.address,
                                    [projectFile.modules.minter]:
                                        InfinityMinter.address,
                                },
                                ethers: ethers,
                                chainId: chainId,
                            }
                        )();

                        if (
                            deployedMods[value.mod] === undefined ||
                            deployedMods[value.mod] === null
                        ) {
                            Controller.log(
                                '- mod ' +
                                    value.mod +
                                    ' did not return any deployed contracts'
                            );
                            tempProjectFile.deployedMods[value.mod] = {
                                ...Gems.mods[value.mod],
                                contracts: {},
                                receipts: [],
                            };
                        } else {
                            let contracts = {};
                            if (
                                deployedMods[value.mod] instanceof Array ===
                                true
                            ) {
                                deployedMods[value.mod].forEach((mod) => {
                                    contracts[mod.contractName] = mod.address;
                                });
                            } else {
                                contracts[
                                    deployedMods[value.mod].contractName
                                ] = deployedMods[value.mod].address;
                            }

                            let receipts =
                                deployedMods[value.mod] instanceof Array !==
                                true
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
                            tempProjectFile.deployedMods[value.mod] = {
                                ...Gems.mods[value.mod],
                                contracts: contracts,
                                receipts: receipts,
                            };
                        }

                        console.log('[💎] Gem Deployed: ' + value.mod);
                        tempProjectFile.stages['mod_' + value.mod] = true;
                    }
                } catch (error) {
                    if (tempProjectFile.errors === undefined)
                        tempProjectFile.errors = {};

                    tempProjectFile.errors['mod_' + value.mod] = error;

                    //write tempUI with stage progress incase we fail
                    Controller.log('- Writing temp_uri');
                    Controller.writeInformation(
                        tempProjectFile,
                        './.temp_project'
                    );
                    console.log(`failed to deploy gem [${value.mod}]: `.red);
                    throw error;
                }
            }
        }

        tempProjectFile.stages['mods'] = true;
    }

    let addresses = {};
    //add deployed mods to deploy info
    Object.values(tempProjectFile.deployedMods || {}).forEach((mod) => {
        Object.keys(mod.contracts || {}).forEach((key) => {
            if (addresses[key] !== undefined) {
                console.log('conflicting gem: ');
                console.log(mod);
                console.log('address of already existing contract:');
                console.log(addresses[key]);
                throw new Error(
                    'mod with name of ' +
                        key +
                        ' has already been deployed by another mod'
                );
            }

            addresses[key] = mod.contracts[key];
        });
    });

    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    Controller.log('- Writing .deployInfo');
    let deployInfo = {
        chainId: chainId,
        network: Controller.defaultNetwork,
        project: Controller.deployConfig.project,
        modules: tempProjectFile.modules,
        deployer: deployer,
        id: tempProjectFile.id,
        date: Date.now(),
        contracts: {
            InfinityMint: InfinityMint.address,
            InfinityMintStorage: InfinityMintStorage.address,
            InfinityMintUtil: InfinityMintUtil.address,
            InfinityMintLinker: InfinityMintLinker.address,
            InfinityMintValues: InfinityMintValues.address,
            InfinityMintApi: InfinityMintApi.address,
            InfinityMintProject: InfinityMintProject.address,
            InfinityMintApi: InfinityMintApi.address,
            [tempProjectFile.modules.svg || tempProjectFile.modules.controller]:
                InfinityMintAsset.address,
            [tempProjectFile.modules.random]: InfinityMintRandomNumber.address,
            [tempProjectFile.modules.minter]: InfinityMinter.address,
            [tempProjectFile.modules.royalty ||
            tempProjectFile.modules.royalties]: InfinityMintRoyalty.address,
            ...addresses,
        },
    };
    //write the file
    Controller.writeInformation(deployInfo);
    Controller.writeInformation(deployInfo, './deployments/' + Controller.defaultNetwork + '/deployInfo.json');

    tempProjectFile.contracts = deployInfo.contracts;
    //write tempUI with stage progress incase we fail
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    Controller.log('☻ Success ☻\n'.green);
    log('\n> All Contracts Deployed'.green);
    //save settings
    Controller.log('- Saving Settings');
    Controller.saveSettings();

    log(`The Cats are loose!
██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗███╗   ███╗██╗███╗   ██╗████████╗
██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝████╗ ████║██║████╗  ██║╚══██╔══╝
██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝ ██╔████╔██║██║██╔██╗ ██║   ██║   
██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝  ██║╚██╔╝██║██║██║╚██╗██║   ██║   
██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║   ██║ ╚═╝ ██║██║██║ ╚████║   ██║   
╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝   ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝   
          ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗███████╗██████╗             
          ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝██╔════╝██╔══██╗            
          ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝ █████╗  ██║  ██║            
          ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝  ██╔══╝  ██║  ██║            
          ██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║   ███████╗██████╔╝            
          ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝   ╚══════╝╚═════╝ 
		`.rainbow
    );
    log(
        `INITIALIZING INFINITYMINT: ${new Date(
            Date.now()
        ).toDateString()} at ${new Date(Date.now()).toTimeString()}`.white
            .bgYellow
    );

    if (tempProjectFile.stages['initialSetup'] != true) {
        log('+ Running scripts/setup.js\n'.magenta);
        let result = await Controller.executeNodeScript('scripts/setup.js');

        if (result !== 0) {
            console.log('\nSHE DIED!\n'.red.underline);
            console.log(
                '\n> Please redeploy once the following errors have been fixed'
                    .yellow
            );
            console.log(
                '> Please further investigate the .temp_project file to investigate a failure cause\n'
                    .yellow
            );
            let temp = Controller.readInformation('./.temp_project', true);
            console.log(temp.errors);
            console.log('\ndying in 5 seconds...'.gray);
            await delay(5);
            throw new Error('failed setup');
        }

        tempProjectFile = {
            ...JSON.parse(Controller.readInformation('./.temp_project')),
        };
        tempProjectFile.stages['initialSetup'] = true;
    }

    //save receipts
    let receipts = Controller.saveReceipts(true);

    Controller.log('- Maping a copy of temp uri and putting it in temp');
    Controller.writeInformation(
        tempProjectFile,
        './temp/' + Controller.deployConfig.project + '_temp_uri.json'
    );

    //delete force_network if it exists
    if (Controller.getFileSystem().existsSync('./.force_network')) {
        Controller.log('- Deleting ./.force_network');
        Controller.getFileSystem().unlinkSync('./.force_network');
    }

    //delete temp uri
    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        Controller.log('- Deleting ./.temp_project');
        Controller.getFileSystem().unlinkSync('./.temp_project');
    }

    let projectLocation =
        Controller.settings.version === 2
            ? Controller.settings.reactLocation +
              'dist/' +
              Controller.deployConfig.project +
              '/' +
              chainId +
              '/' +
              Controller.deployConfig.project +
              '.json'
            : Controller.settings.reactLocation +
              'src/Deployments/projects/' +
              Controller.deployConfig.project +
              '.json';

    console.log('-copying project to ' + projectLocation);

    if (
        !Controller.getFileSystem().existsSync(
            Controller.settings.reactLocation + 'src/Deployments/projects/'
        )
    )
        Controller.getFileSystem().mkdirSync(
            Controller.settings.reactLocation + 'src/Deployments/projects/'
        );

    Controller.getFileSystem().copyFileSync(
        './projects/' + Controller.deployConfig.project + '.json',
        projectLocation
    );

    log(`\n`);

    log(
        `SETUP COMPLETED: ${new Date(Date.now()).toDateString()} at ${new Date(
            Date.now()
        ).toTimeString()}           `.white.bgGreen
    );
    log(`
RIP MOTHER OF WEB3. SHE HAS ASCENDED. MAY SHE FOREVER MINT. THANK YOU FOR ALL OF THE GAS!
██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗███╗   ███╗██╗███╗   ██╗████████╗
██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝████╗ ████║██║████╗  ██║╚══██╔══╝
██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝ ██╔████╔██║██║██╔██╗ ██║   ██║   
██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝  ██║╚██╔╝██║██║██║╚██╗██║   ██║   
██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║   ██║ ╚═╝ ██║██║██║ ╚████║   ██║   
╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝   ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝   
          █████╗ ███████╗ ██████╗███████╗███╗   ██╗██████╗ ███████╗██████╗                
         ██╔══██╗██╔════╝██╔════╝██╔════╝████╗  ██║██╔══██╗██╔════╝██╔══██╗               
         ███████║███████╗██║     █████╗  ██╔██╗ ██║██║  ██║█████╗  ██║  ██║               
         ██╔══██║╚════██║██║     ██╔══╝  ██║╚██╗██║██║  ██║██╔══╝  ██║  ██║               
         ██║  ██║███████║╚██████╗███████╗██║ ╚████║██████╔╝███████╗██████╔╝               
         ╚═╝  ╚═╝╚══════╝ ╚═════╝╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═════╝    `.yellow
    );
    log(
        (
            Controller.deployConfig.project.rainbow + (' contracts are now live on ' + Controller.defaultNetwork + '(' + chainId + ') at ' +
            InfinityMint.address
            
        ).green)
    );
   
    log(
        `
[TOTAL GAS USED: ${receipts._final.totalGas}]`.random);
    

    if (parseInt(chainId) !== 1337) {
        log(
            `
NOTE: Run in terminal: npm run verify\nfor verification status on etherscan.`
                .dim
        );
    } else {
        log(
            `
[Ganache]`.green +
                ` InfinityMint was deployed to: ` +
                (
                    (process.env.GANACHE_URL || localhost) +
                    ':' +
                    (process.env.GANACHE_PORT || 8545)
                ).bgGreen.white
        );
    }

    Controller.restartQuestionReadline();
    await Controller.newQuestion('\npress <ENTER> to continue...'.green);
};
