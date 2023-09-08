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
    log('+ Deploying 🥃Club.eth Extension Contract');
    const DrinkClub = await deploy('Mod_Drink', {
        from: deployer,
        log: true,
        args: [
            liveDeployments.InfinityMint,
            liveDeployments.InfinityMintApi,
            liveDeployments.InfinityMintStorage,
            projectFile.description.token + '🥃',
            projectFile.description.tokenSymbol + '🥃', //only needs the erc721 address to function
        ],
        libraries: {
            InfinityMintUtil: liveDeployments.InfinityMintUtil, //libraries
        },
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    log('☻ Success ☻\n'.green);
    Controller.logTx(DrinkClub.receipt, '🥃Club.eth Contract');
    return DrinkClub;
};

module.exports = deploy;
