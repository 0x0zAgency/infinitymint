//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import '../InfinityMintAsset.sol';

contract RaritySVG is InfinityMintAsset {
    uint256[] internal pathRarity;

    constructor(string memory _tokenName, address valuesContract)
        InfinityMintAsset(valuesContract)
    {
        tokenName = _tokenName;
        assetsType = 'svg'; //returns scalable vector asset
    }

    //save the last path so we may get its name later
    function getNextPathId(RandomNumber randomNumberController)
        public
        virtual
        override
        returns (uint32)
    {
        if (pathCount == 1 && disabledPaths[safeDefaultReturnPath])
            revert('No valid paths');

        uint256[] memory randNumbers = new uint256[](pathCount);
        uint32 pathId = uint32(safeDefaultReturnPath);
        uint256 count = 0;

        //count how many rarity values are greather
        for (uint256 i = 0; i < pathCount; ) {
            randNumbers[i] = randomNumberController.getMaxNumber(100);
            if (pathRarity[i] > randNumbers[i]) count++;
            unchecked {
                ++i;
            }
        }

        //construct array with length of count
        uint256[] memory selectedPaths = new uint256[](count);
        count = 0; //reset count to zero to use as index position
        for (uint256 i = 0; i < pathCount; ) {
            //populate array of selected paths
            if (pathRarity[i] > randNumbers[i]) selectedPaths[count++] = i;

            unchecked {
                ++i;
            }
        }

        if (valuesController.isTrue('randomRarity')) {
            //pick an asset
            uint256 result = randomNumberController.getMaxNumber(
                selectedPaths.length
            );
            if (result < selectedPaths.length)
                pathId = uint32(selectedPaths[result]);
            else {
                //pick an asset
                uint256 randomAssetId = randomNumberController.getMaxNumber(
                    pathCount
                );

                if (disabledPaths[randomAssetId])
                    pathId = uint32(safeDefaultReturnPath);
                else pathId = uint32(randomAssetId);
            }
        } else {
            uint256 a = 0;
            uint256 b = 0;
            if (valuesController.isTrue('lowestRarity')) {
                for (uint256 i = 0; i < selectedPaths.length; ) {
                    if (a == 0) {
                        a = pathRarity[selectedPaths[i]];
                        b = selectedPaths[i];
                    } else if (pathRarity[i] < a) {
                        a = pathRarity[selectedPaths[i]];
                        b = selectedPaths[i];
                    }

                    unchecked {
                        ++i;
                    }
                }

                if (b < pathCount) pathId = uint32(b);
                else pathId = 0;
            } else {
                //default to least rare path selection
                for (uint256 i = 0; i < selectedPaths.length; ) {
                    if (a < pathRarity[selectedPaths[i]]) {
                        a = pathRarity[selectedPaths[i]];
                        b = selectedPaths[i];
                    }

                    unchecked {
                        ++i;
                    }
                }

                if (b < pathCount) pathId = uint32(b);
                else pathId = uint32(safeDefaultReturnPath);
            }
        }

        //attempts to stop duplicate mints of the same PathId (does not work with pathId 0)
        if (
            valuesController.isTrue('stopDuplicateMint') &&
            pathId != 0 &&
            lastPath != 0 &&
            pathId == lastPath
        ) {
            uint256 _lastPath = lastPath;
            //if it is greater than or equal to two then we have an attempt
            if (selectedPaths.length >= 2) {
                uint32 attempts = 3; //try 3 times
                while (pathId == _lastPath && attempts-- >= 0) {
                    //pick an base from the select paths
                    uint256 result = randomNumberController.getMaxNumber(
                        selectedPaths.length
                    );

                    //if it is less than
                    if (result < selectedPaths.length)
                        pathId = uint32(selectedPaths[result]); //next path is this result
                    else pathId = uint32(selectedPaths[0]); //just use the first value
                }
                //just set it to zero
                if (attempts <= 0) pathId = uint32(safeDefaultReturnPath);
            } else {
                if (pathId > 1) pathId = pathId - 1;
                else if (pathId + 1 < pathCount) pathId = pathId + 1;
            }
        }

        lastPath = pathId;
        return pathId;
    }

    function pushPathRarities(uint256[] memory rarity) public onlyApproved {
        for (uint256 i = 0; i < rarity.length; ) {
            pathRarity.push(rarity[i]);

            unchecked {
                ++i;
            }
        }
    }

    function setPathRarities(uint256[] memory pathId, uint256[] memory rarity)
        public
        onlyApproved
    {
        require(pathId.length == rarity.length);

        for (uint256 i = 0; i < pathId.length; ) {
            pathRarity[pathId[i]] = rarity[i];

            unchecked {
                ++i;
            }
        }
    }

    function setPathRarity(uint256 pathId, uint256 rarity) public onlyApproved {
        require(rarity < 100); //rarity is only out of 100%
        pathRarity[pathId] = rarity;
    }
}
