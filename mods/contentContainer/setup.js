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

    console.log(
        '- authenticating Mod_ContentOracle with InfinityMint contract'
    );
    let tx = await infinityMint.setPrivilages(
        liveDeployments.Mod_ContentOracle,
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    //add the link to the project links
    addLink(
        tempProjectFile, // link index 0
        {
            key: 'spot_1', //this is what we reference the link by
            title: 'Content Block',
            versionType: 'spot_1',
            contract: 'Mod_ContentContainer',
            deployable: true,
            description: 'Allows your spot to sell content',
            deployFakeContract: true, //only on ganache
            useDefaultLinker: true,
            verifyIntegrity: true,
            onlyForced: false, //can only be set via another contract other than the linker
            canMint: false, //cant just mint in the wild
            args: [
                //used to deploy fake contract
                //0 = type
                //1 = default value
                //2 = id
                ['uint256', '4294967295', 'tokenId'],
                [
                    'address',
                    '0x0000000000000000000000000000000000000000',
                    'erc721Destination',
                ],
                [
                    'address',
                    liveDeployments['Mod_ContentOracle'],
                    'Mod_ContentOracle',
                ],
            ],
        }
    );

    //return our changes
    return tempProjectFile;
};

module.exports = setup;
