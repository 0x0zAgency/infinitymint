// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/// @notice A building is a separate contract that records typed links to IP bricks.
/// @dev Listing a brick does NOT imply copyright transfer or a license grant.
interface IYellowBrickStructure {
    event MemberLinked(
        address indexed memberBrick,
        bytes32 indexed relationshipType,
        bytes32 indexed evidenceHash,
        uint256 memberIndex
    );
    event MemberUnlinked(address indexed memberBrick, uint256 indexed memberIndex);

    function structureType() external view returns (bytes32);
    function memberCount() external view returns (uint256);
    function memberAt(uint256 index) external view returns (
        address memberBrick,
        bytes32 relationshipType,
        bytes32 evidenceHash,
        bool active
    );
    function linkMember(
        address memberBrick,
        bytes32 relationshipType,
        bytes32 evidenceHash
    ) external;
}
