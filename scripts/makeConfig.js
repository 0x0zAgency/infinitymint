const fs = require('fs');
const colors = require('colors');

if (!colors.enabled) colors.enable();

console.log('\n > Checking if hardhat.config.js & .env exists...'.blue);

//check for config
if (!fs.existsSync('./hardhat.config.js')) {
    console.log(
        '! No example hardhat file, copying example.hardhat.config.js'.red
    );
    fs.copyFileSync('./example.hardhat.config.js', './hardhat.config.js');
} else console.log(' ☻ Exists\n'.green);

console.log('\n > Checking if .env exists...'.blue);

//check .env
if (!fs.existsSync('./.env')) {
    console.log('! No .env file, copying .env.example'.red);
    fs.copyFileSync('./.env.example', './.env');
} else console.log(' ☻ Exists\n'.green);
