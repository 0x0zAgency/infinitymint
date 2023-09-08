const Controller = require('../src/Controller');

async function main() {
    await Controller.executeService('hardhat', ['etherscan-verify'], 'npx');
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
