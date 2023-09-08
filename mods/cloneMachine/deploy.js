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
    log('+ Deploying CloneMachineOracle');
    const CloneMachineOracle = await deploy('Mod_CloneMachineOracle', {
        from: deployer,
        log: true,
        libraries: {
            InfinityMintUtil: liveDeployments.InfinityMintUtil, //libraries
        },
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    log('☻ Success ☻\n'.green);
    Controller.logTx(CloneMachineOracle.receipt, 'CloneMachineOracle Contract');
    return CloneMachineOracle;
};

module.exports = deploy;
