const { ethers, deployments, getChainId } = require('hardhat');
const hre = require('hardhat');
const Controller = require('../src/Controller');
const Gems = require('../src/Gems');
const glob = require('glob');
const path = require('path');

async function main() {
    const { deploy, log, get, run } = deployments;
    const accounts = await ethers.getSigners();
    const chainId = await getChainId();

    let projectFile;
    let deployInfo;

    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        projectFile = Controller.readInformation('./.temp_project', true);
    } else {
        projectFile = await Controller.getProjectFile(true);
        let result = Controller.verifyExecutionContext();
        if (result !== true)
            throw new Error(
                'please change current project to ' +
                    result +
                    ' or redeploy as ' +
                    Controller.deployConfig.project
            );
    }

    await Gems.loadMods();

    if (
        Controller.getFileSystem().existsSync(
            './deployments/' + Controller.defaultNetwork + '/.deployInfo'
        )
    )
        deployInfo = Controller.readInformation(
            './deployments/' + Controller.defaultNetwork + '/.deployInfo',
            true
        );
    else
        deployInfo = Controller.readInformation(
            Controller.settings.reactLocation +
                'src/Deployments/deployInfo.json',
            true
        );

    Controller.loadReceipts();

    if (!Gems.isModValid(process.argv[2].trim()))
        throw new Error('invalid gem');

    projectFile.mods[process.argv[2]] = true;
    Gems.enableMods(projectFile.mods);

    // Compile the contract we need
    const thisMod = Gems.mods[process.argv[2]];

    //find all .sol files in the contracts folder
    let matches = (
        await new Promise((resolve, reject) => {
            glob(
                process.cwd() + '/' + thisMod.path + '**/*.sol',
                (_err, matches) => {
                    if (_err !== null) reject(_err);
                    else resolve(matches);
                }
            );
        })
    ).forEach((fullPath) => {
        let parsedPath = path.parse(fullPath);
        let solPath =
            process.cwd() +
            '/contracts/__mods/' +
            fullPath
                .replace(process.cwd() + '/' + thisMod.path + 'contracts/', '')
                .replace(parsedPath.base, '') +
            parsedPath.name +
            '.sol';
        let data = Controller.readInformation(fullPath);
        let found = false;

        data = data.split('\n');
        data.forEach((line) => {
            if (found) return;

            if (
                line.indexOf('import') === -1 &&
                line.indexOf('contract') !== -1 &&
                line.indexOf('Mod_') === -1 &&
                line.indexOf('{') !== -1
            )
                console.log(
                    (
                        `mod warning [${file.mod}]: file contract name for ` +
                        file.name +
                        '.sol is missing Mod_ contract must be called Mod_' +
                        file.name
                    ).red
                );
            else if (
                line.indexOf('contract') !== -1 &&
                line.indexOf('Mod_') !== -1
            )
                found = true;
        });

        data = data.map((line) =>
            line.indexOf('import') !== -1
                ? line.replace('./../../../contracts/', './../')
                : line
        );

        Controller.getFileSystem().writeFileSync(solPath, data.join('\n'));
    });

    await hre.run('clean');
    await hre.run('compile');

    let deployScript = Gems.getDeployMethods().filter(
        (method) => method.mod === process.argv[2]
    )[0];

    const InfinityMint = await get('InfinityMint');
    const InfinityMintApi = await get('InfinityMintApi');
    const InfinityMintUtil = await get('InfinityMintUtil');
    const InfinityMintStorage = await get('InfinityMintStorage');
    const InfinityMintLinker = await get('InfinityMintLinker');
    const InfinityMintValues = await get('InfinityMintValues');
    const InfinityMintProject = await get('InfinityMintProject');
    const InfinityMintRoyalty = await get(projectFile.modules.royalty);
    const InfinityMintAsset = await get(projectFile.modules.controller);
    const InfinityMintRandomNumber = await get(projectFile.modules.random);
    const InfinityMinter = await get(projectFile.modules.minter || 'Minter');

    let newContracts = {};

    if (deployScript) {
        let contractOrContracts = await deployScript.method.bind(this, {
            get,
            deploy: (contract, options) => {
                return deploy(contract, {
                    ...options,
                    contract: contract,
                });
            },
            log,
            tempProjectFile: projectFile,
            projectFile,
            deployer: accounts[0].address,
            accounts,
            deployments,
            liveDeployments: {
                InfinityMint: InfinityMint.address,
                InfinityMintApi: InfinityMintApi.address,
                InfinityMintUtil: InfinityMintUtil.address,
                InfinityMintStorage: InfinityMintStorage.address,
                InfinityMintLinker: InfinityMintLinker.address,
                InfinityMintValues: InfinityMintValues.address,
                InfinityMintProject: InfinityMintProject.address,
                InfinityMintAsset: InfinityMintAsset.address,
                InfinityMintRoyalty: InfinityMintRoyalty.address,
                InfinityMintRandomNumber: InfinityMintRandomNumber.address,
                [projectFile.modules.controller]: InfinityMintAsset.address,
                [projectFile.modules.royalty]: InfinityMintRoyalty.address,
                [projectFile.modules.random]: InfinityMintRandomNumber.address,
                [projectFile.modules.minter]: InfinityMinter.address,
            },
            ethers,
            chainId,
        })();

        if (contractOrContracts instanceof Array) {
            contractOrContracts.forEach((contract) => {
                projectFile.contracts[contract.contractName] = contract.address;
                newContracts[contract.contractName] = contract.address;
            });
        } else {
            projectFile.contracts[contractOrContracts.contractName] =
                contractOrContracts.address;
            newContracts[contractOrContracts.contractName] =
                contractOrContracts.address;
        }

        deployInfo.contracts = {
            ...deployInfo.contracts,
            ...newContracts,
        };
    }

    projectFile.contracts = deployInfo.contracts;

    let setupScript = Gems.getScriptMethods().filter(
        (method) => method.mod === process.argv[2]
    )[0];

    if (setupScript) {
        let newProjectFile = await setupScript.method.bind(this, {
            get,
            deploy,
            log,
            tempProjectFile: projectFile,
            projectFile,
            deployer: accounts[0].address,
            accounts: accounts,
            deployments,
            liveDeployments: {
                InfinityMint: InfinityMint.address,
                InfinityMintApi: InfinityMintApi.address,
                InfinityMintUtil: InfinityMintUtil.address,
                InfinityMintStorage: InfinityMintStorage.address,
                InfinityMintLinker: InfinityMintLinker.address,
                InfinityMintValues: InfinityMintValues.address,
                InfinityMintProject: InfinityMintProject.address,
                InfinityMintAsset: InfinityMintAsset.address,
                InfinityMintRoyalty: InfinityMintRoyalty.address,
                InfinityMintRandomNumber: InfinityMintRandomNumber.address,
                [projectFile.modules.controller]: InfinityMintAsset.address,
                [projectFile.modules.royalty]: InfinityMintRoyalty.address,
                [projectFile.modules.random]: InfinityMintRandomNumber.address,
                [projectFile.modules.minter]: InfinityMinter.address,
                ...newContracts,
            },
            ethers,
            chainId,
        })();

        if (newProjectFile !== undefined && newProjectFile !== null) {
            projectFile = {
                ...projectFile,
                ...newProjectFile,
            };
        }
    }

    deployInfo.contracts = projectFile.contracts;

    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        Controller.writeInformation(projectFile, './.temp_project');
        Controller.writeInformation(deployInfo, './.deployInfo');
    } else {
        Controller.writeInformation(
            projectFile,
            './projects/' + Controller.deployConfig.project + '.json'
        );
        Controller.writeInformation(
            deployInfo,
            './deployments/' + Controller.defaultNetwork + '/.deployInfo'
        );
        Controller.writeInformation(deployInfo, './.deployInfo');
    }

    //recopy
    await Controller.executeNodeScript('scripts/recopy.js');
    //redeploy linker
    await Controller.executeNodeScript('scripts/deployLinker.js');
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
