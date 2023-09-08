const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');

async function main() {
    const { get, deploy } = deployments;
    const accounts = await ethers.getSigners();
    const InfinityMint = await get('InfinityMint');
    const abis = {
        InfinityMint: await ethers.getContractFactory('InfinityMint'),
    };

    let erc721 = new ethers.Contract(
        InfinityMint.address,
        abis.InfinityMint.interface,
        accounts[0]
    );

    let tokenId = 0;
    let pubKey = '';
    let locked = process.argv[4] === 'false' ? false : true;
    tokenId = process.argv[2];
    pubKey = process.argv[3];

    if (pubKey.split('-').length === 0)
        throw new Error('bad public key: must be in format <0>-<1>-<2>');

    //split it up and check each val
    pubKey = pubKey.split('-').map((val) => {
        if (isNaN(val)) throw new Error(val + ' from pub key is bad');
        return parseInt(val);
    });

    let bytes = ethers.utils.defaultAbiCoder.encode(
        ['address', 'uint256[]'],
        [accounts[0].address, pubKey]
    );
    let tx = await erc721.setTokenLockable(tokenId, locked, bytes);
    let receipt = await tx.wait();

    Controller.logTx(receipt);

    if (locked) console.log('successfully locked token: ' + tokenId);
    else console.log('successfully unlocked token: ' + tokenId);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
