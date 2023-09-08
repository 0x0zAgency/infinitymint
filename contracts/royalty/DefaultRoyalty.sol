//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import '../Royalty.sol';

/**
    Needs to only allow the deployer to withdraw/set the price
 */
contract DefaultRoyalty is Royalty {
    mapping(uint256 => uint256) public counter;

    constructor(address valuesContract) Royalty(valuesContract) {}

    function incrementBalance(uint256 value, uint256 splitType)
        external
        override
        onlyApproved
        onlyOnce
    {
        //register as free
        if (value <= 0) {
            registerFree(splitType);
            return;
        }

        counter[splitType] = counter[splitType] + 1;
        //just give the deployer the entire value
        values[deployer] = values[deployer] + value;
    }
}
