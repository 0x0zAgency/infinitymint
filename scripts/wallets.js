const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const colors = require('colors');
const tinySVG = require('tinysvg-js');

async function main() {
    const { get, deploy } = deployments;
    const accounts = await ethers.getSigners();

    console.log(('> Listing ' + accounts.length + ' accounts').cyan);

    accounts.forEach((account) => {
        console.log(account.address);
    });
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
