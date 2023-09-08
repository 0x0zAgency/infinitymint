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
    let erc721Contract = await getContract('InfinityMint');
    let storageContract = await getContract('InfinityMintStorage');

    //approve with main ERC721
    let address = (await getContract('Mod_FlagManager')).address;

    console.log(
        '+ Approving ' +
            address +
            ' (flag manager) with main ERC721 at ' +
            liveDeployments.InfinityMint
    );
    let tx = await erc721Contract.setPrivilages(address, true);
    console.log('☻ Success'.green);
    Controller.logTx(await tx.wait());

    //approve with InfinityMintStorage controller so it can set flags
    console.log(
        '+ Approving ' +
            address +
            ' (flag manager) with main storage controller  ' +
            liveDeployments.InfinityMintStorage
    );
    tx = await storageContract.setPrivilages(address, true);
    console.log('☻ Success'.green);
    Controller.logTx(await tx.wait());
};

module.exports = setup;
