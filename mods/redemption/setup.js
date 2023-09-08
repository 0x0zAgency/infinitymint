const { addLink, getContract } = require('../../src/helpers');
const Controller = require('./../../src/Controller');
/**
 * Approves addresses inside of the project with the redemption contract as well so they can be admins there as well
 * @param {*} param0
 */
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
    let redemptionContract = await getContract('Mod_Redemption');
    let linkerContract = await getContract('InfinityMintLinker');

    console.log('- approving admins with cd-key redemption contract');
    for (let i = 0; i < tempProjectFile.approved.length; i++) {
        if (tempProjectFile.approved[i] == accounts[0].address) {
            Controller.log('NOTE: skipping deployer'.cyan);
            continue;
        }

        Controller.log('- approving address: ' + tempProjectFile.approved[i]);
        let tx = await redemptionContract.setPrivilages(
            tempProjectFile.approved[i],
            true
        );
        Controller.logTx(await tx.wait());
        Controller.log(' ☻ Success'.green);
    }

    Controller.log(
        '- approving main ERC721 with redemption contract: ' +
            liveDeployments.InfinityMint
    );
    let tx = await redemptionContract.setPrivilages(
        liveDeployments.InfinityMint,
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    Controller.log(
        '- approving redemption linker with InfinityMintLinker: ' +
            liveDeployments.Mod_RedemptionLinker
    );
    tx = await linkerContract.setPrivilages(
        liveDeployments.Mod_RedemptionLinker,
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    addLink(tempProjectFile, {
        key: 'proof_of_redemption',
        title: '🧾 Proof Of Redemption',
        description:
            'Use our Proof of Redemption system to redeem an NFTs for your phygital assets.',
        deployable: false, //means that the token owner has to deploy this link them selves
        deployFakeContract: false, //will deploy a copy of what ever the contract key is for the token owner to deployer
        useDefaultLinker: false, //if true, will link inside of InfinityMintLinker, if not will mint in our own specified contract.
        verifyIntegrity: false, //used when linking deployed contracts by the token owner, since we no do that here we can disable
        onlyForced: true, //can only be set via another contract other than the linker
        canMint: true, //can be minted from the website
        erc721: true, //is a link to an ERC721 contract
        contract: 'Mod_RedemptionLinker',
        permanent: true,
        method: 'mintProofOfRedemption',
        //see main.js
        useHooks: ['redemption'],
        requirements: ['wallet','stickers'],
        args: [
            //used to deploy fake contract
            //0 = type
            //1 = default value
            //2 = id
            ['uint256', '0', 'tokenId'],
        ],
    });

    return tempProjectFile;
};

module.exports = setup;
