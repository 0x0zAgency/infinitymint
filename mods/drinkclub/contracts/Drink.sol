//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2022
//0x0z 2023
pragma solidity ^0.8.0;

import 'infinitymint/alpha/InfinityMint.sol';
import 'infinitymint/alpha/InfinityMintApi.sol';
import 'infinitymint/alpha/InfinityMintStorage.sol';

/**
  @notice allows an NFT to redeem an ERC721 which gives them access to a free drink at the marvel, the token owners
  send drink requests to this contract with a drink code that the bar then has to send back to confirm, if this is is successful then the
  token will be drained and the token owner can refill their cup in 72 hours, they will also receive an ERC721
 */
contract Mod_Drink is ERC721, Authentication, InfinityMintObject {
    InfinityMint erc721;
    InfinityMintApi api;
    InfinityMintStorage storageController;

    uint256 public currentTokenId;

    mapping(uint256 => uint256) internal timeouts;
    mapping(uint256 => bytes) internal requests;
    mapping(address => bool) internal drinks;

    event DrinkRequested(uint256 tokenId, address indexed sender);
    event DrinkAccepted(
        uint256 tokenId,
        address indexed sender,
        uint256 drinkId
    );
    event DrinkRefilled(uint256 tokenId, address indexed sender);

    constructor(
        address erc721Destination,
        address apiDestination,
        address storageDestination,
        string memory tokenName,
        string memory tokenSymbol
    ) ERC721(tokenName, tokenSymbol) {
        erc721 = InfinityMint(erc721Destination);
        api = InfinityMintApi(apiDestination);
        storageController = InfinityMintStorage(storageDestination);
    }

    function isDrinkFull(uint256 tokenId) public view returns (bool) {
        InfinityObject memory obj = storageController.get(uint32(tokenId));
        if (obj.owner != address(0x0) || obj.mintData.length == 0) return false;
        return abi.decode(obj.mintData, (bool));
    }

    function hasDrink() public view returns (bool) {
        return drinks[sender()];
    }

    function hasRequest(uint256 tokenId) public view returns (bool) {
        return requests[tokenId].length != 0;
    }

    /// @notice allows a user to request a drink by sending a drink code, they can only do this every 72 hours. Bar/approved has to accept the drink with the same drink code.
    function requestDrink(uint256 tokenId, bytes memory drinkCode) public {
        require(
            erc721.isApprovedOrOwner(sender(), tokenId),
            'sender must be approved for tokenId'
        );

        InfinityObject memory obj = storageController.get(uint32(tokenId));
        bool isFull = abi.decode(obj.mintData, (bool));

        require(
            isFull,
            'your drink is not full and you need to refill it in 72 hours'
        );
        require(
            requests[tokenId].length == 0,
            'there is already a request open'
        );

        requests[tokenId] = drinkCode;
        emit DrinkRequested(tokenId, sender());
    }

    /// @notice  owners of a drink token can refill their drink every 72 hours
    function refillDrink(uint256 tokenId) public {
        require(
            erc721.isApprovedOrOwner(sender(), tokenId),
            'sender must be approved for tokenId'
        );
        require(drinks[sender()], 'you do not have a drink token to refill');

        InfinityObject memory obj = storageController.get(uint32(tokenId));
        bool isFull = abi.decode(obj.mintData, (bool));
        require(
            isFull == false,
            'your drink is still full and does not need to be refilled'
        );
        require(
            timeouts[tokenId] < block.timestamp,
            'you need to wait 72 hours to claim another drink'
        );
        obj.mintData = abi.encode(true);
        storageController.set(uint32(tokenId), obj);
        emit DrinkRefilled(tokenId, sender());
    }

    /// @notice staff members can 'pour' a drink. and the owner can reset it after 72 hours and get an ew drink, the owner of the token gets a new ERC721
    function acceptDrink(
        uint256 tokenId,
        bytes memory drinkCode
    ) public onlyApproved {
        require(
            requests[tokenId].length != 0,
            'no request open for this drink'
        );
        require(
            !InfinityMintUtil.isEqual(requests[tokenId], drinkCode),
            'drink code must match what is given'
        );

        timeouts[tokenId] = block.timestamp + (60 * 60 * 72); //72 hrs
        InfinityObject memory obj = storageController.get(uint32(tokenId));
        obj.mintData = abi.encode(false);
        storageController.set(uint32(tokenId), obj);
        mint(obj.owner, currentTokenId, bytes(''));
        drinks[obj.owner] = true;
        emit DrinkAccepted(tokenId, sender(), currentTokenId++);
    }

    /// @notice staff members can deny a drink
    function denyDrink(uint256 tokenId) public onlyApproved {
        require(
            requests[tokenId].length != 0,
            'no request open for this drink'
        );
        delete requests[tokenId];
    }
}
