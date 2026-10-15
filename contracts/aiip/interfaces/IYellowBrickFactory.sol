// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IYellowBrickFactory {
    event BrickDeployed(
        bytes32 indexed ipId,
        address indexed brick,
        address indexed originator,
        bytes32 contentHash
    );

    /// @notice Originator pays chain gas only, with no factory platform markup.
    /// @dev Implementation must reject duplicate policy violations and guard clone initialization.
    function deployBrick(
        bytes32 ipId,
        bytes32 contentHash,
        string calldata metadataURI,
        bytes32 salt
    ) external returns (address brick);

    function predictBrickAddress(
        address originator,
        bytes32 ipId,
        bytes32 salt
    ) external view returns (address predicted);
}
