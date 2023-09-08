const axios = require('axios');
const { getContract } = require('../src/helpers');

async function main() {
    let erc721 = await getContract('InfinityMint');
    let tokenId = 0;
    if (process.argv[2] !== undefined) tokenId = process.argv[2];

    console.log(
        ('\n> Retrieving TokenURI for token #' + tokenId + '\n').magenta
    );

    let result = await erc721.tokenURI(tokenId);

    console.log('tokenURI:\n'.cyan + result);

    let fetchable =
        result.indexOf('http://') !== -1 || result.indexOf('https://') !== -1;

    if (fetchable) {
        let returnResult;

        returnResult = await axios.get(result);
        console.log('\nFetched:'.cyan);
        console.log(returnResult.data);
    }

    console.log('\n☻ Success ☻\n'.green);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
