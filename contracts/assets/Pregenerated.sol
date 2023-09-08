//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './SimpleImage.sol';

//Traditional 1:1 mint
contract Pregenerative is SimpleImage {
    //holds json objects
    mapping(uint32 => bytes) internal mintData;

    /**

	 */
    constructor(string memory _tokenName, address valuesContract)
        SimpleImage(_tokenName, valuesContract)
    {
        assetsType = 'pregenerated';
    }

    /**
		Sets the mint data for this token
	 */

    function setMintData(uint32 index, bytes memory _mintData)
        public
        onlyApproved
    {
        if (bytes(mintData[index]).length != 0) revert('Already set');

        mintData[index] = _mintData;
    }

    //nameCount is actually tokenId
    function getNames(uint256 nameCount, RandomNumber)
        public
        virtual
        override
        returns (string[] memory results)
    {
        if (names.length > nameCount) {
            results = new string[](1);
            results[0] = getDefaultName();
        } else {
            results = new string[](2);
            results[0] = names[nameCount];
            results[1] = getDefaultName();
        }
    }

    //no assets
    function getRandomAsset(uint32 pathId, RandomNumber randomNumberController)
        public
        view
        virtual
        override
        returns (uint32[] memory assetsId)
    {}

    /**
		Mint data is the tokenURI and pathId is actually the tokenId
	 */
    function getMintData(
        uint32 pathId,
        uint32,
        RandomNumber
    ) public virtual override returns (bytes memory) {
        bytes memory result = mintData[pathId];
        if (bytes(result).length == 0) return '{}';
        return result;
    }
}
