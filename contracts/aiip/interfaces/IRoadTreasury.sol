// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/// @notice Draft budget-capped utility-fee accounting API, not an implementation.
/// @dev Chain gas fees are outside this cap. Rights-holder royalties are distinct.
interface IRoadTreasury {
    event FeeCollected(
        uint64 indexed budgetPeriod,
        address indexed paymentAsset,
        bytes32 indexed settlementId,
        uint256 amount
    );
    event NodeServicePaid(
        address indexed eligibleOperator,
        bytes32 indexed serviceId,
        uint256 amount
    );
    event FeeCapReached(uint64 indexed budgetPeriod, address indexed paymentAsset);

    /// @notice Apply approved basis points and remaining budget capacity.
    function quoteFee(address paymentAsset, uint256 grossAmount)
        external view returns (uint256);

    /// @notice Max collectible fee remaining this budget period in asset units.
    function remainingBudgetCapacity(address paymentAsset)
        external view returns (uint256);

    /// @notice An operational fee recipient must run a qualifying node AND Road service.
    function isEligibleNodeOperator(address operator)
        external view returns (bool);
}
