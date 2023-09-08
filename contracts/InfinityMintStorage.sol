//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './InfinityMintObject.sol';
import './Authentication.sol';

/// @title InfinityMint storage controller
/// @author 0xTinman.eth
/// @notice Stores the outcomes of the mint process and previews and also unlock keys
/// @dev Attached to to an InfinityMint
contract InfinityMintStorage is Authentication, InfinityMintObject {
    /// @notice previews
    mapping(address => mapping(uint256 => InfinityObject)) public previews;
    /// @notice previews timestamps of when new previews can be made
    mapping(address => uint256) public previewTimestamp;
    /// @notice all of the token data
    mapping(uint32 => InfinityObject) private tokens;
    /// @notice Address flags can be toggled and effect all of the tokens
    mapping(address => mapping(string => bool)) private flags;
    /// @notice a list of tokenFlags associated with the token
    mapping(uint256 => mapping(string => bool)) public tokenFlags;
    /// @notice a list of options
    mapping(address => mapping(string => string)) private options;
    /// @notice private mapping holding a list of tokens for owned by the address for quick look up
    mapping(address => uint32[]) private registeredTokens;

    /// @notice returns true if the address is preview blocked and unable to receive more previews
    function getPreviewTimestamp(address addr) external view returns (uint256) {
        return previewTimestamp[addr];
    }

    /// @notice sets a time in the future they an have more previews
    function setPreviewTimestamp(
        address addr,
        uint256 timestamp
    ) public onlyApproved {
        require(timestamp > block.timestamp, 'timestamp must be in the future');
        previewTimestamp[addr] = timestamp;
    }

    /**
		@notice Returns true if address in destinations array is valid,
		destinations array is managed by InfinityMintLinker and i used to associate contract destinations on chain with a token
	*/
    function hasDestinaton(
        uint32 tokenId,
        uint256 index
    ) external view returns (bool) {
        return
            tokens[tokenId].destinations.length < index &&
            tokens[tokenId].destinations[index] != address(0x0);
    }

    /// @notice Allows those approved with the contract to directly force a token flag. The idea is a seperate contract would control immutable this way
    /// @dev NOTE: This can only be called by contracts to curb rugging potential
    function forceTokenFlag(
        uint256 tokenId,
        string memory _flag,
        bool position
    ) public onlyApproved {
        tokenFlags[tokenId][_flag] = position;
    }

    //// @notice Allows the current token owner to toggle a flag on the token, for instance, locked flag being true will mean token cannot be transfered
    function setTokenFlag(
        uint256 tokenId,
        string memory _flag,
        bool position
    ) public onlyApproved {
        require(this.flag(tokenId, 'immutable') != true, 'token is immutable');
        require(
            !InfinityMintUtil.isEqual(bytes(_flag), 'immutable'),
            'token immutable/mutable state cannot be modified this way for security reasons'
        );
        tokenFlags[tokenId][_flag] = position;
    }

    /// @notice returns the value of a flag
    function flag(
        uint256 tokenId,
        string memory _flag
    ) external view returns (bool) {
        return tokenFlags[tokenId][_flag];
    }

    /// @notice sets an option for a users tokens
    /// @dev this is used for instance inside of tokenURI
    function setOption(
        address addr,
        string memory key,
        string memory option
    ) public onlyApproved {
        options[addr][key] = option;
    }

    /// @notice deletes an option
    function deleteOption(address addr, string memory key) public onlyApproved {
        delete options[addr][key];
    }

    /// @notice returns a global option for all the addresses tokens
    function getOption(
        address addr,
        string memory key
    ) external view returns (string memory) {
        return options[addr][key];
    }

    //// @notice Allows the current token owner to toggle a flag on the token, for instance, locked flag being true will mean token cannot be transfered
    function setFlag(
        address addr,
        string memory _flag,
        bool position
    ) public onlyApproved {
        flags[addr][_flag] = position;
    }

    function tokenFlag(
        uint32 tokenId,
        string memory _flag
    ) external view returns (bool) {
        return tokenFlags[tokenId][_flag];
    }

    function validDestination(
        uint32 tokenId,
        uint256 index
    ) external view returns (bool) {
        return (tokens[tokenId].owner != address(0x0) &&
            tokens[tokenId].destinations.length != 0 &&
            index < tokens[tokenId].destinations.length &&
            tokens[tokenId].destinations[index] != address(0x0));
    }

    /// @notice returns the value of a flag
    function flag(
        address addr,
        string memory _flag
    ) external view returns (bool) {
        return flags[addr][_flag];
    }

    /// @notice returns address of the owner of this token
    /// @param tokenId the tokenId to get the owner of
    function getOwner(uint32 tokenId) public view returns (address) {
        return tokens[tokenId].owner;
    }

    /// @notice returns an integer array containing the token ids owned by the owner address
    /// @dev NOTE: This will only track 256 tokens
    /// @param owner the owner to look for
    function getAllRegisteredTokens(
        address owner
    ) public view returns (uint32[] memory) {
        return registeredTokens[owner];
    }

    /// @notice this method adds a tokenId from the registered tokens list which is kept for the owner. these methods are designed to allow limited data retrival functionality on local host environments
    /// @dev for local testing purposes mostly, to make it scalable the length is capped to 128. Tokens should be indexed by web2 server not on chain.
    /// @param owner the owner to add the token too
    /// @param tokenId the tokenId to add
    function addToRegisteredTokens(
        address owner,
        uint32 tokenId
    ) public onlyApproved {
        //if the l
        if (registeredTokens[owner].length < 256)
            registeredTokens[owner].push(tokenId);
    }

    /// @notice Gets the amount of registered tokens
    /// @dev Tokens are indexable instead by their current positon inside of the owner wallets collection, returns a tokenId
    /// @param owner the owner to get the length of
    function getRegisteredTokenCount(
        address owner
    ) public view returns (uint256) {
        return registeredTokens[owner].length;
    }

    /// @notice returns a token
    /// @dev returns an InfinityObject defined in {InfinityMintObject}
    /// @param tokenId the tokenId to get
    function get(uint32 tokenId) public view returns (InfinityObject memory) {
        if (tokens[tokenId].owner == address(0x0)) revert('invalid token');

        return tokens[tokenId];
    }

    /// @notice Sets the owner field in the token to another value
    function transfer(address to, uint32 tokenId) public onlyApproved {
        //set to new owner
        tokens[tokenId].owner = to;
    }

    function set(
        uint32 tokenId,
        InfinityObject memory data
    ) public onlyApproved {
        require(data.owner != address(0x0), 'null owner');
        require(data.currentTokenId == tokenId, 'tokenID mismatch');
        tokens[tokenId] = data;
    }

    /// @notice use normal set when can because of the checks it does before the set, this does no checks
    function setUnsafe(uint32 tokenId, bytes memory data) public onlyApproved {
        tokens[tokenId] = abi.decode(data, (InfinityObject));
    }

    function setPreview(
        address owner,
        uint256 index,
        InfinityObject memory data
    ) public onlyApproved {
        previews[owner][index] = data;
    }

    function getPreviewAt(
        address owner,
        uint256 index
    ) external view returns (InfinityObject memory) {
        require(
            previews[owner][index].owner != address(0x0),
            'invalid preview'
        );

        return previews[owner][index];
    }

    function findPreviews(
        address owner,
        uint256 previewCount
    ) public view onlyApproved returns (InfinityObject[] memory) {
        InfinityObject[] memory temp = new InfinityObject[](previewCount);
        for (uint256 i = 0; i < previewCount; ) {
            temp[i] = previews[owner][i];

            unchecked {
                ++i;
            }
        }

        return temp;
    }

    function deletePreview(
        address owner,
        uint256 previewCount
    ) public onlyApproved {
        for (uint256 i = 0; i < previewCount; ) {
            delete previews[owner][i];

            unchecked {
                ++i;
            }
        }

        delete previewTimestamp[owner];
    }

    function deleteFromRegisteredTokens(
        address owner,
        uint32 tokenId
    ) public onlyApproved {
        uint256 length = registeredTokens[owner].length;
        for (uint256 i = 0; i < length; ) {
            if (registeredTokens[owner][i] == tokenId) {
                registeredTokens[owner][i] = registeredTokens[owner][
                    length - 1
                ];
                registeredTokens[owner].pop();
                break;
            }

            unchecked {
                ++i;
            }
        }
    }
}
