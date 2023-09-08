const Controller = require('./../Controller');
const VersionTwo = {
    version: 2,
    name: 'Schrödinger',
    supports: {
        multiChain: true,
        multiProject: true,
        eads: true,
    },
    locations: {
        deployments: 'dist/',
        styles: 'src/Styles/',
        images: 'src/Images/',
        mods: 'src/Resources/Mods/',
        scripts: 'src/Resources/Scripts/',
    },
    makeFolders: () => {
        let locations = [...Object.values(VersionTwo.locations)].map(
            (location) => Controller.settings.reactLocation + location
        );

        locations.forEach((location) => {
            if (!Controller.getFileSystem().existsSync(location)) {
                Controller.log('- making ' + location);
                Controller.getFileSystem().mkdirSync(location);
            }
        });
    },
    onCopyDeployments: (deployments) => {},
    onCopyContent: (content) => {},
    onCopyGems: (files) => {},
    onCopyStaticManifest: (static, projectFile) => {
        let fileName =
            Controller.settings.reactLocation + 'src/Resources/projects.json';

        let projects = Controller.readInformation(fileName, true);

        if (projects.staticManifests == undefined)
            projects.staticManifests = {};

        if (
            projects.staticManifests[Controller.deployConfig.project] ===
            undefined
        )
            projects.staticManifests[Controller.deployConfig.project] = {};

        Controller.log('- writing ' + fileName);
        projects.staticManifests[Controller.deployConfig.project][
            projectFile.network.chainId
        ] = static;

        Controller.writeInformation(projects, fileName);
        Controller.log('- writing to dist folder');
        Controller.writeInformation(projects, fileName);
        Controller.writeInformation(
            static,
            Controller.settings.reactLocation +
                'dist/' +
                projectFile.project +
                '/' +
                projectFile.network.chainId +
                '/' +
                'static_manifest.json'
        );
    },
    onCopyScripts: (scripts, projectFile) => {
        let fileName =
            Controller.settings.reactLocation + 'src/Resources/projects.json';

        [...(scripts || [])].forEach((script) => {
            Controller.getFileSystem().copyFileSync(
                script.filepath,
                Controller.settings.reactLocation +
                    VersionTwo.locations.scripts +
                    script.filename
            );
        });

        let projects = Controller.readInformation(fileName, true);

        if (projects.scriptManifests == undefined)
            projects.scriptManifests = {};

        if (
            projects.scriptManifests[Controller.deployConfig.project] ===
            undefined
        )
            projects.scriptManifests[Controller.deployConfig.project] = {};

        let manifest = {
            updated: Date.now(),
            project: Controller.deployConfig.project,
            scripts: scripts.map((file) => file.filename),
        };

        Controller.log('- writing ' + fileName);
        projects.scriptManifests[Controller.deployConfig.project][
            projectFile.network.chainId
        ] = manifest;

        Controller.log('- writing to dist folder');
        Controller.writeInformation(projects, fileName);
        Controller.writeInformation(
            manifest,
            Controller.settings.reactLocation +
                'dist/' +
                projectFile.project +
                '/' +
                projectFile.network.chainId +
                '/' +
                'script_manifest.json'
        );
    },
    onCopyProject: (projectFile) => {
        let projects = Controller.readInformation(
            Controller.settings.reactLocation + 'src/Resources/projects.json',
            true
        );

        if (projects.projects === undefined) projects.projects = {};

        if (projects.projects[projectFile.project] === undefined)
            projects.projects[projectFile.project] = {};

        projects.projects[projectFile.project][projectFile.network.chainId] =
            projectFile;

        Controller.writeInformation(
            projects,
            Controller.settings.reactLocation + 'src/Resources/projects.json'
        );
        Controller.log('- writing to dist folder');
        Controller.writeInformation(
            projectFile,
            Controller.settings.reactLocation +
                'dist/' +
                projectFile.project +
                '/' +
                projectFile.network.chainId +
                '/' +
                projectFile.project +
                '.json'
        );
    },
    onCopyDeployInfo: (deployInfo) => {
        if (
            !Controller.getFileSystem().existsSync(
                Controller.settings.reactLocation +
                    'src/Resources/projects.json'
            )
        ) {
            console.log('- no projects file');
        } else {
            let projectFile = Controller.readInformation(
                Controller.settings.reactLocation +
                    'src/Resources/projects.json',
                true
            );

            if (projectFile.deployments === undefined)
                projectFile.deployments = {};

            if (projectFile.deployments[deployInfo.project] === undefined)
                projectFile.deployments[deployInfo.project] = {};

            projectFile.deployments[deployInfo.project][deployInfo.chainId] =
                deployInfo;

            Controller.writeInformation(
                projectFile,
                Controller.settings.reactLocation +
                    'src/Resources/projects.json'
            );
        }

        Controller.log('- writing to dist folder');
        Controller.writeInformation(
            deployInfo,
            Controller.settings.reactLocation +
                'dist/' +
                deployInfo.project +
                '/' +
                deployInfo.chainId +
                '/' +
                'deployInfo.json'
        );
    },
};

module.exports = VersionTwo;
