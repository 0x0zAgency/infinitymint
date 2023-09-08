const { ethers } = require('hardhat');
const Controller = require('../src/Controller');
const fs = require('fs');
const {
    getMostCommonNumber,
    getHighestKey,
    getLowestKey,
    getLeastCommonNumber,
    replaceColours,
    getContract,
} = require('../src/helpers');
const tinySVG = require('tinysvg-js');

//TODO: Put inside of the project config space

async function main() {
    //we access the json projectFile as it contains build info after deploy
    let deployedProject = await Controller.getProjectFile(true);
    //the normal projectFile is loaded from the js file and is from before (does not have colours/finalized paths but does have methods)
    let projectFile = await Controller.getProjectFile(false);
    let result = Controller.verifyExecutionContext();
    let accounts = await ethers.getSigners();

    if (result !== true)
        throw new Error(
            'please change current project to ' +
                result +
                ' or redeploy as ' +
                Controller.deployConfig.project
        );

    let range = Controller.deployConfig?.mintAllRangeSize || 10;

    projectFile.paths = {
        ...projectFile.paths,
        ...(projectFile.paths.indexes || {}),
    };

    if (projectFile.paths.indexes !== undefined)
        delete projectFile.paths.indexes;

    let previousTotal = {};

    if (!fs.existsSync('./results/')) fs.mkdirSync('./results/');

    if (
        fs.existsSync('./results/' + Controller.deployConfig.project + '.json')
    ) {
        try {
            previousTotal = JSON.parse(
                Controller.readInformation(
                    './results/' + Controller.deployConfig.project + '.json'
                )
            );
        } catch (error) {
            console.log('could not read previous total');
            previousTotal = {};
        }

        //wipe previous total if it is not for this contract
        if (
            previousTotal.id === undefined ||
            previousTotal.id !== deployedProject.id
        ) {
            Controller.log('- New deployment creating new results file'.dim);
            previousTotal = {};
        } else {
            previousTotal.restarted = Date.now();
        }
    }

    const totals = {
        project: Controller.deployConfig.project,
        id: deployedProject.id,
        started: Date.now(),
        restarted: Date.now(),
        rangeCount: 0,
        deployment: deployedProject.deployment || {
            ...Controller.defaultDeployment,
        },
        contracts: {
            ...(deployedProject.contracts || {}),
        },
        generatedColours: 0,
        _final: {},
        nameCount: {},
        timeAverages: {},
        mostCommonPath: {},
        gasAverages: {}, //for ever 10 mints
        outcomes: {},
        ...previousTotal,
    };

    let apiContract = await getContract('InfinityMintApi');
    let erc721 = await getContract('InfinityMint');
    let mints = await erc721.mintsEnabled();

    if (!mints) {
        Controller.log('- mints disabled enabling minter in order to continue');
        let tx = await erc721.setMintsEnabled(true);
        await tx.wait();
        Controller.log(' ☻ Success'.green);
    }

    let totalMints = await apiContract.totalMints();
    let totalSupply = await apiContract.totalSupply();

    if (
        totals._final.completed !== undefined &&
        totalSupply - totalMints <= 0
    ) {
        Controller.log('\n> Mint has already been completed'.red);
        return;
    }

    Controller.log(
        (
            `\n > Minting All (writing statistics to ${process.cwd()}/results/` +
            Controller.deployConfig.project +
            '.json)\n'
        ).magenta
    );

    let pathId = 0;
    let pathsLength = Object.keys(deployedProject.paths).filter(
        (key) => key !== 'default'
    ).length;
    let contractSettings = Controller.getContractConfig(
        projectFile.modules.controller
    );
    let lastPathId = 0;

    let count = totalSupply - totalMints;
    if (process.argv[2] !== undefined && !isNaN(process.argv[2]))
        count = parseInt(process.argv[2]);

    if (count >= projectFile.deployment.maxSupply)
        count = projectFile.deployment.maxSupply;

    if (count <= 0 || isNaN(count)) count = 1;

    let address = accounts[0].address;
    if (process.argv[3] !== undefined) address = process.argv[3];

    let pathCount = 0;

    if (projectFile.deployment?.incrementalMode)
        pathCount = parseInt((await apiContract.totalMints()).toString());

    for (let i = 0; i < count; i++) {
        let tokenId = parseInt(totalMints) + i;
        let start = Date.now();
        console.log(
            (
                '\n> minting tokenId ' +
                tokenId +
                '/' +
                (totalSupply - tokenId) +
                ' left'
            ).gray.underline
        );

        let selection;
        let getPathId = (forceRandom = false) => {
            let pathId = 0;
            selection = [];
            //mimics how Rarity works on chain, which is selecting paths which beat the random number
            //and then selecting the highest out of that list
            if (projectFile.modules.controller.indexOf('Rarity') !== -1) {
                Object.keys(deployedProject.paths).forEach((pathId, i) => {
                    if (pathId == 'default') return;
                    let path = deployedProject.paths[pathId];
                    if (path.rarity > Math.floor(Math.random() * 100))
                        selection.push([pathId, path.rarity]);
                });

                //if we randomise the selected pathId that meet the rarity check
                if (forceRandom || contractSettings.randomRarity) {
                    if (selection.length === 0) {
                        pathId = 0;
                    } else {
                        pathId =
                            selection[
                                Math.floor(Math.random() * selection.length)
                            ][0];
                    }
                    //if we return the lowest (most rare rare) pathId from the selection
                } else if (contractSettings.lowestRarity) {
                    let lowestRarity = 0;
                    let lowestPath = 0;

                    selection.forEach((asset) => {
                        if (lowestRarity === 0) {
                            lowestRarity = asset[1];
                            lowestPath = asset[0];
                        } else if (asset[1] < lowestRarity) {
                            lowestRarity = asset[1];
                            lowestPath = asset[0];
                        }
                    });

                    pathId = lowestPath;
                    //default to if we return the highest (least rare) pathId from the selection
                } else {
                    let highestRarity = 0;
                    let highestPath = 0;

                    selection.forEach((asset) => {
                        if (highestRarity < asset[1]) {
                            highestRarity = asset[1];
                            highestPath = asset[0];
                        }
                    });

                    pathId = highestPath;
                }
            } else if (projectFile.deployment?.incrementalMode === true) {
                if (pathCount >= pathsLength) pathCount = 0;
                return pathCount++;
            } else {
                pathId = Object.keys(deployedProject.paths).filter(
                    (key) => key !== 'default'
                )[
                    Math.floor(
                        Math.random() *
                            Object.keys(deployedProject.paths).length
                    )
                ];
            }

            return pathId;
        };

        pathId = getPathId();
        if (pathId === undefined || pathId === 'default') pathId = 0;

        if (
            projectFile.deployment.stopDuplicateMint &&
            lastPathId !== null &&
            lastPathId == pathId
        ) {
            Controller.log('- stopping duplicate mint'.dim);
            let attempts = 10;
            while (lastPathId === pathId && attempts-- > 0) {
                pathId = getPathId(true);
            }

            if (attempts <= 0) {
                console.log(
                    '! Failed to get different pathId to the last in 10 attempts !'
                        .red
                );

                if (selection.length !== 0) pathId = selection[0][0];
            }
        }

        lastPathId = pathId;

        let settings =
            deployedProject.paths[pathId] || deployedProject.paths.default;
        let colours = [];
        let obj = {};
        let pathSize = deployedProject?.paths[pathId]?.pathSize || 1;

        if (projectFile.modules.controller.indexOf('Pregen') === -1) {
            let extraColours =
                deployedProject.deployment.extraColours ||
                Controller.defaultDeployment.extraColours ||
                6;

            if (Controller.deployConfig.usingOldColours) {
                if (settings.uploadColours) {
                    Controller.log('- Using stored colours');
                    colours = settings.paths.colours;
                    Controller.log('- Replacing special colour codes');
                    colours = replaceColours(colours);
                } else if (pathSize !== undefined) {
                    Controller.log('- Random colours');
                    for (let i = 0; i < pathSize; i++)
                        colours.push(Math.floor(Math.random() * 0xffffff));

                    totals.generatedColours += pathSize;
                }

                Controller.log('- Adding extra colours');
                for (let i = 0; i < extraColours; i++) {
                    colours.push(Math.floor(Math.random() * 0xffffff));
                }

                totals.generatedColours += extraColours;

                Controller.log('\nColours: '.blue);
                console.log(
                    [...colours].map((colour) =>
                        tinySVG.toHexFromDecimal(colour)
                    )
                );
            } else {
                if (pathSize !== undefined) {
                    let div = projectFile.deployment?.colourChunkSize;
                    if (pathSize <= div) {
                        colours = [
                            Math.floor(Math.random() * 0xffffff),
                            pathSize,
                            Math.floor(Math.random() * 0xffffffff),
                            extraColours,
                        ];
                    } else {
                        let div = projectFile.deployment?.colourChunkSize || 4;
                        let groups = 1 + Math.floor(pathSize / div);
                        let objects = [];
                        let count = 0;
                        let tempPathSize = pathSize;
                        for (let i = 0; i < groups * 2; i++) {
                            if (i % 2 == 0)
                                objects[i] = Math.floor(
                                    Math.random() * 0xffffff
                                );
                            else {
                                let result = tempPathSize - div * count++;
                                objects[i] = result > div ? div : result;
                            }
                        }

                        objects.push(Math.floor(Math.random() * 0xffffffff));
                        objects.push(extraColours);
                        colours = objects;
                    }

                    Controller.log('\nMinified Colours: '.blue);
                    console.log(colours);
                }
            }

            try {
                //get the mintData stuff
                let methods =
                    projectFile.paths[pathId].methods ||
                    projectFile.paths.default.methods ||
                    {};

                if (
                    projectFile.paths[pathId]?.mintData ||
                    projectFile.paths.default?.mintData
                ) {
                    Controller.log('- setting hardcoded mintData');
                    obj =
                        projectFile.paths[pathId].mintData ||
                        projectFile.paths.default.mintData;
                } else if (methods?.getMintData) {
                    Controller.log('- calling getMintData');
                    obj = methods?.getMintData(pathId, tokenId);
                }
            } catch (error) {
                console.log('could not get mint data stuff');
            }
        }

        if (pathId >= pathsLength) pathId = pathsLength - 1;

        //select assets
        let returnedAssets = [];
        if (deployedProject.assetTree !== undefined) {
            let sections = Object.values(
                deployedProject.assetTree.sectionAssets
            );
            let assets = Object.values(deployedProject.assets);
            let findAsset = (assetId) => {
                return assets
                    .filter((asset) => asset.paths?.assetId == assetId)
                    .pop();
            };

            for (let i = 0; i < sections.length; i++) {
                let sectionAssets = Object.values(sections[i]);

                sectionAssets = sectionAssets.filter((assetId) => {
                    let asset = findAsset(assetId);
                    return (
                        asset.rarity === 100 ||
                        (asset.rarity || 0) > Math.floor(Math.random() * 100)
                    );
                });

                if (sectionAssets.length === 0) returnedAssets.push(0);
                else if (sectionAssets.length == 1)
                    returnedAssets.push(sectionAssets.pop());
                else
                    returnedAssets.push(
                        sectionAssets[
                            Math.floor(
                                Math.random() *
                                    Object.keys(sectionAssets).length
                            )
                        ]
                    );
            }
        }

        //decide names
        //TODO: Load pregen names here
        let names = [];
        try {
            if (projectFile.deployment.matchedMode === true) {
                names.push(projectFile.paths[pathId].name);
            } else {
                if (
                    projectFile.names !== undefined &&
                    Object.values(projectFile.names).length !== 0
                ) {
                    let max = projectFile.deployment.nameCount;
                    let count = Math.random() * max;

                    for (let i = 0; i < count; i++)
                        names.push(
                            Object.values(projectFile.names)[
                                Math.floor(
                                    Math.random() * projectFile.names.length
                                )
                            ]
                        );
                }
            }
        } catch (error) {
        } finally {
            names.push(projectFile.description.token);
        }

        names = names.filter((name) => name !== undefined);
        console.log('\nNames: '.blue);
        console.log(names);

        /**
         * Mint
         */
        let tx;
        let receipt;
        try {
            tx = await erc721.implicitMint(
                address,
                projectFile.modules.controller.indexOf('Pregen') === -1
                    ? pathId
                    : tokenId,
                settings?.paths?.pathSize || 1,
                colours,
                ethers.utils.hexlify(
                    ethers.utils.toUtf8Bytes(JSON.stringify(obj))
                ),
                returnedAssets,
                names,
                {
                    gasLimit:
                        Controller.defaultNetwork == 'ganache'
                            ? 8000000
                            : 3000000,
                    gasPrice: Controller.getGasPrice(),
                }
            );
            receipt = await tx.wait();
        } catch (error) {
            console.log('BAD MINT!'.red);
            console.error(error);
            continue;
        }

        //decode event
        let data = ethers.utils.defaultAbiCoder.decode(
            ['address', 'bytes'],
            receipt.logs[1].data
        );
        let types = [
            { type: 'uint32', name: 'pathId' },
            { type: 'uint32', name: 'pathSize' },
            { type: 'uint32', name: 'currentTokenId' },
            { type: 'address', name: 'owner' },
            { type: 'bytes', name: 'colours' },
            { type: 'bytes', name: 'mintData' },
            { type: 'uint32[]', name: 'assets' },
            { type: 'string[]', name: 'names' },
            { type: 'address[]', name: 'destinations' },
        ];

        if (contractSettings.isIncremental) pathId++;

        let result = {
            ...ethers.utils.defaultAbiCoder.decode(
                Controller.deployConfig.abiHelpers?.encoding?.types || types,
                data[1]
            ),
        };

        if (
            Controller.deployConfig.abiHelpers?.encoding?.encoder !==
                undefined &&
            typeof Controller.deployConfig.abiHelpers?.encoding?.encoder ===
                'function'
        ) {
            result = Controller.deployConfig.abiHelpers?.encoding?.encoder(
                result,
                ethers,
                tinySVG,
                deployedProject,
                projectFile
            );
        }

        let gasCost = ethers.utils.formatEther(
            receipt.gasUsed.mul(receipt.effectiveGasPrice)
        );

        let mintData =
            typeof result.mintData !== 'object'
                ? JSON.parse(ethers.utils.toUtf8String(result.mintData))
                : result.mintData;

        //add ton name count
        if (result.names !== undefined)
            result.names.forEach((value) => {
                if (
                    value.toLowerCase() ===
                    deployedProject.description.token.toLowerCase()
                )
                    return;

                if (totals.nameCount[value] == undefined) {
                    totals.nameCount[value] = 1;
                } else totals.nameCount[value] += 1;
            });

        if (deployedProject.paths[pathId].addPathToName) {
            result.names.push(deployedProject.paths[pathId].name);
        }

        if (mintData !== undefined && Object.keys(mintData).length !== 0) {
            Controller.log('\nMintdata: '.cyan);
            console.log(mintData);

            if (
                projectFile.modules.controller.indexOf('Pregen') !== -1 &&
                mintData.uriWeb2 !== undefined
            ) {
                console.log(' - Setting tokenURI to ' + mintData.uriWeb2);
                tx = await erc721.setTokenURI(
                    result.currentTokenId,
                    mintData.uriWeb2
                );
            }
        }

        if (result.assets.length !== 0) {
            Controller.log('\nAssets: '.blue);
            console.log(result.assets);
        }

        Controller.log('\n');
        console.log(
            (
                `> minted ${result.names.join(' ')} pathId ${result.pathId} ` +
                'gas cost: ' +
                gasCost +
                ' eth/matic\n\n'
            ).green.underline +
                `real money cost: $${
                    (parseInt(
                        Controller.deployConfig.networks[
                            Controller.defaultNetwork
                        ]?.tokenPrice?.ethusd
                    ) || 1) * parseFloat(gasCost)
                }`.gray
        );
        receipt = Controller.logTx(receipt);

        let end = Date.now();
        totals.outcomes[tokenId] = {
            start: start,
            end: end,
            assets: result.assets,
            gasPrice: parseFloat(gasCost),
            gasUsed: parseInt(receipt.gasUsed.toString()),
            timeElapsed: end - start,
            pathId: parseInt(result.pathId),
            name: result.names.join(' '),
            assetCount: result.assets.length,
            receipt: receipt,
        };

        //every 10th token
        if (++totals.rangeCount >= range) {
            totals.rangeCount = 0;
            //work out average from last 10 tokens
            let totalGas = 0;
            let totalTime = 0;
            let numbers = [];

            //add total gas + total time together and add to numbers array
            Object.keys(totals.outcomes).map((value) => {
                if (value < tokenId && value >= tokenId - range) {
                    totalGas += totals.outcomes[value].gasUsed;
                    totalTime += totals.outcomes[value].timeElapsed || 0;
                    numbers.push(value);
                }
            });

            //add gas average to totals
            totals.gasAverages[tokenId - (range - 1) + '-' + tokenId] =
                totalGas / numbers.length;
            //add time average to total;s
            totals.timeAverages[tokenId - (range - 1) + '-' + tokenId] =
                Math.floor(totalTime / numbers.length);

            //gets the mode of the outcomes using pathId
            let pathIds = [];
            numbers.forEach((value) => {
                pathIds.push(totals.outcomes[value].pathId);
            });

            //add most common path for last 10 tokens to totals
            totals.mostCommonPath[tokenId - (range - 1) + '-' + tokenId] =
                parseInt(getMostCommonNumber(pathIds));
        }

        if (
            totals.rangeCount %
                (Controller.deployConfig.mintAllSaveMod || 5) ===
            0
        ) {
            //write it
            Controller.log(
                (
                    `- Saving statistics to ${process.cwd()}/results/` +
                    Controller.deployConfig.project +
                    '.json'
                ).dim
            );
            Controller.writeInformation(
                totals,
                './results/' + Controller.deployConfig.project + '.json'
            );
        }
    }

    Controller.log('\n > Completed mint'.blue);

    //add total gas and time
    let totalGas = 0;
    let totalGasUsed = 0;
    let totalTime = 0;
    let outcomes = Object.values(totals.outcomes);
    let times = {};
    let prices = {};

    outcomes.forEach((value, index) => {
        totalTime += value.timeElapsed;
        totalGas += value.gasPrice;
        totalGasUsed += value.gasUsed;
        times[index] = value.timeElapsed;
        prices[index] = value.gasPrice;
    });

    let now = Date.now();

    totals._final = {
        project: Controller.deployConfig.project,
        completed: now,
        timeElapsedSeconds: parseFloat(
            ((now - totals.started) / 1000).toFixed(1)
        ),
        timeElapsedMinutes: parseFloat(
            ((now - totals.started) / 1000 / 60).toFixed(1)
        ),
        seedNumber:
            deployedProject.deployment?.seedNumber ||
            Controller.deployConfig?.seedNumber ||
            Controller.defaultDeployment.seedNumber,
        generatedColours: totals.generatedColours,
        timeElapsedMiliseconds: now - totals.started,
        timeElapsedHours: parseFloat(
            ((now - totals.started) / 1000 / 60 / 60).toFixed(1)
        ),
        totalMissed: totalSupply - outcomes.length,
        totalMints: outcomes.length,
        totalGasCost: totalGas,
        totalGasUsed: totalGasUsed,
        mostCommonName: getHighestKey(totals.nameCount),
        leastCommonName: getLowestKey(totals.nameCount),
        slowestMint: totals.outcomes[getHighestKey(times)],
        fastestMint: totals.outcomes[getLowestKey(times)],
        mostExpensiveMint: totals.outcomes[getHighestKey(prices)],
        leastExpensiveMint: totals.outcomes[getLowestKey(prices)],
        mostCommonPath: parseInt(getMostCommonNumber(totals.mostCommonPath)),
        leastCommonPath: parseInt(getLeastCommonNumber(totals.mostCommonPath)),
        averageGasCost: totalGas / outcomes.length,
        averageTimeTaken: totalTime / outcomes.length,
    };
    Controller.writeInformation(
        totals,
        './results/' + Controller.deployConfig.project + '.json'
    );

    Controller.writeInformation(
        totals,
        './results/' + Controller.deployConfig.project + '_completed.json'
    );

    if (
        totals._final.totalMissed <=
        (Controller.deployConfig?.mintAllRangeSize || 10)
    )
        //margin of 10
        Controller.writeInformation(
            totals,
            './results/' + Controller.deployConfig.project + '_perfect.json'
        );

    Controller.log('\n> Finished\n'.magenta);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
