//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;
//SafeMath Contract
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../RandomNumber.sol';

contract UnsafeRandom is RandomNumber {
    uint256 internal numberSeed = 12456789;

    constructor(uint32 seedNumber, address valuesContract)
        RandomNumber(valuesContract)
    {
        numberSeed = seedNumber;
    }

    function returnNumber(uint256 maxNumber, uint256 _salt)
        public
        view
        override
        returns (uint256)
    {
        if (maxNumber <= 0) maxNumber = 1;
        uint256 c = uint256(
            keccak256(
                abi.encode(
                    numberSeed,
                    _salt,
                    maxNumber,
                    block.difficulty,
                    block.number,
                    block.timestamp,
                    msg.sender, //is this contract or who ever calls this
                    randomnessFactor
                )
            )
        );

        (bool safe, uint256 result) = SafeMath.tryMod(c, maxNumber);

        if (safe) return result;

        return 0;
    }
}
