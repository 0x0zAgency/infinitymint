//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './EASWallet.sol';
import './IEASRegistry.sol';
import './IEASReceiver.sol';

/**
    Each Token Gets a Receiver
 */
contract EASReceiver is EASWallet, IEASRegistry {
    address public manager;
    address public minter;

    /// @notice Creates new wallet contract, tokenId refers to the ERC721 contract this wallet was spawned from.
    /// @dev makes the owner field the owner of the contract not the deployer.
    /// @param tokenId the tokenId from the main ERC721 contract
    /// @param erc721Destination the main ERC721 contract
    constructor(
        uint32 tokenId,
        address erc721Destination,
        address minterDestination,
        address managerDestination
    ) EASWallet(tokenId, erc721Destination) {
        minter = minterDestination;
        manager = managerDestination;
    }

    function registerInterface() public pure returns (bytes4) {
        return type(IEASReceiver).interfaceId;
    }
}
