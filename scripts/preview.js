const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');

async function main() {
    let erc721 = await getContract('InfinityMint');
    let storageContract = await getContract('InfinityMinStorage');
    let apiContract = await getContract('InfinityMintAPI');
    let mints = await erc721.mintsEnabled();
    let projectFile = await Controller.getProjectFile(true);

    if (!mints) {
        console.log(
            'Mints are disabled! Run node scripts/enable.js before using this command!'
        );
        return;
    }

    if (await apiContract.isPreviewBlocked(accounts[0].address)) {
        console.log(
            'preview blocked until: ' +
                new Date(
                    parseInt(
                        (
                            await storageContract.getPreviewTimestamp(
                                accounts[0].address
                            )
                        ).toString()
                    ) * 1000
                ).toString()
        );
        console.log('deleting previous preview for ' + accounts[0].address);
        await storageContract.deletePreview(
            accounts[0].address,
            projectFile.deployment.previewCount || 1
        );
    } else console.log('not preview blocked');

    let tx = await erc721.getPreview();
    let receipt = await tx.wait();
    Controller.logTx(receipt);
    Controller.log(
        ('preview mint successful gas cost: ',
        ethers.utils.formatEther(
            receipt.gasUsed.mul(receipt.effectiveGasPrice)
        ) + ' eth/matic').green
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
