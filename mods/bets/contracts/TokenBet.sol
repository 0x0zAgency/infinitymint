//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import 'infinitymint/alpha/InfinityMint.sol';
import 'infinitymint/alpha/InfinityMintStorage.sol';
import 'infinitymint/alpha/Authentication.sol';
import 'infinitymint/alpha/InfinityMintObject.sol';
import './Bet.sol';

contract Mod_TokenBet is Mod_Bet {
    InfinityMintStorage internal storageController;

    constructor(
        address oracleDestination,
        address erc721Destination,
        string memory defaultBetURI,
        uint256 startingPrice,
        uint256 startingHousePercentage,
        address storageDestination
    )
        Mod_Bet(
            oracleDestination,
            erc721Destination,
            defaultBetURI,
            startingPrice,
            startingHousePercentage
        )
    {
        storageController = InfinityMintStorage(storageDestination);
    }

    function placeBet(uint256 tokenId) public payable override {
        require(
            infinityMint.isApprovedOrOwner(sender(), tokenId),
            'must be token holder'
        );

        InfinityObject memory temp = storageController.get(uint32(tokenId));
        require(branches[temp.pathId].length != 0, 'no branch for this path');
        super.placeBet(temp.pathId);
    }
}
