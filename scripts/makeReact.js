/**
 * Infinitymint will ask to provide a build location
 * When it does, create the folder for the output of the `git clone` into.
 */

const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');

(async () => {
    let location = await Controller.getDriveLocation(
        false,
        'Please select where you want to create infinity app'
    );

    if (!Controller.getFileSystem().existsSync(location)) {
        Controller.log('- creating ' + location);
        Controller.getFileSystem().mkdirSync(location);
    }

    await Controller.executeService(
        'clone',
        ['https://github.com/0x0zAgency/infinitymint-classic.git', '.'],
        'git',
        true,
        location
    );
    await Controller.executeService(
        'install',
        ['--build-from-source'],
        'npm',
        true,
        location
    );
    Controller.settings.reactLocation = location;
    Controller.saveSettings();
})()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error(err.stack);
        process.exit(1);
    });
