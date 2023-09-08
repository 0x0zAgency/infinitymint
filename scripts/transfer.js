const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');

async function main() {
    const { get, deploy } = deployments;
    const accounts = await ethers.getSigners();
    const InfinityMint = await get('InfinityMint');

    const abis = {
        InfinityMint: await ethers.getContractFactory('InfinityMint'),
    };

    let tokenId = process.argv[2] || 0;
    let wallet = process.argv[3] || accounts[1].address;

    let erc721 = new ethers.Contract(
        InfinityMint.address,
        abis.InfinityMint.interface,
        accounts[0]
    );

    console.log(
        ' - Transfering from ' +
            accounts[0].address +
            ' to ' +
            wallet +
            ' tokenID ' +
            tokenId
    );
    let result = await erc721.transferFrom(
        accounts[0].address,
        wallet,
        tokenId
    );
    Controller.logTx(await result.wait());
    console.log('\n☻ Success ☻\n'.green);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
