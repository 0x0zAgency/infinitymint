const Controller = require('../src/Controller');

async function main() {
    if (!Controller.getFileSystem().existsSync('./hardhat.config.js')) {
        console.log('> creating hardhat.config.js');
        Controller.getFileSystem().copyFileSync(
            './example.hardhat.config.js',
            './hardhat.config.js'
        );
    }

    if (!Controller.getFileSystem().existsSync('./.env')) {
        console.log('> creating .env');
        Controller.getFileSystem().copyFileSync(
            './import Controller from "infinitymint-client/dist/src/classic/controller";',
            './.env'
        );
    }
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
