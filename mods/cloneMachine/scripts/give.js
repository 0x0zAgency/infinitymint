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
    let abi = await ethers.getContractFactory('Mod_CloneMachineOracle');
    let accounts = await ethers.getSigners(); //accounts
    let oracleAddress = deployedProject.contracts['Mod_CloneMachineOracle'];
    let oracleContract = new ethers.Contract(
        oracleAddress,
        abi.interface,
        accounts[0]
    );
    let account = await Controller.newQuestion(
        'please enter receiver of clone: '
    );
    let cloneId = await Controller.newQuestion('please enter cloneId: ');
    cloneId = isNaN(cloneId) ? 0 : parseInt(cloneId);

    console.log(
        '- Transfering ownership of clone ' + cloneId + ' to ' + account
    );
    let tx = await oracleContract.transferPermissions(cloneId, account);
    Controller.logTx(await tx.wait());
    console.log('☻ Success ☻\n'.green);
    console.log(account + ' is owner of clone ' + cloneId);
};

Script.name = 'Transfer Ownership Of A Clone';
Script.description = 'Transfers all permissions of the clone to an address.';
Script.requireDeployment = true;
Script.verifyContext = true;
Script.parameters = {
    cloneIndex: 0,
    account: 0, //only used if the clone's permissions are not managed by the oracle, if not this must be set to the account that deployed the clone.
    owner: 'address', //special key that will use address index 1 of the loaded mnemonic unless specific
};
module.exports = Script;
