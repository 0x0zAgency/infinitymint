//Created Mon Feb 27 2023 23:41:27 GMT+0000 (Greenwich Mean Time)
const project = {
    description: {
        name: 'test',
        token: 't',
        tokenPlural: 'Tests',
        tokenSymbol: 'T',
        authors: [],
    },
    static: {
        background: '@Images/default_background.jpg',
        headerBackground: '@Images/default_header.jpg',
        defaultImage: '@Images/sad_panda.jpg',
        backgroundColour: 'black',
        stylesheets: ['styles/bootstrap.darkly.css'],
        images: {
            features: '@Images/default_features.jpg',
            loading: '@Images/loading.gif',
            texture: '@Images/texture.jpg',
            teamDefaultIcon: '@Images/person.png',
            noWeb3: '@Images/missingWeb3.png',
            loadingComponent: '@Images/loading.gif',
        },
    },
    deployment: {
        colourChunkSize: 128,
        seedNumber: 26400780,
        startingPrice: 1,
        stickerSplit: 20,
        baseTokenValue: 10000000000000000,
        randomessFactor: 11259375,
        nameCount: 4,
        mustGenerateName: true,
        previewCount: 3,
        maxSupply: 100000000,
        extraColours: 6,
        maxRandomNumber: 16777215,
        incrementalMode: false,
        stopDuplicateMint: false,
        matchedMode: false,
        lowestRarity: false,
        highestRarity: false,
        randomRarity: true,
    },
    paths: {
        default: {
            fileName: null,
            name: 'Unknown',
            padding: '2.5%',
            rarity: 15,
            innerPadding: '5%',
        },
        indexes: [
            {
                fileName: 'partytime/kazoo.svg',
                name: 'Token',
                viewbox: '0 0 612 612',
                rarity: 15,
                translate: {
                    x: '8.5%',
                    y: '31.5%',
                },
            },
        ],
    },
    names: [],
    assets: {},
    assetConfig: {},
    modules: {
        controller: 'RaritySVG',
        minter: 'DefaultMinter',
        random: 'UnsafeRandom',
        royalty: 'DefaultRoyalty',
    },
};
//do not delete this line
module.exports = project;
