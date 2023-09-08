const { run, ethers, deployments, getChainId } = require('hardhat');
const Script = async (args, projectFile) => {};

Script.name = 'Mint A Clone NFT';
Script.description = 'Mints an NFT from a specified clone.';
Script.requireDeployment = true;
Script.verifyContext = true;
Script.parameters = {
    cloneIndex: 0,
    receiver: 'address', //special key that will use address index 0 of the loaded mnemonic unless specific
};
module.exports = Script;
