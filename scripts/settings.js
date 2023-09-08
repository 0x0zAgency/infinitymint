const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const { delay } = require('../src/helpers');

async function main() {
    let reactLocation = await Controller.getDriveLocation();

    if (reactLocation === '') {
        console.log('\n\n! RETURNED REACT LOCATION IS EMPTY !');
        await delay(2);
    }

    Controller.settings.reactLocation = reactLocation;
    console.log('> Saving settings');
    Controller.settings.firstTime = false;
    Controller.saveSettings();
    Controller.log(' ☻ Success'.green);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
