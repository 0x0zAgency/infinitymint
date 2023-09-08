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
    await Controller.deleteIfPresent('Mod_Marketplace');

    log('+ Deploying Marketplace Extension Contract');
    const Marketplace = await deploy('Mod_Marketplace', {
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
    Marketplace.contractName = 'Mod_Marketplace';
    Controller.logTx(Marketplace.receipt, 'Marketplace Contract');
    return Marketplace;
};

module.exports = deploy;
