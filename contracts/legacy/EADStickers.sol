//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './Stickers.sol';
import '../ERC721.sol';
import '../IntegrityInterface.sol';

/// @title InfinityMint Ethereum Ad Service Sticker ERC721
/// @author 0xTinman.eth
/// @notice This is an ERC721 contract powering eads stickers, these are attached to every token minted by InfinityMint.
/// @dev
contract EADStickers is Stickers, ERC721 {
    /// @notice the erc721 token id must reference this contracts address
    uint256 public erc721TokenId;

    /// @notice Emitted when a request is accepted
    event EASRequestAccepted(
        uint32 stickerId,
        address indexed sender,
        uint256 price,
        bytes packed
    );
    /// @notice Emitted when a request is denied
    event EASRequestDenied(
        uint32 requestId,
        address indexed sender,
        uint256 price,
        bytes packed
    );
    /// @notice Emitted when a request is withdrew
    event EASRequestWithdrew(
        uint32 requestId,
        address indexed sender,
        uint256 price,
        bytes packed
    );
    /// @notice Emitted when a request is added
    event EASRequestAdded(
        uint32 requestId,
        address indexed sender,
        uint256 price,
        bytes packed
    );
    /// @notice Emitted when a request is added
    event EASStickerUpdated(
        uint32 requestId,
        address indexed sender,
        uint256 price,
        bytes packed
    );

    /// @dev owner is made owner of this contract
    constructor(
        uint32 tokenId,
        address erc721Destination,
        address EASWalletAddress,
        address valuesContract
    ) ERC721('EADS Sticker', 'EADS') Stickers(valuesContract) {
        erc721TokenId = tokenId;
        erc721 = erc721Destination;
        EASWallet = InfinityMintWallet(EASWalletAddress);
        versionType = 'EADStickers'; // Should be the contract name
    }

    /**
		@notice This can be called by the new token owner at any time and it will match the current owner of the contract to the tokenId,
		in all cases the wallet will still be attached to the owner of the tokenId and when its not it will simply move over permissions of
		the contract to the new owner
	 */
    function transferOwnershipToTokenOwner() public onlyOnce {
        address owner = IERC721(erc721).ownerOf(erc721TokenId);
        require(deployer != owner, 'owner of the token is the deployer');
        require(msg.sender == owner, 'sender must be the new owner');
        transferOwnership(owner);
    }

    function getIntegrity()
        public
        view
        override
        returns (
            address,
            address,
            uint256,
            bytes memory,
            bytes4
        )
    {
        return (
            address(this),
            deployer,
            erc721TokenId,
            versionType,
            type(IntegrityInterface).interfaceId
        );
    }

    /// @notice  Sets the ethereum ad service wallet location
    function setWalletAddresss(address EASWalletAddress) public onlyDeployer {
        require(isContract(EASWalletAddress), 'is not a contract');
        require(
            InfinityMintWallet(EASWalletAddress).deployer() == deployer,
            'the deployer for this contract and the wallet contract must be the same'
        );

        EASWallet = InfinityMintWallet(EASWalletAddress);
    }

    /// @notice verifies that the current owner of this contract
    function verifyAuthenticity() external view override returns (bool) {
        //first we check if the current deployer of this contract is approved or the owner of the tokenID it is attached too
        (bool success, bytes memory returnData) = erc721.staticcall(
            abi.encodeWithSignature(
                'isApprovedOrOwner(uint256,address)',
                erc721TokenId,
                deployer
            )
        );

        //invalid token id
        if (!success) return false;
        //if we aren't, then the deployer isn't approved to the tokenId is linked too
        if (!abi.decode(returnData, (bool))) return false;

        return true;
    }

    /// @notice  Updates a sticker with new data.
    /// @dev NOTE: Right now the deployer does not have to approve changes.
    function updateSticker(uint32 stickerId, bytes memory packed) public {
        address sender = (msg.sender);

        require(isApprovedOrOwner(sender, uint256(stickerId))); // ERC721 permissions can update the sticker
        require(isSafe(packed, erc721TokenId), 'your packed sticker is unsafe');
        require(
            enabled,
            'stickers are not enabled right now and need to be enabled in order to update'
        );

        (, , , address theirOwner) = unpackSticker(packed);
        (, , , address actualOwner) = unpackSticker(stickers[stickerId]);

        require(theirOwner == actualOwner, 'trying to change the owner');

        stickers[stickerId] = packed;
    }

    /// @notice See {ERC721}
    function beforeTransfer(
        address,
        address to,
        uint256 _tokenId
    ) internal override {
        uint32 tokenId = uint32(_tokenId);

        (, string memory checkSum, string memory object, ) = unpackSticker(
            stickers[tokenId]
        );

        //save the sticker to point to the new owner
        stickers[tokenId] = abi.encode(tokenId, checkSum, object, to);
    }

    /// @notice Burns a sticker
    /// @dev will delete a sticker forever
    function burn(uint32 stickerId) public {
        require(isApprovedOrOwner(_sender(), stickerId));

        delete stickers[stickerId]; //delete the data for the sticker
        delete approvedTokens[stickerId]; //delete approved

        tokens[stickerId] = address(0x0);
        balance[_sender()] -= 1;
    }

    /// @notice  Accepts a sticker request, minting it as an ERC721
    /// @dev The index is relative to the amount of stickers the address has sent.
    function acceptRequest(address sender, uint32 index)
        public
        override
        onlyApproved
        onlyOnce
    {
        require(requests[sender][index].length != 0);

        (uint256 price, address savedSender, bytes memory packed) = abi.decode(
            requests[sender][index],
            (uint256, address, bytes)
        );
        require(sender == savedSender, 'sender and saved sender are different');

        //mint the sticker
        ERC721.mint(savedSender, currentStickerId, packed);
        //save the sticker
        stickers[currentStickerId] = abi.encode(price, savedSender, packed);

        //send the royalty
        //if the price is greater than 100 wei or zero, we hit back the parent ERC721 with the royalty cut
        if (
            (price > 100 || price == 0) &&
            valuesController.tryGetValue('stickerSplit') >= 2
        ) {
            //this is what we went back to parent ERC721
            uint256 cut = 0;

            //if the price is not equal to zero, do the math.
            if (price != 0) {
                cut =
                    (price / 100) *
                    valuesController.tryGetValue('stickerSplit');

                //deduct the cut from the value that the deployer holds onto
                if (price - cut > 0) price = price - cut;
                //else set the cut to zero
            }

            (bool success, bytes memory returnData) = address(erc721).call{
                value: cut
            }(
                abi.encodeWithSignature(
                    'depositStickerRoyalty(uint32)',
                    erc721TokenId
                )
            );

            if (!success) {
                if (returnData.length == 0)
                    revert('cannot deposit royalty to main ERC721');
                else
                    assembly {
                        let returndata_size := mload(returnData)
                        revert(add(32, returnData), returndata_size)
                    }
            }

            //send it to the wallet currently associated with this sticker contract
            EASWallet.deposit{ value: price }();
        }

        //delete the old now acccepted request
        deleteRequest(sender, index);
        //emit
        emit EASRequestAccepted(currentStickerId++, sender, price, packed);
    }

    /// @notice  Returns the tokenURI for the sticker objects
    /// @dev Will use the sticker object as a tokenURI if none is set.
    function tokenURI(uint256 stickerId)
        public
        view
        override
        returns (string memory)
    {
        if (
            bytes(uri[stickerId]).length == 0 &&
            stickers[uint32(stickerId)].length == 0
        ) revert('Token URI for non existent token');

        if (bytes(uri[stickerId]).length != 0) return uri[stickerId];

        require(
            isSafe(stickers[uint32(stickerId)], erc721TokenId),
            'request is not safely packed'
        );

        (, , string memory object, ) = unpackSticker(
            stickers[uint32(stickerId)]
        );

        return object;
    }

    /// @notice  Adds a sticker request for the owner to accept.
    /// @dev Its up to the end user to validate the sticker and make sure it is safe. We do various validation and check summing to make sure things are okay.
    function addRequest(bytes memory packed) public payable override onlyOnce {
        require(msg.value == stickerPrice, 'not the sticker price');
        require(isSafe(packed, erc721TokenId), 'your packed sticker is unsafe');
        require(enabled, 'no new stickers can be added right now');
        address sender = (msg.sender);
        require(
            balanceOf(msg.sender) < 100,
            'you have minted the maximum amount of stickers to this wallet, use another wallet to mint more.'
        );

        //add it!
        requests[sender].push(abi.encode(msg.value, sender, packed));
        if (!hasOpenRequests(sender)) openRequests.push(sender);

        emit EASRequestAdded(
            uint32(requests[sender].length - 1),
            sender,
            msg.value,
            packed
        ); //emit
    }

    /// @notice  Withdraws a sticker request giving you back your money
    /// @dev The index is relative to the amount of stickers the address has sent.
    function withdrawRequest(uint32 index) public override onlyOnce {
        address sender = (msg.sender);

        require(requests[sender][index].length != 0);

        (uint256 price, address savedSender, bytes memory packed) = abi.decode(
            requests[sender][index],
            (uint256, address, bytes)
        );

        //require the current sender and the saved sender to be the same
        require(savedSender == sender);
        //transfer
        payable(savedSender).transfer(price); //transfer back the price to the sender
        //delete the rquest
        deleteRequest(sender, index);
        //emit
        emit EASRequestWithdrew(index, savedSender, price, packed);
    }

    /// @notice  Denys a sticker request sending the requestee their money back.
    /// @dev The index is relative to the amount of stickers the address has sent.
    function denyRequest(address sender, uint32 index)
        public
        override
        onlyApproved
        onlyOnce
    {
        require(requests[sender][index].length != 0);

        (uint256 price, address savedSender, bytes memory packed) = abi.decode(
            requests[sender][index],
            (uint256, address, bytes)
        );

        //delete the request
        deleteRequest(sender, index);
        //send the money back to the sender of the sticker offer
        payable(savedSender).transfer(price);
        emit EASRequestDenied(index, sender, price, packed);
    }
}
