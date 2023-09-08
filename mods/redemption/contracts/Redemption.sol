//SPDX-License-Identifier: UNLICENSED
//0x0zAgency 2023
pragma solidity ^0.8.0;

import 'contracts/Authentication.sol';
import 'contracts/IERC721.sol';

contract Mod_Redemption is IERC721Receiver, Authentication, InfinityMintObject {
    string public constant version = "0.69";  // <-- Add a version variable
    IERC721 erc721;

    mapping(uint256 => bytes) private activeRedemptions;
    mapping(uint256 => Request) private requests;
    mapping(uint256 => SuccessfulRedemption) private successfulRedemptions;
    mapping(address => uint256) private requestCount;
    mapping(address => bool) private blockedWallets;

    struct Request {
        address sender;
        bytes redemption;
        bytes key;
        bool valid;
    }

    struct SuccessfulRedemption {
        address receiver;
        address admin;
        uint256 time;
        uint256 tokenId;
        bool valid;
    }

    event RequestSubmitted(uint256 tokenId, address indexed sender);
    event RequestApproved(
        uint256 tokenId,
        address indexed sender,
        address admin
    );
    event RequestRejected(
        uint256 tokenId,
        address indexed sender,
        address admin
    );

    constructor(address erc721Destination) {
        erc721 = IERC721(erc721Destination);
    }



    function getRequestOwner(uint256 tokenId) public view returns (address) {
        if (requests[tokenId].valid == false) return address(0x0);
        return requests[tokenId].sender;
    }

    function getRequest(uint256 tokenId) public view returns (Request memory) {
        /*require(
            approved[sender()] ||
                deployer == sender() ||
                getRequestOwner(tokenId) == sender(),
            'invalid permissions'
        );*/
        return requests[tokenId];
    }

    function getActiveRedemption(uint256 tokenId)
        public
        view
        returns (bytes memory)
    {
        require(bytes(activeRedemptions[tokenId]).length != 0, 'invalid active redemption');
        return activeRedemptions[tokenId];
    }

    function setWalletBlocked(address addr, bool value) public onlyApproved {
        blockedWallets[addr] = value;
    }

    function hasRequest(uint256 tokenId) public view returns (bool) {
        return requests[tokenId].valid == true;
    }

    function getRequestCount(address addr)
        external
        view
        onlyApproved
        returns (uint256)
    {
        return requestCount[addr];
    }

    function getChecks(uint256 tokenId)
        external
        view
        returns (bool[] memory bools)
    {
        bools = new bool[](3);
        bools[0] = this.isRedeemable(tokenId);
        bools[1] = hasRedeemed(tokenId);
        bools[2] = hasRequest(tokenId);
    }

    function getMyRequestCount() external view returns (uint256) {
        require(sender() != address(0x0));
        return requestCount[sender()];
    }

    function isRedeemable(uint256 tokenId) external view returns (bool) {
        return bytes(activeRedemptions[tokenId]).length != 0;
    }

    function hasRedeemed(uint256 tokenId) public view returns (bool) {
        return successfulRedemptions[tokenId].valid;
    }

    function getRedemptionProof(uint256 tokenId)
        public
        view
        returns (SuccessfulRedemption memory)
    {
        require(hasRedeemed(tokenId), 'has not been redeemed');
        /*require(
            sender() == successfulRedemptions[tokenId].receiver ||
                approved[sender()] ||
                deployer == sender()
        );*/
        return successfulRedemptions[tokenId];
    }

    function makeUnredeemable(uint256 tokenId) public {
        require(
            bytes(activeRedemptions[tokenId]).length != 0,
            'must be redeemable'
        );
        require(
            successfulRedemptions[tokenId].valid == false,
            'already redeemed cannot change'
        );

        delete activeRedemptions[tokenId];
    }

    /// @notice Allows this redemption contract to receive ERC721 from approved addresses only
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external view onlyApproved returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @notice Rejects a request to redeem a token
    function rejectRedeem(uint256 tokenId) public onlyApproved {
        require(requests[tokenId].valid, 'invalid request');
        require(
            bytes(activeRedemptions[tokenId]).length != 0,
            'invalid redemption token id'
        );

        address tempSender = (requests[tokenId].sender);
        if (requestCount[tempSender] > 0)
            requestCount[tempSender] = requestCount[tempSender] - 1;

        delete requests[tokenId];
        emit RequestRejected(tokenId, tempSender, sender());
    }

    /// @notice Approves a request to redeem a token
    function approveRedeem(uint256 tokenId, bytes memory redemption)
        public
        onlyApproved
        onlyOnce
    {
        //is valid request
        require(requests[tokenId].valid, 'invalid request');
        //active redemption valid
        require(
            bytes(activeRedemptions[tokenId]).length != 0,
            'invalid redemption token id'
        );
        //has already been redeemed
        require(
            successfulRedemptions[tokenId].valid == false,
            'token has already been redeemed'
        );
        //check that the passcode is equal to the activeRedemptions passcode.
        require(
            InfinityMintUtil.isEqual(redemption, activeRedemptions[tokenId]),
            'check failed'
        );
        Request memory tempRequest = requests[tokenId];
        delete requests[tokenId];

        //write to storage
        successfulRedemptions[tokenId] = SuccessfulRedemption(
            tempRequest.sender,
            sender(),
            block.timestamp,
            tokenId,
            true
        );

        //deduct from request count
        if (requestCount[requests[tokenId].sender] > 0)
            requestCount[tempRequest.sender] =
                requestCount[tempRequest.sender] -
                1;
        //transfer the token from this contract to the sender
        erc721.safeTransferFrom(address(this), tempRequest.sender, tokenId);
        emit RequestApproved(tokenId, tempRequest.sender, sender());
    }

    /// @notice Requests a token to be transfered to the sender
    function requestToken(
        uint256 tokenId,
        bytes memory redemption,
        bytes memory theirKey
    ) public 
         {
        
        require(!isContract(sender()), 'cannot be invoked by contract');
        require(
            !blockedWallets[sender()],
            'cannot redeem a token at this time'
        );
        
        require(
            requestCount[sender()] <= 3,
            'you have too many requests open at this time'
        );
        
        require(
            successfulRedemptions[tokenId].valid == false,
            'token has already been redeemed'
        );
        
        require(
            bytes(activeRedemptions[tokenId]).length != 0,
            'invalid redemption token id'
        );

        
        require(
            requests[tokenId].valid == false,
            'request already open for this token'
        );
        
        require(
            bytes(redemption).length != 0,
            string(redemption)
        );
        
        require(
            bytes(activeRedemptions[tokenId]).length != 0,
            string(activeRedemptions[tokenId])
        );
        
        require(
            InfinityMintUtil.isEqual(redemption, activeRedemptions[tokenId]),
            string(redemption)
            //'validation sucks failed'
        );

        requests[tokenId] = Request(sender(), redemption, theirKey, true);
        requestCount[sender()] = requestCount[sender()] + 1;
        emit RequestSubmitted(tokenId, sender());
    }

    function addRedemption(uint256 tokenId, bytes memory redemption)
        public
        onlyApproved
    {
        require(bytes(activeRedemptions[tokenId]).length == 0, 'already set');
        require(
            erc721.ownerOf(tokenId) == address(this),
            'please transfer the token to this contract first'
        );

        activeRedemptions[tokenId] = redemption;
    }

    function addRedemptions(
        uint256[] memory _tokenIds,
        bytes[] memory redemptions
    ) public onlyApproved {
        require(_tokenIds.length == redemptions.length, 'mismatch');

        for (uint256 i = 0; i < redemptions.length; ) {
            uint256 tokenId = _tokenIds[i];
            activeRedemptions[tokenId] = redemptions[i];

            unchecked {
                ++i;
            }
        }
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
}
