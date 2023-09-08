const fs = require('fs');
const networks = require('../networks');
const util = require('util');
const { spawn } = require('child_process');
const os = require('os');
const readline = require('readline');
const colors = require('colors');
const axios = require('axios').default;
const { ethers } = require('ethers');
const { Blob } = require('buffer');
const tinySVG = require('tinysvg-js');
const crypto = require('crypto');
const { delay, md5, pickKeys, splitSet, fixColours } = require('./helpers');
const glob = require('glob');
const ipfsController = require('./ipfsController');

/**
 * Simple class to aid Hardhat and make infinity mint easier
 */
let rl;
let question;

const Controller = new (class {
    receipts = {};
    version = 'alpha-1.69.0';
    ipfsCache = {};
    allowedProjectStorageExtensions = [
        'tinysvg',
        'svg',
        'json',
        'txt',
        'html',
        'png', //can be stored in project file as they can be read as a base64 object
    ];
    defaultDeployment = {
        startingPrice: 1,
        baseTokenValue: 1 * 10 ** 18,
        maxSupply: 1900,
        randomnessFactor: 0xabcd,
        extraColours: 6,
        previewCount: 3,
        previewCount: 3,
        nameCount: 4,
        seedNumber: 70,
        maxRandomNumber: 0xffffff,
        previewTimeout: 1000 * 60 * 10, //10 mins
        matchedMode: false,
        randomMode: true,
        incrementalMode: false,
    };
    contractSettings = {
        SimpleSVG: {
            setupModule: 'infinitymint',
            defaultRenderScript: 'Vector',
            allowedPathExtensions: ['svg'],
            allowedAssetExtensions: ['svg'],
            allowedContentExtensions: [
                'svg',
                'png',
                'jpeg',
                'mp3',
                'jpg',
                'glb',
                'gltf',
                'fbx',
                'obj',
                'usdz',
                'wav',
                'mp4',
                'txt',
                'html',
                'css',
                'js',
                'json',
            ],
        },
        Audiocover: {
            setupModule: 'infinitymint',
            allowedPathExtensions: ['jpeg', 'jpg', 'png'],
            allowedAssetExtensions: ['mp3', 'wav', 'flac'],
            allowedContentExtensions: ['mp3', 'wav', 'flac'],
        },
        RaritySVG: 'SimpleSVG',
        SimpleToken: {
            setupModule: 'infinitymint',
        },
        SimpleImage: {
            setupModule: 'infinitymint',
            defaultRenderScript: 'MagicMirror',
            allowedFileExtensions: ['png', 'jpeg', 'jpg'],
            allowedAssetExtensions: ['png', 'jpeg', 'jpg'],
            allowedContentExtensions: [
                'png',
                'jpeg',
                'jpg',
                'glb',
                'mp3',
                'gltf',
                'fbx',
                'obj',
                'svg',
                'usdz',
                'wav',
                'mp4',
                'txt',
                'html',
                'css',
                'js',
                'json',
            ],
        },
        RarityImage: 'SimpleImage', //will goto SimpleImage key for values
        RarityToken: 'SimpleToken',
    };

    constructor() {
        //

        if (rl !== undefined)
            try {
                rl.close();
            } catch (error) {}

        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        question = util.promisify(rl.question).bind(rl);

        this.preivousDeployment = {
            valid: false,
        };

        this.deployConfig = {
            project: 'example',
            ipfs: {
                apiKey: null,
            },
        };

        this.settings = {
            firstTime: true,
            reactLocation: '',
            autoSetup: true,
        };

        //some default values
        this.environmentVariables = {
            RINKEBY_RPC_URL: null, //replace with anything other than null to take lead over env variable, get your own from http://infura.io
            WALLET_MNEMONIC: null, //for your wallet, from metamask/bave
            ETHERSCAN_API_KEY: null,
            SILENT_OUTPUT: false,
            SOLIDITY_VERSION: '0.8.10',
            SOLIDITY_RUNS: 200,
        };

        this.defaultNetwork = null;
    }

    getFileSystem() {
        return fs;
    }

    getGasPrice() {
        return (
            Controller.deployConfig.networks[Controller.defaultNetwork]
                .gasPrice || 3.3 * 1e9
        );
    }

    verifyExecutionContext() {
        let path = './deployments/' + this.defaultNetwork + '/' + '.deployInfo';

        let file = this.readInformation(path, true);
        if (!this.getFileSystem().existsSync(path)) return file.project;

        if (file.project !== this.deployConfig.project) return file.project;
        if (file.network !== this.defaultNetwork)
            return file.project + ' and network ' + file.network;

        return true;
    }

    async newQuestion(q = '') {
        let result = await question(q);
        return result;
    }

    /**
     * Registers contract settings for an object
     * @param {string} contractName
     * @param {object} settings
     */
    registerContractSettings(contractName, settings) {
        if (this.contractSettings[contractName] !== undefined)
            throw new Error(`${contractName} already exists`);

        this.contractSettings[contractName] = {
            setupModule: 'default',
            defaultRenderScript: 'Default',
            ...settings,
        };
    }

    /**
     *
     * @param {string|null} fileName
     * @returns
     */
    loadIPFSCache(fileName = null) {
        if (fileName === null) fileName = this.deployConfig.project;
        //check for IPFS cache and load it if it exists
        if (fs.existsSync('./temp/' + fileName + '_ipfs.json')) {
            this.ipfsCache = JSON.parse(
                this.readInformation('./temp/' + fileName + '_ipfs.json')
            );
            this.log('- loaded ipfs cache');
        } else {
            this.ipfsCache = {
                started: Date.now(),
                files: {},
            };
        }

        return this.ipfsCache;
    }

    async uploadObject(asset, ipfsFilePath = null) {
        if (!fs.existsSync('./imports/' + asset.fileName))
            throw new Error(`/imports/${asset.fileName} does not exist`);

        //remove extension
        if (ipfsFilePath !== null && typeof ipfsFilePath === 'string')
            ipfsFilePath = ipfsFilePath.split('.')[0];

        ipfsFilePath = ipfsFilePath.toString();

        let extension = (asset.fileName.split('.').pop() || '').toLowerCase();
        if (extension.length == 0) extension = '';
        let raw;
        let colours = [];
        let pathSize = 1;

        ///TODO: replace with an array somewhere
        if (
            extension === 'svg' ||
            extension === 'tinysvg' ||
            extension === 'xml' ||
            extension === 'html' ||
            extension === 'txt'
        ) {
            raw = fs.readFileSync('./imports/' + asset.fileName, 'utf-8');

            if (extension === 'svg') {
                this.log('- converting object to tinysvg');
                let result = tinySVG.toTinySVG(raw, true);
                raw = result.compressed;
                colours = [...result.colours];
                colours = fixColours(colours);
                pathSize = result.pathSize;
                extension = 'tinysvg';
            }
        } else {
            raw = await fs.promises.readFile('./imports/' + asset.fileName);
        }

        let size;
        try {
            size = new Blob([raw]).size / 1024;
        } catch (error) {
            console.error(error);
        }

        let checksum;

        try {
            checksum = crypto
                .createHash('md5')
                .update(raw.toString('base64'))
                .digest('hex');
        } catch (error) {
            console.log(error);
        }

        let _id = asset.name || ipfsFilePath || 'Unknown Path';
        let obj = {
            data: raw,
            uploaded: Date.now(),
            type: ipfsController.getContentType(extension),
            pathSize: pathSize,
            fileName: asset.fileName,
            extension: extension,
            colours: colours,
            dontLoad: size > this.deployConfig.maxLoadSize,
            dontStore: size > this.deployConfig.maxStorageSize,
            projectStorage: false,
            localStorage: this.deployConfig.copyContent,
            checksum: checksum,
            ipfs:
                this.deployConfig.useLocalAndIPFSContent ||
                !this.deployConfig.copyContent,
            size: size.toFixed(1),
        };

        console.log('- checksum/size: ' + obj.checksum + '/' + obj.size + 'kb');

        if (asset.section !== undefined) obj.section = asset.section;

        if (
            obj.size < this.deployConfig.projectPathStorageMaximum &&
            Object.values(this.allowedProjectStorageExtensions || []).filter(
                (extension) =>
                    extension.toLowerCase() === obj.extension.toLowerCase()
            ).length !== 0
        ) {
            console.log(
                ('- skipping ' + _id + ' and allowing storage in project file')
                    .gray
            );
            obj.localStorage = false;
            obj.projectStorage = true;
            obj.ipfs = false;

            if (obj.data instanceof Buffer) {
                console.log('- converting buffer to base64'.gray);
                obj.data = obj.data.toString('base64');
            }
        } else {
            if (this.ipfsCache.files === undefined) this.loadIPFSCache();

            if (
                obj.ipfs &&
                this.ipfsCache.files !== undefined &&
                (this.ipfsCache.files[obj.fileName] === undefined ||
                    this.ipfsCache.files[obj.fileName].checksum !==
                        obj.checksum)
            ) {
                if (this.ipfsCache.files[obj.fileName] !== undefined)
                    this.log(
                        'checksum invalid: ' +
                            this.ipfsCache.files[asset.fileName].checksum +
                            '=/=' +
                            obj.checksum
                    );

                console.log(('- uploading ' + _id + ' to ipfs').yellow);
                obj.cid = await ipfsController.uploadFile(
                    `${ipfsFilePath}${
                        obj.extension.length === 0 ? '' : '.' + obj.extension
                    }`,
                    raw,
                    obj.type
                );
                obj.data = obj.cid;

                if (obj.ipfs === true) {
                    obj.ipfsURL =
                        Controller.deployConfig.ipfs.publicGateway +
                        `${obj.cid}/${ipfsFilePath}${
                            obj.extension.length === 0
                                ? ''
                                : '.' + obj.extension
                        }`;
                    console.log('- set IPFS url to ' + obj.ipfsURL);
                }

                this.ipfsCache.files[asset.fileName] = obj;
                this.saveIPFSCache();
            } else if (
                obj.ipfs &&
                this.ipfsCache.files !== undefined &&
                this.ipfsCache.files[obj.fileName] !== undefined &&
                this.ipfsCache.files[obj.fileName].checksum === obj.checksum
            ) {
                console.log(('- using ipfs cache for ' + _id).grey);
                obj = {
                    ...this.ipfsCache.files[asset.fileName],
                };
            } else {
                obj.data = '';
            }
        }

        return obj;
    }

    /**
     *
     * @param {object} tempProjectFile
     * @returns
     */

    async uploadAssets(tempProjectFile, assetContract) {
        //assets start from 1, zero is a null asset.
        let actualAssetId = 1;

        if (
            typeof tempProjectFile.assets === 'object' &&
            tempProjectFile.assets instanceof Array === false
        ) {
            let keys = Object.keys(tempProjectFile.assets);
            let squashed = [];
            let actualSectionId = 0;
            keys.forEach((key) => {
                this.log(
                    ' - consolidating section ' +
                        key +
                        ' into section ' +
                        actualSectionId
                );
                tempProjectFile.assets[key].forEach((value) => {
                    squashed.push({
                        ...value,
                        section: actualSectionId,
                        sectionKey: key,
                    });
                });

                actualSectionId++;
            });

            tempProjectFile.assets = squashed;
        }

        if (tempProjectFile.assets instanceof Array === false) {
            throw new Error('assets must be an array');
        }

        let assetTree = {
            pathAssets: {}, //assets for this path
            sectionAssets: {}, //assets for this section
            pathSections: {}, //sections for path
        };

        for (let i = 0; i < tempProjectFile.assets.length; i++) {
            let asset = tempProjectFile.assets[i];

            //if the asset pathId isn't a number or an array containing pathIds or an object
            //containing pathIds then set it to be an asset for all of the paths
            if (
                typeof asset.pathId !== 'number' &&
                asset.pathId instanceof Array === false
            )
                asset.pathId =
                    typeof asset.pathId === 'object'
                        ? Object.values(asset.pathId)
                        : Object.keys(tempProjectFile.paths).filter(
                              (value) => value != 'default'
                          );

            //
            let addToTree = (pathId) => {
                if (assetTree.pathAssets[pathId] === undefined)
                    assetTree.pathAssets[pathId] = [actualAssetId];
                else assetTree.pathAssets[pathId].push(actualAssetId);

                if (assetTree.sectionAssets[asset.section || 0] === undefined)
                    assetTree.sectionAssets[asset.section || 0] = [
                        actualAssetId,
                    ];
                else if (
                    Object.values(
                        assetTree.sectionAssets[asset.section || 0]
                    ).filter((assetId) => assetId === actualAssetId).length ===
                    0
                )
                    assetTree.sectionAssets[asset.section || 0].push(
                        actualAssetId
                    );

                if (assetTree.pathSections[pathId] === undefined)
                    assetTree.pathSections[pathId] = [asset.section || 0];
                else if (
                    Object.values(
                        assetTree.pathSections[pathId].filter(
                            (section) => section === (asset.section || 0)
                        )
                    ).length === 0
                )
                    assetTree.pathSections[pathId].push(asset.section || 0);
            };

            asset.paths = await this.uploadObject(asset, actualAssetId);
            asset.paths = {
                ...asset.paths,
                assetId: parseInt(actualAssetId),
            };
            asset.assetId = parseInt(actualAssetId);

            if (asset.paths.ipfs === true) {
                asset.paths.ipfsURL =
                    this.deployConfig.ipfs.publicGateway +
                    `${asset.paths.cid}/${actualAssetId}${
                        asset.paths.extension.length === 0
                            ? ''
                            : '.' + asset.paths.extension
                    }`;
                console.log('- set IPFS url to ' + asset.paths.ipfsURL);
            }

            if (typeof asset.pathId === 'number') {
                this.log(
                    '- encoding asset assetId ' +
                        actualAssetId +
                        ' for pathId ' +
                        asset.pathId +
                        ' for section ' +
                        (asset.section || 0) +
                        ' for contract: ' +
                        asset.fileName
                );

                asset.encodedAsset = ethers.utils.defaultAbiCoder.encode(
                    ['uint256', 'uint256', 'uint256', 'bytes'],
                    asset.pathId,
                    asset.section || 0,
                    asset.rarity || 100,
                    ethers.utils.toUtf8Bytes(asset.cid || '{}')
                );

                addToTree(asset.pathId);
            } else {
                if (asset.pathId instanceof Array === false)
                    throw new Error('pathid by this point should be Array');

                for (let i = 0; i < asset.pathId.length; i++) {
                    if (i == 0) {
                        this.log(
                            '- encoding asset assetId ' +
                                actualAssetId +
                                ' for pathId ' +
                                asset.pathId[i] +
                                ' for section ' +
                                (asset.section || 0) +
                                ' for contract: ' +
                                asset.fileName
                        );
                        asset.encodedAsset =
                            ethers.utils.defaultAbiCoder.encode(
                                ['uint256', 'uint256', 'uint256', 'bytes'],
                                [
                                    asset.pathId[i],
                                    asset.section || 0,
                                    asset.rarity || 100,
                                    ethers.utils.toUtf8Bytes(asset.cid || '{}'),
                                ]
                            );
                    }

                    addToTree(asset.pathId[i]);
                }
            }

            actualAssetId++;
        }

        //update the asset tree in obhectURI
        tempProjectFile.assetTree = assetTree;

        this.log(' ☻ Success'.green);
        this.log('\n > Setting up assets inside of contract'.blue);

        /**
         * Set the assets
         */
        let selectedAssets = pickKeys(
            ['encodedAsset', 'rarity'],
            tempProjectFile.assets
        );
        if (
            selectedAssets.length !== 0 &&
            selectedAssets.encodedAsset.length <
                this.deployConfig.assetChunkSize
        ) {
            this.log(
                ' - Setting assets in contract count of ' +
                    selectedAssets.encodedAsset.length
            );
            //setting assets in contract
            let tx = await assetContract.addAssets(
                selectedAssets.rarity
                //selectedAssets.encodedAsset
            );
            tx = await tx.wait();
            this.logTx(tx);
            this.log(' ☻ Success'.green);
        } else {
            //split the set up into groups of 25
            selectedAssets = splitSet(
                selectedAssets,
                [],
                this.deployConfig.assetChunkSize || 10,
                true
            );

            for (let i = 0; i < selectedAssets.length; i++) {
                let selection = selectedAssets[i];

                this.log(
                    ' - Setting ' +
                        selection.encodedAsset.length +
                        ' in contract ' +
                        (selectedAssets.length - i) +
                        ' chunks left'
                );
                //setting assets in contract
                let tx = await assetContract.addAssets(
                    selection.rarity
                    //selection.encodedAsset
                );
                tx = await tx.wait();
                this.logTx(tx);
                this.log(' ☻ Success'.green);
            }
        }

        let isFlattened = () => {
            let lastSection;
            Object.values(assetTree.pathSections).forEach((section) => {
                if (
                    lastSection !== undefined &&
                    Object.keys(section).filter(
                        (key) =>
                            lastSection[key] !== undefined &&
                            lastSection[key] == section[key]
                    ).length !== 0
                )
                    return false;

                lastSection = section;
            });
            return true;
        };

        if (isFlattened()) {
            this.log('> All sections are the same enabling flat mode..'.blue);

            this.log(' - Setting path sections for all the paths in contract');
            let tx = await assetContract.flatPathSections(
                assetTree.pathSections[0]
            );
            tx = await tx.wait();
            this.logTx(tx);
            this.log(' ☻ Success'.green);
        } else {
            /**
             * Set the path sections
             */
            let left = [];
            Object.keys(assetTree.pathSections).forEach((key) => {
                left.push(key);
            });
            while (left.length !== 0) {
                let selection = {
                    pathId: [],
                    sections: [],
                };

                //TODO: Turn the 25 here into a controllable variable
                for (
                    let i = 0;
                    i < (this.deployConfig.sectionChunkSize || 25);
                    i++
                ) {
                    if (left.length === 0) break;
                    let index = left.pop();
                    selection.pathId.push(index);
                    selection.sections.push(assetTree.pathSections[index]);
                }

                this.log(
                    ' - Setting path sections for paths size of ' +
                        selection.pathId.length +
                        ' in contract ' +
                        left.length +
                        ' left'
                );

                let tx = await assetContract.setPathSections(
                    selection.pathId,
                    selection.sections
                );
                tx = await tx.wait();
                this.logTx(tx);
                this.log(' ☻ Success'.green);
            }
        }

        for (let [sectionId, assets] of Object.entries(
            assetTree.sectionAssets
        )) {
            this.log('- setting assets for sectionId ' + sectionId);

            let sortedAssets = [...assets];
            sortedAssets = sortedAssets.sort(
                (a, b) =>
                    (tempProjectFile.assets[a]?.rarity || 0) +
                    (tempProjectFile.assets[b]?.rarity || 0)
            );
            let tx = await assetContract.pushSectionAssets(sortedAssets);
            tx = await tx.wait();
            this.logTx(tx);
        }

        //check sum and also remove encoded asset
        tempProjectFile.assets.forEach((asset, index) => {
            if (tempProjectFile.assets[index].encodedAsset !== undefined)
                delete tempProjectFile.assets[index].encodedAsset;

            tempProjectFile.assets[index].checksum = md5(JSON.stringify(asset));
        });

        //save the IPFS cache
        this.saveIPFSCache();

        //must return the project file
        return tempProjectFile;
    }

    saveReceipts(isFinal = false) {
        let fileName = `./temp/${Controller.deployConfig.project}_${Controller.defaultNetwork}_receipts.json`;
        if (!fs.existsSync('./temp/')) fs.mkdirSync('./temp/');

        //write it
        this.log(`> Saving receipts to ${fileName}`.dim);
        this.log(isFinal ? '> Saving as final receipt'.cyan : '');

        if (isFinal) {
            let totalGas = 0;

            Object.keys(this.receipts).forEach((key) => {
                let value = this.receipts[key];
                totalGas +=
                    value.gasUsedNumerical !== undefined &&
                    !isNaN(value.gasUsedNumerical)
                        ? value.gasUsedNumerical
                        : 0;
            });

            let obj = {
                ...this.receipts,
                _final: {
                    totalGas: totalGas,
                },
            };

            this.writeInformation(obj, fileName);
            return obj;
        } else this.writeInformation(this.receipts, fileName);

        return this.receipts;
    }

    loadReceipts() {
        let fileName = `./temp/${Controller.deployConfig.project}_${Controller.defaultNetwork}_receipts.json`;
        if (!fs.existsSync(fileName)) return;

        try {
            this.log(' > Loading receipts from ' + fileName);
            this.receipts = JSON.parse(this.readInformation(fileName));
        } catch (error) {
            this.log('Could not read receipts');
            this.log(error);
        }
    }

    saveIPFSCache() {
        if (!fs.existsSync('./temp/')) fs.mkdirSync('./temp/');

        let cache = { ...this.ipfsCache, files: { ...this.ipfsCache.files } };

        //write it
        this.log(
            (
                `- saving IFPS cache to ${process.cwd()}/temp/` +
                this.deployConfig.project +
                '_ipfs.json'
            ).dim
        );
        this.writeInformation(
            cache,
            `./temp/` + this.deployConfig.project + '_ipfs.json'
        );
    }

    isEnvTrue(env) {
        return (
            process?.env[env] !== undefined &&
            (process?.env[env] === 'true' || process?.env[env] === true)
        );
    }

    /**
     *
     * @param {string} param1
     * @param {string} param2
     * @param {string} param3
     * @returns
     */
    log(param1, param2 = '', param3 = '') {
        if (
            process.env.SILENT_OUTPUT === 'true' ||
            process.env.SILENT_OUTPUT === true
        )
            return;

        console.log(
            (param3.length != 0 ? `[${param3}] ` : ``) +
                `${param1}` +
                (param2.length != 0 ? `${param2}` : '')
        );
    }

    async copyScripts(controller, copyAll = true, renderScript = null) {
        let promise = () => {
            return new Promise((resolve, reject) => {
                glob('./scripts/render/**/*.js', (err, matches) => {
                    resolve(matches);
                });
            });
        };

        let results = await promise();

        //if we are copying all contracts then don't filter else only include the the build scripts
        results = results.filter((file) =>
            !copyAll
                ? renderScript !== null
                    ? file.replace(/^.*[\\\/]/, '') === renderScript + '.js'
                    : file.replace(/^.*[\\\/]/, '') === controller + '.js'
                : true
        );

        results = results.map((filepath) => {
            return {
                filepath: filepath,
                filename: filepath.replace(/^.*[\\\/]/, ''),
            };
        });

        if (
            copyAll !== true &&
            (renderScript !== null) & (results.length === 0)
        ) {
            throw new Error(
                'controller script is invalid, specified controller script does not exist in contracts directory: ' +
                    renderScript
            );
        }

        let module = await this.getVersionModule();
        let project = fs.existsSync('./temp_project')
            ? JSON.parse(
                  fs.readFileSync('./temp_project', {
                      encoding: 'utf-8',
                  })
              )
            : await this.getProjectFile(true);
        module.onCopyScripts(results, project);
    }

    /**
     * Logs a tx.
     * @param {object} tx
     */
    logTx(receipt, description = '') {
        try {
            if (
                receipt.gasUsed === undefined &&
                receipt.getTransactionReceipt !== undefined
            )
                receipt = receipt.getTransactionReceipt();

            this.receipts[receipt.transactionHash] = {
                description: description,
                ...receipt,
                gasUsedNumerical: parseInt(receipt.gasUsed.toString()),
            };
            if (
                process.env.HIDE_GAS !== true &&
                process.env.HIDE_GAS !== 'true'
            )
                console.log(('Gas used: ' + receipt.gasUsed).yellow);

            return receipt;
        } catch (error) {
            console.error(error);
            console.log('UNABLE TO GET RECEIPT');
            return {
                gasUsed: 0,
            };
        }
    }

    /**
     * Gets the deploy configuration for that particular module
     * @param {string} key
     * @returns
     */
    getContractConfig(key) {
        let result;
        let res = this.contractSettings[key];

        if (typeof res === 'string') result = this.contractSettings[res];
        else result = res;

        if (result === undefined || result === null)
            throw new Error('Contract settings are null');

        return result;
    }

    /**
     *
     * @param {number} decimal
     * @returns
     */

    toHexFromDecimal(decimal) {
        return this.toHex(this.toRGB(decimal));
    }

    /**
     *
     * @param {Array} arr
     * @returns
     */
    toHex(arr = []) {
        let rgb = (arr[0] << 16) | (arr[1] << 8) | arr[2];
        return '#' + rgb.toString(16).padEnd(6, 0);
    }

    toRGB(c) {
        let r = Math.floor(c / (256 * 256));
        let g = Math.floor(c / 256) % 256;
        let b = c % 256;

        return [r, g, b];
    }

    async fetch(url) {
        try {
            let response = await axios.get(url, {
                timeout: 10000,
            });
            return { success: true, ...response.data };
        } catch (error) {
            this.log(error);
            return { success: false };
        }
    }

    async getProjectFile(requireJson) {
        try {
            if (requireJson)
                return await require('./../projects/' +
                    this.deployConfig.project.replace('.js', '') +
                    '.json');
            return await require('./../projects/' +
                this.deployConfig.project.replace('.js', ''));
        } catch (error) {
            this.log(error);
            this.log(
                'BAD ObjectURI! ' + this.deployConfig.project.replace('.js', '')
            );
            return {};
        }
    }

    saveSettings() {
        if (!fs.existsSync('./settings/')) fs.mkdirSync('./settings/');

        this.writeInformation(
            this.settings,
            './settings/' + this.deployConfig.project + '.json'
        );
    }

    load() {
        try {
            this.preivousDeployment = {
                valid: true,
                ...JSON.parse(this.readInformation()),
            };
            this.settings = {
                ...this.settings,
                ...JSON.parse(
                    this.readInformation(
                        './settings/' + this.deployConfig.project + '.json'
                    )
                ),
            };
        } catch (error) {
            this.log(error.message);
            this.log('defaulting to ganache for network\n');
        }

        if (fs.existsSync('./.force_network')) {
            this.log('> Forcing network');
            this.defaultNetwork =
                this.readInformation('./.force_network').toString();
            this.log('- Network forced to ' + this.defaultNetwork);
        }

        if (
            this.defaultNetwork === null &&
            this.preivousDeployment.valid &&
            networks[this.preivousDeployment.chainId] !== undefined
        )
            this.defaultNetwork = networks[this.preivousDeployment.chainId];
        else if (this.defaultNetwork === null) this.defaultNetwork = 'ganache';

        try {
            if (fs.existsSync('./.gas_prices')) {
                let gasPrices = JSON.parse(
                    this.readInformation('./.gas_prices')
                );

                Object.keys(gasPrices).forEach((key) => {
                    if (
                        this.deployConfig.networks[key] !== undefined &&
                        this.deployConfig.networks[key].useGasStation
                    ) {
                        //if onGet is not undefined && callable
                        if (
                            this.deployConfig.networks[key].onGetGas !==
                                undefined &&
                            typeof this.deployConfig.networks[key].onGetGas ===
                                'function'
                        ) {
                            this.deployConfig.networks[key].gasPrice =
                                this.deployConfig.networks[key].onGetGas(
                                    gasPrices[key],
                                    this.deployConfig.networks[key]
                                );
                        } else {
                            this.deployConfig.networks[key].gasPrice =
                                gasPrices[key].standard.maxPriorityFee *
                                    (this.deployConfig.networks[key].gasValue ||
                                        1e9) ||
                                gasPrices[key].standard *
                                    (this.deployConfig.networks[key].gasValue ||
                                        1e9) ||
                                null;
                        }

                        //floor it
                        this.deployConfig.networks[key].gasPrice = Math.floor(
                            this.deployConfig.networks[key].gasPrice
                        );
                    }

                    if (key === this.defaultNetwork) {
                        this.log(
                            '- gas price for ' +
                                key +
                                ' set to ' +
                                this.deployConfig.networks[key].gasPrice +
                                ' wei'
                        );
                    }
                });
            }

            if (fs.existsSync('./.token_prices')) {
                let tokenPrices = JSON.parse(
                    this.readInformation('./.token_prices')
                );

                Object.keys(tokenPrices).forEach((key) => {
                    if (key === 'updated' || key === 'refreshes') return;

                    if (this.deployConfig.networks[key] === undefined) {
                        this.log('bad key: ' + key);
                        return;
                    }

                    //floor it
                    this.deployConfig.networks[key].tokenPrice = {
                        ...tokenPrices[key],
                    };

                    this.log(
                        '- token price for ' +
                            key +
                            ' set to $' +
                            this.deployConfig.networks[key].tokenPrice.usd
                    );
                });
            }
        } catch (error) {
            this.log('COULD NOT SET GAS PRICES!'.red);
            this.log(error);
        }

        //sets the above array using env variables
        Object.keys(this.environmentVariables).map((val) => {
            if (
                process?.env[val] !== undefined &&
                this.environmentVariables[val] === null
            ) {
                this.environmentVariables[val] = process?.env[val];
            }

            if (this.environmentVariables[val] === null)
                this.environmentVariables[val] = '';
        });
    }

    async deleteIfPresent(contractName) {
        contractName = contractName.split('.json')[0];
        if (
            Controller.getFileSystem().existsSync(
                './deployments/' +
                    Controller.defaultNetwork +
                    '/' +
                    contractName +
                    '.json'
            )
        )
            await Controller.getFileSystem().promises.unlink(
                './deployments/' +
                    Controller.defaultNetwork +
                    '/' +
                    contractName +
                    '.json'
            );
    }

    async getDriveLocation(checkForReact = true, thing = 'InfinityMint') {
        if (!colors.enabled) colors.enable();

        let folderLocation = '';
        let selectedLocation = process.cwd() + '/';
        let shouldBreak = false;
        let lastFile = '';
        let files = [];
        while (!shouldBreak) {
            this.log('\n\n');
            files = (
                await fs.promises.readdir(selectedLocation, {
                    withFileTypes: true,
                })
            )
                .filter((file) => file.isDirectory())
                .map((file) => file.name);

            files.forEach((name, index) => {
                console.log(`[${index}] ${name}`.blue);
            });

            console.log(`[${files.length}] <back>`.magenta);
            console.log('\n📝 The Thing Finder'.yellow.underline);
            this.log(
                (
                    'Please enter the location of the ' +
                    thing +
                    '. Input a number for the folder you want to navigate to and then press enter.\nYou might need to press [y] to confirm your selection.'
                ).cyan
            );
            console.log(
                '[y]es'.green +
                    ' | ' +
                    '[e]xit'.red +
                    ' | ' +
                    '[d]rive'.white +
                    ' | ' +
                    '[n]ewfolder'.white +
                    ' | ' +
                    '[r]eset'.rainbow
            );
            console.log(
                'Current Selected Directory: '.dim + selectedLocation.bgMagenta
            );

            let result = await question('-> ');

            if (result === undefined || result === null || result === '')
                continue;

            if (!isNaN(result)) {
                result = parseInt(result);
                selectedLocation =
                    result >= files.length
                        ? lastFile === ''
                            ? selectedLocation + '../'
                            : selectedLocation.replace(lastFile + '/', '')
                        : selectedLocation + files[result] + '/';
                if (result < files.length) lastFile = files[result];
                else lastFile = '';

                if (checkForReact && this.checkReactFolder(selectedLocation)) {
                    shouldBreak = true;
                    folderLocation = selectedLocation;
                    console.log('\n ☻ Valid Location Detected! ☻'.green);
                    break;
                }
            } else {
                //copy and pasted a link in
                if (result.length > 5) {
                    if (
                        result.substring(0, result.length - 1) !== '/' &&
                        result.substring(0, result.length - 1) !== '\\'
                    )
                        result = result + '/';

                    if (!fs.existsSync(result)) {
                        console.log(
                            '\nSorry!\n The entered path does not exist: ' +
                                result
                        );
                        await new Promise((resolve) => {
                            setTimeout(resolve, 2000);
                        });
                    } else if (
                        this.checkReactFolder(result) ||
                        !checkForReact
                    ) {
                        shouldBreak = true;
                        folderLocation = result;
                    } else {
                        selectedLocation = result;
                        console.log(
                            '\nSorry!\n Something is wrong with that path. Make sure you select the root folder of the respository'
                                .red
                        );
                        await new Promise((resolve) => {
                            setTimeout(resolve, 2000);
                        });
                    }
                } else
                    switch (result.toLowerCase()) {
                        default:
                        case 'reset':
                        case 'r':
                            selectedLocation = process.cwd() + '/';
                            break;
                        case 'n':
                        case 'new':
                        case 'newfolder':
                            if (checkForReact) {
                                console.log(
                                    'Sorry! You cannot create a new folder for your react repository this way. Please use the createInfinityApp script first'
                                        .red
                                );
                                await new Promise((resolve) => {
                                    setTimeout(resolve, 2000);
                                });
                                break;
                            }
                            console.log('\n');
                            let folder = await this.newQuestion(
                                'Please enter name of new folder: '.cyan
                            );
                            folderLocation = selectedLocation + folder;
                            shouldBreak = true;
                            break;
                        case 'd':
                        case 'drive':
                            console.log('\n');
                            let result = await this.newQuestion(
                                'Please enter drive letter: '.cyan
                            );
                            result = result.split(':')[0];
                            selectedLocation = `${result.toUpperCase()}:/`;
                            break;
                        case 'yes':
                        case 'y':
                            if (
                                !checkForReact ||
                                this.checkReactFolder(selectedLocation)
                            ) {
                                shouldBreak = true;
                                folderLocation = selectedLocation;
                                console.log(
                                    ' ☻ Valid Location Detected! ☻'.green
                                );
                                break;
                            }
                            console.log(
                                '\nSorry!\n Something is wrong with that path. Make sure you select the root folder of the respository'
                                    .red
                            );
                            await new Promise((resolve) => {
                                setTimeout(resolve, 2000);
                            });
                            break;
                        case 'exit':
                        case 'e':
                            return '';
                    }
            }
        }

        this.log('\nLocation set to: '.dim + folderLocation.bgGreen);
        return folderLocation;
    }

    /**
     *
     * @param {object} objectURI
     * @returns
     */
    async copyBuild(objectURI = {}, useProjectDeployInfo = false) {
        if (this.settings.reactLocation === '') return;
        if (!colors.enabled) colors.enable();

        let module = await this.getVersionModule();
        let fileNames = (
            await fs.promises.readdir(
                './deployments/' + this.defaultNetwork + '/',
                {
                    withFileTypes: true,
                }
            )
        )
            .filter(
                (file) =>
                    file.isFile() &&
                    (file.name.indexOf('.json') !== -1 ||
                        file.name.indexOf('.chainId') !== -1)
            )
            .map((file) => file.name);

        if (Controller.settings.version === 2) {
            if (!fs.existsSync(this.settings.reactLocation + 'dist/'))
                fs.mkdirSync(this.settings.reactLocation + 'dist/');

            if (
                !fs.existsSync(
                    this.settings.reactLocation +
                        'dist/' +
                        Controller.deployConfig.project +
                        '/'
                )
            )
                fs.mkdirSync(
                    this.settings.reactLocation +
                        'dist/' +
                        Controller.deployConfig.project
                );
        }

        if (
            Controller.settings.version === 1 &&
            !Controller.getFileSystem().existsSync(
                Controller.settings.reactLocation + 'src/Deployments'
            )
        )
            Controller.getFileSystem().mkdirSync(
                Controller.settings.reactLocation + 'src/Deployments'
            );

        let deploymentLocation =
            this.settings.version === 2
                ? this.settings.reactLocation +
                  'dist/' +
                  this.deployConfig.project +
                  '/' +
                  objectURI.network.chainId +
                  '/'
                : this.settings.reactLocation + 'src/Deployments/';

        if (
            Controller.deployConfig.clearBuildFolder &&
            fs.existsSync(deploymentLocation)
        ) {
            fs.readdirSync(deploymentLocation, {
                withFileTypes: true,
            })
                .filter(
                    (file) =>
                        file.isFile() &&
                        (file.name.indexOf('.json') !== -1 ||
                            file.name.indexOf('.chainId') !== -1) &&
                        (Controller.defaultNetwork === 'ganache' ||
                            file.name.indexOf('Fake_') === -1)
                )
                .forEach((file) => {
                    try {
                        this.log('- deleting old file ' + file.name);
                        fs.unlinkSync(deploymentLocation + file.name);
                    } catch (error) {
                        this.log('could not unlink file: ');
                        this.log(error);
                    }
                });
        }

        if (!fs.existsSync(deploymentLocation))
            fs.mkdirSync(deploymentLocation);

        fileNames.forEach((file) => {
            let data = fs.readFileSync(
                './deployments/' + this.defaultNetwork + '/' + file
            );
            let path = this.settings.reactLocation + 'src/Deployments/';
            if (this.settings.version === 2) {
                path =
                    this.settings.reactLocation +
                    'dist/' +
                    Controller.deployConfig.project +
                    '/' +
                    objectURI.network.chainId +
                    '/';
            }

            if (!fs.existsSync(path)) fs.mkdirSync(path);

            if (fs.existsSync(path + file)) {
                this.log(
                    '- Deleting ' +
                        file +
                        ' from ' +
                        this.settings.reactLocation
                );
                fs.unlinkSync(path + file);
            }

            fs.writeFileSync(path + file, data);
            this.log('- Wrote ' + file);
        });
        this.log(' ☻ Success'.green);

        this.log('\n- Writing project file');
        module.onCopyProject(objectURI);
        this.log(' ☻ Success'.green);

        this.log('\n- Writing .deployInfo');
        let deployInfo = fs.readFileSync('./.deployInfo', {
            encoding: 'utf-8',
        });
        fs.writeFileSync(
            './deployments/' + this.defaultNetwork + '/.deployInfo',
            deployInfo
        );

        module.onCopyDeployInfo(JSON.parse(deployInfo));
    }

    checkReactFolder(location, saveToSettings = true) {
        if (
            !fs.existsSync(location) ||
            !fs.existsSync(location + 'package.json')
        )
            return false;

        let result = fs.readFileSync(location + 'package.json');

        try {
            result = JSON.parse(result);

            if (
                result?.infinityMint?.allowExport !== true &&
                result?.infinitymint?.allowExport !== true
            ) {
                this.log('is not supported export: ' + result.name);
                return false;
            }

            if (result?.infinityMint?.version && saveToSettings) {
                Controller.settings.version = result.infinityMint.version;
            } else if (saveToSettings) Controller.settings.version = 1;

            Controller.saveSettings();
        } catch (error) {
            this.log(error);
            return false;
        }

        return true;
    }

    /**
     *
     * @param {VersionTwo|VersionOne} version
     * @returns
     */
    async getVersionModule(version = null) {
        if (version === null) version = Controller.settings.version || 1;
        let result = await require('./versions/' + version);
        return result.default || result;
    }

    execute(
        application = 'node',
        initialArgument,
        extraArguments = [],
        dontSave = false,
        hideExperimentalError = true,
        autoClose = true,
        cwd = null
    ) {
        return new Promise(async (resolve, reject) => {
            //saves the current receipts to file
            if (!dontSave) Controller.saveReceipts();
            let isActive = true;
            var shell = os.platform() === 'win32' ? 'powershell.exe' : '';
            let ls;
            let command =
                application +
                ' ' +
                initialArgument +
                ' ' +
                extraArguments.join(' ');

            //correctly fixes arguments passed to this method to be valid commmand parameters
            let newArgs = [];
            extraArguments.forEach((arg) => {
                let matches = arg.match(/(["'])(?:(?=(\\?))\2.)*?\1/g);

                if (matches !== null) {
                    matches.forEach((match, index) => {
                        arg = arg.replace(
                            match,
                            `INFINITY_MINT_INDEX:($:%)${index}`
                        );
                    });
                    arg = arg.split(' ');
                    arg.forEach((newArg) => {
                        if (newArg.indexOf('INFINITY_MINT_INDEX:($:%)') !== -1)
                            newArgs.push(matches[newArg.split('($:%)')[1]]);
                        else newArgs.push(newArg);
                    });
                } else {
                    arg = arg.split(' ');
                    arg.forEach((newArg) => newArgs.push(newArg));
                }
            });

            command = command.trim().replace('  ', ' ');
            console.log('executing command: ' + command + ' with args =>');
            console.log(newArgs);

            if (os.platform() === 'win32')
                ls = spawn(shell, [command], {
                    cols: 148,
                    rows: 2,
                    cwd: cwd || process.cwd(),
                    env: Object.create(process.env),
                });
            else {
                ls = spawn(application, [initialArgument, ...newArgs], {
                    cols: 148,
                    rows: 2,
                    cwd: cwd || process.cwd(),
                    env: Object.create(process.env),
                });

                if (os.platform() === 'win32') ls.write(command + '\r');
            }

            ls.stderr.on('data', (data) => {
                if (isActive) process.stdout.write(data);
            });

            ls.stdout.on('data', (data) => {
                try {
                    if (isActive) process.stdout.write(data);
                } catch (error) {}
            });

            ls.on('close', (code) => {
                code = parseInt(code);
                Controller.log('exit code: ' + code);
                isActive = false;

                try {
                    ls.kill();
                } catch (error) {
                    console.log(error);
                }

                resolve(parseInt(code));
            });

            let inputLoop = () => {
                if (!isActive) return;
                Controller.newQuestion('').then((string) => {
                    if (!isActive) return;
                    try {
                        if (ls == null) return;
                        ls.stdin.write(string + '\r');
                        if (isActive) inputLoop();
                    } catch (error) {}
                });
            };
            inputLoop();
        });
    }

    executeService(
        service,
        args = [],
        cmd = 'npm',
        autoClose = true,
        cwd = null
    ) {
        cmd = /^win/.test(process.platform) ? `${cmd}.cmd` : `${cmd}`;
        return this.execute(
            cmd,
            service,
            args,
            true,
            process?.env?.HIDE_EXPERIMENTAL_WARNING === 'true',
            autoClose,
            cwd
        );
    }

    executeNodeScript(script, args = [], dontSave = false, cwd = null) {
        return this.execute(
            'node',
            script,
            args,
            dontSave,
            process?.env?.HIDE_EXPERIMENTAL_WARNING === 'true',
            true,
            cwd
        );
    }

    //default location is root
    writeInformation(obj = {}, fileLocation = './.deployInfo') {
        //searches object deleting functions
        let search = (arr, object) => {
            arr.forEach((key) => {
                if (
                    typeof object[key] === 'object' ||
                    object[key] instanceof Array
                )
                    search(Object.keys({ ...object[key] }), object[key]);

                if (object[key] === 'function') delete object[key];
            });
        };

        //delete functions
        search(Object.keys(obj), obj);
        fs.writeFileSync(fileLocation, JSON.stringify(obj, null, 4));
    }

    restartQuestionReadline() {
        //
        rl.close();
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        question = util.promisify(rl.question).bind(rl);
    }

    //default location is root
    readInformation(fileLocation = './.deployInfo', toJson = false) {
        if (!fs.existsSync(fileLocation)) return toJson ? {} : '{}';

        if (!toJson)
            return fs.readFileSync(fileLocation, {
                encoding: 'utf-8',
            });

        let buffer = fs.readFileSync(fileLocation, {
            encoding: 'utf-8',
        });
        return JSON.parse(buffer);
    }
})();

module.exports = Controller;
