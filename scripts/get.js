const Controller = require('../src/Controller');
const { getContract } = require('../src/helpers');

async function main() {
    let apiContract = await getContract('InfinityMintApi');
    let deployedProject = await Controller.getProjectFile(true);
    let tokenId = 0;

    if (process.argv[2] !== undefined) tokenId = process.argv[2];

    let result = await apiContract.get(tokenId);

    let names;
    if (deployedProject.paths[result.pathId].addPathToName) {
        names = [...result.names, deployedProject.paths[result.pathId].name];
    } else names = [...result.names];

    console.log({ ...result, names: names });
    console.log('\n☻ Success ☻\n'.green);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
