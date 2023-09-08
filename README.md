# InfinityMint Build Tools by 0x0zAgency

# Quickstart
## Requirements
- OS: Mac OSX, Windows (XP-11), Debian (5+), Ubuntu (14+)
- Node: v18.5.0+

**Links:**
- [InfinityMint GitHub](https://github.com/0x0zAgency/infinitymint) **You Are Here**
- [React-Maker GitHub](https://github.com/0x0zAgency/infinitymint-react-maker)

## Installation
1. Run `npm i`.
   - For _node-gyp_ issues: `npm install --build-from-source`.

## Setup
1. **.env File**: Rename '.env.example' to '.env'. Configure `IPFS_APIKEY`, `WALLET_MNEMONIC`, `ETHERSCAN_API_KEY`, etc. Keep this file secure.
2. **Imports Folder**: Copy a sample folder in `imports`, rename it, and populate with your files.
3. **Project File**: Use an example from `projects` or run `create_project`.

## Local Environment
1. Run `npm run ganache`.
   - `.mnemonic`: Mnemonic for Ganache wallet.
   - `.keys`: Private keys for deployed wallet.

## Token URI
1. Update `project_default_uri.json`.
2. In `InfinityMint.sol`, update URLs at lines 249 and 400.

## React App
1. Clone [React-Maker](https://github.com/0x0zAgency/infinitymint-react-maker).
2. Run `npm i`.
3. Link to InfinityMint via `settings.js`.
4. Deploy project using `deploy_project`.
5. Run `npm run start`.

## Live Demo
- [Live Testmet Deployment of 🥳time.eth](https://partytime.infinitymint.app/) - This demo dApp is provided as a case you can check out to understand how to work InfintyMint to your advantage. The test deployment is on Goerli🔵Base.

## Resources
- [Follow Us](https://x.com/0x0zAgency)
- [Join Console.xyz](https://app.console.xyz/c/0x0zagency)
- [Documentation](./DEFAULT_README.md)

Enjoy Infinity and welcome to Tokenized Commerce!

# Longstart

## 🗿 Requirements

-   Mac OSX (any version), Windows (XP, Vista, 7, 8, 10, 11), Debian (5+), Ubuntu (14+)

-   Node 18.5.0 or Higher

[https://github.com/0x0zAgency/infinitymint](https://github.com/0x0zAgency/infinitymint)

[https://github.com/0x0zAgency/infinitymint-react-maker](https://github.com/0x0zAgency/infinitymint-react-maker)

## 🗿 Installation

1. Quick install: `npm i`. 

   1.1. To prevent OS-specific build issues with _node-gyp_, run `npm install --build-from-source` in the root of the repository.


## 🗿 Getting Started

InfinityMint requires a few more steps before we get started let's set up some default files we need to make sure your project gets off on the right path.

1. `.env` - Rename the provided '.env.example' to '.env' and set up and change any variables that are key to you such as the `IPFS_APIKEY`, `WALLET_MNEMONIC`, `ETHERSCAN_API_KEY`, and if you want to maintain a fixed GANACHE session the `GANACHE_MEMONIC` with the `GANACHE_USE_ENV=true`. **It is critical that you do not share this file as it can contain the keys to your deploying wallet. Like any crypto wallet you should keep these keys safe!**

2. `Set-up your project's "imports" folder` - Navigate to `imports` folder and create a copy of any of the provided sample folders. Be sure to rename it to something related to your project so it is easier to keep track of later. We will be calling everything from the PWA(React) requirements, to the files that will be uploaded to the contracts or IPFS and much more. The fastest way to get started is simply to overwrite the base files with your own. **It is a critical step you obtain an API key for an IPFS service else you will be limited to 12kb asset sizes. Currently, We only support web3.storage right now and you can get an API key for free by going to https://web3.storage**.

3. `Set-up your project file` - There are two ways to do this. The fast way, simply copy and paste any of the provided examples in the `projects` folder. The other way would be to run invoke `create_project` from the InfinityMint Console.

4. `Start-up a local EVM with Ganache` - In a terminal from the root of the project run: `npm run ganache`. This will set up a local EVM and will save two files we will need to work with.
   
   4.1 `.mnemonic` - This file is located in the root of the project and will contain the Mnemonic for the wallet used by Ganache. All of the accounts on this wallet will be funded with 1000 ETH that you can use to build your project. **DON'T PANIC: IF YOU RUN OUT FUNDS YOU CAN CALL A NEW INSTANCE OF GANACHE BY INVOKING `newGanache.js` FROM THE `tools_and_scripts` MENU**

   4.2 `.keys` - These are the private keys for deployed wallet. You can import these private keys into any wallet that you use to transact on the EVM. We have broken out the `deployer` wallet and suggest this be the first account you import while you are in this phase of the development of your project.

5. `Set-up the default Token URI files` - Now lets set up the default Token URI's for your minters. If you are using the `mods:{redemption: true}` You will need to do this that contract as well. If you copied a provided example imports folder there should be a `project_default_uri.json` file. You will need to replace all of values, including adding valid URL's for the images. **We highly recommend using IPFS for any external files** Once your file is ready upload it to IPFS or anywhere you can get URL. 

   5.1 Navigate to `contracts/InfinityMint.sol` and update the URLs:

      - Line 249: `result = 'https://your.token.uri.default.json';`

      - Line 400: `setTokenURI(currentTokenId,'https://your.token.uri.default.json');`

   5.2 If you are using the Redemption 💎 you will need to navigate to `mods/redemption/contracts` and open `RedemptionLinker.sol`:

      - Line 71: `uri[redemptionTokenId] = 'https://proof.token.uri.default.json';`

6. `Set-up Infinitymint-React-Maker` - We are ready to fork then clone the React Web Application Starterkit repository specific to this release of InfinityMint found over at https://github.com/0x0zAgency/infinitymint-react-maker. **Follow the installation directions in that projects README. However for a quickstart, simply run `npm i` in the projects root from your CLI.

7. `Link your Infinitymint to your Infinitymint-React-Maker` - From your InfinityMint Console invoke `settings.js` from the `tools_and_scripts` menu. This tool will ask you to set the folder where the `Infinitymint-React-Maker` resides.

8. `Deploy Project` - Now that we have a place to put our project, let's deploy our project by invoking `deploy_project` from the InfinityMint Console. This process will deploy your projects smart contracts, upload all of your projects paths to IPFS, create a local copy of your deployment files at `deployments/*blockchain*`. Because you have Linked your InfinityMint to the Infinitymint-React-Maker this process will also copy the deployments to the target at `Infinitymint-React-Maker/src/deployments`

9. `Deploy React App` - With the project deployed now its time to get your React App server up and running. To do this, run `npm run start` from the `Infinitymint-React-Maker` project. This should open your default browser and run your Infinitymint at `https://localhost:3000`

10. Enjoy Infinity and welcome to Tokenized Commerce!

## 🗿 Resources

[Follow Us On X](https://x.com/0x0zAgency)
[Join our Console.xyz](https://app.console.xyz/c/0x0zagency)
[Official Documentation](./DEFAULT_README.md)