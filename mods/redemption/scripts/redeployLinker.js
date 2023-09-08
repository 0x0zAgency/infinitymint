const Controller = require('../../../src/Controller');
const { run, ethers, deployments, getChainId } = require('hardhat');

const Script = async ({
    args,
    deployedProject,
    undeployedProject,
    get,
    deploy,
    deployer,
}) => {
    const accounts = await ethers.getSigners();

    if (
        Controller.getFileSystem().existsSync(
            './deployments/' +
                Controller.defaultNetwork +
                '/Mod_RedemptionLinker.js'
        )
    ) {
        Controller.getFileSystem().unlinkSync(
            './deployments/' +
                Controller.defaultNetwork +
                '/Mod_RedemptionLinker.js'
        );
        throw new Error(
            'please rerun the script, had to delete old linker and need to refresh instance.'
        );
    }
    /**
     *  Register with oracle
     */
    console.log('+ Redeploying RedemptionLinker contract');
    const RedemptionLinker = await deploy('Mod_RedemptionLinker', {
        from: deployer,
        log: true,
        args: [
            '',
            `${deployedProject.description.name}: Proof Of Redemption`,
            'PoR',
            deployedProject.contracts.Mod_Redemption, //only needs the erc721 address to function
            deployedProject.contracts.InfinityMintLinker,
            deployedProject.contracts.InfinityMint,
        ],
        libraries: {
            InfinityMintUtil: deployedProject.contracts.InfinityMintUtil, //libraries
        },
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    console.log('☻ Success ☻\n'.green);
    Controller.logTx(RedemptionLinker.receipt, 'RedemptionLinker Contract');

    let linkerAbi = await ethers.getContractFactory('InfinityMintLinker');
    let linkerContract = new ethers.Contract(
        deployedProject.contracts.InfinityMintLinker,
        linkerAbi.interface,
        accounts[0]
    );

    Controller.log(
        '- approving redemption linker with InfinityMintLinker: ' +
            RedemptionLinker.address
    );
    tx = await linkerContract.setPrivilages(RedemptionLinker.address, true);
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    console.log(
        ' - modifying .deployInfo and setting Mod_RedemptionLinker to equal ' +
            RedemptionLinker.address
    );
    let file = Controller.readInformation(
        './deployments/' + Controller.defaultNetwork + '/.deployInfo',
        true
    );
    file.contracts.Mod_RedemptionLinker = RedemptionLinker.address;
    console.log(
        ' - modifying project fiile and setting contract Mod_RedemptionLinker to equal ' +
            RedemptionLinker.address
    );
    deployedProject.contracts.Mod_RedemptionLinker = RedemptionLinker.address;

    console.log('- saving .deployInfo');
    Controller.writeInformation(
        file,
        './deployments/' + Controller.defaultNetwork + '/.deployInfo'
    );

    console.log('- saving project');
    Controller.writeInformation(
        deployedProject,
        './projects/' + Controller.deployConfig.project + '.json'
    );

    console.log('> Redemption Contract successfully redeployed'.cyan);
};

Script.name = 'Redeploy Linker';
Script.description = 'Redeploys linker contract.';
Script.requireDeployment = true;
Script.allowCount = false; //will execute the script x amount of times
Script.verifyContext = true; //will ensure that when this script is execute the current select project matches the deployed project and the network matches the deployed projects network

module.exports = Script;
