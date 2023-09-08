const { run, ethers, deployments, getChainId } = require('hardhat');
const Controller = require('../../../src/Controller');
const Script = async ({
    args,
    deployedProject,
    undeployedProject,
    get,
    deploy,
    deployer,
}) => {
    let abis = {
        InfinityMint: await ethers.getContractFactory('InfinityMint'),
        Royalty: await ethers.getContractFactory(
            deployedProject.modules.royalty
        ),
    };
    let accounts = await ethers.getSigners(); //accounts

    let cloneId = await Controller.newQuestion('please enter cloneId: ');
    cloneId = isNaN(cloneId) ? 0 : parseInt(cloneId);
    let path =
        './temp/cloneMachine/' +
        Controller.deployConfig.project +
        '/' +
        cloneId +
        '/';
    if (!Controller.getFileSystem().existsSync(path))
        throw new Error('bad clone id path does not exist: ' + path);

    let deployInfo = Controller.readInformation(path + '.deployInfo', true);
    let infinityMint = new ethers.Contract(
        deployInfo.contracts['InfinityMint'],
        abis.InfinityMint.interface,
        accounts[0]
    );
    let royaltyController = new ethers.Contract(
        deployInfo.contracts[deployInfo.modules.royalty],
        abis.Royalty.interface,
        accounts[0]
    );

    console.log('- printing clone #' + cloneId + ' owners');
    let a = await infinityMint.deployer();
    let b = await royaltyController.deployer();
    console.log('InfinityMint: ' + a);
    console.log('Royalty: ' + b);
};

Script.name = 'Check Ownert';
Script.description = 'Prints who currently owns a clone.';
Script.requireDeployment = true;
Script.verifyContext = false;
Script.parameters = {
    cloneIndex: 0,
    account: 0, //only used if the clone's permissions are not managed by the oracle, if not this must be set to the account that deployed the clone.
    owner: 'address', //special key that will use address index 1 of the loaded mnemonic unless specific
};
module.exports = Script;
