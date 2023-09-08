const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const { getContract } = require('../src/helpers');

/**
 * Main
 * @returns
 */
async function main() {
    let projectFile = await Controller.getProjectFile();
    //ethers deployment helpers
    let { get } = deployments;

    const accounts = await ethers.getSigners();
    Controller.loadReceipts();

    let deployment = {
        ...Controller.defaultDeployment,
        ...(projectFile.deployment || {}),
    };

    let contract = await getContract('InfinityMintValues');

    Controller.log(' > Setting values in InfinityMintValues contract\n'.blue);
    let booleanValues = {};
    let numericalValues = {};
    for (let [index, value] of Object.entries(deployment)) {
        if (value.toString().indexOf('.') !== -1)
            throw new Error(index + ' cannot have decimal places.');

        if (
            value === true ||
            value === false ||
            value === 'true' ||
            value === 'false'
        ) {
            booleanValues[index] = value === true || value === 'true';
        } else {
            if (!isNaN(index) || index.indexOf('.') !== -1)
                throw new Error('invalid index: ' + index);

            if (
                index === 'maxTokensPerWallet' &&
                Controller.defaultNetwork === 'ganache'
            ) {
                console.log(
                    'NOTE: skipping maxTokensPerWallet since we are on ganache'
                        .cyan
                );
                continue;
            }

            numericalValues[index] = value.toString();
        }
    }

    Controller.log('- Setting up contract variables');
    let tx = await contract.setupValues(
        Object.keys(numericalValues),
        Object.values(numericalValues),
        Object.keys(booleanValues),
        Object.values(booleanValues)
    );

    let receipt = await tx.wait();
    Controller.logTx(receipt);
    Controller.log(' ☻ Success'.green);

    if (
        !Controller.getFileSystem().existsSync('./.temp_project') &&
        Controller.getFileSystem().existsSync(
            './projects/' + Controller.deployConfig.project + '.json'
        )
    ) {
        Controller.log('- updating project file');
        let deployedProject = Controller.getProjectFile(true);
        deployedProject.deployment = projectFile.deployment;
        deployedProject.updated = Date.now();
        Controller.getFileSystem().writeFileSync(
            './projects/' + Controller.deployConfig.project + '.json',
            JSON.stringify(deployedProject)
        );
        console.log('NOTE: Remember to run scripts/update.js'.cyan);
    }
    Controller.saveReceipts();

    console.log('\nFinished Successfully'.green);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
