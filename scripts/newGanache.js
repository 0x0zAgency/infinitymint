const ganache = require('ganache');

const options = {};
const server = ganache.server(options);
const PORT = require('process').env.GANACHE_PORT || 8545;
server.listen(PORT, async (err) => {
    if (err) throw err;

    console.log(`ganache listening on port ${PORT}...`);
    const provider = server.provider;
    const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
    });
});
