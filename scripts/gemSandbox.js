const {
    run,
    ethers,
    deployments,
    getNamedAccounts,
    getChainId,
} = require('hardhat');
const Controller = require('../src/Controller');
const Gems = require('../src/Gems');

async function executeScript(path, script, parameters) {
    let { mod } = parameters;

    let result = await require(path + script);
    result = result.default || result;

    if (result.executeAnywhere !== true && !Gems.isModEnabled(mod))
        throw new Error(
            'Gem is not enabled in project file ' +
                Controller.deployConfig.project +
                ', make gem script executeAnywhere to remove this error.'
        );

    if (result.requireDeployment && !parameters.hasDeployment)
        throw new Error('requries deployment');

    let check = Controller.verifyExecutionContext();
    if (result.verifyContext && check !== true)
        throw new Error(
            'please change current project to ' +
                check +
                ' or redeploy as ' +
                Controller.deployConfig.project
        );

    await result(parameters);
    process.exit(0);
}

async function main() {
    await Gems.loadMods();

    let mod;
    if (process.argv[2] === undefined) throw new Error('mod undefined');

    mod = process.argv[2];

    console.log(process.argv);
    console.log(mod);

    let path = './mods/' + mod + '/';
    if (!Controller.getFileSystem().existsSync(path))
        throw new Error('bad mod: ' + path);

    if (!Controller.getFileSystem().existsSync(path + 'scripts/'))
        throw new Error('no scripts');

    let deployedProject = await Controller.getProjectFile(true);
    let undeployedProject = await Controller.getProjectFile(false);
    Gems.enableMods(undeployedProject.mods || []);

    let hasDeployment = false;
    let deployInfo = {};

    if (Controller.getFileSystem().existsSync('./deployments/')) {
        hasDeployment = true;
        deployInfo = Controller.readInformation(
            './deployments/' + Controller.defaultNetwork + '/.deployInfo',
            true
        );
    }

    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();

    if (process.argv[3] !== undefined) {
        await executeScript('../mods/' + mod + '/scripts/', process.argv[3], {
            mod,
            deployedProject,
            undeployedProject,
            hasDeployment,
            deployInfo,
            scriptArguments: process.argv.slice(3),
            deploy,
            log,
            get,
            deployer,
            chainId,
            ethers,
        });
    } else {
        throw new Error('no script given');
    }
}

main()
    .then(() => {})
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
