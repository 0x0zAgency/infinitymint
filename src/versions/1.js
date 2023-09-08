const Controller = require('./../Controller');

const VersionOne = {
    version: 1,
    name: 'Classic',
    supports: {
        multiChain: false,
        multiProject: false,
        eads: true,
    },
    locations: {
        deployments: 'src/Deployments/',
        styles: 'src/Styles/',
        images: 'src/Images/',
        static: 'src/Deployments/static/',
        mods: 'src/Deployments/mods/',
        scripts: 'src/Deployments/scripts/',
    },
    makeFolders: () => {
        let locations = [...Object.values(VersionOne.locations)].map(
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
    onCopyScripts: (scripts) => {
        let location =
            Controller.settings.reactLocation + VersionOne.locations.scripts;
        scripts.forEach((file) => {
            Controller.log('- copying ' + file.filepath + ' to ' + location);
            Controller.getFileSystem().copyFileSync(
                file.filepath,
                location + file.filename
            );
        });

        let manifest = {
            updated: Date.now(),
            project: Controller.deployConfig.project,
            scripts: scripts.map((file) => file.filename),
        };

        Controller.log('- Writing script manifest');
        Controller.writeInformation(
            manifest,
            Controller.settings.reactLocation +
                'src/Deployments/scripts/manifest.json'
        );
    },
    onCopyStaticManifest: (static) => {
        let fileName =
            Controller.settings.reactLocation +
            VersionOne.locations.deployments +
            'static/manifest.json';

        Controller.log('- writing ' + fileName);
        Controller.writeInformation(static, fileName);
    },
    onCopyProject: (projectFile) => {
        let fileName =
            Controller.settings.reactLocation +
            VersionOne.locations.deployments +
            'projects/' +
            projectFile.project +
            '.json';

        Controller.log('- saving ' + fileName);
        Controller.writeInformation(projectFile, fileName);
    },
    onCopyDeployInfo: (deployInfo) => {
        let fileName =
            Controller.settings.reactLocation +
            VersionOne.locations.deployments +
            'deployInfo.json';

        Controller.log('- saving ' + fileName);
        Controller.writeInformation(deployInfo, fileName);
    },
};

module.exports = VersionOne;
