const { run, ethers, deployments } = require('hardhat');
const Controller = require('../src/Controller');

async function main() {
    let projectFile;
    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        projectFile = JSON.parse(Controller.readInformation('./.temp_project'));
    } else projectFile = await Controller.getProjectFile(true);

    let module = await Controller.getVersionModule();

    if (Controller.deployConfig.clearPreviousContent) {
        console.log('\n> Deleting old folders\n'.blue);

        Controller.log('- deleting public/imgs/paths in react');
        if (
            Controller.getFileSystem().existsSync(
                Controller.settings.reactLocation + 'public/imgs/paths/'
            )
        )
            Controller.getFileSystem().rmdirSync(
                Controller.settings.reactLocation + 'public/imgs/paths/',
                {
                    recursive: true,
                    force: true,
                }
            );

        Controller.log('- deleting public/imgs/assets in react');
        if (
            Controller.getFileSystem().existsSync(
                Controller.settings.reactLocation + 'public/imgs/assets/'
            )
        )
            Controller.getFileSystem().rmdirSync(
                Controller.settings.reactLocation + 'public/imgs/assets/',
                {
                    recursive: true,
                    force: true,
                }
            );

        Controller.log('- deleting public/imgs/content in react');
        if (
            Controller.getFileSystem().existsSync(
                Controller.settings.reactLocation + 'public/imgs/content/'
            )
        )
            Controller.getFileSystem().rmdirSync(
                Controller.settings.reactLocation + 'public/imgs/content/',
                {
                    recursive: true,
                    force: true,
                }
            );
    }

    console.log('\n> Copying Paths \n'.blue);

    let keys = Object.keys(projectFile.paths).filter(
        (key) => key !== 'default'
    );

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let path = projectFile.paths[key];

        if (key === 'default' || path === null || path === undefined) continue;

        let location = Controller.settings.reactLocation + 'public/imgs/';

        if (!Controller.getFileSystem().existsSync(location))
            Controller.getFileSystem().mkdirSync(location);

        location = location + 'paths/';

        if (!Controller.getFileSystem().existsSync(location))
            Controller.getFileSystem().mkdirSync(location);

        location = location + path.fileName.replace(/^.*[\\\/]/, '');

        if (path.paths.projectStorage) {
            Controller.log(
                (
                    'skipping path ' +
                    location +
                    ' since already stored in project json file'
                ).gray
            );
        } else {
            Controller.log(
                '> copying ./imports/' + path.fileName + ' to ' + location
            );
            Controller.getFileSystem().copyFileSync(
                `./imports/${path.fileName}`,
                location
            );
            path.paths.localStorage = true;
            path.paths.data =
                '/imgs/paths/' + path.fileName.replace(/^.*[\\\/]/, '');
            path.paths.ipfs =
                Controller.deployConfig.useLocalAndIPFSContent ||
                !Controller.deployConfig.copyContent;
        }

        if (path.content !== undefined) {
            let location =
                Controller.settings.reactLocation + 'public/imgs/content/';

            //make dir if it does not exist
            if (!Controller.getFileSystem().existsSync(location))
                Controller.getFileSystem().mkdirSync(location);

            let keys = Object.keys(path.content);
            Object.values(path.content).map((value, index) => {
                try {
                    let key = path.content[keys[index]].key;
                    let _fileName = value.fileName.replace(/^.*[\\\/]/, '');
                    location =
                        Controller.settings.reactLocation +
                        'public/imgs/content/' +
                        key +
                        '/';

                    if (!Controller.getFileSystem().existsSync(location))
                        Controller.getFileSystem().mkdirSync(location);

                    if (path.content[keys[index]].paths.projectStorage) {
                        Controller.log(
                            (
                                'skipping content ' +
                                value.fileName +
                                ' since already stored in project json file'
                            ).gray
                        );
                        return;
                    }

                    location = location + _fileName;

                    if (!Controller.getFileSystem().existsSync(location)) {
                        Controller.log(
                            ' > copying content ./imports/' +
                                value.fileName +
                                ' to ' +
                                location
                        );
                        Controller.getFileSystem().copyFileSync(
                            `./imports/${value.fileName}`,
                            location
                        );
                    } else console.log(('already exists: ' + location).gray);

                    path.content[keys[index]].paths.data =
                        '/imgs/content/' + key + '/' + _fileName;
                    path.content[keys[index]].paths.localStorage = true;
                    path.content[keys[index]].paths.ipfs =
                        Controller.deployConfig.useLocalAndIPFSContent ||
                        !Controller.deployConfig.copyContent;
                } catch (error) {
                    console.log('cannot copy content'.red);
                    console.log(error);
                }
            });
        }
    }
    console.log('[✔️] Passed');

    if (projectFile.assets !== undefined) {
        console.log('\n > Copying Assets \n'.blue);

        keys = Object.keys(projectFile.assets);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];

            if (key === 'default') continue;

            let asset = projectFile.assets[key];
            let location =
                Controller.settings.reactLocation + 'public/imgs/assets/';

            if (!Controller.getFileSystem().existsSync(location))
                Controller.getFileSystem().mkdirSync(location);

            location = location + asset.fileName.replace(/^.*[\\\/]/, '');

            if (asset.paths.projectStorage) {
                Controller.log(
                    '- skipping asset ' +
                        location +
                        ' since already stored in project json file'
                );
                continue;
            }

            Controller.log(
                '- copying ./imports/' + asset.fileName + ' to ' + location
            );
            Controller.getFileSystem().copyFileSync(
                `./imports/${asset.fileName}`,
                location
            );
            asset.paths.localStorage = true;
            asset.paths.data =
                '/imgs/assets/' + asset.fileName.replace(/^.*[\\\/]/, '');
            asset.paths.ipfs =
                Controller.deployConfig.useLocalAndIPFSContent ||
                !Controller.deployConfig.copyContent;
        }

        console.log('[✔️] Passed');
    }

    //clears all styles not in permanent styles
    if (Controller.deployConfig.clearStaticManifest) {
        console.log('\n > Deleting Old Stylesheet Files \n'.blue);

        //these are not deleted
        let skipKeys = Controller.deployConfig.permanentStyles || [
            'audiocover.css',
            'app.css',
            'darkTypography.css',
            'styles.js',
        ];

        Controller.getFileSystem()
            .readdirSync(
                Controller.settings.reactLocation +
                    (module.locations.styles || 'src/Styles/'),
                {
                    withFileTypes: true,
                }
            )
            .filter(
                (file) =>
                    skipKeys.filter((key) => key == file.name).length === 0
            )
            .forEach((file) => {
                try {
                    Controller.log('- deleting stylesheet ' + file.name);
                    Controller.getFileSystem().unlinkSync(
                        Controller.settings.reactLocation +
                            (module.locations.styles || 'src/Styles/'),
                        file.name
                    );
                } catch (error) {
                    console.log('could not unlink file: ');
                    console.log(error);
                }
            });
        console.log('[✔️] Passed');
    }

    //just clears bootstrap files, safer option as there is no telling how many custom styles they could have
    if (
        Controller.deployConfig.clearBootstrapStyles &&
        !Controller.deployConfig.clearStaticManifest
    ) {
        console.log('\n > Deleting Unused Bootstrap Styles \n'.blue);

        Controller.getFileSystem()
            .readdirSync(
                Controller.settings.reactLocation +
                    (module.locations.styles || 'src/Styles/'),
                {
                    withFileTypes: true,
                }
            )
            .filter((file) => file.name.indexOf('bootstrap.') !== -1)
            .forEach((file) => {
                try {
                    Controller.log('- deleting stylesheet ' + file.name);
                    Controller.getFileSystem().unlinkSync(
                        Controller.settings.reactLocation +
                            'src/Styles/' +
                            file.name
                    );
                } catch (error) {
                    console.log('could not unlink file: ');
                    console.log(error);
                }
            });
    }

    if (projectFile.static !== undefined) {
        console.log('\n> Copying Static Manifest Files \n'.blue);

        let extraImageKeys = ['headerBackground', 'background', 'defaultImage'];

        let copyFile = (filename, image = true) => {
            console.log(filename);
            let newname = filename.replace(/^.*[\\\/]/, '');
            newname = (image ? 'Images/' : 'Styles/') + newname;
            Controller.log(
                ' - copying ' +
                    newname +
                    ' to ' +
                    Controller.settings.reactLocation +
                    'src/' +
                    newname
            );
            Controller.getFileSystem().copyFileSync(
                './imports/' + filename,
                Controller.settings.reactLocation + 'src/' + newname
            );
            return newname;
        };

        extraImageKeys.forEach((key) => {
            if (projectFile.static[key] === undefined) return;

            //copy background images
            if (projectFile.static[key][0] !== '@') {
                projectFile.static[key] =
                    '@' + copyFile(projectFile.static[key], true);
            }
        });

        if (projectFile.static.images !== undefined) {
            let keys = Object.keys(projectFile.static.images);
            keys.forEach((key) => {
                let value = projectFile.static.images[key];
                projectFile.static.images[key] =
                    value[0] !== '@' ? '@' + copyFile(value, true) : value;
            });
        }

        if (projectFile.static.stylesheets !== undefined) {
            if (projectFile.static.stylesheets instanceof Array === false)
                projectFile.static.stylesheets = Object.values(
                    projectFile.static.stylesheets
                );

            //copy images
            projectFile.static.stylesheets = projectFile.static.stylesheets.map(
                (value) => (value[0] !== '@' ? copyFile(value, false) : value)
            );
        }

        console.log('[✔️] Passed');
    }

    if (projectFile?.static !== undefined) {
        projectFile.static.project = Controller.deployConfig.project;
        projectFile.static.updated = Date.now();
    }

    module.onCopyStaticManifest(projectFile.static || {}, projectFile);

    if (Controller.getFileSystem().existsSync('./.temp_project')) {
        Controller.writeInformation(projectFile, './.temp_project');
    } else {
        Controller.log(
            '- Saving project file (recommended that you run setProject as well)'
        );
        Controller.writeInformation(
            projectFile,
            './projects/' + Controller.deployConfig.project + '.json'
        );
        Controller.log(' ☻ Success'.green);
    }

    console.log('\nFinished Successfully'.green);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
