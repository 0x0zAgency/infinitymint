const project = {
    description: {
        name: 'HouseHemp - LivingNFT Minter',
        token: '🌱',
        tokenPlural: '🌱',
        tokenSymbol: '🌱',
        authors: [
            {
                name: '0x0z.eth',
                ens: '0x0z.eth',
                twitter: 'https://twitter.com/househempshop',
                avatar: 'https://pbs.twimg.com/profile_images/1709669055316021248/jI6CKtkH_400x400.jpg',
            },
            
        ],
    },
    static: {
        background: 'background.png',
        headerBackground: 'HH-LOGO-XL.png',
        defaultImage: '@Images/sad_panda.jpg',
        backgroundColour: '#FFFFFF',
        menuColour: '#993399',
        stylesheets: ['styles/bootstrap.zephyr.css'],
        images: {
            features: '@Images/features.jpeg',
            loading: '@Images/loading.gif',
            texture: '@Images/texture.jpg',
            teamDefaultIcon: '@Images/person.png',
            noWeb3: '@Images/missingWeb3.png',
            loadingComponent: '@Images/loading.gif',
        },
    },
    deployment: {
        colourChunkSize: 69,
        seedNumber: 69420,
        startingPrice: 10,
        stickerSplit: 20,
        baseTokenValue: 1000000000000000,
        randomessFactor: 42069,
        nameCount: 1,
        mustGenerateName: true,
        previewCount: 0,
        maxSupply: 42069,
        extraColours: 6,
        maxRandomNumber: 16777215,
        incrementalMode: true,
        stopDuplicateMint: false,
        matchedMode: true,
        lowestRarity: false,
        highestRarity: false,
        randomRarity: true,
    },
    paths: {
        default: {
            fileName: null,
            name: 'Unknown',
            padding: '0%',
            rarity: 100,
            innerPadding: '0%',
            data: {
                //InfinityLinks
                ezaf: {
                    //eZAF Data
                },
                eGPS: {
                    //eGPS Data
                    eGPS_locationData: '',
                    eGPS_eventMap: '',
                    eGPS_eventKey: '',
                },
            },
        },
        indexes: [
            {
                fileName: 'HH-TOKENURI.png',
                name: 'Living NFT',
                viewbox: '0 0 420 420',
                rarity: 100,
                data: {
                    househemp: {
                        plantID: '',
                        plantName: '',
                        plantType: '',
                        plantStage: '',
                        plantAge: '',
                        plantHeight: '',
                        plantWeight: '',
                        plantHealth: '',
                        plantNutrients: '',
                        plantParent: '',
                    },
                },
            },
        ],
    },
    mods: {
        marketplace: true,
        redemption: true,
        multimint: true,
        flagsExtended: true,
    },
    
    assets: {},
    assetConfig: {},
    modules: {
        controller: 'SimpleImage',
        minter: 'DefaultMinter',
        random: 'UnsafeRandom',
        royalty: 'DefaultRoyalty',
    },
};
//do not delete this line
module.exports = project;
