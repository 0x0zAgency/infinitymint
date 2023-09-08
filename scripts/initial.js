const { run, ethers, deployments } = require('hardhat'); //loads the configuration filek
const Controller = require('../src/Controller');
const Gems = require('../src/Gems');
const tcpp = require('tcp-ping');
//a method for each argument passed to the script,
const methods = {
    //writes force_network which hardhat then reads and forces the network to that value, useful when
    //running many node scripts at once and you need hardhat to rememeber the network
    network: (value) => {
        Controller.log('> Writing ./.force_network to value: ' + value);
        Controller.getFileSystem().writeFileSync('./.force_network', value);
        Controller.defaultNetwork = value;
    },
};

async function main() {
    //do arguments
    let arguments = process.argv.slice(2);
    arguments.forEach((value) => {
        if (value.indexOf('=') == -1) throw new Error('invalid arg: ' + value);

        let [left, right] = value.split('=');

        if (!methods[left]) throw new Error('invalid arg: ' + left);

        methods[left](right);
    });

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

    console.log(
        '- pinging http://localhost:8545 and checking for a response'.dim
    );

    let result = await ping({
        address: (process.env.GANACHE_URL || 'localhost')
            .replace('https://', '')
            .replace('http://', ''),
        port: process.env.GANACHE_PORT || 8545,
        timeout: 1000,
        attempts: 2,
    });

    if (!result) throw new Error('please start ganache with npm ganache');

    if (
        Controller.settings.reactLocation === '' &&
        Controller.settings.firstTime &&
        !Controller.isEnvTrue('FORCE_DEPLOYMENT')
    ) {
        let reactLocation = await Controller.getDriveLocation();

        if (reactLocation === '') {
            Controller.log('\n\n! RETURNED REACT LOCATION IS EMPTY !');
            await delay(2);
        }

        Controller.settings.reactLocation = reactLocation;
        Controller.log('> Saving settings');
        Controller.settings.firstTime = false;
        Controller.saveSettings();
        Controller.log(' ☻ Success'.green);
    }

    if (Controller.defaultNetwork === 'ganache') {
        let shouldDelete = true;

        if (!Controller.getFileSystem().existsSync('./.temp_project')) {
            shouldDelete = true;
        } else {
            console.log(
                '\nWe have detected a previous failed deployment. Please select a course of action:'
                    .underline.cyan
            );
            console.log('\n[0] Deploy New InfinityMint'.magenta);
            console.log('[1] Retry Failed Attempt\n'.magenta);

            if (Controller.isEnvTrue('FORCE_DEPLOYMENT')) {
                shouldDelete = true;
                shouldAsk = false;
            } else {
                let shouldAsk = true;

                while (shouldAsk) {
                    let result = await Controller.newQuestion(
                        'please enter a number [0-1]: '
                    );

                    if (result.length === 0) continue;

                    if (isNaN(result)) continue;

                    result = parseInt(result);

                    switch (result) {
                        case 0:
                            shouldDelete = true;
                            shouldAsk = false;
                            break;
                        case 1:
                            shouldDelete = false;
                            shouldAsk = false;
                            break;
                        default:
                            continue;
                    }
                }
            }
        }

        if (shouldDelete) {
            if (
                Controller.getFileSystem().existsSync('./deployments/ganache/')
            ) {
                Controller.log('- Deleting previous ganache deployment');
                Controller.getFileSystem().rmSync('./deployments/ganache/', {
                    recursive: true,
                    force: true,
                });
            }
            Controller.log('- Deleting previous ganache receipts');
            if (
                Controller.getFileSystem().existsSync(
                    './temp/' +
                        Controller.deployConfig.project +
                        '_ganache_receipts.json'
                )
            )
                Controller.getFileSystem().unlinkSync(
                    './temp/' +
                        Controller.deployConfig.project +
                        '_ganache_receipts.json'
                );
        }

        if (Controller.getFileSystem().existsSync('./output.ganache')) {
            Controller.log('- deleting output.ganache');
            try {
                Controller.getFileSystem().unlinkSync('./output.ganache');
            } catch (error) {
                Controller.log('WARNING: could not delete output.ganache'.dim);
            }
        }

        if (
            shouldDelete &&
            Controller.getFileSystem().existsSync('./.temp_project')
        ) {
            let temp_uri = JSON.parse(
                Controller.readInformation('./.temp_project')
            );

            let deleteFile = true;

            if (
                !Controller.isEnvTrue('FORCE_DEPLOYMENT') &&
                temp_uri?.network?.chainId !== 1337
            ) {
                console.log('Warning!'.cyan.underline);
                console.log(
                    (
                        'This failed deployment isnt on ganache (failed deployment is on chain  ' +
                        temp_uri?.network?.chainId +
                        ") so we couldn't automatically delete it safely.\n"
                    ).yellow
                );
                console.log(
                    'Are you sure you want to delete this failed deployment (and deploy a new InfinityMint)?'
                        .underline.red
                );
                let result = await Controller.newQuestion('y/n: ');
                if (result.toLowerCase()[0] !== 'y') {
                    deleteFile = false;
                }
            }

            if (deleteFile) {
                Controller.log('- deleting previous temp_project');
                try {
                    Controller.getFileSystem().unlinkSync('./.temp_project');
                } catch (error) {
                    Controller.log(
                        'WARNING: could not delete previous temp_uri'.dim
                    );
                }
            } else Controller.log('- leaving previous temp_project');
        }

        if (
            Controller.isEnvTrue('WARN_ABOUT_SCRIPT_PROJECT') &&
            !Controller.isEnvTrue('FORCE_DEPLOYMENT') &&
            Controller.getFileSystem().existsSync('./.project')
        ) {
            let result = Controller.getFileSystem().readFileSync('./.project');
            console.log('\n');
            console.log('Warning!'.cyan.underline);
            console.log(
                'We have detected a .project file in the root of your directory, this file will forcefully set'
                    .yellow
            );
            console.log(
                (
                    'the project to be ' +
                    result +
                    ', this might not be as you are expecting as the env variable set is ' +
                    process.env.INFINITYMINT_PROJECT
                ).yellow
            );
            console.log('\n');
            console.log(
                (
                    'SHOULD WE DELETE .PROJECT AND MAKE CURRENT PROJECT ' +
                    process.env.INFINITYMINT_PROJECT +
                    ' INSTEAD OF ' +
                    result +
                    '?'
                ).underline.red
            );
            let choice = await Controller.newQuestion('yes/no: ');
            if (choice.toLowerCase()[0] === 'y') {
                Controller.getFileSystem().unlinkSync('./.project');
            }
        }
    }

    let shouldUpdate = false;

    if (
        !Controller.getFileSystem().existsSync('./.token_prices') ||
        !Controller.getFileSystem().existsSync('./.gas_prices')
    )
        shouldUpdate = true;
    else {
        if (
            Controller.getFileSystem().existsSync('./.token_prices') &&
            Date.now() >
                JSON.parse(Controller.readInformation('./.token_prices'))
                    .refreshes ===
                undefined
        )
            shouldUpdate = true;

        if (
            Controller.getFileSystem().existsSync('./.gas_prices') &&
            JSON.parse(Controller.readInformation('./.gas_prices'))
                .refreshes === undefined
        )
            shouldUpdate = true;
    }

    if (shouldUpdate) {
        Controller.log('\n> Updating gas and token prices\n'.blue);
        let result = await Controller.executeNodeScript(
            'scripts/updateGasAndPrices.js',
            [],
            true
        );

        if (result !== 0)
            Controller.log('WARNING: Failed to update gas and prices'.red);
    }

    if (Controller.getFileSystem().existsSync('./contracts/__mods/')) {
        Controller.log('- Deleting old temp mods folder');
        Controller.getFileSystem().rmdirSync('./contracts/__mods/', {
            recursive: true,
            force: true,
        });
    }

    if (Controller.deployConfig.modsDisabled !== true) {
        Controller.log('> Preparing Mods\n'.blue);
        await prepareMods();
    }

    if (
        Controller.deployConfig.flushArtifacts === true &&
        Controller.getFileSystem().existsSync('./artifacts/')
    ) {
        Controller.log('- cleaning hardhat');
        await run('clean');
    }

    Controller.log('\n> Saving settings'.blue);
    Controller.settings.firstTime = false;
    Controller.saveSettings();
    Controller.log(' ☻ Success'.green);
}

async function prepareMods() {
    let directories = Controller.getFileSystem()
        .readdirSync('./mods/', {
            withFileTypes: true,
        })
        .filter(
            (file) =>
                file.isDirectory() &&
                Controller.getFileSystem().existsSync(
                    './mods/' + file.name + '/contracts/'
                )
        )
        .map((dir) => {
            return {
                path: './mods/' + dir.name + '/contracts/',
                name: dir.name,
            };
        });

    if (directories.length === 0) return;

    if (!Controller.getFileSystem().existsSync('./contracts/__mods/'))
        Controller.getFileSystem().mkdirSync('./contracts/__mods/');

    let totalFiles = [];

    directories.map((dir) => {
        let files = Controller.getFileSystem()
            .readdirSync(dir.path, {
                withFileTypes: true,
            })
            .filter((file) => file.name.indexOf('.sol') !== -1)
            .map((file) => file.name);

        Controller.log((' > solidity enabled mod found: ' + dir.name).cyan);
        try {
            let mod = Controller.getFileSystem().readFileSync(
                './mods/' + dir.name + '/' + dir.name + '.json'
            );

            if (mod === undefined)
                throw new Error(
                    'mod: ' + dir.name + ' has no ' + dir.name + '.json defined'
                );
            else mod = JSON.parse(mod);

            Controller.log(
                `${mod.name} by ${mod.author} (v${mod.version || '?.?'})`
                    .underline
            );
            Controller.log(
                `${mod.description || 'No description available'}\n`.gray
            );
        } catch (error) {
            Controller.log(error);
            throw new Error('mod: ' + dir.name + ' has bad mod manifest file');
        }
        files.forEach((file) =>
            totalFiles.push({
                path: './mods/' + dir.name + '/contracts/' + file,
                name: file.split('.')[0],
                mod: dir.name,
            })
        );
    });

    if (totalFiles.length !== 0) {
        await Gems.loadMods();
        let projectFile = await Controller.getProjectFile();
        Gems.enableMods(projectFile.mods || []);

        totalFiles.forEach((file) => {
            if (!Gems.isModEnabled(file.mod)) {
                Controller.log(' - mod ' + file.mod + ' is not enabled');
                return;
            }

            let fileData = Controller.getFileSystem().readFileSync(file.path);
            fileData = fileData.toString();

            if (file.name.indexOf('Mod_') !== -1)
                throw new Error(
                    `mod error [${file.mod}]: file ` +
                        file.name +
                        '.sol cannot have Mod_ in filename'
                );

            //re-reference
            let fileName = `./contracts/__mods/${file.name}.sol`;
            fileData = fileData.split('\n');
            let found = false;
            fileData.forEach((line) => {
                if (found) return;

                if (
                    line.indexOf('import') === -1 &&
                    line.indexOf('contract') !== -1 &&
                    line.indexOf('Mod_') === -1 &&
                    line.indexOf('{') !== -1
                )
                    console.log(
                        (
                            `mod warning [${file.mod}]: file contract name for ` +
                            file.name +
                            '.sol is missing Mod_ contract must be called Mod_' +
                            file.name
                        ).red
                    );
                else if (
                    line.indexOf('contract') !== -1 &&
                    line.indexOf('Mod_') !== -1
                )
                    found = true;
            });
            fileData = fileData.map((line) =>
                line.indexOf('import') !== -1
                    ? line.replace('./../../../contracts/', './../')
                    : line
            );

            if (Controller.getFileSystem().existsSync(fileName))
                throw new Error(
                    `mod error [${file.mod}]: file already exists` +
                        fileName +
                        ' ! mod might be have conflict with other mod'
                );

            Controller.log(' - writing to ' + fileName);
            Controller.getFileSystem().writeFileSync(
                fileName,
                fileData.join('\n')
            );
        });
    }

    Controller.log(' \n☻ Success'.green);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
