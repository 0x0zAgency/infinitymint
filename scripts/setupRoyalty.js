const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const { getContract } = require('../src/helpers');

/**
 * Main
 * @returns
 */
async function main() {
    let projectFile = await Controller.getProjectFile();
    //ethers deployment helpers
    let { get, deploy } = deployments;
    //VERY GREASY HACK
    let oldDeploy = deploy;
    deploy = async (name, options) => {
        name = getFullyQualifiedName(name);
        return await oldDeploy(name, options);
    };

    const accounts = await ethers.getSigners();

    if (!Controller.getFileSystem().existsSync('./.temp_project')) {
        let result = Controller.verifyExecutionContext();
        if (result !== true)
            throw new Error(
                'please change current project to ' +
                    result +
                    ' or redeploy as ' +
                    Controller.deployConfig.project
            );
    }

    //read tx receipts from
    Controller.loadReceipts();

    let royaltyModule =
        projectFile.modules.royalty || projectFile.modules.royalties;

    if (royaltyModule === undefined)
        throw new Error('no module for royalty defined');

    if (royaltyModule === 'DefaultRoyalty') {
        Controller.log('\n > No Setup Required'.blue);
        return;
    }

    if (
        projectFile.royalties === undefined ||
        Object.keys(projectFile.royalties).length === 0
    ) {
        Controller.log('\n > No Royalty Key'.red);
        return;
    }

    let royalties = {
        ...projectFile.royalties,
    };

    let contract = await getContract(royaltyModule);

    switch (royaltyModule) {
        case 'SplitRoyalty':
            await processSplitRoyalty(contract, projectFile, royalties.payouts);
            break;
        default:
            throw new Error('Unsupported royalty module: ' + royaltyModule);
    }

    if (
        !Controller.getFileSystem().existsSync('./.temp_project') &&
        Controller.getFileSystem().existsSync(
            './projects/' + Controller.deployConfig.project + '.json'
        )
    ) {
        Controller.log('- updating project file');
        let deployedProject = Controller.getProjectFile(true);
        deployedProject.royalty = projectFile.royalty;
        deployedProject.updated = Date.now();
        Controller.getFileSystem().writeFileSync(
            './projects/' + Controller.deployConfig.project + '.json',
            JSON.stringify(deployedProject)
        );
        Controller.log('Note: Remember to run scripts/update.js'.yellow);
    }

    console.log('\nFinished Successfully'.green);
}

async function processSplitRoyalty(contract, projectFile, payouts) {
    Controller.log('\n > Setting up split royalty\n'.blue);
    let mintCount = 0;
    let stickerCount = 0;
    let tempProjectFile = { ...projectFile };
    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        tempProjectFile = JSON.parse(
            Controller.readInformation('./.temp_project')
        );
    }

    //if there has been an error before here, then reset the splits
    if (
        projectFile?.deployed === true ||
        (tempProjectFile?.errors !== undefined &&
            tempProjectFile?.errors['setupRoyalty'] !== undefined)
    ) {
        Controller.log('- Resetting splits');
        let tx = await contract.resetSplits();
        await tx.wait();
    }

    payouts.forEach((value, index) => {
        if (value.address === undefined)
            throw new Error('address not defined for ' + index);

        if (value.splits === undefined)
            throw new Error('splits not defined for ' + index);

        mintCount += value.splits.mints;

        if (value.splits.stickers !== undefined)
            stickerCount += value.splits.stickers;
    });

    if (mintCount > 100)
        throw new Error('Mint count overflow total splits equal over 100%');

    if (stickerCount > 100)
        throw new Error('Sticker count overflow total splits equal over 100%');

    for (let i = 0; i < payouts.length; i++) {
        let value = payouts[i];

        if (value.address === undefined)
            throw new Error('address for ' + i + ' is undefined');

        let address = value.address;

        if (value.splits.mints === undefined || isNaN(value.splits.mints))
            throw new Error(
                'mint split not defined for index ' + i + ' in royalties'
            );

        Controller.log(
            'adding mint split of ' +
                value.splits.mints +
                ' for address ' +
                address
        );

        let tx = await contract.addSplit(
            address,
            Math.floor(value.splits.mints),
            0
        );

        Controller.log(' ☻ Success'.green);

        let receipt = await tx.wait();
        Controller.logTx(receipt);

        if (
            value.splits.stickers !== undefined &&
            !isNaN(value.splits.stickers)
        ) {
            Controller.log('- Setting sticker split');
            tx = await contract.addSplit(
                address,
                Math.floor(value.splits.stickers),
                1
            );
            let receipt = await tx.wait();
            Controller.logTx(receipt);
            Controller.log(' ☻ Success'.green);
        }

        Controller.log(
            'Registered address ' +
                address +
                ' with mint split of ' +
                value.splits.mints +
                '% and sticker split of ' +
                value.splits?.stickers || 0 + '%'
        );
    }

    Controller.saveReceipts();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
