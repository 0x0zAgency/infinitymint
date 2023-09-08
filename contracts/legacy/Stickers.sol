//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import '../InfinityMintWallet.sol';
import './StickerInterface.sol';
import '../IntegrityInterface.sol';
import '../Authentication.sol';

abstract contract Stickers is
    StickerInterface,
    IntegrityInterface,
    Authentication
{
    /// @notice Should be the name of the contract or the name of this contract
    bytes public versionType = 'Stickers';
    address public erc721;
    uint32 public currentTokenId;
    uint256 public stickerPrice;
    uint32 public currentStickerId;
    address[] public openRequests;

    bool internal enabled;

    InfinityMintWallet public EASWallet;
    InfinityMintValues public valuesController;

    mapping(uint32 => bytes) internal flags;
    mapping(uint32 => bytes) internal stickers;
    mapping(address => bytes[]) internal requests;

    constructor(address valuesContract) {
        enabled = true;
        valuesController = InfinityMintValues(valuesContract);
        stickerPrice = 1 * valuesController.tryGetValue('baseTokenValue');
    }

    function totalSupply() external view returns (uint256) {
        return currentStickerId;
    }

    function verifyAuthenticity()
        external
        view
        virtual
        override
        returns (bool)
    {
        return true;
    }

    function setStickerPrice(uint256 price) public onlyApproved {
        stickerPrice = price;
    }

    function setEnabled(bool isEnabled) public onlyDeployer {
        enabled = isEnabled;
    }

    function isStickerFlagged(
        uint32 stickerId
    ) external view returns (bool, string memory) {
        if (flags[stickerId].length == 0) return (false, '');
        return abi.decode(flags[stickerId], (bool, string));
    }

    function setFlaggedSticker(
        uint32 stickerId,
        bool isFlagged,
        string memory reason
    ) public onlyDeployer {
        require(stickerId < currentStickerId);

        if (!isFlagged && flags[stickerId].length != 0) delete flags[stickerId];
        else flags[stickerId] = abi.encode(isFlagged, reason);
    }

    function getMyRequests() public view returns (bytes[] memory result) {
        require(requests[msg.sender].length != 0, 'no requests'); //check if user has any requests (if not, return empty array
        bytes[] memory temp = requests[msg.sender];
        return temp;
    }

    function getSticker(
        uint32 stickerId
    ) external view override returns (bytes memory result) {
        require(stickers[stickerId].length != 0);
        return stickers[stickerId];
    }

    function getStickerCount() external view override returns (uint256) {
        return uint256(currentStickerId);
    }

    function getStickers()
        external
        view
        override
        returns (uint32[] memory result)
    {
        uint32 count = 0;
        for (uint32 i = 0; i < currentStickerId; ) {
            if (stickers[i].length != 0) count++;
            unchecked {
                ++i;
            }
        }

        if (count != 0) {
            //ceate new array with the size of count
            result = new uint32[](count);
            count = 0; //reset count
            for (uint32 i = 0; i < currentStickerId; ) {
                if (stickers[i].length != 0) result[count++] = i;
                unchecked {
                    ++i;
                }
            }
        }
    }

    function getRequests()
        public
        view
        onlyApproved
        returns (bytes[] memory result)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < openRequests.length; ) {
            count += requests[openRequests[i]].length;
            unchecked {
                ++i;
            }
        }

        result = new bytes[](count);
        count = 0;
        for (uint256 i = 0; i < openRequests.length; ) {
            for (uint256 x = 0; x < requests[openRequests[i]].length; ) {
                result[count++] = requests[openRequests[i]][x];

                unchecked {
                    ++x;
                }
            }

            unchecked {
                ++i;
            }
        }

        return result;
    }

    function getRequestCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < openRequests.length; ) {
            count += requests[openRequests[i]].length;
            unchecked {
                ++i;
            }
        }
        return count;
    }

    function removeFromOpenRequests(address addr) internal {
        if (openRequests.length - 1 == 0) {
            openRequests = new address[](0);
            return;
        }

        address[] memory temp = new address[](openRequests.length - 1);
        address[] memory copy = (openRequests);
        uint256 index = 0;
        for (uint256 i = 0; i < copy.length; ) {
            if (copy[i] == addr) {
                unchecked {
                    ++i;
                }
                continue;
            }

            temp[index++] = copy[i];

            unchecked {
                ++i;
            }
        }
        openRequests = temp;
    }

    function hasOpenRequests(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < openRequests.length; ) {
            if (openRequests[i] == addr) return true;

            unchecked {
                ++i;
            }
        }
        return false;
    }

    function isSafe(
        bytes memory _p,
        uint256 erc721TokenId
    ) internal pure returns (bool) {
        //will call exception if it is bad
        (uint32 tokenId, , , ) = unpackSticker(_p);
        return tokenId == erc721TokenId;
    }

    function unpackSticker(
        bytes memory sticker
    )
        internal
        pure
        returns (
            uint32 tokenId,
            string memory checkSum,
            string memory object,
            address owner
        )
    {
        return abi.decode(sticker, (uint32, string, string, address));
    }

    function deleteRequest(address sender, uint256 index) internal {
        //if this is the last request
        if (requests[sender].length - 1 <= 0) {
            requests[sender] = new bytes[](0);
            removeFromOpenRequests(sender);
            return;
        }

        //create new temp
        bytes[] memory temp = new bytes[](requests[sender].length - 1);
        //copy to memory so not accessing storage
        bytes[] memory copy = (requests[sender]);
        uint256 count = 0; //temps index
        //for length of copy
        for (uint256 i = 0; i < copy.length; ) {
            //if i !== the deleted index add it to the new temp array
            if (i != index) temp[count++] = copy[i];
            unchecked {
                ++i;
            }
        }

        //overwrite
        requests[sender] = temp;

        //remove this request
        if (requests[sender].length == 0) removeFromOpenRequests(sender);
    }
}
