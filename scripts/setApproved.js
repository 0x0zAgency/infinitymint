const Controller = require('../src/Controller');
const { getContract } = require('../src/helpers');

async function main() {
    //save the tx receipts
    Controller.loadReceipts();

    let erc721 = await getContract('InfinityMint');
    let projectFile;

    if (Controller.getFileSystem().existsSync('./.temp_project'))
        projectFile = Controller.readInformation('./.temp_project', true);
    else {
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

    console.log(
        '\n> Approving wallet addresses on main ERC721 (for free/implicit mint & website admin panel access)\n'
            .blue
    );
    let addresses = projectFile.approved || [];

    if (addresses.length !== 0) {
        console.log(' - approving ' + addresses.length + ' addresses');
        let tx = await erc721.multiApprove(addresses);
        Controller.log(' ☻ Success'.green);
        Controller.logTx(await tx.wait());
    }

    console.log('Finished Successfully\n'.green);

    //save the tx receipts
    Controller.saveReceipts();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
