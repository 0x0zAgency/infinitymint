//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './Authentication.sol';
import './InfinityMintStorage.sol';
import './Asset.sol';
import './RandomNumber.sol';
import './InfinityMintObject.sol';

/// @title Minter Interface
/// @author 0xTinman.eth
/// @notice The purpose of this interface is to lay the foundation for a minter contract designed to produce a valid InfinityObject at the end of it
/// @dev
abstract contract Minter is Authentication {
    Asset public assetController;
    InfinityMintValues public valuesController;
    InfinityMintStorage public storageController;
    RandomNumber public randomNumberController;

    /*
     */
    constructor(
        address valuesContract,
        address storageContract,
        address assetContract,
        address randomNumberContract
    ) {
        valuesController = InfinityMintValues(valuesContract);
        storageController = InfinityMintStorage(storageContract);
        assetController = Asset(assetContract);
        randomNumberController = RandomNumber(randomNumberContract);
    }

    function setAssetController(address assetContract) public onlyApproved {
        assetController = Asset(assetContract);
    }

    function setStorageController(address storageContract) public onlyApproved {
        storageController = InfinityMintStorage(storageContract);
    }

    function setRandomNumberController(address randomNumberContract)
        public
        onlyApproved
    {
        randomNumberController = RandomNumber(randomNumberContract);
    }

    function mint(
        uint32 currentTokenId,
        address sender,
        bytes memory mintData
    ) public virtual returns (InfinityMintObject.InfinityObject memory);

    /**

     */
    function getPreview(uint32 currentTokenId, address sender)
        external
        virtual
        returns (uint256 previewCount);

    /*

    */
    function mintPreview(
        uint32 index,
        uint32 currentTokenId,
        address sender
    ) external virtual returns (InfinityMintObject.InfinityObject memory);
}
