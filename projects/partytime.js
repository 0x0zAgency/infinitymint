/**
 * Think of this as a huge metadata object which is going to contain all sorts of information about
 * your NFT project as well as related configurations.
 */
const projectFile = {
    description: {
        name: '🥳time.eth', //Will appear in the Navbar and Footer
        token: 'Party🎉Pass', //the name of the token
        tokenSymbol: 'Party🎉Pass', //the name of the token
        tokenPlural: 'Party🎉Passes', //the plural name of the token
        authors: [
            //any authors
            
            {
                Name: '0x0z',
                role: 'The Magic of Web3',
                url: 'https://0x0z.xyz',
                twitter: '0x0zAgency',
            },
        ],
        //goes inside of the tokenURI
        tokenName: 'Party🎉Pass',
        tokenDescription: `Hello this is Party Time Party Pass!`,
    },
    //@ means will reference files inside of react build
    static: {
        logo: 'partytime/logo.png',
        background: 'bg_partytime.jpg',
        headerBackground: 'partytime_header.png',
        backgroundColour: 'black',
        stylesheets: ['styles/bootstrap.pulse.css', '@Resources/app.css'],
        images: {
            features: 'partytime_features.gif',
            loading: 'loading_partytime.gif',
            texture: 'partytime_texture.jpg',
            teamDefaultIcon: '@Images/person.png',
            noWeb3: '@Images/missingWeb3.png',
            loadingComponent: '@Images/loading_partytime.gif',
        },
    },
    deployment: {
        // DO NOT SET TO A LOWER VALUE THAN 4. MUST BE AN EVEN NUMBER!
        // IF YOU HAVE HUUUUGEE PATHS IN YOUR INFINITY MINT, YOU SHOULD UP THIS TO LIKE 32 OR 64 OR 128, CAN SAVE LOTS OF GAS WHEN GENERATING COLOURS. THERE IS NO MAX NUMBER.
        colourChunkSize: 128, //Saves gas when generating on chain colours. Will use colour compression algorithm to abstract colours instead of uniquely generating a colour for every one requested
        seedNumber: 420 * 69, //play with this until you find a selection you like, will yield same random results each time!
        startingPrice: 1, //must be a whole number, you can use the baseTokenValue below to make the tokenPrice below one, changing it to 0.1 will make the startingPrice 1/10th and 0.01 1/100th etc.
        stickerSplit: 20, //20% of the profits from stickers go to us
        baseTokenValue: 0.01 * 10 ** 18, //1.0 == normal price 0.1 1/10th etc
        randomessFactor: 0xabc, //lower number = less color variation higher number up to 0xFFFFFF more variation.
        nameCount: 4, //only effects random name gen, is a random number between 0 and 4 or 1 and 4 depending on if the below key is set to true
        mustGenerateName: true, //a name must be picked, only effects random name gen
        //preview usage is about 75% of the mint price and then 90% of the final total
        //4 previews with no assets = Gas used: 1083051
        previewCount: 4, //be careful that high numbers can cause high gas fees and possible revert. 18 is like the last reasonable value
        maxSupply: 10000, //total supply of tokens
        //is ignore on ganache!
        maxTokensPerWallet: 16, //over time, transfers will take up a ton of gas for people who have many tokens, We can prevent that reality by capping the wallets to only own max 128.
        extraColours: 4, //dependant on your deployment you may need extra colours! here is how you have extra colours.
        maxRandomNumber: 0xffffff, //keep this as it is
        incrementalMode: false,
        stopDuplicateMint: false, //will stop two pathIds from being the same, recommended in projects with a decent amount of paths
        matchedMode: false, //if true, will ignore names key and instead take names from the paths themselves, so like the whales mint.
        //helps favour lesser common mints and can assure that at least all path types are minted
        lowestRarity: false, //specially with path selection in a Rarity Contract, enabling this will choose the lowest rarity path out of the selected path for a mint.
        //helps make lesser common mints even more less common
        highestRarity: false, //specially with path selection in a Rarity Contract, enabling this will choose the highest rarity path out of the selected path for a mint.
        //will lead to a usual distribution of mints based on their rarity values
        randomRarity: true, //specially with path selection in a Rarity Contract, enabling will randomise the selection of paths that meet the rarity requirement
    },
    mods: {
        marketplace: true,
        redemption: true,
        flagsExtended: true,
        multimint: true,
        drinkclub: false,
    },
    modules: {
        controller: 'RaritySVG',
        random: 'UnsafeRandom',
        minter: 'DefaultMinter',
        royalty: 'SplitRoyalty',
    },
    royalties: {
        payouts: [
            
            {
                name: '0x0z.eth',
                address: '0xDFF917ab602e8508b6907dE1b038dd52B24A2379', //your ENS supported
                splits: {
                    mints: 100,
                    stickers: 100,
                },
            },
        ],
    },
    names: [
        'Fun',
        'Frens',
        'Dance',
        'Run',
        'Jump',
        'Wow',
        'Oh',
        'Hai',
        'Who',
        'Secret',
        'Quiet',
        'Sing',
        'Gusch',
        'Pretend',
        'Just',
        'Hilda',
        'Karl',
        'Kid',
        'Crazy',
        'Animal',
        'Ghost',
        'Josh',
        'x',
        'Ox',
        'Spirit',
        'Hips',
        'Toes',
        'Thanks',
        'Partner',
        'Sing',
        'Special',
        'Time',
        'Always',
        'Bye',
        'Much',
        'Loud',
        'Spicy',
        'Happy',
        'Sad',
        'Gay',
        'DIVA',
        'Bass',
        'Moist',
        'Meme',
        'Trap',
        'Lifted',
        'Super',
        'Mega',
        'Dumb',
        'Gangked',
        'Busted',
        'Weed',
        'Horny',
        'Radical',
        'DAO',
        'Hood',
        'Certified',
        'Erect',
        'Moore',
        'Ke',
        'Kek',
        'El',
        'Woke',
        'Sick',
        'System',
        'Acid',
        '8-Bit',
        '16-Bit',
        '64',
        'Darkness',
        'Fake',
        'VIP',
        'LUXE',
        'Floor',
        'Busy',
        'Mediocre',
        'p0xer',
        'Larp',
        'Wannabe'
    ],
    //Setting specific variables for each path Id
    paths: {
        //will be applied to all values
        default: {
            fileName: null,
            name: 'Unknown',
            addPathToName: true, //does not do it on chain
            uploadColours: false,
            padding: '2.5%', //this is padding applied to outside of the token, making a border. Set to zero to disble.
            innerPadding: '2.5%', //this is padding applied to inside of the token, higher values will make the second border more visible, set to zero to disable.
            //this will be copied to every path
            content: {
                background: 'backgrounds/stripes.png',
            },
            data: {
                memberData: {
                    showProfile: '',
                    confimedENS: '',
                    partyPlanner: '🥳time.eth',
                    //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                    activeParty: '🥳time.eth',
                    activePartyLink: 'https://magicmirror.one/🥳time.eth',
                    activePartyImage: 'partytime/logo.png',
                    activePartyDescription: 'Party Time',
                    activePartyLocation: '🌎',
                    activePartyPassword: '🔑',
                    activePartyPasswordProtected: false,
                    activePartyMaxCapacity: 420,
                    partyBounty: 0

                },
            },
            viewbox: '0 0 1024 1024', //sets the viewbox for all tokens, you can use the translate field in each path to scale/adjust preview to the box standard
            hideSecondBorder: false,
            hideStroke: false,
            rarity: 100, //must use RaritySVG
            text: {
                settings: {
                    wordPadding: 16,
                    spaceDecrease: 2,
                    fontSize: 16,
                    capitalizeName: true,
                },
                path: null, //can also be undefined
                inline: {
                    start: {
                        x: 15,
                        y: 15,
                    },
                    direction: 'horizontal',
                    break: true, //will break the new word onto a new line if we go outside of the viewbox
                },
                //for each word you can define an object holding x/y key of where to put this text
                custom: [
                    {
                        x: 15,
                        y: 15,
                        fontSize: 15, //can override values inside of settings
                    },
                    //will inline the rest at the last position if no more custom
                ],
            },
        },
        indexes: [
            {
                fileName: 'partytime/witchhat.svg',
                name: 'Witch Hat',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
                content: {
                    svg: 'partytime/witchhat.svg',
                    background: 'backgrounds/zigzag.png',
                },
            },
            {
                fileName: 'partytime/whale.svg',
                name: 'Whale',
                uploadColours: false,
                rarity: 12,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/whale.svg',
                    background: 'backgrounds/dots.png',
                }
            },
            {
                fileName: 'partytime/trumpet.svg',
                name: 'Trumpet',
                uploadColours: false,
                rarity: 14,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
                content: {
                    svg: 'partytime/trumpet.svg',
                    background: 'backgrounds/stripes.png',
                }
            },
            {
                fileName: 'partytime/sungod.svg',
                name: 'Sun God',
                uploadColours: false,
                rarity: 12,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/sungod.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/sun.svg',
                name: 'Sun Face',
                uploadColours: false,
                rarity: 12,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
                content: {
                    svg: 'partytime/sun.svg',
                    background: 'backgrounds/dots.png',
                }
            },
            {
                fileName: 'partytime/spacestation.svg',
                name: 'Space Station',
                uploadColours: false,
                rarity: 14,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/spacestation.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/sacred.svg',
                name: 'Sacred Geometry',
                uploadColours: false,
                rarity: 10,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
                content: {
                    svg: 'partytime/sacred.svg',
                    background: 'backgrounds/dots.png',
                }
            },
            {
                fileName: 'partytime/planet.svg',
                name: 'Planet',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/planet.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/partychan.svg',
                name: 'Chan',
                uploadColours: false,
                rarity: 10,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/partychan.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/orangeman.svg',
                name: 'Donald',
                uploadColours: false,
                rarity: 5,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/orangeman.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/obama.svg',
                name: 'Obama',
                uploadColours: false,
                rarity: 5,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/obama.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/mary.svg',
                name: 'Mary',
                uploadColours: false,
                rarity: 5,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/mary.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/kazoo.svg',
                name: 'Kazoo',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/kazoo.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/ethereum.svg',
                name: 'Ethereum',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/ethereum.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/deepstate.svg',
                name: 'Conspiracy',
                uploadColours: false,
                rarity: 5,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/deepstate.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/astronaut.svg',
                name: 'Astronaut',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/astronaut.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/balloons.svg',
                name: 'Balloon',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/balloons.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/bbq.svg',
                name: 'BBQ',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/bbq.svg',
                    background: 'backgrounds/stripes.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/bear.svg',
                name: 'Bear',
                uploadColours: true,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/bear.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/bull.svg',
                name: 'Bull',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/bull.svg',
                    background: 'backgrounds/stripes.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/beer.svg',
                name: 'Beer',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/beer.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/bellydance.svg',
                name: 'Bellydancer',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/bellydance.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/disco.svg',
                name: 'Disco',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/disco.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/drugs.svg',
                name: 'Drugs',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/drugs.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/fastfood.svg',
                name: 'Fast Food',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/fastfood.svg',
                    background: 'backgrounds/stripes.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/frog.svg',
                name: 'Frog',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/frog.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/police.svg',
                name: 'Police',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/police.svg',
                    background: 'backgrounds/stripes.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/segway.svg',
                name: 'Segway',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/segway.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/unicorn.svg',
                name: 'Unicorn',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/unicorn.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/adhd.svg',
                name: 'Infinity ADHD',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/adhd.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/arcade.svg',
                name: 'Arcade',
                uploadColours: false,
                rarity: 5,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/arcade.svg',
                    background: 'backgrounds/zigzag.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            },
            {
                fileName: 'partytime/camera.svg',
                name: 'Camera',
                uploadColours: false,
                rarity: 15,
                viewbox: '0 0 1024 1024',
                translate: {
                    x: '0%',
                    y: '0%',
                },
                content: {
                    svg: 'partytime/camera.svg',
                    background: 'backgrounds/dots.png',
                },
                data: {
                    memberData: {
                        showProfile: '',
                        confimedENS: '',
                        partyPlanner: '🥳time.eth',
                        //Maps to data from confimedENS if available. However, this token profile will overide the default display from the ENS and it can be used to update the users ENS profile with Magic🪞
                        activeParty: '🥳time.eth',
                        activePartyLink: 'https://magicmirror.one/🥳time.eth',
                        activePartyImage: 'partytime/logo.png',
                        activePartyDescription: 'Party Time',
                        activePartyLocation: '🌎',
                        activePartyPassword: '🔑',
                        activePartyPasswordProtected: false,
                        activePartyMaxCapacity: 420,
                        partyBounty: 0

                    },
                },
            }
        ],
    },
    approved: ['0xDFF917ab602e8508b6907dE1b038dd52B24A2379'], //list of approved addresses that can free mint / implicit mint
};

module.exports = projectFile;
