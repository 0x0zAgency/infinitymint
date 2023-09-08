const Controller = require('../src/Controller');
const { getContract } = require('../src/helpers');

async function main() {
    let projectFile;

    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        projectFile = Controller.readInformation('./.temp_project', true);
    } else {
        projectFile = await Controller.getProjectFile(true);
    }

    //create new ethers classes so we can talk to everything
    let storageContract;
    let erc721Contract;
    let assetContract;

    //get the contract addresses
    storageContract = await getContract('InfinityMintStorage');
    erc721Contract = await getContract('InfinityMint');
    assetContract = await getContract(
        projectFile.modules.svg || projectFile.modules.controller
    );
    minterContract = await getContract(projectFile.modules.minter);
    royaltyContract = await getContract(projectFile.modules.royalty);

    let addresses = [
        projectFile.contracts['InfinityMint'],
        projectFile.contracts['InfinityMintStorage'],
        projectFile.contracts['InfinityMintApi'],
        projectFile.contracts[projectFile.modules.minter],
        projectFile.contracts[
            projectFile.modules.svg || projectFile.modules.controller
        ],
    ];

    Controller.log(
        `- setting ` + addresses.length + ' permissions in storage contract'
    );
    tx = await storageContract.multiApprove(addresses);
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    /**
     * InfinityMinter Contract
     */

    Controller.log(
        `- giving InfinityMint:${projectFile.contracts['InfinityMint']} access to InfinityMinter`
    );
    tx = await minterContract.setPrivilages(
        projectFile.contracts['InfinityMint'],
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    /**
     * Asset Contract
     */

    addresses = [
        projectFile.contracts['InfinityMint'],
        projectFile.contracts['InfinityMintApi'],
        projectFile.contracts[projectFile.modules.minter],
    ];

    Controller.log(
        `- setting ` + addresses.length + ' permissions in assetcontract'
    );
    tx = await assetContract.multiApprove(addresses);
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    /**
     * Main Contract
     */

    Controller.log(
        `- giving InfinityMinterApi:${projectFile.contracts['InfinityMintApi']} eleveated access to ERC721 contract`
    );
    tx = await erc721Contract.setPrivilages(
        projectFile.contracts['InfinityMintApi'],
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);

    /**
     * Royalty Contract
     */

    Controller.log(
        `- giving InfinityMint:${projectFile.contracts['InfinityMint']} access to royalty contract`
    );
    tx = await royaltyContract.setPrivilages(
        projectFile.contracts['InfinityMint'],
        true
    );
    Controller.logTx(await tx.wait());
    Controller.log(' ☻ Success'.green);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
