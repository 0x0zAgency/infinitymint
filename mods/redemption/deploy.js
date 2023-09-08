const Controller = require('../../src/Controller');

const deploy = async ({
    deployer,
    deployments,
    ethers,
    chainId,
    deploy,
    get,
    log,
    liveDeployments,
    tempProjectFile,
    projectFile,
}) => {
    log('+ Deploying CD-Key Redemption Contract');
    const Redemption = await deploy('Mod_Redemption', {
        from: deployer,
        log: true,
        args: [
            liveDeployments.InfinityMint, //only needs the erc721 address to function
        ],
        libraries: {
            InfinityMintUtil: liveDeployments.InfinityMintUtil, //libraries
        },
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    log('☻ Success ☻\n'.green);
    Controller.logTx(Redemption.receipt, 'Redemption Contract');

    log('+ Deploying RedemptionLinker contract');
    const RedemptionLinker = await deploy('Mod_RedemptionLinker', {
        from: deployer,
        log: true,
        args: [
            '',
            `${projectFile.description.name}: Proof Of Redemption`,
            'PoR',
            Redemption.address, //only needs the erc721 address to function
            liveDeployments.InfinityMintLinker,
            liveDeployments.InfinityMint,
        ],
        libraries: {
            InfinityMintUtil: liveDeployments.InfinityMintUtil, //libraries
        },
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    log('☻ Success ☻\n'.green);
    Controller.logTx(RedemptionLinker.receipt, 'RedemptionLinker Contract');
    return [Redemption, RedemptionLinker];
};

module.exports = deploy;
