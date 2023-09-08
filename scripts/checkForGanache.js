const tcpp = require('tcp-ping');
const colors = require('colors');
const Controller = require('./../src/Controller');
const { delay } = require('../src/helpers');
const os = require('os');

async function main() {
    if (!colors.enabled) colors.enable();
    let ping = (connection) => {
        return new Promise((resolve, reject) => {
            tcpp.ping(connection, (err, data) => {
                let error = data.results[0].err;
                if (!error) {
                    resolve(true);
                }
                if (error) {
                    resolve(false);
                }
            });
        });
    };
    let addr = process.env.GANACHE_URL || 'http://localhost';
    let port = process.env.GANACHE_PORT || 8545;

    console.log(
        '- pinging ' + addr + ':' + port + ' and checking for a response'.dim
    );

    let result = await ping({
        address: addr.replace('http://', '').replace('https://', ''),
        port: port,
        timeout: 1000,
        attempts: 2,
    });

    if (!result) {
        console.log(
            '\n> Ganache is not online, please make sure ganache is online.\n'
                .red
        );

        if (os.platform() === 'win32') {
            let question = await Controller.newQuestion(
                'would you like to open a new terminal window and run ganache? y/n:'
            );
            if (question.toLowerCase()[0] === 'y') {
                console.log(
                    'making child process, please fully close this terminal once the CMD window opens.'
                );
                var child_process = require('child_process');
                child_process.execSync(
                    'start cmd.exe /K node scripts/ganache.js'
                );
            }
        } else {
            console.log(
                'Please type npm run ganache and then npm start'.yellow
            );
            await delay(5);
            throw new Error('ganache is active');
        }
    }

    result = await ping({
        address: addr.replace('http://', '').replace('https://', ''),
        port: port,
        timeout: 1000,
        attempts: 2,
    });

    if (result)
        console.log('Ganache Online At ' + (addr + ':' + port) + 's\n'.green);
}
main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
