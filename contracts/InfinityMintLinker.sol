//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './Authentication.sol';
import './IntegrityInterface.sol';
import './InfinityMintStorage.sol';

/// @title InfinityMint Linker
/// @author 0xTinman.eth
/// @notice Serves as a utility contract which manages the destinations field of an InfinityMint token
/// @dev Allows content owners to add pre-validated links the user can add to their destinations field, contract creator sets links through build tools
contract InfinityMintLinker is Authentication, InfinityMintObject {
    /// @notice the location of the main ERC721 contract
    address public erc721Location;
    /// @notice location of the storage contract
    InfinityMintStorage internal storageController;
    /// @notice holds all of the links its length is linkCount
    mapping(uint256 => Link) internal links;
    /// @notice the length of links mapping or the amount of links setup
    uint256 linkCount = 0;

    struct Link {
        uint256 index;
        bytes versionType;
        bytes4 interfaceId;
        string key;
        bool erc721;
        bool verifyIntegrity;
        bool forcedOnly;
        bool permanent;
        bool active;
    }

    constructor(address _storageDestination, address erc721Destination) {
        storageController = InfinityMintStorage(_storageDestination);
        erc721Location = erc721Destination;
    }

    function getLink(uint256 index) external view returns (Link memory) {
        require(bytes(links[index].key).length != 0, 'link is invalid');
        return links[index];
    }

    function getLinkByKey(string calldata key)
        external
        view
        returns (Link memory)
    {
        return requireLinkFromKey(key);
    }

    function addSupport(
        uint256 index,
        string memory key,
        bytes memory versionType,
        bool isErc721,
        bool verifyIntegrity,
        bool forcedOnly,
        bool permanent
    ) public onlyApproved {
        require(index < 32, 'can only have a maximum index of 32');
        require(links[index].active != true, 'link already established');
        links[index] = Link(
            index,
            versionType,
            type(IntegrityInterface).interfaceId,
            key,
            isErc721,
            verifyIntegrity,
            forcedOnly,
            permanent,
            true
        );
        unchecked {
            linkCount++;
        }
    }

    /// @notice disables this link from being used in the future
    function toggleSupport(uint256 index) public onlyApproved {
        require(bytes(links[index].key).length != 0, 'invalid link');
        links[index].active = false;
    }

    /// @notice used by build tools to redeploy
    function clearLinks() public onlyDeployer {
        for (uint256 i = 0; i < linkCount; ) {
            if (links[i].active) links[i].active = false;
            unchecked {
                ++i;
            }
        }

        linkCount = 0;
    }

    function changeLinkKey(string calldata keyToChange, string calldata key)
        public
        onlyApproved
    {
        Link memory tempLink = requireLinkFromKey(keyToChange);
        require(
            hasKey(key) == false,
            'cannot change key to that key as that key already exists'
        );

        tempLink.key = key;
        links[tempLink.index] = tempLink;
    }

    function hasKey(string calldata key) internal view returns (bool) {
        require(bytes(key).length != 0, 'blank key');

        for (uint256 i = 0; i < linkCount; ) {
            if (
                InfinityMintUtil.isEqual(bytes(links[i].key), bytes(key)) &&
                links[i].active
            ) return true;

            unchecked {
                ++i;
            }
        }

        return false;
    }

    /// @notice gets link type from string key name
    /// @dev if two or more keys are present with the same name then this is designed to return the newest object which has been added.
    function requireLinkFromKey(string calldata key)
        internal
        view
        returns (Link memory)
    {
        require(bytes(key).length != 0, 'blank key');

        Link memory tempLink;
        bool hasFound = false;
        for (uint256 i = 0; i < linkCount; ) {
            if (
                InfinityMintUtil.isEqual(bytes(links[i].key), bytes(key)) &&
                links[i].active
            ) {
                hasFound = true;
                tempLink = links[i];
            }
            unchecked {
                ++i;
            }
        }

        require(hasFound, 'key invalid');
        return tempLink;
    }

    /// @notice has to be called by token owner
    function setLink(
        uint256 tokenId,
        string calldata key,
        address destination
    ) public {
        require(isApprovedOrOwner(sender(), tokenId), 'not owner');
        _setLink(tokenId, key, destination);
    }

    /// @notice Can be called by other contracts who are approved
    function forceLink(
        uint256 tokenId,
        string calldata key,
        address destination
    ) public onlyApproved {
        Link memory link = requireLinkFromKey(key); // will throw
        InfinityObject memory token = storageController.get(uint32(tokenId)); // will throw

        if (token.destinations.length == 0) {
            token.destinations = new address[](link.index + 1);
            token.destinations[link.index] = destination;
        } else {
            if (link.index >= token.destinations.length) {
                address[] memory tempCopy = new address[](link.index + 1);
                for (uint256 i = 0; i < tempCopy.length; ) {
                    if (i == link.index) tempCopy[i] = destination;
                    else if (
                        i < token.destinations.length &&
                        token.destinations[i] != address(0x0)
                    ) tempCopy[i] = token.destinations[i];

                    unchecked {
                        ++i;
                    }
                }

                token.destinations = tempCopy;
            } else {
                token.destinations[link.index] = destination;
            }
        }

        storageController.set(uint32(tokenId), token);
    }

    function unlink(uint256 tokenId, string calldata key) public {
        require(isApprovedOrOwner(sender(), tokenId), 'not owner');

        Link memory link = requireLinkFromKey(key); // will throw
        InfinityObject memory token = storageController.get(uint32(tokenId)); // will throw
        require(link.permanent != true, 'link can never be unlinked');
        require(
            link.forcedOnly != true,
            'link must be managed through an external contract'
        );

        //the first two indexes should always be index 0 (wallet) and index 1 (stickers), the erc721
        //will set a token flag allowing you to unlink the contracts upon transfer unless it is
        //disabled in the values controller. it is up to the deployer to decide if they will
        //allow people to unlink the wallet/sticker when they transfer, bare in mind this does
        //potentially allow them to transfer the token, unlink and re-establish new links
        //burning eads contracts.
        require(
            link.index != 0 ||
                storageController.flag(tokenId, 'canUnlinkIndex0'),
            'index 0 cannot be unlinked at this time'
        );
        require(
            link.index != 1 ||
                storageController.flag(tokenId, 'canUnlinkIndex1'),
            'index 1 cannot be unlinked at this time'
        );

        token.destinations[link.index] = address(0x0);
        storageController.set(uint32(tokenId), token);
    }

    function _setLink(
        uint256 tokenId,
        string calldata key,
        address destination
    ) internal {
        Link memory link = requireLinkFromKey(key); // will throw
        InfinityObject memory token = storageController.get(uint32(tokenId)); // will throw

        //must be set by another contract
        require(link.forcedOnly != true, 'cannot be set by linker');
        //if the destinations isnt zero require it to be a new index or an unmapped but created inex
        if (token.destinations.length != 0) {
            require(
                link.index >= token.destinations.length ||
                    token.destinations[link.index] == address(0x0),
                'destination already set'
            );
        }

        // for stuff like ENS Registry contracts and the like outside of InfinityMint we can chose not to verify
        if (link.verifyIntegrity) {
            (
                address from,
                address _deployer,
                uint256 _tokenId,
                bytes memory versionType,
                bytes4 interfaceId
            ) = IntegrityInterface(destination).getIntegrity();

            require(_deployer == sender(), 'mismatch 0');
            require(from == destination, 'mismatch 1');
            require(tokenId == _tokenId, 'mismatch 2');
            require(
                InfinityMintUtil.isEqual(versionType, link.versionType),
                'mismatch 3'
            );
            require(interfaceId == link.interfaceId, 'mismatch 4');
        }

        if (token.destinations.length == 0) {
            token.destinations = new address[](link.index + 1);
            token.destinations[link.index] = destination;
        } else {
            if (link.index + 1 >= token.destinations.length) {
                address[] memory tempCopy = new address[](link.index + 1);
                for (uint256 i = 0; i < tempCopy.length; ) {
                    if (i == link.index) tempCopy[i] = destination;
                    else if (i < token.destinations.length)
                        tempCopy[i] = token.destinations[i];

                    unchecked {
                        ++i;
                    }
                }

                token.destinations = tempCopy;
            } else {
                token.destinations[link.index] = destination;
            }
        }

        storageController.set(uint32(tokenId), token);
    }

    /// @notice gets token
    /// @dev erc721 address must be ERC721 implementor.
    function isApprovedOrOwner(address owner, uint256 tokenId)
        private
        view
        returns (bool)
    {
        (bool success, bytes memory returnData) = erc721Location.staticcall(
            abi.encodeWithSignature(
                'isApprovedOrOwner(address,uint256)',
                owner,
                tokenId
            )
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
