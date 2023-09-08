const { ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const { getContract } = require('../src/helpers');

(async () => {
    const { deploy, get } = deployments;
    const accounts = await ethers.getSigners();

    let projectFile;
    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        projectFile = Controller.readInformation('./.temp_project', true);
    } else {
        projectFile = await Controller.getProjectFile(true);
        let result = Controller.verifyExecutionContext();

        if (result !== true) {
            throw new Error(
                'Change your current project to ' +
                    result +
                    ', or redeploy as ' +
                    Controller.deployConfig.project
            );
        }
    }

    Controller.loadReceipts();

    // Load the main InfinityMint contract
    // & its corresponding StorageController.
    const InfinityMint = await get('InfinityMint');
    const InfinityMintStorage = await get('InfinityMintStorage');
    // Get the addresses from the current storageContract
    let storageContract = await getContract('InfinityMintStorage');
    let deployContract = process.argv[2] !== 'false';
    let contract = 'Mod_UploadPaths';
    let Mod_UploadPaths;
    if (deployContract) {
        if (projectFile.network.chainId !== 1337)
            throw new Error('- Cannot delete Mod_UploadPaths.json manually!');

        if (
            Controller.getFileSystem().existsSync(
                `./deployments/${Controller.defaultNetwork}/${contract}.json`
            )
        ) {
            console.log('- deleting previous deployment');
            Controller.getFileSystem().unlinkSync(
                `./deployments/${Controller.defaultNetwork}/${contract}.json`
            );

            let result = await Controller.executeNodeScript(
                'scripts/deployUploadPaths.js'
            );

            if (result !== 0) {
                throw new Error(
                    '\
					You had an error with deployments. \
					Either retry or check the `scripts/deployUploadPaths` script \
				'
                );
            }

            return;
        }

        Controller.log(
            '\n> Deploying new uploadPaths contract "'.blue +
                contract.underline +
                '" pointing to erc721 destination: '.blue +
                InfinityMint.address.underline +
                '\n'
        );

        Mod_UploadPaths = await deploy(contract, {
            contract: 'Mod_UploadPaths',
            from: accounts[0].address,
            log: true,
            args: [
                process.argv[3] || InfinityMint.address,
                process.argv[4] || InfinityMintStorage.address,
            ],
        });

        Controller.logTx(Mod_UploadPaths.receipt);
        Controller.log(' ☻ Success'.green);

        if (!Controller.getFileSystem().existsSync('./.temp_project')) {
            let filePath =
                Controller.settings.reactLocation +
                'src/Deployments/' +
                contract +
                '.json';

            Controller.log('- copying abi to ' + filePath);
            Controller.getFileSystem().copyFileSync(
                './deployments/' +
                    Controller.defaultNetwork +
                    '/' +
                    contract +
                    '.json',
                filePath
            );
        }
    } else {
        Mod_UploadPaths = await get('Mod_UploadPaths');
    }

    Controller.log(
        '\
		- authenticating new `uploadPaths` contract at ' +
            Mod_UploadPaths.address +
            ' with storage controller \
	'
    );

    let tx;
    if (storageContract.togglePrivilages !== undefined) {
        tx = await storageContract.togglePrivilages(Mod_UploadPaths.address);
    } else if (storageContract.setPrivilages !== undefined) {
        tx = await storageContract.setPrivilages(Mod_UploadPaths.address, true);
    } else {
        throw new Error('Could not work out permission function');
    }

    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    console.log('\n > Setting up new `uploadPaths` contract!\n'.blue);

    let module = await Controller.getVersionModule();
    console.log(
        '\
		\n > Modifying .deployInfo to include modified Mod_UploadPaths contract\
		'
            .blue
    );

    if (Controller.getFileSystem().existsSync('.deployInfo')) {
        let deployInfo = JSON.parse(
            Controller.getFileSystem().readFileSync('.deployInfo')
        );
        deployInfo.contracts['Mod_UploadPaths'] = Mod_UploadPaths.address;

        Controller.getFileSystem().writeFileSync(
            '.deployInfo',
            JSON.stringify(deployInfo)
        );

        Controller.log(' ☻ Success'.green);
        module.onCopyDeployInfo(deployInfo);
    }

    // All done successfully!
    console.log('\n > Copying .deployInfo config to react');

    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        Controller.writeInformation(projectFile, './.temp_project');
    } else {
        projectFile.contracts['Mod_UploadPaths'] = Mod_UploadPaths.address;
        projectFile.updated = Date.now();
        projectFile.modules.linker = contract;
        console.log(' - Saving modified project file');

        Controller.writeInformation(
            projectFile,
            './projects/' + Controller.deployConfig.project + '.json'
        );

        Controller.log(' ☻ Success'.green);

        console.log(' - Updating project file on-chain');
        await Controller.executeNodeScript('scripts/setProject.js');
    }

    console.log('\n> Mod_UploadPaths Deployed'.cyan);
    Controller.saveReceipts();
})()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error.stack);
        process.exit(1);
    });
