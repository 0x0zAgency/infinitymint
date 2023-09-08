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
    log('+ Deploying SelectiveMint');
    const SelectiveMint = await deploy('Mod_SelectiveMint', {
        from: deployer,
        log: true,
        args: [
            liveDeployments.InfinityMint, //only needs the erc721 address to function
            liveDeployments[tempProjectFile.modules.controller], //only needs the erc721 address to function
            liveDeployments[tempProjectFile.modules.random], //only needs the erc721 address to function
            liveDeployments.InfinityMintValues, //only needs the erc721 address to function
            liveDeployments[tempProjectFile.modules.royalty], //only needs the erc721 address to function
        ],
        libraries: {},
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    SelectiveMint.contractName = 'Mod_SelectiveMint';

    log('☻ Success ☻\n'.green);
    Controller.logTx(SelectiveMint.receipt, 'SelectiveMint Contract');

    log('+ Deploying MultiMinterOracle');
    const MultiMinterOracle = await deploy('Mod_MultiMinterOracle', {
        from: deployer,
        log: true,
        args: [],
        libraries: {},
        waitConfirmations:
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .confirmations,
    });
    MultiMinterOracle.contractName = 'Mod_MultiMinterOracle';

    log('☻ Success ☻\n'.green);
    Controller.logTx(MultiMinterOracle.receipt, ' MultiMinterOracle Contract');

    return [SelectiveMint, MultiMinterOracle];
};

module.exports = deploy;
