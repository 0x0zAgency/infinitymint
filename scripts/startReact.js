/**
 * Infinitymint will ask to provide a build location
 * When it does, create the folder for the output of the `git clone` into.
 */

const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');

(async () => {
    await Controller.executeService(
        'start',
        [],
        'npm',
        true,
        Controller.settings.reactLocation
    );
})()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error(err.stack);
        process.exit(1);
    });
