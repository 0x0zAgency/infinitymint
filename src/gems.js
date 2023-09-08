const Controller = require('./Controller');

const Gems = new (class {
    mods = {};

    modError(modName, error) {
        if (error instanceof Error !== true) error = new Error(error);

        Controller.log(`mod error [${modName}]:`);
        console.log(error);
        throw error;
    }

    async loadMods(requireLocation = './../') {
        Controller.getFileSystem()
            .readdirSync('./mods/', {
                withFileTypes: true,
            })
            .filter((file) => file.isDirectory())
            .map((dir) => {
                return {
                    path: 'mods/' + dir.name + '/',
                    name: dir.name,
                };
            })
            .forEach((mod) => {
                if (
                    !Controller.getFileSystem().existsSync(
                        './' + mod.path + '/' + mod.name + '.json'
                    )
                )
                    this.modError(mod.name, `${mod.name}.json does not exist`);

                let fileData = Controller.readInformation(
                    './' + mod.path + '/' + mod.name + '.json',
                    true
                );

                if (this.mods[mod.name] !== undefined)
                    this.modError(
                        mod.name,
                        `${mod.name} conflicts with another mod of the same name`
                    );

                Controller.log(
                    '- Successfully read manifest file for ' + mod.name
                );
                this.mods[mod.name] = {
                    manifest: { ...fileData },
                    loaded: Date.now(),
                    path: mod.path,
                    name: mod.name,
                    enabled: false,
                };
                Controller.log(('💎 Gem Found! ' + mod.name).grey);
            });

        let keys = Object.keys(this.mods);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = this.mods[key];
            let basePath = requireLocation + value.path;

            if (
                Controller.getFileSystem().existsSync(
                    './' + value.path + 'deploy.js'
                )
            )
                this.mods[key].deployMethod = await require(basePath +
                    'deploy');
            else this.mods[key].deployMethod = null;

            if (
                Controller.getFileSystem().existsSync(
                    './' + value.path + 'setup.js'
                )
            )
                this.mods[key].setupMethod = await require(basePath + 'setup');
            else this.mods[key].setupMethod = null;

            Controller.log(('💎 Gem Loaded: ' + value.name).magenta);

            if (this.mods[key].setupMethod !== null)
                Controller.log('has setup method'.gray);

            if (this.mods[key].deployMethod !== null)
                Controller.log('has deploy method'.gray);
        }
    }

    getDeployMethods() {
        let keys = Object.keys(this.mods);
        let methods = [];

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = this.mods[key];
            if (value.enabled && value.deployMethod !== null)
                methods.push({ method: value.deployMethod, mod: key });
        }

        return methods;
    }

    getScriptMethods() {
        let keys = Object.keys(this.mods);
        let methods = [];

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = this.mods[key];
            if (value.setupMethod !== null && value.enabled)
                methods.push({ method: value.setupMethod, mod: key });
        }

        return methods;
    }

    copyMod(modName) {
        let mod = this.mods[modName];
        let paths = {};
        let folders = [
            'pages',
            'images',
            'styles',
            'components',
            'modals',
            'resources',
        ];

        let basePath =
            Controller.settings.reactLocation + 'src/Deployments/mods/';

        if (Controller.settings.version === 2)
            basePath =
                Controller.settings.reactLocation + 'src/Resources/Mods/';

        if (!Controller.getFileSystem().existsSync(basePath))
            Controller.getFileSystem().mkdirSync(basePath);

        basePath = basePath + mod.name + '/';

        if (!Controller.getFileSystem().existsSync(basePath))
            Controller.getFileSystem().mkdirSync(basePath);

        folders.forEach((folder) => {
            paths[folder] = [];

            if (
                !Controller.getFileSystem().existsSync(
                    './' + mod.path + folder + '/'
                )
            )
                return;

            let baseFolder =
                basePath +
                (folder.toUpperCase()[0] + folder.substring(1)) +
                '/';

            let files = Controller.getFileSystem()
                .readdirSync('./' + mod.path + folder + '/', {
                    withFileTypes: true,
                })
                .filter(
                    (file) =>
                        !file.isDirectory() && file.name.indexOf('.js') !== -1
                )
                .map((file) => file.name);

            if (files.length !== 0) {
                Controller.log('- making ' + baseFolder);

                if (!Controller.getFileSystem().existsSync(baseFolder))
                    Controller.getFileSystem().mkdirSync(baseFolder);

                files.forEach((file) => {
                    let actualPath = mod.path + folder + '/' + file;
                    let copyPath = baseFolder + file;
                    Controller.log(
                        '- copying ' + actualPath + ' to ' + copyPath
                    );
                    Controller.getFileSystem().copyFileSync(
                        actualPath,
                        copyPath
                    );
                    paths[folder].push(
                        mod.name +
                            '/' +
                            (folder.toUpperCase()[0] + folder.substring(1)) +
                            '/' +
                            file.split('.')[0]
                    );
                });
            }
        });

        if (Controller.getFileSystem().existsSync(mod.path + 'main.js')) {
            Controller.log(
                '- copying ' + mod.path + 'main.js to ' + basePath + '/main.js'
            );
            Controller.getFileSystem().copyFileSync(
                mod.path + 'main.js',
                basePath + '/main.js'
            );
            mod.main = true;
            mod.mainSrc = mod.name + '/main.js';
        }

        mod.reactPath = basePath;
        mod.files = paths;

        Controller.log('- writing mod manifest.json');
        Controller.writeInformation(mod, basePath + `${mod.name}.json`);

        return paths;
    }

    enableMods(_mods) {
        if (_mods instanceof Array === false)
            _mods = Object.keys(_mods).filter((key) => _mods[key] === true);

        _mods.forEach((modName) => {
            if (!this.isModValid(modName))
                throw new Error('mod does not exist: ' + modName);
            else {
                Controller.log(('💎 Gem Enabled: ' + modName).underline.green);
                this.mods[modName].enabled = true;
            }
        });
    }

    isModEnabled(modName) {
        if (!this.isModValid(modName)) return false;

        return this.mods[modName].enabled;
    }

    isModValid(modName) {
        return (
            this.mods[modName] !== undefined &&
            Object.values(this.mods[modName]).length !== 0
        );
    }
})();

module.exports = Gems;
