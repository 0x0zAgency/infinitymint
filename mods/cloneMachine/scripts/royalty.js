const { run, ethers, deployments, getChainId } = require('hardhat');
const Script = async (args, projectFile) => {};

Script.name = 'View System-Wide Royalties';
Script.description =
    'A tool to help figure out royalties which are spread across all the clones and then withdraw from them.';
Script.requireDeployment = true;
Script.verifyContext = true;
Script.parameters = {
    address: 'address', //any address is valid and it does not have to be deployer/approved
    includeParentMinter: true, //will include the parent minter in its search
    useExperimentalRoyaltyTypes: true, //will try and poke for potentially unknown royalty indexes.
};
module.exports = Script;
