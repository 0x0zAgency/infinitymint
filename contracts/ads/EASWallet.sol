//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './../Authentication.sol';
import './../InfinityMintObject.sol';

contract EASWallet is Authentication, InfinityMintObject {
    /// @notice the location of the main ERC721 contract this wallet was spawned from;
    address public erc721;
    /// @notice the main ERC721 contract this wallet is attached too
    uint256 public currentTokenId;
    /// @notice the value/balance of the current wallet
    uint256 private walletValue;

    /// @notice Creates new wallet contract, tokenId refers to the ERC721 contract this wallet was spawned from.
    /// @dev makes the owner field the owner of the contract not the deployer.
    /// @param tokenId the tokenId from the main EAS ERC721 contract
    /// @param erc721Destinaton the main ERC721 contract
    constructor(uint256 tokenId, address erc721Destinaton) Authentication() {
        //this only refers to being allowed to deposit into the wallet
        currentTokenId = tokenId;
        erc721 = erc721Destinaton;
        walletValue = 0;
    }

    function send(address destination, uint256 amount) public onlyApproved {
        require(amount > 0);
        require(walletValue - amount >= 0);

        walletValue = walletValue - amount;
        (bool success, ) = destination.call{ value: amount }('');
        require(success, 'failure to withdraw');
    }

    /// @notice Returns the balance of the wallet
    function getBalance() public view returns (uint256) {
        return walletValue;
    }

    /// @notice Allows anyone to deposit ERC20 into this wallet.
    function deposit() public payable onlyOnce {
        uint256 value = (msg.value);
        require(value >= 0);

        walletValue = walletValue + value;
    }

    /// @notice Allows you to withdraw
    function withdraw() public onlyOnce onlyApproved {
        //to stop re-entry attack
        uint256 balance = (walletValue);
        walletValue = 0;
        payable(deployer).transfer(balance);
    }
}
