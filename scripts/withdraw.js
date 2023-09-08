const { run, ethers, deployments } = require('hardhat');

async function main() {
    const { get, deploy } = deployments;
    const accounts = await ethers.getSigners();
    const InfinityMint = await get('InfinityMint');

    const abis = {
        InfinityMint: await ethers.getContractFactory('InfinityMint'),
    };

    console.log(
        ('\n> Withdrawing balance for account: ' + accounts[0].address).blue
    );
    let erc721 = new ethers.Contract(
        InfinityMint.address,
        abis.InfinityMint.interface,
        accounts[0]
    );
    let tx = await erc721.withdraw();
    await tx.wait();
    console.log(' ☻ Success'.green);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
