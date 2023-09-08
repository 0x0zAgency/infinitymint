const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
/**
 * Main
 * @returns
 */
async function main() {
    const { get, deploy } = deployments;
    const accounts = await ethers.getSigners();
    let projectFile = await Controller.getProjectFile();
    let module = projectFile.modules.royalty || projectFile.modules.royalties;

    if (module === undefined) throw new Error('no module for royalty defined');

    if (
        projectFile.royalties === undefined ||
        Object.keys(projectFile.royalties).length === 0
    ) {
        Controller.log('\n > No Royalty Key'.red);
        return;
    }

    const Royalty = await get(module);
    const abis = {
        Royalty: await ethers.getContractFactory(module),
    };

    let contract = new ethers.Contract(
        Royalty.address,
        abis.Royalty.interface,
        accounts[0]
    );

    let freeMints = await contract.freebies(0);
    console.log('Total Free Mints: ' + freeMints);

    let freeStickers = await contract.freebies(1);
    console.log('Total System-Wide Free Stickers: ' + freeStickers);

    if (module === 'SplitRoyalty') {
        let mintCount = await contract.getCount(0);
        let stickerCount = await contract.getCount(1);

        console.log('Total Mints: ' + mintCount);
        console.log('Total Stickers: ' + stickerCount);
    }

    let address = accounts[0].address;
    if (process.argv[2] !== undefined && process.argv[2].length !== 0)
        address = process.argv[2];

    console.log('Getting withdraw balance of wallet ' + address);
    let balance = await contract.values(address);
    console.log('Withdrawable Balance: ' + balance);
    console.log(
        'Withdrawable Balance As Eth: ' + ethers.utils.formatEther(balance)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
