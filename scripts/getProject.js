const { ethers } = require('hardhat');
const Controller = require('../src/Controller');
const { getContract } = require('../src/helpers');

async function main() {
    if (process.argv[2] === 'true') {
        console.log('> Pulling local project file'.blue);
        let projectFile = await Controller.getProjectFile(true);
        console.log(projectFile);
    } else {
        let projectController = await getContract('InfinityMintProject');
        let currentVersion = await projectController.getCurrentVersion();
        let currentTag = await projectController.getCurrentTag();
        currentTag = ethers.utils.toUtf8String(currentTag);

        console.log('> Pulling Project File from chain\n'.blue);
        let result = await projectController.getProject();

        console.log(('\ncurrent project version: ' + currentVersion).yellow);
        console.log(('version tag: ' + currentTag).yellow);

        console.log('\nraw:'.magenta);
        console.log(result);
        result = ethers.utils.toUtf8String(result);
        console.log('decoded:'.magenta);
        console.log(result);

        if (result.indexOf('://') !== -1) {
            let result = await fetch(result).then((res) => res.json());
            console.log('fetched:'.magenta);
            console.log(result);
        } else {
            console.log('is not a fetchable link'.red);
        }
    }
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
