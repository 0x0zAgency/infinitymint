// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/// @title IYellowBrick
/// @notice Draft ABI for an individual IP contract on the 0x Yellow Brick Road.
/// @dev Registration records claims and commitments, not legal proof of copyright.
interface IYellowBrick {
    event ModuleUpdated(bytes32 indexed moduleType, address indexed module, uint64 version);
    event MetadataUpdated(bytes32 indexed contentHash, string metadataURI, uint64 version);

    /// @notice Chain-independent IP identity committed at registration.
    function ipId() external view returns (bytes32);

    /// @notice Stable hash/commitment to the registered IP content or canonical manifest.
    function contentHash() external view returns (bytes32);

    /// @notice Wallet that paid to originate the deployed on-chain brick.
    function originator() external view returns (address);

    /// @notice Protocol administrator of this brick; not automatic copyright ownership.
    function controller() external view returns (address);

    /// @notice URI describing the current versioned metadata, rights assertions and evidence.
    function metadataURI() external view returns (string memory);

    /// @notice Resolve a typed Rights, License, Usage, Provenance or Settlement module.
    function moduleFor(bytes32 moduleType) external view returns (address);
}
