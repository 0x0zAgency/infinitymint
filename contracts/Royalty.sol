//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './Authentication.sol';

/// @title InfinityMint Royalty Abstract Contract
/// @author 0xTinman.eth
abstract contract Royalty is Authentication {
    //globals
    InfinityMintValues internal valuesController;
    address public erc721Destination;

    //payout values
    mapping(address => uint256) public values;
    mapping(uint256 => uint256) public freebies;

    uint256 public tokenPrice;
    uint256 public originalTokenPrice;
    uint256 public lastTokenPrice;
    uint256 public stickerSplit;

    uint8 public constant SPLIT_TYPE_MINT = 0;
    uint8 public constant SPLIT_TYPE_STICKER = 1;

    uint256 internal remainder;

    event DispensedRoyalty(
        address indexed sender,
        uint256 amount,
        uint256 newTotal
    );

    constructor(address valuesContract) {
        valuesController = InfinityMintValues(valuesContract);

        tokenPrice =
            valuesController.tryGetValue('startingPrice') *
            valuesController.tryGetValue('baseTokenValue');
        lastTokenPrice =
            valuesController.tryGetValue('startingPrice') *
            valuesController.tryGetValue('baseTokenValue');
        originalTokenPrice =
            valuesController.tryGetValue('startingPrice') *
            valuesController.tryGetValue('baseTokenValue');

        if (valuesController.tryGetValue('stickerSplit') > 100)
            revert('sticker split is a value over 100');
        stickerSplit = valuesController.tryGetValue('stickerSplit');
    }

    function changePrice(uint256 _tokenPrice) public onlyDeployer {
        lastTokenPrice = tokenPrice;
        tokenPrice = _tokenPrice;
    }

    function registerFree(uint256 splitType) public onlyApproved {
        freebies[splitType]++;
    }

    function dispenseRoyalty(address addr)
        public
        onlyApproved
        onlyOnce
        returns (uint256 total)
    {
        if (values[addr] <= 0) revert('Invalid or Empty address');

        total = values[addr];
        values[addr] = 0;

        emit DispensedRoyalty(addr, total, values[addr]);
    }

    function incrementBalance(uint256 value, uint256 typeOfSplit)
        external
        virtual;
}
