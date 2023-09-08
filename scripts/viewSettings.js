const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');
const tcpp = require('tcp-ping');
const { delay } = require('../src/helpers');
const Gems = require('../src/Gems');

//the terminal
const term = require('terminal-kit').createTerminal({
    stdin: process.stdin,
    stdout: process.stdout,
});

async function main() {
    console.log('\n> Project Settings: '.cyan);
    term.table(
        [
            Object.keys(Controller.settings),
            [...Object.values(Controller.settings)],
        ],
        {
            firstRowTextAttr: { bgColor: 'blue' },
            width: 92,
            fit: true, // Activate all expand/shrink + wordWrap
        }
    );

    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
