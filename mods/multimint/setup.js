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
        '- authenticating Mod_SelectiveMint with InfinityMint contract'
    );
    let tx = await infinityMint.setPrivilages(
        liveDeployments.Mod_SelectiveMint,
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    //add the link to the project links
    addLink(
        tempProjectFile, // link index 0
        {
            key: 'multiminter', //this is what we reference the link by
            title: 'MultiMinter Receiver',
            versionType: 'multiReceiver',
            contract: 'Mod_MultiReceiver',
            deployable: true,
            description:
                'Allows the token receive MultiMinter tokens from this Minter. These are child minters within the parent Minter.',
            deployFakeContract: true, //only on ganache
            useDefaultLinker: true,
            verifyIntegrity: true,
            onlyForced: false, //can only be set via another contract other than the linker
            canMint: false, //cant just mint in the wild
            requirements: ['wallet'],
            args: [
                //used to deploy fake contract
                //0 = type
                //1 = default value
                //2 = id
                ['uint256', '42069', 'tokenId'],
                [
                    'address',
                    '0x0000000000000000000000000000000000000000',
                    'erc721Destination',
                ],
                [
                    'address',
                    liveDeployments['Mod_MultiMinterOracle'],
                    'Mod_MultiMinterOracle',
                ],
            ],
        }
    );

    //return our changes
    return tempProjectFile;
};

module.exports = setup;
