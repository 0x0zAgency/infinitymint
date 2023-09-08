const { run, ethers, deployments } = require('hardhat');
const Controller = require('../../src/Controller');
const tcpp = require('tcp-ping');
const { delay } = require('../../src/helpers');
const Gems = require('../../src/Gems');

//the terminal
const term = require('terminal-kit').createTerminal({
    stdin: process.stdin,
    stdout: process.stdout,
});

//the IM project file
let deployedProjectFile;
let undeployedProjectFile;
let deployedProject = 'none';
let projectName = Controller.deployConfig.project;

//banned scripts which are not to be shown in view scripts
let bannedScripts = ['initial.js', 'setup.js', 'gemSandbox.js', 'ganache.js'];

async function viewDeployment(network) {
    term.reset();
    term.clear();

    let result = Controller.readInformation(
        './deployments/' + network + '/.deployInfo',
        true
    );

    term.bgRed('Deployed Project: ' + result.project + '\n');
    term.bgGreen('Current Network: ' + network + '\n');
    term.bgBlue('Deployment Time: ' + new Date(result.date).toString() + '\n');
    term.bgMagenta('ERC721♾️: ' + result.contracts['InfinityMint'] + '\n');
    term.bgYellow('Deployer: ' + result.deployer + '\n');
    term.bgWhite('Tag: ' + (result.tag || 'no tag set') + '\n');

    term.singleColumnMenu(
        [
            'copyDeployment',
            'restoreDeployment',
            'tagDeployment',
            backToMenu,
            'Back To Deployments...',
        ],
        async (error, response) => {
            if (response.selectedText === backToMenu) await drawMenu();
            else if (response.selectedText === 'Back To Deployments...')
                await menu['deployments']();
            else {
                await executeScript(response.selectedText);
                let question = await Controller.newQuestion(
                    'Return to menu? y/n: '.green
                );
                if (question.toLowerCase()[0] === 'y') drawMenu();
                else menu['deployments']();

                term.reset();
            }
        }
    );
}

function displayError(error) {
    console.log('\n');
    console.log('ERROR!'.bgRed);
    console.error(error);

    console.log('\n');
}

async function displayGemScripts(gem) {
    gem = gem.split('.')[0];
    console.clear();
    term.reset();
    let files = [];
    let flag = false;
    if (!Controller.getFileSystem().existsSync('./mods/' + gem + '/scripts/'))
        flag = true;
    else {
        files = Controller.getFileSystem().readdirSync(
            './mods/' + gem + '/scripts/'
        );
    }

    if (flag || files.length === 0) {
        console.log('This gem has scripts files  that you can execute'.red);
        await Controller.newQuestion('press enter to return to menu...');
        menu['gems']();
        return;
    }

    term.bgRed('Current Project: ' + projectName + '\n');
    term.bgGreen('Deployed Project: ' + deployedProject + '\n');
    term.bgBlue('Current Network: ' + Controller.defaultNetwork + '\n');
    term.bgMagenta('Mod Context: ' + gem);
    console.log(
        '\nPlease select which script you would like to execute: '.cyan
    );
    term.singleColumnMenu(
        [...files, backToMenu, 'Back To Gems...'],
        async (error, response) => {
            if (response.selectedText === backToMenu) await drawMenu();
            else if (response.selectedText === 'Back To Gems...')
                await menu['gems']();
            else {
                let script = await loadScript(
                    gem,
                    response.selectedText.split('.')[0]
                );

                if (script.allowCount) {
                    let result = await Controller.newQuestion(
                        'please enter amount of times to run script: '
                    );

                    if (result.length !== 0 && !isNaN(result))
                        result = Math.max(1, parseInt(result));
                    else result = 1;

                    try {
                        for (let i = 0; i < result; i++) {
                            await executeScript(
                                'gemSandbox',
                                `${gem} ${response.selectedText.split('.')[0]}`,
                                'gems',
                                true
                            );
                        }
                    } catch (error) {
                        term.bgRed('ERROR');
                        console.error(error);
                        let question = await Controller.newQuestion(
                            'Retry? y/n: '.green
                        );
                        if (question.toLowerCase()[0] === 'y')
                            displayGemScripts(gem);
                        else menu['gems']();
                        return;
                    }
                } else
                    await executeScript(
                        'gemSandbox',
                        `${gem} ${response.selectedText.split('.')[0]}`,
                        'gems'
                    );

                let question = await Controller.newQuestion(
                    'Return to menu? y/n: '.green
                );
                if (question.toLowerCase()[0] === 'y') drawMenu();
                else menu['gems']();

                term.clear();
                term.reset();
            }
        }
    );
}

//the menu and what to do when options are pressed
let backToMenu = 'Back To Main Menu...';

/**
 * The menu optiions
 */
let menu = {
    tools_and_scripts: async (response) => {
        console.clear();
        term.reset();
        let files = Controller.getFileSystem()
            .readdirSync('./scripts/', {
                withFileTypes: true,
            })
            .filter((file) => !file.isDirectory())
            .map((file) => file.name)
            .filter(
                (file) =>
                    bannedScripts.filter((banned) => file === banned).length ===
                    0
            );
        files.push(backToMenu);

        console.log(('Execution Context: ' + projectName).bgGreen.white);
        term.underline.blue(
            'Please select which file you would like to execute!\n'
        );
        term.gridMenu(files, async (error, response) => {
            if (response.selectedText === backToMenu) drawMenu();
            else {
                let result = await Controller.newQuestion(
                    '\narguments (please split using spaces): '.gray
                );
                result = result.trim();
                result = result
                    .split(' ')
                    .filter((sub) => sub !== ' ' && sub.length !== 0)
                    .join(' ');
                executeScript(response.selectedText, result).catch(
                    displayError
                );
            }
        });
    },
    my_projects: async (response) => {
        console.clear();
        term.reset();
        let files = Controller.getFileSystem()
            .readdirSync('./projects/', {
                withFileTypes: true,
            })
            .filter(
                (file) =>
                    !file.isDirectory() && file.name.indexOf('.json') === -1
            )
            .map((file) => file.name);

        if (files.length === 0) {
            await Controller.newQuestion(
                'No projects found... please press enter to return to menu...'
                    .red
            );
            drawMenu();
            return;
        }

        files.push(backToMenu);
        term.underline.blue(
            'Please select a project you would like to do things with!\n'
        );
        term.gridMenu(files, async (error, response) => {
            if (response.selectedText === backToMenu) drawMenu();
            else {
                delete menu[projectName];
                projectName = response.selectedText.split('.')[0];
                menu = {
                    [projectName]: displayProject,
                    ...menu,
                };
                displayProject(response.selectedText);
            }
        });
    },
    deploy_project: async (response, redeployment = false) => {
        console.log(
            '- writing temporary .project file to force project to our project'
        );
        Controller.getFileSystem().writeFileSync('./.project', projectName);
        let result;
        if (!redeployment)
            result = await Controller.executeService('run', [
                'build_' + Controller.defaultNetwork,
            ]);
        else result = await Controller.executeService('run', ['redeploy']);
        Controller.restartQuestionReadline();

        if (Controller.isEnvTrue('CLEANUP_SCRIPT_PROJECT')) {
            console.log(
                '- removing temporary .project file to force project to our project'
            );
            Controller.getFileSystem().unlinkSync('./.project');
        }

        if (result !== 0) {
            console.log('\n');
            console.log('Deployment Unsuccessful'.red.underline);
            let question = await Controller.newQuestion('Retry? y/n: '.green);
            if (question.toLowerCase()[0] === 'y')
                menu['deploy_project'](response, true);
            else drawMenu();

            return;
        }

        console.log('\n');
        console.log('Deployment Successful!'.green.underline);
        drawMenu();
    },
    create_project: async (response) => {
        console.clear();
        await executeScript('createProject');
    },
    change_network: async (response) => {
        term.gridMenu(
            [...Object.keys(Controller.deployConfig.networks), backToMenu],
            async (error, response) => {
                if (response.selectedText === backToMenu) drawMenu();
                else {
                    Controller.defaultNetwork = response.selectedText;
                    Controller.getFileSystem().writeFileSync(
                        './.force_network',
                        response.selectedText
                    );
                    drawMenu();
                }
            }
        );
    },
    deployments: async (response) => {
        console.clear();
        term.reset();
        let files = Controller.getFileSystem()
            .readdirSync('./deployments/', {
                withFileTypes: true,
            })
            .filter((file) => file.isDirectory())
            .map((file) => file.name);

        if (files.length === 0) {
            await Controller.newQuestion(
                'No deployments found... please any key to return to the menu...'
                    .red
            );
            drawMenu();
            return;
        }

        files.push('Add Backup Deployment');
        files.push(backToMenu);
        term.underline.blue('Please select a deployment!\n');
        term.gridMenu(files, async (error, response) => {
            if (response.selectedText === backToMenu) await drawMenu();
            else if (response.selectedText === 'Add Network') {
            } else {
                await viewDeployment(response.selectedText);
            }
        });
    },
    gems: async (response) => {
        console.clear();
        term.reset();
        await loadProjectFile(projectName);
        Gems.mods = {};

        try {
            await Gems.loadMods();
            await Gems.enableMods(undeployedProjectFile.mods);
        } catch (error) {
            console.log(error);
            throw new Error('bad');
        }
        console.clear();
        term.reset();

        let files = Controller.getFileSystem()
            .readdirSync('./mods/', {
                withFileTypes: true,
            })
            .filter((file) => file.isDirectory())
            .map(
                (file) =>
                    file.name +
                    (Gems.isModEnabled(file.name) ? '~active' : '~inactive')
            );

        if (files.length === 0) {
            await Controller.newQuestion(
                'No gems found... please any key to return to the menu...'.red
            );
            drawMenu();
            return;
        }

        files.push(backToMenu);
        term.underline.blue(
            'Please which gem you would like to do things with!\n'
        );
        term.gridMenu(files, async (error, response) => {
            if (response.selectedText === backToMenu) drawMenu();
            else {
                if (!Gems.isModEnabled(response.selectedText.split('~')[0])) {
                    await Controller.newQuestion(
                        'Mod is not enabled in project, please press enter to return to gem menu'
                            .red
                    );
                    menu['gems']();
                    return;
                } else displayGemScripts(response.selectedText.split('~')[0]);
            }
        });
    },
    exit: async (response) => {
        console.clear();
        term.reset();
        term.green('Goodbye\n');
        process.exit(0);
    },
};

/**
 * Loads both IM project files
 * @param {string} projectFile
 */
let loadProjectFile = (projectFile) => {
    undeployedProjectFile = require('../../projects/' + projectName + '.js');
    undeployedProjectFile =
        undeployedProjectFile.default || undeployedProjectFile;
};

let displayProject = async (response) => {
    Controller.deployConfig.project = projectName;
    loadProjectFile(projectName);
    console.clear();
    let description = {
        ...undeployedProjectFile.description,
    };

    console.log('\n');
    console.log(projectName.bgGreen.white);
    console.log('created with InfinityMint'.gray);

    if (description.authors !== undefined) delete description.authors;

    console.log('\nProject Description: '.grey);
    term.table([Object.keys(description), [...Object.values(description)]], {
        firstRowTextAttr: { bgColor: 'blue' },
        width: 92,
        fit: true, // Activate all expand/shrink + wordWrap
    });

    if (
        undeployedProjectFile.description?.authors !== undefined &&
        Object.values(undeployedProjectFile.description?.authors).length !== 0
    ) {
        console.log('\nAuthors: '.grey);
        term.table(
            [
                ['name', 'twitter', 'ens'],
                ...Object.values(
                    undeployedProjectFile.description?.authors || [
                        { name: 'unknown author' },
                    ]
                ).map((author) => [
                    author.name,
                    author.twitter || 'no twitter',
                    author.ens || 'no ens',
                ]),
            ],
            {
                firstRowTextAttr: { bgColor: 'blue' },
                width: 92,
                fit: true, // Activate all expand/shrink + wordWrap
            }
        );
    }

    if (
        undeployedProjectFile.royalties !== undefined &&
        Object.values(undeployedProjectFile?.royalties?.payouts).length !== 0
    ) {
        console.log('\nRoyalty: '.grey);
        term.table(
            [
                ['name', 'address', 'splits'],
                ...Object.values(
                    undeployedProjectFile?.royalties?.payouts || [
                        { name: 'unknown author' },
                    ]
                ).map((author) => [
                    author.name,
                    author.address || 'no address',
                    JSON.stringify(author.splits || {}),
                ]),
            ],
            {
                firstRowTextAttr: { bgColor: 'blue' },
                width: 92,
                fit: true, // Activate all expand/shrink + wordWrap
            }
        );
    }

    console.log('\nModules: '.grey);
    undeployedProjectFile.modules.renderScript =
        undeployedProjectFile.modules?.renderScript ||
        Controller.getContractConfig(undeployedProjectFile.modules.controller)
            .defaultRenderScript ||
        undeployedProjectFile.modules.controller;
    term.table(
        [
            Object.keys(undeployedProjectFile.modules),
            [...Object.values(undeployedProjectFile.modules)],
        ],
        {
            firstRowTextAttr: { bgColor: 'blue' },
            width: 92,
            fit: true, // Activate all expand/shrink + wordWrap
        }
    );

    console.log('\nContent Overview: '.grey);
    term.table(
        [
            ['paths', 'assets'],
            [
                Object.values(
                    undeployedProjectFile?.paths?.indexes ||
                        undeployedProjectFile?.paths ||
                        []
                ).length,
                Object.values(
                    undeployedProjectFile?.assets?.indexes ||
                        undeployedProjectFile?.assets ||
                        []
                ).length,
            ],
        ],
        {
            firstRowTextAttr: { bgColor: 'blue' },
            width: 92,
            fit: true, // Activate all expand/shrink + wordWrap
        }
    );
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

    if (undeployedProjectFile?.mods !== undefined) {
        console.log('\n> Gems: '.magenta);
        Object.keys(undeployedProjectFile?.mods).forEach((key) => {
            console.log(
                key.cyan +
                    ' ' +
                    (undeployedProjectFile.mods[key] !== false ? '✔️' : '⭕')
            );
        });
    }

    console.log(
        '- writing temporary .project file to force project to our project'
    );
    Controller.getFileSystem().writeFileSync('./.project', projectName);

    if (
        !Controller.getFileSystem().existsSync(
            './projects/' + projectName + '.json'
        )
    ) {
        term.red(
            'invalid initial project: no file known as ' +
                projectName +
                '.json in projects folder'
        );
        deployedProjectFile = {
            valid: false,
        };
    } else {
        let path = './projects/' + projectName + '.json';
        if (Controller.getFileSystem().existsSync(path))
            deployedProjectFile = Controller.readInformation(path, true);
    }

    console.log('\n');
    console.log('Success! Project is now the selected project.'.grey);
    let question = await Controller.newQuestion(
        'Would you like to execute scripts with the context of this project? y/n: '
            .green
    );
    if (question.toLowerCase()[0] === 'y') menu['tools_and_scripts']();
    else drawMenu();
};

let loadScript = async (modName, file) => {
    let result = await require('../../mods/' + modName + '/scripts/' + file);
    result = result.default || result;
    return result;
};

let executeScript = async (
    file,
    arguments = '',
    returnTo = 'tools_and_scripts',
    isCount = false
) => {
    console.clear();
    console.log(
        (
            '\n> Executing ' +
            file +
            ' with arguments: ' +
            (arguments.length === 0
                ? 'no args'
                : `[${arguments.split(' ').join(',')}]`) +
            '\n'
        ).cyan
    );

    try {
        console.log(
            '- writing temporary .project file to force project to our project'
        );
        Controller.getFileSystem().writeFileSync('./.project', projectName);

        term.reset();
        let result = await Controller.executeNodeScript(
            'scripts/' + file,
            [arguments],
            true
        );
        Controller.restartQuestionReadline();

        if (Controller.isEnvTrue('CLEANUP_SCRIPT_PROJECT')) {
            console.log(
                '- removing temporary .project file to force project to our project'
            );
            Controller.getFileSystem().unlinkSync('./.project');
        }

        if (result !== 0) throw new Error('failed script');

        console.log('');
        term.underline.green('Script Successfully Executed!\n');

        if (
            Controller.getFileSystem().existsSync(
                './settings/' + Controller.deployConfig.project + '.json'
            )
        )
            Controller.settings = {
                ...Controller.settings,
                ...JSON.parse(
                    Controller.readInformation(
                        './settings/' +
                            Controller.deployConfig.project +
                            '.json'
                    )
                ),
            };

        if (!isCount) {
            let question = await Controller.newQuestion(
                'Return to menu? y/n: '.green
            );
            if (question.toLowerCase()[0] === 'y') drawMenu();
            else menu[returnTo]();
        }
    } catch (error) {
        displayError(error);

        if (!isCount) {
            let question = await Controller.newQuestion('Retry? y/n: '.green);
            if (question.toLowerCase()[0] === 'y')
                executeScript(file, arguments, returnTo);
            else menu[returnTo]();
        } else {
            let question = await Controller.newQuestion('kill? y/n: '.green);
            if (question.toLowerCase()[0] === 'y')
                throw new Error('has killed');

            await delay(2);
        }
    }
};

async function drawMenu() {
    term.reset();
    console.clear();

    let versionObj = {};
    if (Controller.settings.version)
        versionObj = await Controller.getVersionModule(
            Controller.settings.version || 1
        );

    let path =
        './deployments/' + Controller.defaultNetwork + '/' + '.deployInfo';

    if (Controller.getFileSystem().existsSync(path))
        deployedProject = Controller.readInformation(path, true).project;

    console.log(`
██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗                           
██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝                           
██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝                            
██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝                             
██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║                              
╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝                              
            ██████╗ ██████╗ ███╗   ██╗███████╗ ██████╗ ██╗     ███████╗
           ██╔════╝██╔═══██╗████╗  ██║██╔════╝██╔═══██╗██║     ██╔════╝
           ██║     ██║   ██║██╔██╗ ██║███████╗██║   ██║██║     █████╗  
           ██║     ██║   ██║██║╚██╗██║╚════██║██║   ██║██║     ██╔══╝  
           ╚██████╗╚██████╔╝██║ ╚████║███████║╚██████╔╝███████╗███████╗
            ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝╚══════╝
Infinitymint (0xSchrödinger Version) by 0x0zAgency (https://0x0z.eth.limo) and frens 
Follow the 0xYBR ██\n`
            .yellow
    );
    term.bgRed('Current Project: ' + projectName + '\n');
    term.bgGreen('Deployed Project: ' + deployedProject + '\n');
    term.bgBlue('Current Network: ' + Controller.defaultNetwork + '\n');
    term.bgYellow(
        'Current React Version: ' + (versionObj.name || 'unknown') + '\n'
    );
    console.log(
        'Please use your arrow keys to navigate and press enter to select an option\n'
            .gray
    );

    if (
        !Controller.getFileSystem().existsSync(
            './projects/' + projectName + '.json'
        )
    )
        term.red(
            'invalid deployed project: no file known as ' +
                projectName +
                '.json in projects folder\n'
        );

    if (
        !Controller.getFileSystem().existsSync(
            './settings/' + projectName + '.json'
        )
    )
        term.red(
            'no settings found for ' +
                projectName +
                ' please deploy or run settings.js\n'
        );

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

    let address =
        process.env.GANACHE_URL !== undefined &&
        process.env.GANACHE_URL !== null &&
        process.env.GANACHE_URL.trim().length !== 0
            ? process.env.GANACHE_URL
            : 'http://localhost';

    let port =
        process.env.GANACHE_PORT !== undefined &&
        process.env.GANACHE_PORT !== null &&
        process.env.GANACHE_PORT.trim().length !== 0
            ? process.env.GANACHE_PORT
            : 8545;

    ping({
        address: address.replace('https://', '').replace('http://', ''),
        port: port,
        timeout: 1000,
        attempts: 2,
    }).then((result) => {
        if (!result)
            console.log(
                'Ganache/InfinityChain is not online. Check: \n'.red +
                    (address + ':' + port).yellow.underline
            );
        else
            console.log(
                (
                    'Connected to Ganache/InfinityChain at ' +
                    (address + ':' + port)
                ).green
            );

        let keys = Object.keys(menu);
        term.gridMenu(keys, (error, response) => {
            let value = menu[response.selectedText];
            value(response).catch((error) => displayError);
        });
    });
}

//exit if control-c
term.on('key', (key, matches, data) => {
    if (key === 'CTRL_C') {
        console.clear();
        process.exit();
    }
});

if (
    !Controller.getFileSystem().existsSync(
        './projects/' + projectName + '.json'
    )
) {
    term.red(
        'invalid initial project: no file known as ' +
            projectName +
            '.json in projects folder'
    );
    deployedProjectFile = {
        valid: false,
    };
} else {
    let path = './projects/' + projectName + '.json';
    if (Controller.getFileSystem().existsSync(path))
        deployedProjectFile = Controller.readInformation(path, true);
}

menu = {
    [projectName]: displayProject,
    ...menu,
};

drawMenu();
