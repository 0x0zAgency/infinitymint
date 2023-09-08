const Controller = require('../../src/Controller');
const hre = require('hardhat');

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
    log('+ Deploying ContentOracle');
    const ContentOracle = await deploy('Mod_ContentOracle', {
        from: deployer,
        log: true,
        args: [
            liveDeployments.InfinityMint, //only needs the erc721 address to function
        ],
        libraries: {},
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    ContentOracle.contractName = 'Mod_ContentOracle';

    log('☻ Success ☻\n'.green);
    Controller.logTx(ContentOracle.receipt, 'ContentOracle Contract');

    return [ContentOracle];
};

module.exports = deploy;
