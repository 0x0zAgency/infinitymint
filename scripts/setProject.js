const { ethers, getChainId } = require('hardhat');
const { Web3Storage, File } = require('web3.storage');
const Controller = require('../src/Controller');
const { delay, getContract } = require('../src/helpers');
const { Blob } = require('buffer');

async function main() {
    const chainId = await getChainId(); //chain id
    //read temp projectFile
    let projectFile;

    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        Controller.loadReceipts();
        projectFile = Controller.readInformation('./.temp_project', true);
    } else {
        projectFile = await Controller.getProjectFile(true);
        if (projectFile === undefined) throw new Error('invalid project');

        let result = Controller.verifyExecutionContext();
        if (result !== true)
            throw new Error(
                'please change current project to ' +
                    result +
                    ' or redeploy as ' +
                    Controller.deployConfig.project
            );
    }

    let projectController = await getContract('InfinityMintProject');

    const ipfs = new Web3Storage({
        token: Controller.deployConfig.ipfs.apiKey,
    });

    projectFile.updated = Date.now();
    let newProjectFile = { ...projectFile };
    let versions = parseInt((await projectController.getVersions()).toString());
    let tx;
    let tag = 'initial';

    if (versions !== 0) tag = 'version_' + versions;

    let preSize = new Blob([
        typeof newProjectFile === 'object'
            ? JSON.stringify(newProjectFile)
            : newProjectFile,
    ]).size;

    //upload projectFile to IPFS if it is above 6kb
    if (
        process.argv[2] === 'true' ||
        (parseInt(chainId) !== 1337 &&
            Controller.deployConfig.projectFileForcedProduction) ||
        (!Controller.deployConfig.useCopiedProjectFile &&
            preSize / 1024 >
                (parseInt(chainId) !== 1337
                    ? Controller.deployConfig.maximumLiveProjectSize || 6
                    : Controller.deployConfig.maximumGanacheProjectSize || 12))
    ) {
        //add tag and version
        newProjectFile.tag = tag;
        newProjectFile.version = versions;

        Controller.log(
            `- ${Controller.deployConfig.project}.json is too big to set in contract uploading to IPFS`
        );
        //create new IFPS file class
        let file = new File(
            [JSON.stringify(newProjectFile)],
            `${Controller.deployConfig.project}.json`
        );
        let cid = await ipfs.put([file]);
        newProjectFile =
            Controller.deployConfig.ipfs.publicGateway +
            `${cid}/${Controller.deployConfig.project}.json`;
        Controller.log('Succesfully uploaded to IPFS'.dim);
    }

    //if we are copying content and not not also putting on IPFS
    if (Controller.deployConfig.useCopiedProjectFile) {
        if (
            parseInt(chainId) === 1337 ||
            !Controller.deployConfig.projectFileForcedProduction
        ) {
            newProjectFile = {};
            newProjectFile.local = true;
            newProjectFile.tag = tag;
            newProjectFile.updated = Date.now();
            newProjectFile.version = versions;

            console.log(
                'Note: Using copied local project file so project file will not be available on chain'
                    .cyan
            );
        } else {
            if (
                parseInt(chainId) !== 1337 &&
                Controller.deployConfig.projectFileForcedProduction
            )
                console.log(
                    'WARNNING: project was forcefully set to be not local since we are on production'
                        .cyan
                );
        }
    }

    newProjectFile =
        typeof newProjectFile === 'object'
            ? JSON.stringify(newProjectFile)
            : newProjectFile;
    let finalSize = new Blob([newProjectFile]).size;

    if (
        (parseInt(chainId) !== 1337 ||
            Controller.deployConfig.assertOnGanache) &&
        finalSize / 1024 > Controller.deployConfig.assertProjectSize
    ) {
        console.log(
            '\nCritical Warning: Something appears to have gone quite wrong and the file about to be put on chain for your project ' +
                'is above the assertProjectSize of ' +
                Controller.deployConfig.assertProjectSize +
                'kb. This normally suggests that it did not upload to ' +
                'ipfs correctly and other things might not have as well. If the size in okay and this looks like a singular case, then continue with deployment and run ' +
                +'node scripts/setProject.js to set the project file on chain.'
        );
        await delay(5);
        Controller.log('Continuing in 5 seconds...'.red);
        await delay(5);
    } else if (finalSize / 1024 < 24) {
        console.log(
            '- setting project in contract, size of ' + finalSize / 1024 + 'kb'
        );

        //set initial project
        if (versions == 0) {
            console.log('- setting initial project');
            tx = await projectController.setInitialProject(
                ethers.utils.hexlify(ethers.utils.toUtf8Bytes(newProjectFile))
            );
        } else {
            console.log('- updating project (using version tag ' + tag + ')');
            tx = await projectController.updateProject(
                ethers.utils.hexlify(ethers.utils.toUtf8Bytes(newProjectFile)),
                ethers.utils.hexlify(ethers.utils.toUtf8Bytes(tag)),
                true //sets it as the current project
            );
        }

        //put tags in local project
        projectFile.tag = tag;
        projectFile.version = parseInt(versions.toString());

        if (parseInt(chainId) !== 1337) {
            Controller.logTx(await tx.wait());
        } else if (!Controller.deployConfig.ignoreSetProjectReceipt) {
            Controller.logTx(await tx.wait());
        } else {
            let receipt = await tx.wait();

            if (
                receipt.gasUsed === undefined &&
                receipt.getTransactionReceipt !== undefined
            )
                receipt = receipt.getTransactionReceipt();

            Controller.log(
                '- Not saving receipt: but gas usage for set was '.yellow +
                    parseInt(receipt.gasUsed.toString())
            );
            Controller.log(' ☻ Success'.green);
        }
    } else {
        throw new Error('bad object uri');
    }

    //write project file
    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        Controller.writeInformation(projectFile, './.temp_project');
    } else {
        let module = await Controller.getVersionModule();
        module.onCopyProject(projectFile);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
