const Controller = require('../../src/Controller');
const { splitSet, pickKeys, md5, fixColours } = require('../../src/helpers');

const setup = async ({ tempProjectFile, assetContract }) => {
    //select which set up script to go with
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');
};

module.exports = setup;
