const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const { getFullyQualifiedName } = require('../src/helpers');

async function parseArgs(get, accounts, defaultArgs = []) {
    if (defaultArgs.length === 0) return [];

    let results = defaultArgs.map((args) => args[2]);
    let newArguments = [];

    for (let i = 0; i < results.length; i++) {
        switch (results[i].toLowerCase()) {
            case 'tokenid':
                newArguments.push(0);
                break;
            case 'erc721':
            case 'erc721destination':
            case 'infinitymint':
                newArguments.push((await get('InfinityMint')).address);
                break;
            case 'infinitymintvalues':
            case 'valuesdestination':
                newArguments.push((await get('InfinityMintValues')).address);
                break;
            case 'wallet':
                newArguments.push((await get('InfinityMint')).address); //just returns the erc721 address
                break;
            case 'multiminteroracle':
            case 'multireceiver':
                newArguments.push((await get('InfinityMint')).address); //just returns the erc721 address
                break;
            case 'stickers':
                newArguments.push((await get('InfinityMint')).address); //just returns the erc721 address
                break;
            case 'owner':
            case 'sender':
                newArguments.push(accounts[0].address);
                break;
            default:
                try {
                    let contract = await get(results[i]);
                    newArguments.push(contract.address);
                    break;
                } catch (error) {
                    //throw
                }
                newArguments.push(defaultArgs[i][1]);
                break;
        }
    }

    return newArguments;
}

async function main() {
    const { deploy, log, get } = deployments;
    const accounts = await ethers.getSigners();

    let projectFile;

    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        projectFile = Controller.readInformation('./.temp_project', true);
    } else projectFile = await Controller.getProjectFile(true);

    Controller.loadReceipts();

    if (projectFile.links === undefined) {
        throw new Error('links are undefined in project file');
    }

    let keys = Object.keys(projectFile.links);
    for (let i = 0; i < keys.length; i++) {
        let value = projectFile.links[keys[i]];

        if (!value.deployFakeContract) continue;

        if (value.contract === undefined)
            throw new Error(`contract ${value.contract} is undefined`);

        Controller.log('- deploying fake contract: ' + value.contract);
        let args = await parseArgs(get, accounts, value.args);
        let fakeContract = await deploy(value.contract, {
            contract: value.contract,
            from: accounts[0].address,
            log: true,
            //will replace arg values with real values
            args: args,
        });

        Controller.log(
            '- renaming ' + value.contract + ' to Fake_' + value.contract
        );
        Controller.getFileSystem().renameSync(
            './deployments/' +
                Controller.defaultNetwork +
                '/' +
                value.contract +
                '.json',
            './deployments/' +
                Controller.defaultNetwork +
                '/Fake_' +
                value.contract +
                '.json'
        );
        projectFile.contracts['Fake_' + value.contract] = fakeContract.address;
        value.abi = 'Fake_' + value.contract;

        Controller.log(' ☻ Success'.green);
        Controller.logTx(fakeContract.receipt);
    }

    if (Controller.getFileSystem().existsSync('./.temp_project'))
        Controller.writeInformation(projectFile, './.temp_project');
    else {
        console.log(' - saving modified project file');
        Controller.writeInformation(
            projectFile,
            './projects/' + Controller.deployConfig.project + '.json'
        );
        Controller.log(' ☻ Success'.green);

        console.log(' - updating project file on chain');
        await Controller.executeNodeScript('scripts/setProject.js');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
