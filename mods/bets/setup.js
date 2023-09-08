const Controller = require('../../src/Controller');
const { addLink, getContract } = require('../../src/helpers');

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
    let infinityMint = await getContract('InfinityMint');

    console.log('- authenticating Mod_HouseOracle with InfinityMint contract');
    let tx = await infinityMint.setPrivilages(
        liveDeployments.Mod_HouseOracle,
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    //return our changes
    return tempProjectFile;
};

module.exports = setup;
