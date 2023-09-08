const { expect, use, assert } = require('chai');
const helpers = require('./../../../src/helpers');

const test = async ({
    get,
    ethers,
    activeDeployments,
    instances,
    abis,
    accounts,
}) => {
    it('Should have ran this test', () => {
        assert.strictEqual(true, true);
    });
};

module.exports = test;
