const Controller = require('../src/Controller');
const colors = require('colors');
const Gems = require('../src/Gems');
const { run, ethers, deployments } = require('hardhat');

async function main() {
    await Gems.loadMods();

    let projectFile;

    if (Controller.getFileSystem().existsSync('./.temp_project'))
        projectFile = Controller.readInformation('./.temp_project', true);
    else projectFile = await Controller.getProjectFile(true);

    let modManifestLocation =
        Controller.settings.reactLocation +
        'src/Deployments/mods/modManifest.json';

    if (Controller.settings.version === 2)
        modManifestLocation =
            Controller.settings.reactLocation +
            'src/Resources/Mods/modManifest.json';

    if (
        projectFile.mods === undefined ||
        Object.values(projectFile.mods).length === 0
    ) {
        console.log('- no enabled gems to copy');
        return;
    }

    await Gems.enableMods(projectFile.mods);

    let mods = projectFile.mods;
    if (mods instanceof Array === false)
        mods = Object.keys(mods).filter((key) => mods[key] === true);

    if (mods.length === 0) {
        console.log('- No mods');
        return;
    }

    let modManifest = Controller.getFileSystem().existsSync(modManifestLocation)
        ? Controller.readInformation(modManifestLocation, true)
        : {};
    modManifest.files = modManifest.files || {};
    modManifest.updated = Date.now();

    let actualMods = {};

    mods.forEach((modName) =>
        Gems.isModEnabled(modName)
            ? (actualMods[modName] = { ...Gems.mods[modName] })
            : false
    );
    modManifest.mods = { ...modManifest.mods, ...actualMods };

    console.log('\n> Copying mod files\n'.blue);

    mods.forEach((modName) => {
        Controller.log('- copying files for ' + modName);
        modManifest.files[modName] = Gems.copyMod(modName);
    });

    Object.keys(modManifest.mods).forEach((modName) => {
        modManifest.mods[modName].enabled =
            modManifest.mods[modName].enabled || Gems.isModEnabled(modName);
    });

    Controller.log('- writing mod manifest');
    Controller.writeInformation(modManifest, modManifestLocation);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
