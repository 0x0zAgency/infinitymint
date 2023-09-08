//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;
import '../Royalty.sol';

/**
    Needs
 */
contract SplitRoyalty is Royalty {
    mapping(uint256 => uint256) public counter;

    bytes[] private splits;

    constructor(address valuesContract) Royalty(valuesContract) {}

    function addSplit(
        address addr,
        uint256 percentage,
        uint256 splitType
    ) public onlyDeployer {
        splits.push(abi.encode(addr, percentage, splitType));
    }

    function getCount(uint256 splitType) external view returns (uint256) {
        return counter[splitType];
    }

    function getSplitCount() external view returns (uint256) {
        return splits.length;
    }

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

        //if no splits / bad split added just give the deployer the entire value
        if (
            splits.length == 0 ||
            splitType > splits.length ||
            splitType < 0 ||
            value < 100 //cannot split correctly
        ) {
            values[deployer] = values[deployer] + value;
            return;
        }

        bool flag = false;
        uint256 _value = value;
        for (uint256 i = 0; i < splits.length; i++) {
            if (_value < 0) revert('Too many royalty splits');

            address _addr;
            uint256 percentage;
            uint256 _splitType;
            (_addr, percentage, _splitType) = abi.decode(
                splits[i],
                (address, uint256, uint256)
            );

            if (percentage <= 0)
                revert('Precentage is less than zero or equal to zero');

            if (splitType != _splitType) continue;

            uint256 profit = (value / 100) * percentage;

            if (profit <= 0) revert('Profit is less than or equal zero');

            values[_addr] = values[_addr] + profit;
            _value = _value - profit;
            flag = true;
        }

        require(flag, 'did not increment any profits');
        //if there are any remaining profits just give them to the dployer
        if (_value > 0) values[deployer] = values[deployer] + _value;
    }

    function resetSplits() public onlyDeployer {
        splits = new bytes[](0);
    }

    function getSplits(address addr)
        external
        view
        returns (uint256[] memory split)
    {
        for (uint256 i = 0; i < splits.length; i++) {
            (address _addr, uint256 percentage, uint256 splitType) = abi.decode(
                splits[i],
                (address, uint256, uint256)
            );

            if (_addr == addr) split[splitType] = percentage;
        }
    }
}
