//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import 'contracts/InfinityMint.sol';
import 'contracts/InfinityMintStorage.sol';
import 'contracts/Authentication.sol';
import 'contracts/InfinityMintObject.sol';
import './Bet.sol';

contract Mod_HouseOracle is Authentication, InfinityMintObject {
    uint256[] public activeGames;
    uint256 private currentGameId;

    struct Game {
        address contractDestination;
        uint256 initialPot;
        uint256 startingPrice;
        uint256 branchCount;
        uint256 winningBranchId;
        uint256 finalPot;
        bool valid;
        bool finished;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => address[]) public approvals;

    function getActiveGameCount() external view returns (uint256) {
        return activeGames.length;
    }

    function start(address betContractDestination) public onlyApproved {
        Mod_Bet betContract = Mod_Bet(betContractDestination);
        require(!betContract.registered(), 'already registered');
        betContract.begin();
        games[currentGameId] = Game(
            betContractDestination,
            betContract.pot(),
            betContract.basePrice(),
            betContract.branchCount(),
            0,
            0,
            true,
            false
        );
        activeGames.push(currentGameId++);
    }

    function end(uint256 gameId) public onlyApproved {
        require(
            games[gameId].valid && !games[gameId].finished,
            'game is not valid or has already finished'
        );
        require(
            approvals[gameId].length != 0,
            'approvals to end the game are at zero'
        );
        require(
            approvals[gameId].length >= 2,
            'needs two or more admins to approve the game'
        );

        Mod_Bet betContract = Mod_Bet(games[gameId].contractDestination);
        games[gameId].finalPot = betContract.pot();
        betContract.finish(games[gameId].winningBranchId);
        games[gameId].finished = true;

        //remove from active games
        uint256 length = activeGames.length;
        for (uint256 i = 0; i < length; ) {
            if (activeGames[i] == gameId) {
                activeGames[i] = activeGames[length - 1];
                activeGames.pop();
                break;
            }

            unchecked {
                ++i;
            }
        }
    }

    function close(uint256 gameId, uint256 branchId) public onlyApproved {
        require(
            games[gameId].valid && !games[gameId].finished,
            'game is not valid or has already finished'
        );
        require(
            approvals[gameId].length == 0,
            'already in the process of closing'
        );

        Mod_Bet betContract = Mod_Bet(games[gameId].contractDestination);
        betContract.close();
        games[gameId].winningBranchId = branchId;
        approvals[gameId].push(sender());
    }
}
