//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './InfinityMintObject.sol';

abstract contract Authentication {
    address public deployer;
    /// @notice for re-entry prevention, keeps track of a methods execution count
    uint256 private executionCount;

    mapping(address => bool) public approved;

    constructor() {
        deployer = msg.sender;
        approved[msg.sender] = true;
        executionCount = 0;
    }

    event PermissionChange(
        address indexed sender,
        address indexed changee,
        bool value
    );

    event TransferedOwnership(address indexed from, address indexed to);

    /// @notice Limits execution of a method to once in the given context.
    /// @dev prevents re-entry attack
    modifier onlyOnce() {
        executionCount += 1;
        uint256 localCounter = executionCount;
        _;
        require(localCounter == executionCount, 're-entry');
    }

    modifier onlyDeployer() {
        require(deployer == msg.sender, 'not deployer');
        _;
    }

    modifier onlyApproved() {
        require(deployer == msg.sender || approved[msg.sender], 'not approved');
        _;
    }

    function setPrivilages(address addr, bool value) public onlyDeployer {
        require(addr != deployer, 'cannot modify deployer');
        approved[addr] = value;

        emit PermissionChange(msg.sender, addr, value);
    }

    function multiApprove(address[] memory addrs) public onlyDeployer {
        require(addrs.length != 0);
        for (uint256 i = 0; i < addrs.length; ) {
            approved[addrs[i]] = true;
            unchecked {
                ++i;
            }
        }
    }

    function multiRevoke(address[] memory addrs) public onlyDeployer {
        require(addrs.length != 0);
        for (uint256 i = 0; i < addrs.length; ) {
            approved[addrs[i]] = false;
            unchecked {
                ++i;
            }
        }
    }

    function isAuthenticated(address addr) external view returns (bool) {
        return addr == deployer || approved[addr];
    }

    function transferOwnership(address addr) public onlyDeployer {
        approved[deployer] = false;
        deployer = addr;
        approved[addr] = true;

        emit TransferedOwnership(msg.sender, addr);
    }
}
