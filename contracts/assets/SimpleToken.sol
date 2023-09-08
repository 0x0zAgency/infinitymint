//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import '../InfinityMintAsset.sol';

contract SimpleToken is InfinityMintAsset {
    //holds json objects
    mapping(uint32 => bytes) internal mintData;

    /**

	 */

    constructor(string memory _tokenName, address valuesContract)
        InfinityMintAsset(valuesContract)
    {
        tokenName = _tokenName;
        assetsType = 'json';
    }

    function getNextPathId(RandomNumber randomNumberController)
        public
        virtual
        override
        returns (uint32)
    {
        if (pathCount == 1 && disabledPaths[safeDefaultReturnPath])
            revert('No valid paths');

        if (valuesController.isTrue('incrementalMode')) {
            nextPath = lastPath++;
            if (nextPath >= pathCount) {
                lastPath = uint32(safeDefaultReturnPath);
                nextPath = uint32(safeDefaultReturnPath);
            }
            while (disabledPaths[nextPath]) {
                if (nextPath >= pathCount)
                    nextPath = uint32(safeDefaultReturnPath);
                nextPath++;
            }
            return nextPath;
        } else {
            uint32 pathId = uint32(
                randomNumberController.getMaxNumber(pathCount)
            );

            if (disabledPaths[pathId] || pathId >= pathCount)
                pathId = uint32(safeDefaultReturnPath);

            return pathId;
        }
    }

    /**
		Sets the mint data for this token
	 */

    function setMintData(uint32 index, bytes memory _mintData)
        public
        onlyApproved
    {
        if (!InfinityMintUtil.isEqual(mintData[index], ''))
            revert('Already set');

        mintData[index] = _mintData;
    }

    /// @notice Returns mint data associated with the path id or the token Id depending on the configuration of the smart token contract
    function getMintData(
        uint32 pathId,
        uint32 tokenId,
        RandomNumber randomNumberController
    ) public virtual override returns (bytes memory) {
        string memory result;
        if (valuesController.isTrue('mintDataUsePaths'))
            result = abi.decode(mintData[pathId], (string));
        else if (
            valuesController.isTrue('mintDataGenerative') &&
            !(bytes(mintData[pathId]).length == 0)
        ) {
            (
                string[] memory keys,
                uint32[] memory minValues,
                uint32[] memory maxValues,
                uint32 length
            ) = abi.decode(
                    mintData[pathId],
                    (string[], uint32[], uint32[], uint32)
                );

            string memory _s;
            for (uint256 i = 0; i < length; i++) {
                uint256 number = randomNumberController.getMaxNumber(
                    maxValues[i]
                );
                if (number < minValues[i]) number = minValues[i];

                _s = string(
                    abi.encode(
                        _s,
                        '"',
                        keys[i],
                        '": ',
                        InfinityMintUtil.toString(number),
                        i != length - 1 ? ',' : ''
                    )
                );

                result = string(abi.encode('{', _s, '}'));
            }
        } else result = string(mintData[tokenId]);

        if (bytes(result).length == 0) return bytes('');

        return bytes(result);
    }
}
