const Controller = require('../../src/Controller');

const deploy = async ({
    deployer,
    deployments,
    liveDeployments,
    ethers,
    chainId,
    deploy,
    log,
    get,
    tempProjectFile,
    projectFile,
}) => {
    log('+ deploying Flag Manager contract'.magenta);

    const FlagManager = await deploy('Mod_FlagManager', {
        from: deployer,
        log: true,
        args: [liveDeployments.InfinityMint, liveDeployments.InfinityMintStorage],
        libraries: {
            InfinityMintUtil: liveDeployments.InfinityMintUtil, //libraries
        },
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });

    log('☻ Success ☻\n'.green);
    Controller.logTx(FlagManager.receipt, 'Flag Manager');
    return FlagManager; //return the full tx object
};

module.exports = deploy;
