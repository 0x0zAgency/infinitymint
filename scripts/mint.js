const { ethers } = require('hardhat');
const Controller = require('../src/Controller');
const tinySVG = require('tinysvg-js');
const { getContract } = require('../src/helpers');

async function main() {
    let deployedProject = await Controller.getProjectFile(true);
    let projectFile = await Controller.getProjectFile(false);
    let erc721Contract = await getContract('InfinityMint');
    let mints = await erc721Contract.mintsEnabled();

    if (!mints) {
        Controller.log('- mints disabled enabling minter in order to continue');
        let tx = await erc721Contract.setMintsEnabled(true);
        await tx.wait();
        Controller.log(' ☻ Success'.green);
    }

    //get the price from the contract of a token
    let price = await erc721Contract.tokenPrice();

    console.log('Token price of ' + price);

    let tx = await erc721Contract.mint({
        gasLimit: Controller.defaultNetwork == 'ganache' ? 8000000 : 2000000,
    });
    let receipt = await tx.wait();

    //get the receipt so can print the gas used:
    //decode event
    let data = ethers.utils.defaultAbiCoder.decode(
        ['address', 'bytes'],
        receipt.logs[1].data
    );
    let types = [
        { type: 'uint32', name: 'pathId' },
        { type: 'uint32', name: 'pathSize' },
        { type: 'uint32', name: 'currentTokenId' },
        { type: 'address', name: 'owner' },
        { type: 'bytes', name: 'colours' },
        { type: 'bytes', name: 'mintData' },
        { type: 'uint32[]', name: 'assets' },
        { type: 'string[]', name: 'names' },
        { type: 'address[]', name: 'destinations' },
    ];

    let result = {
        ...ethers.utils.defaultAbiCoder.decode(
            Controller.deployConfig.abiHelpers?.encoding?.types || types,
            data[1]
        ),
    };

    if (
        Controller.deployConfig.abiHelpers?.encoding?.encoder !== undefined &&
        typeof Controller.deployConfig.abiHelpers?.encoding?.encoder ===
            'function'
    ) {
        result = Controller.deployConfig.abiHelpers?.encoding?.encoder(
            result,
            ethers,
            tinySVG,
            deployedProject,
            projectFile
        );
    }

    let gasCost = ethers.utils.formatEther(
        receipt.gasUsed.mul(receipt.effectiveGasPrice)
    );

    let mintData =
        typeof result.mintData !== 'object'
            ? JSON.parse(ethers.utils.toUtf8String(result.mintData))
            : result.mintData;

    if (deployedProject.paths[result.pathId].addPathToName) {
        result.names.push(deployedProject.paths[result.pathId].name);
    }

    console.log({ ...result, mintData: mintData });
    console.log(
        (
            `minted ${result.names.join(' ')} pathId ${result.pathId} ` +
            'gas cost: ' +
            gasCost +
            ' eth/matic\n'
        ).green +
            `real money: $${
                (parseInt(
                    Controller.deployConfig.networks[Controller.defaultNetwork]
                        ?.tokenPrice?.ethusd
                ) || 1) * parseFloat(gasCost)
            }`.cyan
    );
    Controller.logTx(receipt);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
