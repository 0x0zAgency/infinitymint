//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

abstract contract EASObjects {
    struct EASObject {
        uint256 stickerId;
        address EASDestination;
        address EASWalletDestination;
        string uri;
        uint256 created;
        uint256 updated;
        bool valid;
    }

    /// @notice Copied behavours of the open zeppelin content due to prevent msg.sender rewrite through assembly
    function sender() internal view returns (address) {
        return (msg.sender);
    }

    /// @notice Copied behavours of the open zeppelin content due to prevent msg.sender rewrite through assembly
    function value() internal view returns (uint256) {
        return (msg.value);
    }
}
