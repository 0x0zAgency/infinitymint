const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const colors = require('colors');

async function main() {
    let projectFile;

    if (Controller.getFileSystem().existsSync('./.temp_project'))
        projectFile = Controller.readInformation('./.temp_project', true);
    else projectFile = await Controller.getProjectFile(true);

    if (!colors.enabled) colors.enable();

    Controller.log(
        ' > Copying render scripts from contracts folder into react application'
            .dim
    );

    await Controller.copyScripts(
        projectFile.modules.controller,
        false,
        projectFile.modules.renderScript
    );
    Controller.log(' ☻ Success'.green);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
