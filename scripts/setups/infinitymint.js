const Controller = require('../../src/Controller');
const { splitSet, pickKeys, md5, fixColours } = require('../../src/helpers');

const setup = async ({ tempProjectFile, assetContract }) => {
    //select which set up script to go with
    Controller.log('- Writing temp_uri');
    Controller.writeInformation(tempProjectFile, './.temp_project');

    //if we have paths
    try {
        if (tempProjectFile.stages['paths'] !== true) {
            //if
            if (
                tempProjectFile.errors !== undefined &&
                tempProjectFile.errors['paths']
            ) {
                Controller.log('- Resetting paths due to previous error');
                await assetContract.resetPaths();
            }
            //if no paths
            if (tempProjectFile.paths === undefined) {
                Controller.log('WARNING: No paths found in object URI'.red);
            } else {
                /**
                 * Upload paths to IPFS/set in contract
                 */
                Controller.log('+ uploading paths to contract\n'.magenta);

                //define new object for the results to be added to the projectFile later
                let processedPaths = {};
                //the actual pathId is numerical and does not support keys which are not numerical so we
                //keep the actual pathId here and increment it each loop
                let actualPathId = 0;
                //the length of the paths in total (this is so we can tell the user how many are left)
                let len = Object.keys(tempProjectFile.paths).length - 1;
                //loop through
                for (let [index, path] of Object.entries(
                    tempProjectFile.paths
                )) {
                    //skip default
                    if (index === 'default') continue;

                    Controller.log(`\n+ path ${actualPathId + 1}/${len}`.blue);

                    let defaultPath = tempProjectFile?.paths?.default || {};
                    let valCopy = { ...path };
                    //copy over the default path and then merge it with the value of this path so
                    //default path values are copied to all paths and then overwritten by that path
                    path = {
                        ...defaultPath,
                        ...path,
                    };

                    if (
                        path.content !== undefined ||
                        defaultPath.content !== undefined
                    ) {
                        if (valCopy.content === undefined) {
                            path.content = { ...defaultPath.content };
                        } else {
                            //wtf?
                            path.content = {
                                ...defaultPath.content,
                                ...path.content,
                                ...valCopy.content,
                            };
                        }
                    }

                    path.paths = await Controller.uploadObject(
                        path,
                        actualPathId
                    );
                    //store it
                    processedPaths[actualPathId] = {
                        ...path,
                        rarity: path.rarity || 1,
                        pathSize: path.paths?.pathSize || 0,
                        pathId: actualPathId,
                    };
                    //increment actual path ID
                    actualPathId++;
                    Controller.log('\n');
                }

                let pathCount = Object.values(processedPaths).length;
                Controller.log(
                    ' - Setting path count of ' + pathCount + ' in contract '
                );

                let tx = await assetContract.setPathCount(pathCount);
                Controller.logTx(await tx.wait());
                Controller.log(' ☻ Success'.green);

                let picks = splitSet(
                    //creates an object containing two arrays named path and pathSize
                    pickKeys(['pathSize'], processedPaths), //picks from the object these two keys and
                    //creates a new object with each value being the array of values picked from the object
                    [], //leaving blank will use the keys of the object passed to pick from
                    Controller.deployConfig.pathChunkSize || 10, //sets of 25,
                    true //throw if there is a miscount in the picked keys
                ).reverse();

                //set each chunk inside of the contract
                while (picks.length !== 0) {
                    let selection = picks.pop();
                    Controller.log(
                        ' - Setting pathSizes ' +
                            selection.pathSize.length +
                            ' in contract ' +
                            picks.length +
                            ' chunks left'
                    );

                    let tx = await assetContract.setPathSizes(
                        selection.pathSize
                    );
                    tx = await tx.wait();
                    Controller.logTx(tx);
                    Controller.log(' ☻ Success'.green);
                }

                if (
                    tempProjectFile.modules.controller.indexOf('Rarity') !== -1
                ) {
                    //set the rarities for all paths
                    let selection = pickKeys(['rarity'], processedPaths).rarity;
                    if (selection.length !== 0) {
                        if (
                            selection.length !==
                            Object.keys(processedPaths).length
                        )
                            throw new Error(
                                'rarities does not match the count of paths in the contract'
                            );

                        Controller.log(' - setting rarities in contract');
                        let tx = await assetContract.pushPathRarities(
                            Object.values(selection)
                        );
                        tx = await tx.wait();
                        Controller.logTx(tx);
                        Controller.log(' ☻ Success'.green);
                    }
                }

                //add the default path back to the new paths
                processedPaths.default = {
                    ...tempProjectFile.paths.default,
                };

                //set projectFile paths to be new paths
                tempProjectFile.paths = processedPaths;
            }

            //passed
            tempProjectFile.stages['paths'] = true;

            if (tempProjectFile.errors['paths'] !== undefined)
                delete tempProjectFile.errors['paths'];
        }
    } catch (error) {
        if (tempProjectFile.errors === undefined) tempProjectFile.errors = {};

        Controller.log(error);
        tempProjectFile.errors['paths'] = error;

        Controller.log('- Writing temp_uri');
        Controller.writeInformation(tempProjectFile, './.temp_project');
        throw error;
    }

    return tempProjectFile;
};

module.exports = setup;
