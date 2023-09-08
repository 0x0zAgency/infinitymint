const { run, ethers, deployments } = require('hardhat');

async function main() {
    const { get, deploy } = deployments;
    const accounts = await ethers.getSigners();
    const InfinityMint = await get('InfinityMint');

    const abis = {
        InfinityMint: await ethers.getContractFactory('InfinityMint'),
    };

    let result = Controller.verifyExecutionContext();
    if (result !== true)
        throw new Error(
            'please change current project to ' +
                result +
                ' or redeploy as ' +
                Controller.deployConfig.project
        );

    let erc721 = new ethers.Contract(
        InfinityMint.address,
        abis.InfinityMint.interface,
        accounts[0]
    );
    let mints = await erc721.mintsEnabled();

    if (!mints) console.log('Mints are disabled enabling mints');
    else console.log('Mints are being disabled. All mints will now revert!');

    let tx = await erc721.setMintsEnabled(!mints);
    await tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
