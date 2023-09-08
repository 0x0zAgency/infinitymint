//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './RandomNumber.sol';

abstract contract Asset {
    struct PartialStruct {
        uint32 pathId;
        uint32 pathSize;
        uint32[] assets;
        string[] names;
        uint32[] colours;
        bytes mintData;
    }

    function getColours(uint32 pathId, RandomNumber randomNumberController)
        public
        virtual
        returns (uint32[] memory result);

    function getDefaultName() internal virtual returns (string memory);

    function getNextPath() external view virtual returns (uint32);

    function pickPath(
        uint32 currentTokenId,
        RandomNumber randomNumberController
    ) public virtual returns (PartialStruct memory);

    function isValidPath(uint32 pathId) external view virtual returns (bool);

    function pickPath(
        uint32 pathId,
        uint32 currentTokenId,
        RandomNumber randomNumberController
    ) public virtual returns (PartialStruct memory);

    function setLastAssets(uint32[] memory assets) public virtual;

    function getNames(uint256 nameCount, RandomNumber randomNumberController)
        public
        virtual
        returns (string[] memory results);

    function getRandomAsset(uint32 pathId, RandomNumber randomNumberController)
        external
        virtual
        returns (uint32[] memory assetsId);

    function getMintData(
        uint32 pathId,
        uint32 tokenId,
        RandomNumber randomNumberController
    ) public virtual returns (bytes memory);

    function addAsset(uint256 rarity) public virtual;

    function setNextPathId(uint32 pathId) public virtual;

    function setLastPathId(uint32 pathId) public virtual;

    function getPathSize(uint32 pathId) public view virtual returns (uint32);

    function getNextPathId(RandomNumber randomNumberController)
        public
        virtual
        returns (uint32);
}
