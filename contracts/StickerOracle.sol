//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './Authentication.sol';
import './ERC721.sol';
import './StickerOracle.sol';

contract StickerOracle is ERC721, Authentication, InfinityMintObject {
    ERC721 erc721;

    struct StickerDestination {
        address deployer;
        address destination;
        uint256 activeStickers;
        uint256 completedStickers;
        uint256 deniedStickers;
        uint256 timestamp;
        bool valid;
    }

    struct RegistrationObject {
        address owner;
        uint256 balance;
        uint256 lockedBalance;
        bool valid;
    }

    struct RegistrationMap {
        address owner;
        uint256 oracleId;
        bool valid;
    }

    event AddressRegistration(
        address indexed sender,
        uint256 oracleId,
        RegistrationObject registraitonObject
    );

    event DeploymentRegistration(
        address indexed sender,
        uint256 tokenId,
        address indexed stickersDestination,
        StickerDestination destinationObject
    );

    mapping(address => bool) validDestinations;
    mapping(uint256 => StickerDestination) public registeredStickerDestinations;
    mapping(address => RegistrationMap) public addressRegistrations;
    mapping(uint256 => RegistrationObject) public registrations;

    //internal
    mapping(address => mapping(uint256 => uint256)) internal registeredStickers;
    uint256 internal oracleId;

    modifier onlyApprovedStickerContracts() {
        require(
            validDestinations[sender()],
            'sender is not an approved sticker contract'
        );
        _;
    }

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address erc721Destination
    ) ERC721(tokenName, tokenSymbol) {
        erc721 = ERC721(erc721Destination);
    }

    function topup() public payable {
        require(
            addressRegistrations[sender()].valid,
            'already regsitered for this address'
        );

        registrations[addressRegistrations[sender()].oracleId].balance =
            registrations[addressRegistrations[sender()].oracleId].balance +
            value();
    }

    function canAfford(
        uint256 pps,
        uint256 duration,
        address owner
    ) external view returns (bool) {
        require(addressRegistrations[owner].valid, 'invalid owner');

        return
            registrations[addressRegistrations[sender()].oracleId].balance >=
            (pps * duration);
    }

    function register() public payable {
        require(
            addressRegistrations[sender()].valid == false,
            'already registered this address'
        );

        registrations[oracleId] = RegistrationObject(
            sender(),
            value(),
            0,
            true
        );
        addressRegistrations[sender()] = RegistrationMap(
            sender(),
            oracleId,
            true
        );
        emit AddressRegistration(sender(), oracleId, registrations[oracleId]);
        oracleId = oracleId + 1;
    }

    function getRegistration(uint256 _oracleId)
        external
        view
        returns (RegistrationObject memory)
    {
        require(
            registrations[oracleId].valid,
            'invalid registration at this id'
        );
        return registrations[_oracleId];
    }

    function findRegistration(address addr)
        external
        view
        returns (RegistrationObject memory)
    {
        require(
            addressRegistrations[addr].valid,
            'invalid registration for address'
        );
        return registrations[addressRegistrations[addr].oracleId];
    }

    function registerDeploymentWithOracle(
        uint256 tokenId,
        address stickersDestination
    ) public {
        require(
            stickersDestination != address(0x0),
            'enter a sticker destination'
        );

        require(
            erc721.isApprovedOrOwner(sender(), tokenId),
            'ERC721: not approved'
        );

        Authentication auth = Authentication(stickersDestination);
        require(
            auth.deployer() == sender() || auth.isAuthenticated(sender()),
            'not approved with stickers destination'
        );

        require(
            registeredStickerDestinations[tokenId].valid == false,
            'already registered'
        );

        registeredStickerDestinations[tokenId] = StickerDestination(
            sender(),
            stickersDestination,
            0,
            0,
            0,
            block.timestamp,
            true
        );
        validDestinations[stickersDestination] = true;

        emit DeploymentRegistration(
            sender(),
            tokenId,
            stickersDestination,
            registeredStickerDestinations[tokenId]
        );
    }

    function registerSticker(
        uint256 tokenId,
        uint256 stickerId,
        uint256 stickerEnd
    ) public {
        require(
            registeredStickerDestinations[tokenId].valid,
            'no registry for this tokenId'
        );
        require(
            stickerEnd <= block.timestamp,
            'end is zero or a time in the past'
        );

        address dest = registeredStickerDestinations[tokenId].destination;

        require(checkSenderIsAuthenticated(dest));
        require(isValidSticker(dest, stickerId));
        require(registeredStickers[dest][stickerId] != 0, 'already registered');

        registeredStickers[dest][stickerId] = stickerEnd;
    }

    function hasStickerCompleted(address stickerDestination, uint256 stickerId)
        external
        view
        returns (bool)
    {
        return
            registeredStickers[stickerDestination][stickerId] >=
            block.timestamp;
    }

    function getStickerRegistration(uint256 tokenId)
        external
        view
        returns (StickerDestination memory dest)
    {
        dest = registeredStickerDestinations[tokenId];
        require(dest.valid, 'invalid sticker destination');
    }

    function verifyRegistration(uint256 tokenId, address stickersDestination)
        public
        view
        returns (bool)
    {
        return
            registeredStickerDestinations[tokenId].valid &&
            registeredStickerDestinations[tokenId].destination ==
            stickersDestination;
    }

    /// @notice We just want to check if the call went through okay
    function isValidSticker(address stickerDestination, uint256 stickerId)
        private
        view
        returns (bool)
    {
        (bool success, ) = stickerDestination.staticcall(
            abi.encodeWithSignature('getSticker(uint256)', stickerId)
        );

        return success;
    }

    function checkSenderIsAuthenticated(address stickerDestination)
        private
        view
        returns (bool)
    {
        (bool success, bytes memory returnData) = stickerDestination.staticcall(
            abi.encodeWithSignature('isAuthenticated(address)', sender())
        );

        if (!success) {
            if (returnData.length == 0) revert('is approved or owner reverted');
            else
                assembly {
                    let returndata_size := mload(returnData)
                    revert(add(32, returnData), returndata_size)
                }
        }

        bool result = abi.decode(returnData, (bool));
        return result == true;
    }
}
