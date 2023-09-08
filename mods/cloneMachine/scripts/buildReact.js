const { run, ethers, deployments, getChainId } = require('hardhat');
const glob = require('glob');
const Controller = require('../../../src/Controller');

const Script = async (args, projectFile) => {
    if (Controller.settings.cloneRootFolder === undefined)
        throw new Error('please run makeReact first');

    let bannedDirs = ['template', 'nginx', 'html'];
    let dirs = Controller.getFileSystem()
        .readdirSync(Controller.settings.cloneRootFolder, {
            withFileTypes: true,
        })
        .filter(
            (dir) =>
                dir.isDirectory() &&
                bannedDirs.filter((bannedDir) => bannedDir === dir.name)
                    .length === 0
        );

    let errors = [];
    let copyRecursive = (root = '', a = undefined, b = undefined) => {
        a = a || Controller.settings.cloneRootFolder + 'html/';
        b = b || Controller.settings.cloneRootFolder;
        if (!Controller.getFileSystem().existsSync(a + root))
            Controller.getFileSystem().mkdirSync(a + root);
        Controller.getFileSystem()
            .readdirSync(b + root, {
                withFileTypes: true,
            })
            .forEach((file) => {
                if (file.isFile()) {
                    console.log(
                        '- copying file ' +
                            (b + root + file.name) +
                            ' to ' +
                            (a + root + file.name)
                    );
                    Controller.getFileSystem().copyFileSync(
                        b + root + file.name,
                        a + root + file.name
                    );
                } else if (file.isDirectory()) {
                    copyRecursive(root + file.name + '/', a, b);
                }
            });
    };

    for (let i = 0; i < dirs.length; i++) {
        let dir = dirs[i];

        console.log(
            ('\n> Building ' + dir.name + ` ${i + 1}/${dirs.length}\n`).cyan
        );

        let cwd = Controller.settings.cloneRootFolder + dir.name + '/dist';

        try {
            console.log('- doing npm install cwd: ' + cwd);
            await Controller.executeService(
                'install',
                ['--build-from-source'],
                'npm',
                true,
                cwd
            );
            console.log('- doing npm run build cwd: ' + cwd);
            await Controller.executeService('run', ['build'], 'npm', true, cwd);

            let location = cwd + '/../html/';
            console.log(
                '- copying files from ' + (cwd + '/build/') + ' to ' + location
            );
            copyRecursive('', location, cwd + '/build/');
            console.log('☻ Success ☻\n'.green);
        } catch (error) {
            console.log('ERROR!'.red);
            console.log(error);
            errors.push(error);
        }
    }

    if (errors.length !== 0)
        console.log('WARNING: Finished with ' + errors.length + ' errors');

    console.log('\n> Finished\n'.magenta);
};

Script.name = 'Build Reacts';
Script.description =
    'Attempts to build all of the react files relating to a clone.';
Script.requireDeployment = false;
Script.verifyContext = false;
Script.parameters = {
    cloneIndex: 0,
};
module.exports = Script;
