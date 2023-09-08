//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './InfinityMintValues.sol';

/// @title InfinityMint Random Number Abstract Contract
/// @author 0xTinman.eth
abstract contract RandomNumber {
    uint256 public randomnessFactor;
    bool public hasDeployed = false;
    uint256 public salt = 1;

    InfinityMintValues internal valuesController;

    constructor(address valuesContract) {
        valuesController = InfinityMintValues(valuesContract);
        randomnessFactor = valuesController.getValue('randomessFactor');
    }

    function getNumber() external returns (uint256) {
        unchecked {
            ++salt;
        }

        return returnNumber(valuesController.getValue('maxRandomNumber'), salt);
    }

    function getMaxNumber(uint256 maxNumber) external returns (uint256) {
        unchecked {
            ++salt;
        }

        return returnNumber(maxNumber, salt);
    }

    /// @notice cheap return number
    function returnNumber(uint256 maxNumber, uint256 _salt)
        public
        view
        virtual
        returns (uint256)
    {
        if (maxNumber <= 0) maxNumber = 1;
        return (_salt + 3) % maxNumber;
    }
}
