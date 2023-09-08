const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');

async function main() {
    if (Controller.getFileSystem().existsSync('./.temp_project'))
        throw new Error('clear ./.temp_project before doing this');

    let module = await Controller.getVersionModule();
    //make export folders
    try {
        console.log('\n> Making folders for export\n'.cyan);

        module.makeFolders();
    } catch (error) {
        console.log('ERROR: failed to make folders'.red);
        console.log(error);
        throw error;
    }

    let deployedProject = await Controller.getProjectFile(true);
    await Controller.copyBuild(deployedProject, true);

    await Controller.executeNodeScript('scripts/copyFiles.js');
    await Controller.executeNodeScript('scripts/copyMods.js');
    await Controller.executeNodeScript('scripts/copyScripts.js');

    module.onCopyProject(deployedProject);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
