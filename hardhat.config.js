require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("solidity-docgen");

//deploy helper class
const Controller = require("./src/Controller");
const colors = require("colors");
const { uncompressColours } = require("./src/helpers");

//require env
require("dotenv").config({
	override: false, //will not override already established environment variables
});

/**
 * Manually forcing the project
 * ====================================================================================
 */
//NOTE: If an environment varible under the name InfinityMint_Project does not exist then use this
const projectName = Controller.getFileSystem().existsSync("./.project")
	? Controller.getFileSystem().readFileSync(".project", {
			encoding: "utf-8",
	  })
	: null;

/**
 * Manually forcing the network
 * ====================================================================================
 */
//uncomment the line below the physically set the network
//Controller.defaultNetwork = "polygon" //goerli, rinkeby, mumbai a few

/**
 * Deploy Configuration
 * ====================================================================================
 */
//Set what project to build and tune deployment
Controller.deployConfig = {
	/**
	 * Storage Management
	 * ====================================================================================
	 */
	// will first use IPFS content, if it fails will fallback onto local content.
	// change this to true before you build
	useLocalAndIPFSContent:
		process.env.ALWAYS_UPLOAD_TO_IPFS !== undefined
			? Controller.isEnvTrue("ALWAYS_UPLOAD_TO_IPFS")
			: false, //only appicable if copyProjectContent is true. Will copy paths/assets but also upload to ipfs (recommended).
	//this is only forced when not chain id 1337 (ganache) and will forcefully upload the InfinityMint projcet file to IPFS
	projectFileForcedProduction: true, //will ignore the below setting and forcefully upload your project file to IPFS and then set it on chain
	useCopiedProjectFile: true, //turn this to false when taking to production to put your project settings onto IPFS and chain
	// copyContent leads to possibly very big react build which could in theory could be slowe rthan an IPFS node
	copyContent:
		process.env.COPY_ALL_TO_REACT !== undefined
			? Controller.isEnvTrue("COPY_ALL_TO_REACT")
			: true, //will copy paths/assets into web component. You will need to recopy conent if you add new stuff, or rely on IPFS public node.

	/**
	 * Ganache
	 * ====================================================================================
	 */
	useFreshMnemonic: true,

	/**
	 * Storage Management Misc
	 * ====================================================================================
	 */
	projectPathStorageMaximum: 1, //assets up to 16kb can be stored safely inside of the deployed project file, negating the need for IPFS.
	assertOnGanache: false, //will throw things that are normally not thrown on ganache (like max size errors and such)
	assertProjectSize: 2, //its recommended that assertPathSize is something like 2kb (does not effect ganache unless assertOnGanache is true)
	maximumLiveProjectSize: 6, //anything below this will be stored on chain on anything but ganache, note that its basically 1m gas used to 1kb so be careful with this, its best to just upload to IPFS.
	maximumGanacheProjectSize: 16, //same as above except just for ganache, ganache will happily use 16kb worth of gas to store the project file on chain, negating the need for IPFS.
	ignoreSetProjectReceipt: true, //only effects ganache, will ommit the set project receipt from the ganache receipts and final gas usage total to give a more accurate gas usage total.

	/**
	 * IPFS
	 * ====================================================================================
	 */
	ipfs: {
		//
		publicGateway: "https://dweb.link/ipfs/",
		//PLEASE READ: the apiKey field is a https://web3.storage key! Register an account over there and then paste the key in here!
		//you can get very far with InfinityMint with out IPFS, but you should get a key for your production verison!
		//set this inside of the .env file in the root of this repository
		apiKey: process.env.IPFS_APIKEY,
	},

	/**
	 * ERC721 Linker Settings
	 * ====================================================================================
	 */
	assertWalletAndStickerIndex: true, //will asset index 0 in the project files links are equal to wallet, index 1 is equal to stickers

	/**
	 * WEB COMPONENT SETTINGS
	 * ====================================================================================
	 */
	maxLoadSize: 256, //react specific setting: assets/paths which are above this size will only be downloaded once the user views this token
	maxStorageSize: 64, //react specific setting: assets/paths which are above this size will not be saved in the clients local storage.

	/**
	 * MISC SETTINGS
	 * ====================================================================================
	 */
	//dont mess with this
	project:
		projectName !== null && projectName !== undefined
			? projectName
			: process.env.INFINITYMINT_PROJECT !== undefined &&
			  process.env.INFINITYMINT_PROJECT.length !== 0
			? process.env.INFINITYMINT_PROJECT
			: "partytime",
	//references file inside of objects folder (do not put .js) will not run if --project flag is set
	flushArtifacts: true,
	//these styles will be kept in the Styles/ folder in react side no matter what
	permanentStyles: [
		"audiocover.css",
		"app.css",
		"darkTypography.css",
		"styles.js",
	],
	clearBuildFolder: true,
	gasPriceInterval: 60 * 2, //will get prices every 2 mins
	tokenPriceInterval: 60 * 60, //will update token prices every hour
	clearStaticManifest: false,
	clearPreviousContent: false,
	clearBootstrapStyles: true,
	//this stuff you don't really have to mess with, but they are the size of chunks of content when pushing new content directly to the contract
	nameChunkSize: 10, //will group data together into groups of this number, used when uploading assets/paths/names any big data to the contract
	pathChunkSize: 50, //same as above
	assetChunkSize: 50, //same as above
	usingOldColours: false,
	sectionChunkSize: 25, //same as above
	//for the mint all script
	skipWalletSetApproved: false,
	mintAllRangeSize: 10, //the range size of mintAll token results for example: 10 = 1-10 or 100 = 1-100
	mintAllSaveMod: 10, //save every 10th mintAll

	/**
	 * Links are deployable contracts ontop of the token which can be deployed in the react UI,
	 * by default wallet + EADS Stickers are enabled links allowing tokens to participate in Ethereum Ad Service,
	 * you can add other things here and specify things like interfaceId and versionType to make sure end user
	 * links correct contract. UI manages it all though so unless you are trying to break it makes sure
	 * it deploys the correct contract.
	 * ====================================================================================
	 */
	addDefaultLinks: true, //will add the links to every project
	defaultLinks: [
		// link index 0
		{
			key: "wallet", //this is what we reference the link by
			title: "Wallet Expansion (ERC721♾️Wallet)",
			versionType: "wallet",
			contract: "InfinityMintWallet",
			deployable: true,
			description:
				"Allows the token to act like a wallet, it will be able to hold ERC721 tokens as well as ERC20 tokens. This is where the magic begins.",
			deployFakeContract: true, //only on ganache
			useDefaultLinker: true,
			verifyIntegrity: true,
			onlyForced: false, //can only be set via another contract other than the linker
			canMint: false, //cant just mint in the wild
			args: [
				//used to deploy fake contract
				//0 = type
				//1 = default value
				//2 = id
				["uint256", "4294967295", "tokenId"],
				[
					"address",
					"0x0000000000000000000000000000000000000000",
					"erc721Destination",
				],
			],
		},
		// link index 1 (can also reference by index)
		{
			key: "stickers",
			title: "EADS Sticker Controller",
			versionType: "EADStickers",
			contract: "EADStickers",
			deployable: true,
			onlyForced: false, //can only be set via another contract other than the linker
			description:
				"Allows your token access to the Ethereum Ad Network, a decentralized monetization platoform that supports advertising and sponsorship models. One of the products are called the EADS Stickers which enables virtual stickers to be placed onto your tokenURI for a price that you set.",
			deployFakeContract: true,
			useDefaultLinker: true,
			//Uncomment the line below to disable onChain integrity check for this link (unrecommended)
			//instead: set onlyForced to true and marshal the approval for this link in a Gem contract
			//dontVerifyIntegrity: true,
			erc721: true, //can mint
			canMint: false, //cant just mint in the wild
			//will require all items in the list to be linked before this can be linked
			requirements: ["wallet"],
			/**
			 *
			 * More on args:
			 *
			 * arg 0 = type
			 * arg 1 = default value
			 * arg 2 = magic name
			 *
			 * possible magic names:
			 *
			 * owner - refers to the current address and will use the value of the current account 0
			 * erc721Destination - refers to the destination/address of the infinity mint erc721 contract
			 * wallet - refers to the link destination of the wallet
			 * valuesDestination - refers to the destination/address of the InfinityMint values contract
			 */
			args: [
				["uint256", "4294967295", "tokenId"],
				[
					"address",
					"0x0000000000000000000000000000000000000000",
					"erc721Destination",
				],
				[
					"address",
					"0x0000000000000000000000000000000000000000",
					"wallet",
				], //third arg references a value which react might be able to replace with real information, in the case of
				//this its going to try and find a link with that key name
				[
					"address",
					"0x0000000000000000000000000000000000000000",
					"valuesDestination",
				],
			],
		},
	],

	/**
	 * ABI Helpers
	 * ====================================================================================
	 */
	abiHelpers: {
		events: {
			InfinityMint: {
				Mint: "TokenMinted",
				Preview: "TokenPreviewMinted",
				PreviewComplete: "TokenPreviewComplete",
				Transfer: "Transfer",
			},
		},
		encoding: {
			encoder: (result, ethers, tinysvg, deployedProject, project) => {
				let findAsset = (id) => {
					if (parseInt(id) <= 0)
						return {
							name: "Skipped",
							rarity: 0,
						};

					let values = Object.values(deployedProject.assets || {});
					for (let i = 0; i < values.length; i++) {
						if (
							parseInt(values[i]?.paths?.assetId) === parseInt(id)
						)
							return values[i];
					}

					return {
						name: "Unknown",
						rarity: 0,
					};
				};

				return {
					...result,
					mintdata: JSON.parse(
						ethers.utils.toUtf8String(result.mintData)
					),
					names: [...result.names],
					assets: result.assets.map((val, index) => {
						let asset = findAsset(val.toString());
						return {
							section:
								asset.sectionKey ||
								`${
									Object.keys(project.assets)[index] || index
								}`,
							name: asset.name || "Unknown",
							rarity: asset.rarity,
						};
					}),
					colours_uncompressed: [
						...ethers.utils.defaultAbiCoder
							.decode(["uint32[]"], result.colours)
							.map((val) =>
								uncompressColours([...val]).map((val) =>
									tinysvg.toHexFromDecimal(val)
								)
							)[0],
					],
					colours: [
						...ethers.utils.defaultAbiCoder.decode(
							["uint32[]"],
							result.colours
						)[0],
					],
				};
			},
			types: [
				{ type: "uint64", name: "pathId" },
				{ type: "uint64", name: "pathSize" },
				{ type: "uint64", name: "currentTokenId" },
				{ type: "address", name: "owner" },
				{ type: "bytes", name: "colours" },
				{ type: "bytes", name: "mintData" },
				{ type: "uint64[]", name: "assets" },
				{ type: "string[]", name: "names" },
				{ type: "address[]", name: "destinations" },
			],
		},
	},

	/**
	 * NETWORKS
	 * ====================================================================================
	 */
	//Add extra networks here along with their gas station
	//NOTE: What does this do and mean?
	forceGasStation: true, //overrules useGasStation - ignore gas price and use gasStation fetched price
	networks: {
		ethereum: {
			timeout: 1000 * 60 * 10, // time out for transctions
			useGasStation: true, //if to use the gas station
			confirmations: 3, //wait for 3 confrmations on deployed contracts
			gasStation:
				"https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YZRHB3P4MXVSJ9S96F34UUR9DVV4QFZ2MC", //gas station location
			showGas: true, //show us how much gas is before we do anything
			gasValue: 1e9, //the number of digits in a gwei
			priceStation:
				"https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YZRHB3P4MXVSJ9S96F34UUR9DVV4QFZ2MC",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return { ...tokenPrice.result, usd: tokenPrice.result.ethusd };
			},
			onGetGas: (gasPrices, thisObject) => {
				//called when the fetched data from gasStation is ready, must return a number to use as the gas price
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				); //Make sure it comes back as a integer :)
			},
		},
		ropsten: {
			timeout: 1000 * 60 * 10,
			useGasStation: true, //test with eth prices
			confirmations: 3,
			gasStation:
				"https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",
			showGas: true,
			gasValue: 1e9,
			priceStation:
				"https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return { ...tokenPrice.result, usd: tokenPrice.result.ethusd };
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		goerli: {
			timeout: 1000 * 60 * 10,
			useGasStation: true, //set to true to test with eth prices
			confirmations: 2,
			gasPrice: 3 * 1e9, //3 gwei
			gasStation:
				"https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",
			showGas: true,
			gasValue: 1e9,
			priceStation:
				"https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return { ...tokenPrice.result, usd: tokenPrice.result.ethusd };
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		sepolia: {
			timeout: 1000 * 60 * 10,
			useGasStation: true, //set to true to test with eth prices
			confirmations: 2,
			gasPrice: 3 * 1e9, //3 gwei
			gasStation:
				"https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",
			showGas: true,
			gasValue: 1e9,
			priceStation:
				"https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return { ...tokenPrice.result, usd: tokenPrice.result.ethusd };
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		ganache: {
			timeout: 1000 * 60 * 10,
			useGasStation: true, //test with eth prices
			confirmations: 0,
			///** add a // to the start of this line to use ethereum estimation prices
			gasStation:
				"https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",
			priceStation:
				"https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YGDRBT7Q8AAZWMKZ95BQQW9WYQF27T65BH",

			//*/ // to the start of this line to use ethereum estimation prices
			/** // to the start of this line to use polygon estimation prices
			gasStation:
				"https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=6HKBXX8N9W89PMNNAZGDP82QSCA4IPKZJ3",
			priceStation: "https://api.polygonscan.com/api?module=stats&action=maticprice&apikey=6HKBXX8N9W89PMNNAZGDP82QSCA4IPKZJ3",
			*/ // to the start of this line to use polygon estimation prices
			showGas: false,
			gasValue: 1e9,
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return {
					...tokenPrice.result,
					usd:
						tokenPrice.result?.ethusd ||
						tokenPrice.result?.maticusd,
				};
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		mumbai: {
			timeout: 1000 * 60 * 10,
			gasPrice: 17000000000, //when gas station not used
			useGasStation: true,
			showGas: true,
			confirmations: 5,
			gasStation:
				"https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=6HKBXX8N9W89PMNNAZGDP82QSCA4IPKZJ3",
			priceStation:
				"https://api.polygonscan.com/api?module=stats&action=maticprice&apikey=6HKBXX8N9W89PMNNAZGDP82QSCA4IPKZJ3",
			showGas: false,
			gasValue: 1e9,
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return {
					...tokenPrice.result,
					usd: tokenPrice.result.maticusd,
				};
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		polygon: {
			timeout: 1000 * 60 * 10,
			gasPrice: 350000000000,
			confirmations: 5,
			useGasStation: true,
			gasStation:
				"https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=6HKBXX8N9W89PMNNAZGDP82QSCA4IPKZJ3",
			showGas: false,
			gasValue: 1e9,
			priceStation:
				"https://api.polygonscan.com/api?module=stats&action=maticprice&apikey=6HKBXX8N9W89PMNNAZGDP82QSCA4IPKZJ3",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return {
					...tokenPrice.result,
					usd: tokenPrice.result.maticusd,
				};
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		polygonzkevm: {
			timeout: 1000 * 60 * 10,
			gasPrice: 350000000000,
			confirmations: 5,
			useGasStation: true,
			gasStation:
				"https://api-zkevm.polygonscan.com/api?module=proxy&action=eth_gasPrice&apikey=MA8GXT4R2XBMXFW48ZDD6QI7CGBMTY3FU8",
			showGas: false,
			gasValue: 1e9,
			priceStation:
				"https://api-zkevm.polygonscan.com/api?module=stats&action=ethprice&apikey=MA8GXT4R2XBMXFW48ZDD6QI7CGBMTY3FU8",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return {
					...tokenPrice.result,
					usd: tokenPrice.result.maticusd,
				};
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		polygonzkevmtestnet: {
			timeout: 1000 * 60 * 10,
			gasPrice: 350000000000,
			confirmations: 5,
			useGasStation: true,
			gasStation:
				"https://api-testnet-zkevm.polygonscan.com/api?module=proxy&action=eth_gasPrice&apikey=MA8GXT4R2XBMXFW48ZDD6QI7CGBMTY3FU8",
			showGas: false,
			gasValue: 1e9,
			priceStation:
				"https://api-testnet-zkevm.polygonscan.com/api?module=stats&action=ethprice&apikey=MA8GXT4R2XBMXFW48ZDD6QI7CGBMTY3FU8",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return {
					...tokenPrice.result,
					usd: tokenPrice.result.maticusd,
				};
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		base: {
			timeout: 1000 * 60 * 10,
			useGasStation: true, //set to true to test with eth prices
			confirmations: 2,
			gasPrice: 3 * 1e9, //3 gwei
			gasStation:
				"https://api.basescan.org/api?module=gastracker&action=gasoracle&apikey=4JGA6P1JEYE9SXMW8P6TZYJ7CJ6U3SYXHE",
			showGas: true,
			gasValue: 1e9,
			priceStation:
				"https://api.basescan.org/api?module=stats&action=ethprice&apikey=4JGA6P1JEYE9SXMW8P6TZYJ7CJ6U3SYXHE",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return { ...tokenPrice.result, usd: tokenPrice.result.ethusd };
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		basegoerli: {
			timeout: 1000 * 60 * 10,
			useGasStation: true, //set to true to test with eth prices
			confirmations: 2,
			gasPrice: 3 * 1e9, //3 gwei
			gasStation:
				"https://api-goerli.basescan.org/api?module=gastracker&action=gasoracle&apikey=4JGA6P1JEYE9SXMW8P6TZYJ7CJ6U3SYXHE",
			showGas: true,
			gasValue: 1e9,
			priceStation:
				"https://api.basescan.org/api?module=stats&action=ethprice&apikey=4JGA6P1JEYE9SXMW8P6TZYJ7CJ6U3SYXHE",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return { ...tokenPrice.result, usd: tokenPrice.result.ethusd };
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
		basesepolia: {
			timeout: 1000 * 60 * 10,
			useGasStation: true, //set to true to test with eth prices
			confirmations: 2,
			gasPrice: 3 * 1e9, //3 gwei
			gasStation:
				"https://api-sepolia.basescan.org/api?module=gastracker&action=gasoracle&apikey=4JGA6P1JEYE9SXMW8P6TZYJ7CJ6U3SYXHE",
			showGas: true,
			gasValue: 1e9,
			priceStation:
				"https://api.basescan.org/api?module=stats&action=ethprice&apikey=4JGA6P1JEYE9SXMW8P6TZYJ7CJ6U3SYXHE",
			onGetPrice: (tokenPrice, thisObject) => {
				if (tokenPrice.status !== "1")
					return {
						price: 1000,
					};

				return { ...tokenPrice.result, usd: tokenPrice.result.ethusd };
			},
			onGetGas: (gasPrices, thisObject) => {
				if (gasPrices.status !== "1")
					return 6 * (thisObject.gasValue || 1e9);
				return (
					parseInt(gasPrices.result.SafeGasPrice) *
					(thisObject.gasValue || 1e9)
				);
			},
		},
	},
};

/**
 * END OF STUFF
 * ====================================================================================
 */
//Do not edit anything below this line else you might die.

//enable colours for all files
if (!colors.enabled) colors.enable();
//must call this before export
Controller.load();
//check if the objet URI is valid
Controller.getProjectFile()
	.then((result) => {
		console.log("valid object URI".green);
	})
	.catch((error) => {
		console.log("WARNING: object URI is invalid".white.bgRed);
	});

console.log("\n > Adding our networks to hardhats networks\n".blue);

//default networks
let networks = {
	hardhat: {}, //remove this and hardhat no like
	ethereum: {
		url: process.env.MAINNET_RPC_URL,
		accounts: {
			mnemonic:
				process.env.ETHEREUM_MNEMONIC || process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.ethereum,
		saveDeployments: true,
	},
	sepolia: {
		url: process.env.SEPOLIA_RPC_URL,
		accounts: {
			mnemonic:
				process.env.SEPOLIA_MNEMONIC ||
				process.env.ETHEREUM_MNEMONIC ||
				process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.sepolia,
		saveDeployments: true,
	},
	goerli: {
		url: process.env.GOERLI_RPC_URL,
		accounts: {
			mnemonic:
				process.env.GOERLI_MNEMONIC ||
				process.env.ETHEREUM_MNEMONIC ||
				process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.goerli,
		saveDeployments: true,
	},
	ropsten: {
		url: process.env.ROPSTEN_RPC_URL,
		accounts: {
			mnemonic:
				process.env.ROPSTEN_MNEMONIC ||
				process.env.ETHEREUM_MNEMONIC ||
				process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.ropsten,
		saveDeployments: true,
	},
	ganache: {
		url:
			(process.env.GANACHE_URL !== undefined &&
			process.env.GANACHE_URL !== null &&
			process.env.GANACHE_URL.trim().length !== 0
				? process.env.GANACHE_URL
				: "http://localhost") +
			":" +
			(process.env.GANACHE_PORT !== undefined &&
			process.env.GANACHE_PORT !== null &&
			process.env.GANACHE_PORT.trim().length !== 0
				? process.env.GANACHE_PORT
				: 8545),
		accounts: {
			mnemonic:
				Controller.isEnvTrue("GANACHE_USE_ENV") !== true &&
				Controller.getFileSystem().existsSync("./.mnemonic")
					? Controller.getFileSystem().readFileSync("./.mnemonic", {
							encoding: "utf-8",
					  })
					: process.env.GANACHE_MEMONIC, //dont change this! Use npm run startDevWin / npm riun startDev
		},
		...Controller.deployConfig.networks.ganache,
		saveDeployments: true,
	},
	mumbai: {
		url: process.env.MUMBAI_RPC_URL,
		accounts: {
			mnemonic:
				process.env.MUMBAI_MNEMONIC ||
				process.env.POLYGON_MNEMONIC ||
				process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.mumbai,
		saveDeployments: true,
	},
	polygon: {
		url: process.env.POLYGON_RPC_URL,
		accounts: {
			mnemonic:
				process.env.POLYGON_MNEMONIC || process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.polygon,
		saveDeployments: true,
	},
	polygonzkevm: {
		url: process.env.POLYGONZKEVM_RPC_URL,
		accounts: {
			mnemonic:
				process.env.POLYGON_MNEMONIC || process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.polygonzkevm,
		saveDeployments: true,
	},
	polygonzkevmtestnet: {
		url: process.env.POLYGONZKEVM_RPC_URL,
		accounts: {
			mnemonic:
				process.env.POLYGON_MNEMONIC || process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.polygonzkevmtestnet,
		saveDeployments: true,
	},
	base: {
		url: process.env.BASE_RPC_URL,
		accounts: {
			mnemonic:
				process.env.BASE_MNEMONIC || process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.base,
		saveDeployments: true,
	},
	basegoerli: {
		url: process.env.BASEGOERLI_RPC_URL,
		accounts: {
			mnemonic:
				process.env.BASE_MNEMONIC || process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.base,
		saveDeployments: true,
	},
	basesepolia: {
		url: process.env.BASESEPOLIA_RPC_URL,
		accounts: {
			mnemonic:
				process.env.BASE_MNEMONIC || process.env.WALLET_MNEMONIC,
		},
		...Controller.deployConfig.networks.base,
		saveDeployments: true,
	},
};

//add custom networks into it
Object.keys(Controller.deployConfig.networks)
	.filter((key) => networks[key] === undefined)
	.forEach((key) => {
		networks[key] = {
			...networks[key],
			accounts: {
				mnemonic:
					networks[key]?.accounts?.mnemonic ||
					process.env.WALLET_MNEMONIC,
			},
			...(Controller.deployConfig.networks[key] || {}),
		};
	});

//set it again
Controller.deployConfig.networks = networks;
console.log("Ready".green);

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	contractSizer: {
		alphaSort: false,
		disambiguatePaths: false,
		runOnCompile: true,
		strict: Controller.isEnvTrue("ASSERT_CONTRACT_SIZE"),
	},
	docgen: {
		output: "docs",
		pages: "files",
	},
	networks: networks,
	solidity: {
		version: process.env.SOLIDITY_VERSION,
		settings: {
			optimizer: {
				enabled: true,
				runs: parseInt(process.env.SOLIDITY_RUNS),
			},
		},
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
	defaultNetwork: Controller.defaultNetwork,
	namedAccounts: {
		deployer: {
			default:
				process.env.DEFAULT_ACCOUNT !== undefined
					? parseInt(process.env.DEFAULT_ACCOUNT)
					: 0,
		},
	},
};