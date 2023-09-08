const Controller = require('./../src/Controller');
const colors = require('colors');

const deployment = {
    // DO NOT SET TO A LOWER VALUE THAN 4. MUST BE AN EVEN NUMBER!
    // IF YOU HAVE HUUUUGEE PATHS IN YOUR INFINITY MINT, YOU SHOULD UP THIS TO LIKE 32 OR 64 OR 128, CAN SAVE LOTS OF GAS WHEN GENERATING COLOURS
    colourChunkSize: 128, //Saves gas when generating on chain colours. Will use colour compression algorithm to abstract colours instead of uniquely generating a colour for every one requested
    seedNumber: 420 * 69 * 911, //play with this until you find a selection you like, will yield same random results each time!
    startingPrice: 1, //must be a whole number, you can use the baseTokenValue below to make the tokenPrice below one, changing it to 0.1 will make the startingPrice 1/10th and 0.01 1/100th etc.
    stickerSplit: 20, //20% of the profits from stickers go to us
    baseTokenValue: 0.01 * 10 ** 18, //1.0 == normal price 0.1 1/10th etc
    randomessFactor: 0xabcdef, //lower number = less color variation higher number up to 0xFFFFFF more variation.
    nameCount: 4, //only effects random name gen, is a random number between 0 and 4 or 1 and 4 depending on if the below key is set to true
    mustGenerateName: true, //a name must be picked, only effects random name gen
    previewCount: 3, //be careful that high numbers can cause high gas fees and possible revert
    maxSupply: 10000, //total supply of tokens
    //is ignore on ganache!
    extraColours: 6, //dependant on your deployment you may need extra colours! here is how you have extra colours.
    maxRandomNumber: 0xffffff, //keep this as it is
    incrementalMode: false,
    stopDuplicateMint: false, //will stop two pathIds from being the same, unrecommended in projects with a small path size as it will lead to unnessecary gas usage.
    matchedMode: false, //if true, will ignore names key and instead take names from the paths themselves, so like the whales mint.
    //helps favour lesser common mints and can assure that at least all path types are minted
    lowestRarity: false, //specially with path selection in a Rarity Contract, enabling this will choose the lowest rarity path out of the selected path for a mint.
    //helps make lesser common mints even more less common
    highestRarity: false, //specially with path selection in a Rarity Contract, enabling this will choose the highest rarity path out of the selected path for a mint.
    //will lead to a usual distribution of mints based on their rarity values
    randomRarity: true, //specially with path selection in a Rarity Contract, enabling will randomise the selection of paths that meet the rarity requirement
};

const isTrue = async (choice) => {
    let result = await Controller.newQuestion(`${choice} (y/n):`.green);
    result = result.toLowerCase().trim();

    if (result !== 'n' && result !== 'y') return await isTrue(choice);

    return result === 'y';
};

const getPrice = async (project) => {
    let shouldRun = true;
    let result;
    while (shouldRun) {
        result = await Controller.newQuestion(
            `\nPlease enter a token price (whole number):\n`.red.underline
        );

        if (isNaN(result)) continue;

        result = parseInt(result);
        console.log(
            (
                'Actual token price will be: ' +
                result * project.deployment.baseTokenValue +
                'wei or ' +
                (result * project.deployment.baseTokenValue) / 10 ** 18 +
                'eth/matic'
            ).magenta
        );
        console.log(`are you happy with this token price? y/n`.cyan);

        let answer = await Controller.newQuestion('y/n: '.cyan);
        if (answer.toLowerCase().trim() === 'y') shouldRun = false;
    }

    return result;
};

const AskFor = async (key) => {
    let shouldRun = true;
    let result;
    while (shouldRun) {
        result = await Controller.newQuestion(
            `\nPlease enter a ${key}:\n`.red.underline
        );

        if (result.length === 0) continue;

        console.log(
            `for `.magenta +
                `${key}`.red +
                ` you have put: `.magenta +
                `${result}\n\n` +
                `are you happy with this answer? y/n`.cyan
        );
        let answer = await Controller.newQuestion('y/n: '.cyan);

        if (answer.toLowerCase().trim() === 'y') shouldRun = false;
    }

    return result;
};

async function main() {
    if (!colors.enabled) colors.enable();

    console.log('Welcome to the Infinity Mint Project Creator!'.cyan);
    console.log(' - Please be patient as we guide you through the steps'.dim);

    let projectName = await AskFor('Project Name');
    projectName = projectName
        .trim()
        .replace(/ /g, '')
        .replace(/[^0-9a-zA-Z]+/g, '')
        .toLowerCase();

    if (
        Controller.getFileSystem().existsSync(
            './projects/' + projectName + '.js'
        )
    )
        throw new Error(
            'project with that name already exists: ' + projectName
        );

    let projectFile = {
        description: {},
    };

    projectFile.description.name = await AskFor('Collection Name');
    projectFile.description.token = await AskFor('Token Name');
    projectFile.description.tokenPlural = await AskFor(
        'Token Name Plural/Multiple: (Tokens, Whales, Tokens)'
    );
    projectFile.description.tokenSymbol = await AskFor('Token Symbol');
    projectFile.description.authors = [];

    if (await isTrue('add default static manifest?'))
        projectFile.static = {
            background: '@Images/default_background.jpg',
            headerBackground: '@Images/default_header.jpg',
            defaultImage: '@Images/sad_panda.jpg',
            backgroundColour: 'black',
            stylesheets: [
                'styles/bootstrap.darkly.css',

                '@Resources/darkTypography.css', //will make all text which is on the background directly black
            ],
            images: {
                features: '@Images/default_features.jpg',
                loading: '@Images/loading.gif',
                texture: '@Images/texture.jpg',
                teamDefaultIcon: '@Images/person.png',
                noWeb3: '@Images/missingWeb3.png',
                loadingComponent: '@Images/loading.gif',
            },
        };

    projectFile.deployment = { ...deployment };

    console.log(
        '\nNote: The base token value is multiplied by the token price to equal the mint cost in wei'
            .underline
    );
    console.log(
        'if you are unsure what to set here. Enter 0.01 and then your price will be set in the 10ths of a coin'
            .underline
    );
    let baseTokenValue =
        (await AskFor('Base Token Value (0.01, 0.001, 0.1, 1)')) * 10 ** 18;

    if (isNaN(baseTokenValue))
        throw new Error('number not entered for base token value');

    let maxSupply = await AskFor('Max Token Supply (1-Infinity)');

    if (maxSupply.toLowerCase() === 'infinity') maxSupply = 100000000; //not quite but fair :)

    if (isNaN(maxSupply)) throw new Error('number not entered for max supply');

    projectFile.deployment.baseTokenValue = parseFloat(baseTokenValue);
    projectFile.deployment.maxSupply = parseInt(maxSupply);
    projectFile.deployment.startingPrice = await getPrice(projectFile);

    projectFile.paths = {
        default: {
            fileName: null,
            name: 'Unknown',
            padding: '2.5%',
            rarity: 15,
            innerPadding: '5%',
        },
        indexes: [],
    };

    if (await isTrue('add example path?'))
        projectFile.paths.indexes.push({
            fileName: 'partytime/kazoo.svg',
            name: 'Token',
            viewbox: '0 0 612 612',
            rarity: 15,
            translate: {
                x: '8.5%',
                y: '31.5%',
            },
        });

    projectFile.names = [];
    projectFile.assets = {};
    projectFile.assetConfig = {};

    projectFile.modules = {};
    projectFile.modules.controller = await AskFor(
        'Asset Controller Module (RaritySVG, RarityImage, SimpleToken)'
    );
    projectFile.modules.minter = await AskFor(
        'Minter Module (DefaultMinter, PregenMinter, SelectiveMinter)'
    );
    projectFile.modules.random = 'UnsafeRandom';
    projectFile.modules.royalty = await AskFor(
        'RoyaltyModule (DefaultRoyalty, SplitRoyalty)'
    );

    if (await isTrue('set implicit asset controller render script?'))
        projectFile.modules.renderScript = await AskFor(
            'Render Script (ImageAsset, Image, Vector)'
        );

    let file = `//Created ${new Date().toString()}
const project = ${JSON.stringify(projectFile, null, 4)}
//do not delete this line
module.exports = project;`;

    console.log('- Writing project file');
    Controller.getFileSystem().writeFileSync(
        './projects/' + projectName + '.js',
        file
    );

    console.log(' ☻ Success!'.green);
    console.log(
        (
            'Your infinity mint project file is located inside of ./projects/ and is called ' +
            projectName +
            '.js'
        ).green
    );
    console.log(
        'You can now go ahead and edit the hardhat.config.js project key to point to equal ' +
            projectName.cyan
    );
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
