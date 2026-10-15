// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/// @notice Draft universal and weighted user-governance query API.
/// @dev Personhood/Sybil checks and contribution formula are external design problems.
interface IRoadGovernance {
    event ProposalRegistered(uint256 indexed proposalId, address indexed proposer);
    event VoteRecorded(uint256 indexed proposalId, bytes32 indexed voterId, uint256 weight, bool support);
    event ProposalExecuted(uint256 indexed proposalId);

    /// @notice All eligible unique users receive nonzero baseline weight.
    /// @dev Extra contributions must be bounded and not purchasable.
    function votingWeight(bytes32 voterId, uint256 snapshotId)
        external view returns (uint256);

    /// @notice True after governance approval AND timelock expiry.
    function canExecute(uint256 proposalId) external view returns (bool);
}
