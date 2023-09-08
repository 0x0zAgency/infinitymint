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
    log('+ Deploying HouseOracle');
    const HouseOracle = await deploy('Mod_HouseOracle', {
        from: deployer,
        log: true,
        args: [],
        libraries: {},
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    HouseOracle.contractName = 'Mod_HouseOracle';

    log('☻ Success ☻\n'.green);
    Controller.logTx(HouseOracle.receipt, 'HouseOracle Contract');

    return [HouseOracle];
};

module.exports = deploy;
