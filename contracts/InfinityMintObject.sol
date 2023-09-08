//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

//this is implemented by every contract in our system
import './InfinityMintUtil.sol';
import './InfinityMintValues.sol';

abstract contract InfinityMintObject {
    /// @notice The main InfinityMint object, TODO: Work out a way for this to easily be modified
    struct InfinityObject {
        uint32 pathId;
        uint32 pathSize;
        uint32 currentTokenId;
        address owner;
        uint32[] colours;
        bytes mintData;
        uint32[] assets;
        string[] names;
        address[] destinations;
    }

    /// @notice Creates a new struct from arguments
    /// @dev Stickers are not set through this, structs cannot be made with sticker contracts already set and have to be set manually
    /// @param currentTokenId the tokenId,
    /// @param pathId the infinity mint paths id
    /// @param pathSize the size of the path (only for vectors)
    /// @param assets the assets which make up the token
    /// @param names the names of the token, its just the name but split by the splaces.
    /// @param colours decimal colours which will be convered to hexadecimal colours
    /// @param mintData variable dynamic field which is passed to ERC721 Implementor contracts and used in a lot of dynamic stuff
    /// @param _sender aka the owner of the token
    /// @param destinations a list of contracts associated with this token
    function createInfinityObject(
        uint32 currentTokenId,
        uint32 pathId,
        uint32 pathSize,
        uint32[] memory assets,
        string[] memory names,
        uint32[] memory colours,
        bytes memory mintData,
        address _sender,
        address[] memory destinations
    ) internal pure returns (InfinityObject memory) {
        return
            InfinityObject(
                pathId,
                pathSize,
                currentTokenId,
                _sender, //the sender aka owner
                colours,
                mintData,
                assets,
                names,
                destinations
            );
    }

    /// @notice basically unpacks a return object into bytes.
    function encode(InfinityObject memory data)
        internal
        pure
        returns (bytes memory)
    {
        return
            abi.encode(
                data.pathId,
                data.pathSize,
                data.currentTokenId,
                data.owner,
                abi.encode(data.colours),
                data.mintData,
                data.assets,
                data.names,
                data.destinations
            );
    }

    /// @notice Copied behavours of the open zeppelin content due to prevent msg.sender rewrite through assembly
    function sender() internal view returns (address) {
        return (msg.sender);
    }

    /// @notice Copied behavours of the open zeppelin content due to prevent msg.sender rewrite through assembly
    function value() internal view returns (uint256) {
        return (msg.value);
    }
}
