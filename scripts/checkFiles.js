const Controller = require('../src/Controller');
const { delay } = require('../src/helpers');
const { run, ethers, deployments } = require('hardhat');
const glob = require('glob');

const checkReactFile = (filepath) => {
    filepath = filepath.replace(/@/g, '');
    return Controller.getFileSystem().existsSync(
        Controller.settings.reactLocation + 'src/' + filepath
    );
};

const checkLocalFile = (filePath) => {
    return Controller.getFileSystem().existsSync('./imports/' + filePath);
};

const checkRenderScript = async (renderScript) => {
    let promise = () => {
        return new Promise((resolve, reject) => {
            glob('./scripts/render/**/*.js', (err, matches) => {
                resolve(matches);
            });
        });
    };

    let results = await promise();

    //if we are copying all contracts then don't filter else only include the the build scripts
    results = results.filter(
        (file) =>
            file.replace(/^.*[\\\/]/, '') === renderScript + '.js' || false
    );

    return results.length !== 0;
};

async function main() {
    let projectFile = await Controller.getProjectFile();
    let config = Controller.getContractConfig(projectFile.modules.controller);

    if (projectFile.modules.renderScript === undefined)
        projectFile.modules.renderScript =
            config?.defaultRenderScript || 'Default';

    if (
        projectFile.modules.renderScript.length === 0 ||
        projectFile.modules.renderScript === null
    )
        projectFile.modules.renderScript = projectFile.modules.controller;

    if (
        Controller.settings.reactLocation === undefined ||
        Controller.settings.reactLocation === null ||
        !Controller.getFileSystem().existsSync(
            Controller.settings.reactLocation
        )
    )
        throw new Error(
            '\nreact location is invalid, deploy or run settngs.js script first'.red
        );

    console.log('\n> Checking that render script is valid\n'.blue);

    if ((await checkRenderScript(projectFile.modules.renderScript)) === false) {
        console.log(
            (
                '\nrender script not found in ./scripts/renders/: ' +
                projectFile.modules.renderScript
            ).red
        );
        await delay(2);
        throw new Error('bad render script');
    }

    console.log('\n> Checking that paths and assets are all valid\n'.blue);

    let problems = [];

    if (projectFile.assets !== undefined) {
        let assets;
        if (
            typeof projectFile.assets === 'object' &&
            projectFile instanceof Array === false
        ) {
            assets = [];

            Object.keys(projectFile.assets).forEach((sectionKey) => {
                projectFile.assets[sectionKey].forEach((asset) => {
                    assets.push({ sectionKey: sectionKey, ...asset });
                });
            });
        } else assets = projectFile.assets;

        for (let i = 0; i < assets.length; i++) {
            let asset = assets[i];

            if (
                !Controller.getFileSystem().existsSync(
                    './imports/' + asset.fileName
                )
            ) {
                problems.push(
                    `asset [${i}] (section:${
                        asset.sectionKey || asset.section || 0
                    }) ${asset.name}:${asset.fileName} does not exist`
                );
            }

            let extension = asset.fileName.split('.').pop();
            if (config.allowedAssetExtensions !== undefined) {
                if (
                    Object.values(config.allowedAssetExtensions).filter(
                        (value) =>
                            value.toLowerCase() === extension.toLowerCase()
                    ).length === 0
                )
                    problems.push(
                        'asset file type and extension is not allowed with ' +
                            projectFile.modules.controller +
                            ': ' +
                            asset.fileName
                    );
            }
        }
    }

    projectFile.paths = {
        ...projectFile.paths,
        ...(projectFile.paths.indexes || {}),
    };

    if (projectFile.paths.indexes !== undefined)
        delete projectFile.paths.indexes;

    if (projectFile.paths !== undefined) {
        for (let [index, path] of Object.entries(projectFile.paths)) {
            if (path.content !== undefined) {
                Object.values(path.content).map((filename, contentIndex) => {
                    if (
                        filename === undefined ||
                        filename === null ||
                        typeof filename === 'object'
                    )
                        return;

                    filename = filename.toString();

                    if (
                        !Controller.getFileSystem().existsSync(
                            './imports/' + filename
                        )
                    )
                        problems.push(
                            `path [pathId ${index}|${
                                path.name || 'unknown'
                            }: content ${
                                Object.keys(path.content)[contentIndex]
                            }] ${filename} does not exist`
                        );

                    let extension = filename.split('.').pop();
                    if (config.allowedContentExtensions !== undefined) {
                        if (
                            Object.values(
                                config.allowedContentExtensions
                            ).filter(
                                (value) =>
                                    value.toLowerCase() ===
                                    extension.toLowerCase()
                            ).length === 0
                        )
                            problems.push(
                                'content file type extension is not allowed with ' +
                                    projectFile.modules.controller +
                                    ': ' +
                                    filename
                            );
                    }
                });
            }

            if (index === 'default') continue;

            if (path.fileName === undefined)
                problems.push(
                    `path [pathId ${index}|${
                        path.name || 'unknown'
                    }] has no file name: name is maybe ${path.name}`
                );
            else {
                let extension = path.fileName.split('.').pop();
                if (config.allowedPathExtensions !== undefined) {
                    if (
                        Object.values(config.allowedPathExtensions).filter(
                            (value) =>
                                value.toLowerCase() === extension.toLowerCase()
                        ).length === 0
                    )
                        problems.push(
                            'path file type and extension is not allowed with ' +
                                projectFile.modules.controller +
                                ': ' +
                                path.fileName
                        );
                }
            }

            if (
                !Controller.getFileSystem().existsSync(
                    './imports/' + path.fileName
                )
            )
                problems.push(
                    `path [pathId ${index}|${path.name || 'unknown'}] ${
                        path.name
                    }:${path.fileName} does not exist`
                );
        }
    }

    if (projectFile.static !== undefined) {
        let backgroundKeys = ['headerBackground', 'background', 'defaultImage'];

        let addToProblemIf = (value, reference) => {
            if (!value)
                problems.push('static asset does not exist: ' + reference);
        };

        backgroundKeys.forEach((key) => {
            if (projectFile.static[key] === undefined) return;

            //check each background key
            if (projectFile.static[key][0] === '@')
                addToProblemIf(
                    checkReactFile(projectFile.static[key]),
                    projectFile.static[key]
                );
            else
                addToProblemIf(
                    checkLocalFile(projectFile.static[key]),
                    projectFile.static[key]
                );
        });

        if (projectFile.static.images !== undefined) {
            if (projectFile.static.images instanceof Array === false)
                projectFile.static.images = Object.values(
                    projectFile.static.images
                );

            //check each thing in static to see if it exists
            projectFile.static.images.forEach((value) =>
                value[0] === '@'
                    ? addToProblemIf(checkReactFile(value), value)
                    : addToProblemIf(checkLocalFile(value), value)
            );
        }

        if (projectFile.static.stylesheets !== undefined) {
            if (projectFile.static.stylesheets instanceof Array === false)
                projectFile.static.stylesheets = Object.values(
                    projectFile.static.stylesheets
                );

            //check each thing in static to see if it exists
            projectFile.static.stylesheets.forEach((value) =>
                value[0] === '@'
                    ? addToProblemIf(checkReactFile(value), value)
                    : addToProblemIf(checkLocalFile(value), value)
            );
        }
    }

    if (problems.length !== 0) {
        console.log(
            (' ! FAILED FILE CHECK FOUND ' + problems.length + ' ISSUES ! ')
                .bgRed.white
        );
        console.log(('PROJECT: ' + Controller.deployConfig.project).cyan);
        console.log('\n');
        problems.forEach((problem) => {
            console.log(`\t${problem}`.red);
        });

        console.log('\n');
        console.log(
            ('! FAILED FILE CHECK FOUND ' + problems.length + ' ISSUES ! ')
                .bgRed.white
        );
        console.log(('PROJECT: ' + Controller.deployConfig.project).cyan);
        console.log('Dying in 15 seconds...'.gray);
        await delay(15);
        throw new Error('failed checkFiles');
    }

    console.log(
        (
            '\n[✔️] Passed File Check! All files for ' +
            Controller.deployConfig.project +
            ' are valid!'
        ).green.underline
    );
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
