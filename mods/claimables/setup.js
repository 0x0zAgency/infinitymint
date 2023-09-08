const Controller = require('../../src/Controller');

const setup = async ({
    ethers,
    chainId,
    get,
    abis,
    accounts,
    tempProjectFile,
    liveDeployments,
    projectFile,
    getAssetControllerAddress,
    getMinterAddress,
}) => {
    let erc721Contract = await getContract('InfinityMint');
    let storageContract = await getContract('InfinityMinStorage');
};

module.exports = setup;
