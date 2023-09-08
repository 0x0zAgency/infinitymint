const Controller = require('../src/Controller');
const { run, ethers, deployments } = require('hardhat');
const bip39 = require('bip39');

async function main() {
    let mnemonic = process.env.GANACHE_MEMONIC;

    if (Controller.deployConfig.useFreshMnemonic) {
        mnemonic = bip39.generateMnemonic();
        Controller.getFileSystem().writeFileSync('./.mnemonic', mnemonic);
    } else if (Controller.getFileSystem().existsSync('./.mnemonic'))
        Controller.getFileSystem().unlinkSync('./.mnemonic');

    let keys = [];
    for (let i = 0; i < 10; i++) {
        keys.push(
            ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/` + i)
                .privateKey
        );
    }

    console.log(
        '\n> Obtaining private keys and writing to .keys in root\n'.cyan
    );
    console.log(keys);
    Controller.getFileSystem().writeFileSync(
        './.keys',
        JSON.stringify({ accounts: keys.slice(1), deployer: keys[0] }, null, 2)
    );

    console.log('\n> Starting Ganache with mnemonic ' + mnemonic + '\n'.green);
    await Controller.execute(
        'npx',
        'ganache',
        ['--mnemonic', `"${mnemonic}"`],
        false
    );
}
main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .then(() => {
        process.exit(0);
    });
