//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import 'infinitymint/alpha/InfinityMint.sol';
import 'infinitymint/alpha/InfinityMintApi.sol';
import 'infinitymint/alpha/IERC721.sol';

contract Mod_Marketplace is InfinityMintObject {
    address infinityMint;

    struct OfferObject {
        address sender;
        uint256 tokenId;
        uint256 value;
    }

    struct TransferObject {
        uint256 tokenId;
        address from;
        address to;
        uint256 value;
        bool hasTransfer;
    }

    uint256 internal executionCount;

    mapping(uint32 => mapping(address => OfferObject)) internal tokenOffers;
    mapping(uint32 => address[]) public userOffers;
    mapping(uint32 => TransferObject) internal transfers;

    event Offer(address indexed sender, uint32 tokenId, uint256 amount);
    event AwaitingTransfer(address indexed sender, TransferObject);
    event TransferConfirmed(
        address indexed sender,
        uint256 tokenId,
        address to,
        uint256 amount
    );

    modifier onlyOnce() {
        executionCount += 1;
        uint256 localCounter = executionCount;
        _;
        require(localCounter == executionCount);
    }

    constructor(address _infinityMint) {
        if (!isContract(_infinityMint)) revert('Must be NFT contract address');

        infinityMint = _infinityMint;
    }

    function getOffers(uint32 tokenId) public view returns (address[] memory) {
        return userOffers[tokenId];
    }

    ///@notice Returns true if the address is a contract
    ///@dev Sometimes doesnt work and contracts might be disgused as addresses
    function isContract(address _address) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_address)
        }
        return size > 0;
    }

    function getOffer(uint32 tokenId, address offerSender)
        public
        view
        returns (OfferObject memory)
    {
        return tokenOffers[tokenId][offerSender];
    }

    function awaitingTransfer(uint32 tokenId) public view returns (bool) {
        return (transfers[tokenId].to != address(0x0) &&
            transfers[tokenId].hasTransfer != true);
    }

    function awaitingTransferTo(uint32 tokenId) public view returns (address) {
        return transfers[tokenId].to;
    }

    function ownerOf(uint32 tokenId) public returns (address) {
        (bool success, bytes memory result) = address(infinityMint).call(
            abi.encodeWithSelector(IERC721.ownerOf.selector, uint256(tokenId))
        );

        if (!success) return address(0x0);

        return abi.decode(result, (address));
    }

    function makeOffer(uint32 tokenId) public payable virtual onlyOnce {
        require(!isContract(sender()), 'Contracts are not allowed');
        require(msg.value >= 0, 'value less than zero');
        require(ownerOf(tokenId) != address(0x0), 'Invalid Token');
        require(
            ownerOf(tokenId) != sender(),
            'Cannot make offers on your own token'
        );
        require(
            tokenOffers[tokenId][sender()].sender == address(0x0),
            'You already have an offer open'
        );
        require(
            transfers[tokenId].to == address(0x0),
            'This token has already been sold and is waiting to be transfered'
        );

        tokenOffers[tokenId][sender()] = OfferObject(
            sender(),
            tokenId,
            msg.value
        );
        //add to user offers
        userOffers[tokenId].push(sender());

        emit Offer(sender(), tokenId, msg.value);
    }

    function revokeOffer(uint32 tokenId) public virtual onlyOnce {
        require(!isContract(sender()), 'Contracts are not allowed');
        require(
            transfers[tokenId].to != sender(),
            'you cannot revoke at this time'
        );
        require(
            tokenOffers[tokenId][sender()].sender != address(0x0) &&
                tokenOffers[tokenId][sender()].sender == sender(),
            'No offer from this address or incorect sender'
        );

        //send back the monies
        payable(sender()).transfer(tokenOffers[tokenId][sender()].value);
        //delete the offer for the sender
        delete tokenOffers[tokenId][sender()];
        //update the user offers array
        deleteAddress(tokenId, sender());
    }

    function acceptOffer(uint32 tokenId, address offerSender) public virtual {
        require(
            transfers[tokenId].to == address(0x0),
            'This token has already been sold and is waiting to be transfered'
        );
        require(
            tokenOffers[tokenId][offerSender].sender != address(0x0),
            'No offer from this address'
        );
        require(ownerOf(tokenId) != address(0x0), 'Invalid Token');
        require(
            ownerOf(tokenId) == sender(),
            'You are not the owner of this token'
        );

        transfers[tokenId] = TransferObject(
            tokenId,
            sender(),
            tokenOffers[tokenId][offerSender].sender,
            tokenOffers[tokenId][offerSender].value,
            false
        );

        emit AwaitingTransfer(sender(), transfers[tokenId]);

        //delete the offer for the sender
        delete tokenOffers[tokenId][offerSender];
        //update the user offers array
        deleteAddress(tokenId, offerSender);
    }

    function confirmTransfer(uint32 tokenId) public virtual onlyOnce {
        require(transfers[tokenId].from == sender(), 'not owner');
        require(
            transfers[tokenId].hasTransfer == false,
            'token has already transfered'
        );
        require(
            ownerOf(tokenId) == transfers[tokenId].to,
            'has not transfered'
        );

        uint256 value = (transfers[tokenId].value);
        transfers[tokenId] = TransferObject(
            tokenId,
            address(0x0),
            address(0x0),
            0,
            true
        );
        payable(sender()).transfer(value);
    }

    function deleteAddress(uint32 tokenId, address offerSender) internal {
        if (userOffers[tokenId].length - 1 == 0) {
            userOffers[tokenId] = new address[](0);
            return;
        }

        address[] memory temp = new address[](userOffers[tokenId].length - 1);
        uint256 count = 0;
        for (uint256 i = 0; i < userOffers[tokenId].length; i++) {
            if (userOffers[tokenId][i] == offerSender) continue;
            temp[count++] = userOffers[tokenId][i];
        }
        userOffers[tokenId] = temp;
    }
}
