const { ethers, deployments } = require('hardhat');
const controller = require('../src/Controller');
const { getFullyQualifiedName, getContract } = require('../src/helpers');

async function main() {
    const { deploy, log, get } = deployments;
    const accounts = await ethers.getSigners();

    let projectFile;

    if (controller.getFileSystem().existsSync('./.temp_project')) {
        projectFile = controller.readInformation('./.temp_project', true);
    } else {
        projectFile = await controller.getProjectFile(true);
        let result = controller.verifyExecutionContext();
        if (result !== true)
            throw new Error(
                'please change current project to ' +
                    result +
                    ' or redeploy as ' +
                    controller.deployConfig.project
            );
    }

    controller.loadReceipts();

    let storageContract = await getContract('InfinityMintStorage');
    let deployContract =
        process.argv[2] !== undefined && process.argv[2] !== 'false';
    let contract = 'InfinityMintLinker';
    let InfinityMintLinker;
    if (
        deployContract ||
        !controller
            .getFileSystem()
            .existsSync(
                `./deployments/${controller.defaultNetwork}/${contract}.json`
            )
    ) {
        if (projectFile.network.chainId !== 1337)
            throw new Error('- cannot delete InfinityMintLinker.json manually');

        if (
            controller
                .getFileSystem()
                .existsSync(
                    `./deployments/${controller.defaultNetwork}/${contract}.json`
                )
        ) {
            console.log('- deleting previous deployment');
            controller
                .getFileSystem()
                .unlinkSync(
                    `./deployments/${controller.defaultNetwork}/${contract}.json`
                );
            let result = await controller.executeNodeScript(
                'scripts/deployLinker.js'
            );

            if (result !== 0) throw new Error('bad');

            return;
        }

        controller.log(
            "\n> Deploying new linker contract '".blue +
                contract.underline +
                "' pointing to erc721 destination: ".blue +
                projectFile.contracts['InfinityMint'].underline +
                '\n'
        );
        InfinityMintLinker = await deploy(contract, {
            from: accounts[0].address,
            contract: getFullyQualifiedName('InfinityMintLinker'),
            log: true,
            args: [
                process.argv[3] || projectFile.contracts['InfinityMintStorage'],
                process.argv[4] || projectFile.contracts['InfinityMint'],
            ],
        });
        controller.logTx(InfinityMintLinker.receipt);
        controller.log(' ☻ Success'.green);

        if (!controller.getFileSystem().existsSync('./.temp_project')) {
            let filePath =
                controller.settings.reactLocation +
                'src/Deployments/' +
                contract +
                '.json';
            controller.log('- copying abi to ' + filePath);
            controller
                .getFileSystem()
                .copyFileSync(
                    './deployments/' +
                        controller.defaultNetwork +
                        '/' +
                        contract +
                        '.json',
                    filePath
                );
        }
        projectFile.contracts['InfinityMintLinker'] =
            InfinityMintLinker.address;
    }

    let linkerContract = await getContract('InfinityMintLinker');

    if (
        controller
            .getFileSystem()
            .existsSync(
                `./deployments/${controller.defaultNetwork}/${contract}.json`
            )
    ) {
        console.log('- clearing previous linker links');
        let tx = await linkerContract.clearLinks();
        controller.logTx(await tx.wait());
        controller.log(' ☻ Success'.green);
    }

    controller.log(
        '- authenticating new linker at ' +
            projectFile.contracts['InfinityMintLinker'] +
            ' with storage controller'
    );

    let tx = await storageContract.setPrivilages(
        projectFile.contracts['InfinityMintLinker'],
        true
    );

    controller.logTx(await tx.wait());
    controller.log(' ☻ Success'.green);

    console.log('\n > Setting up new linker\n'.blue);

    let links = Object.values(projectFile.links);
    for (let i = 0; i < links.length; i++) {
        let value = links[i];
        if (value.key === undefined)
            throw new Error('link ' + i + '.key is undefined');

        controller.log(
            `- Adding link support for ` +
                value.key +
                ' version type ' +
                value.versionType +
                ` index [${i}] inside of linker contract`
        );
        let tx = await linkerContract.addSupport(
            i,
            value.key,
            ethers.utils.hexlify(
                ethers.utils.toUtf8Bytes(value.versionType || '')
            ),
            value.erc721 === true,
            value.dontVerifyIntegrity !== true,
            value.forcedOnly === true,
            value.permanent === true,
            {
                gasPrice: controller.getGasPrice(),
            }
        );
        controller.logTx(await tx.wait());
        controller.log(' ☻ Success'.green);
        value.index = i;
        value.active = true;
    }

    let module = await controller.getVersionModule();

    console.log(
        '\n > Modifying .deployInfo to include modified InfinityMintLinker contract\n'
            .blue
    );

    if (controller.getFileSystem().existsSync('.deployInfo')) {
        let deployInfo = JSON.parse(
            controller.getFileSystem().readFileSync('.deployInfo')
        );
        deployInfo.contracts['InfinityMintLinker'] =
            projectFile.contracts['InfinityMintLinker'];
        controller
            .getFileSystem()
            .writeFileSync('.deployInfo', JSON.stringify(deployInfo));

        controller.log(' ☻ Success'.green);
        module.onCopyDeployInfo(deployInfo);
    }

    console.log('\n > Copying .deployInfo config to react');

    if (controller.getFileSystem().existsSync('./.temp_project'))
        controller.writeInformation(projectFile, './.temp_project');
    else {
        projectFile.contracts['InfinityMintLinker'] =
            projectFile.contracts['InfinityMintLinker'];
        projectFile.updated = Date.now();
        projectFile.modules.linker = contract;
        console.log(' - saving modified project file');
        controller.writeInformation(
            projectFile,
            './projects/' + controller.deployConfig.project + '.json'
        );
        controller.log(' ☻ Success'.green);

        console.log(' - updating project file on chain');
        await controller.executeNodeScript('scripts/setProject.js');
    }

    console.log('\n> Linker Deployed'.cyan);
    controller.saveReceipts();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
