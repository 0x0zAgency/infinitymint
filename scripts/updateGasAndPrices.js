const { run, ethers, deployments } = require('hardhat'); //loads the configuration filek
const Controller = require('../src/Controller');

//a method for each argument passed to the script,
const methods = {
    //writes force_network which hardhat then reads and forces the network to that value, useful when
    //running many node scripts at once and you need hardhat to rememeber the network
    network: (value) => {
        Controller.log('> Writing ./.force_network to value: ' + value);
        Controller.getFileSystem().writeFileSync('./.force_network', value);
    },
};

async function main() {
    //get gas prices
    try {
        let gasPrices = {};
        let tokenPrices = {};
        let keys = Object.keys(Controller.deployConfig.networks);
        let interval;

        if (Controller.getFileSystem().existsSync('./.gas_prices'))
            gasPrices = Controller.readInformation('./.gas_prices', true);

        if (Controller.getFileSystem().existsSync('./.token_prices'))
            tokenPrices = Controller.readInformation('./.token_prices', true);

        for (var i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = Controller.deployConfig.networks[key];

            try {
                if (
                    gasPrices.refreshes === undefined ||
                    Date.now() > gasPrices.refreshes
                ) {
                    clearInterval(interval);
                    if (
                        value.useGasStation &&
                        value.gasStation !== undefined &&
                        value.gasStation !== null
                    ) {
                        Controller.log(
                            '- fetching gas prices for ' +
                                key +
                                ' from ' +
                                value.gasStation
                        );

                        gasPrices[key] = await Controller.fetch(
                            value.gasStation
                        );

                        if (gasPrices[key].success === false)
                            throw new Error('could not get gas price');

                        if (
                            Controller.deployConfig.networks[key].onFetchGas !==
                                undefined &&
                            typeof Controller.deployConfig.networks[key]
                                .onFetchGas == 'function'
                        )
                            gasPrices[key] = Controller.deployConfig.networks[
                                key
                            ].onFetchGas.bind(this, gasPrices[key])();
                    } else {
                        gasPrices[key] =
                            Controller.deployConfig.networks[key].gasPrice /
                                1e9 || 3;
                    }

                    console.log(`gas prices for ${key}:`.blue);
                    console.log(
                        '\t' +
                            (gasPrices[key]?.fast?.maxFee ||
                                gasPrices[key]?.result?.SafeGasPrice ||
                                gasPrices[key]) +
                            'gwei'
                    );
                    Controller.log(' ☻ Success'.green);
                } else {
                    console.log('- gas prices up to date');
                }
            } catch (error) {
                console.log('failed to get proper gas prices');
                gasPrices[key] = {
                    valid: false,
                    status: '0',
                };
            }

            try {
                if (
                    tokenPrices.refreshes === undefined ||
                    Date.now() > tokenPrices.refreshes
                ) {
                    if (value.priceStation !== undefined) {
                        tokenPrices[key] = await Controller.fetch(
                            value.priceStation
                        );
                    } else {
                        tokenPrices[key] = {
                            price:
                                Controller.deployConfig.networks[key]
                                    ?.tokenPrice || 1,
                        };
                        tokenPrices[key].usd = tokenPrices[key].price;
                        tokenPrices[key].gbp = tokenPrices[key].price;
                    }

                    if (
                        value.priceStation !== undefined &&
                        Controller.deployConfig.networks[key].onGetPrice !==
                            undefined &&
                        typeof Controller.deployConfig.networks[key]
                            .onGetPrice == 'function'
                    ) {
                        tokenPrices[key] = Controller.deployConfig.networks[
                            key
                        ].onGetPrice.bind(this, tokenPrices[key])();
                    }
                    console.log(`price in usd for ${key}:`.blue);
                    console.log('\t $' + (tokenPrices[key]?.usd || '-1'));
                    Controller.log(' ☻ Success'.green);
                } else {
                    console.log('- token prices up to date');
                }
            } catch (error) {
                console.log('failed to get token gas prices');
                tokenPrices[key] = {
                    price: -1,
                };
            }
        }
        gasPrices.updated = Date.now();
        gasPrices.refreshes =
            Date.now() + Controller.deployConfig.gasPriceInterval * 1000;
        tokenPrices.updated = Date.now();
        tokenPrices.refreshes =
            Date.now() + Controller.deployConfig.tokenPriceInterval * 1000;

        Controller.log('- writing ./.gas_prices'.dim);
        Controller.writeInformation(gasPrices, './.gas_prices');

        Controller.log('- writing ./.token_prices'.dim);
        Controller.writeInformation(tokenPrices, './.token_prices');
    } catch (error) {
        Controller.log(
            ('WARNING: Failed to get gas prices: ' + (error.message || error))
                .red
        );
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
