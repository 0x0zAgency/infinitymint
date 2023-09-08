//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import 'infinitymint/alpha/InfinityMint.sol';
import 'infinitymint/alpha/Authentication.sol';
import 'infinitymint/alpha/InfinityMintObject.sol';
import './HouseOracle.sol';

contract Mod_Bet is Authentication, InfinityMintObject {
    string public uri;
    bool public registered;
    bool public closing;
    uint256 public basePrice;
    uint256 public pot;
    uint256 public housePercentage;
    uint256 public branchCount;

    Mod_HouseOracle internal oracle;
    InfinityMint internal infinityMint;

    event Bet(address indexed sender, uint256 branchId, uint256 branchLength);
    event Finish(
        uint256 winningBranchId,
        uint256 totalShare,
        uint256 branchLength
    );

    mapping(uint256 => uint256) public branchLength;
    mapping(uint256 => bytes) public branches;
    mapping(address => uint256) public winnings;
    mapping(uint256 => mapping(uint256 => bytes)) internal activeBets;
    mapping(address => mapping(uint256 => uint256[])) internal bets;

    constructor(
        address oracleDestination,
        address erc721Destination,
        string memory defaultBetURI,
        uint256 startingPrice,
        uint256 startingHousePercentage
    ) {
        uri = defaultBetURI;
        oracle = Mod_HouseOracle(oracleDestination);
        infinityMint = InfinityMint(erc721Destination);
        basePrice = startingPrice;
        housePercentage = startingHousePercentage;
        registered = false;
        approved[oracleDestination] = true;
    }

    function setInitialPot() public payable onlyApproved {
        require(!registered, 'cannot change pot after registration');
        pot = value();
    }

    function begin() public onlyApproved {
        require(
            sender() == address(oracle),
            'can only be sent from house oracle'
        );
        require(!registered, 'already registered');
        registered = true;
    }

    function withdraw() public onlyOnce {
        require(winnings[sender()] != 0, 'no winnings');

        uint256 val = winnings[sender()];
        winnings[sender()] = 0;
        payable(sender()).transfer(val);
    }

    function close() public onlyApproved {
        require(
            sender() == address(oracle),
            'can only be sent from house oracle'
        );
        require(!closing, 'already closing');
        closing = true;
    }

    function finish(uint256 branchId) public onlyApproved onlyOnce {
        require(registered, 'bet not set up with house oracle');
        require(
            sender() == address(oracle),
            'can only be sent from house oracle'
        );

        uint256 length = branchLength[branchId];
        uint256 totalShare = pot;
        if (length == 0) {
            infinityMint.depositSystemRoyalty{ value: pot }(1);
        } else if (length == 1) {
            (address sender, , ) = abi.decode(
                activeBets[branchId][0],
                (address, uint256, uint256)
            );
            winnings[sender] = pot;
        } else {
            totalShare = pot / length;

            //if the total shares are zero it means that the length of winners is too great and we need to take some off and refund them their stake (they lost because they were slow)
            while (totalShare == 0) {
                totalShare = pot / --length;
            }

            //refund these people back their stake
            if (length != branchLength[branchId]) {
                uint256 difference = branchLength[branchId] - length;

                for (uint256 i = 0; i < difference; ) {
                    (address sender, uint256 stake, ) = abi.decode(
                        activeBets[branchId][0],
                        (address, uint256, uint256)
                    );

                    winnings[sender] = stake;

                    unchecked {
                        ++i;
                    }
                }
            }

            //set winnings total share
            for (uint256 i = 0; i < length; ) {
                (address sender, , ) = abi.decode(
                    activeBets[branchId][0],
                    (address, uint256, uint256)
                );

                winnings[sender] = totalShare;

                unchecked {
                    ++i;
                }
            }
        }

        emit Finish(branchId, totalShare, branchLength[branchId]);
    }

    function setBranches(
        uint256[] memory branchIds,
        bytes[] memory branchUris
    ) public onlyApproved {
        require(branchIds.length == branchUris.length, 'length mismatch');
        for (uint256 i = 0; i < branchIds.length; ) {
            branches[branchIds[i]] = branchUris[i];
            unchecked {
                ++i;
            }
        }
    }

    function setBranch(
        uint256 branchId,
        bytes memory branchUri
    ) public onlyApproved {
        branches[branchId] = branchUri;
    }

    function getBets(
        address addr,
        uint256 branchId,
        uint256[] memory branchIndex
    ) external view returns (bytes[] memory result) {
        result = new bytes[](branchIndex.length);

        for (uint256 i = 0; i < branchIndex.length; ) {
            result[i] = getBet(addr, branchId, branchIndex[i]);
            unchecked {
                ++i;
            }
        }
    }

    function getBetCount(
        address addr,
        uint256 branchId
    ) external view returns (uint256) {
        return bets[addr][branchId].length;
    }

    function getBet(
        address addr,
        uint256 branchId,
        uint256 branchIndex
    ) public view returns (bytes memory) {
        return activeBets[branchId][bets[addr][branchId][branchIndex]];
    }

    function placeBet(uint256 branchId) public payable virtual onlyOnce {
        require(!closing, 'no more bets can be made');
        require(registered, 'bet not set up with house oracle');
        require(value() == basePrice, 'price must match base price');
        require(branches[branchId].length != 0, 'invalid branch');

        activeBets[branchId][branchLength[branchId]] = abi.encode(
            sender(),
            value(),
            branchId
        );
        bets[sender()][branchId].push(branchLength[branchId]);

        if (basePrice >= 100) {
            uint256 houseCut = (value() * (housePercentage / 100));
            infinityMint.depositSystemRoyalty{ value: houseCut }(1);
            pot += value() - houseCut;
        } else pot += value();

        emit Bet(sender(), branchId, branchLength[branchId]++);
    }
}
