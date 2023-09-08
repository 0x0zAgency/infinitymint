//0xTinman.eth 2021
pragma solidity ^0.8.0;

import 'infinitymint/alpha/InfinityMint.sol';
import 'infinitymint/alpha/Authentication.sol';
import 'infinitymint/alpha/InfinityMintObject.sol';
import './ContentOracle.sol';

contract Mod_ContentContainer is Authentication, InfinityMintObject {
    uint256 public tokenId;
    InfinityMint internal erc721;
    Mod_ContentOracle internal oracle;
    mapping(string => bytes) public contentKeys;

    constructor(
        uint256 _tokenId,
        address erc721Destination,
        address oracleDestination
    ) {
        erc721 = InfinityMint(erc721Destination);
        oracle = Mod_ContentOracle(oracleDestination);

        require(erc721.isAuthenticated(address(oracle)), 'bad oracle');
        require(
            erc721.isApprovedOrOwner(msg.sender, _tokenId) ||
                erc721.isAuthenticated(msg.sender),
            'you do not have the permissions to create a content container for this token'
        );
        tokenId = _tokenId;
    }

    function forceKey(string memory key, bytes memory value)
        public
        onlyApproved
    {
        require(
            sender() == address(oracle),
            'keys can only be forced by the oracle'
        );
        require(oracle.isValidKey(key), 'this key is not valid for this token');
        contentKeys[key] = value;
    }

    function setKey(string memory key, bytes memory value) public onlyApproved {
        require(oracle.isValidKey(key), 'this key is not valid for this token');
        require(
            oracle.getContent(key).active,
            'this key is not active for this token'
        );
        contentKeys[key] = value;
    }

    function getKey(string memory key) public view returns (bytes memory) {
        return contentKeys[key];
    }

    function deleteKey(string memory key) public onlyApproved {
        delete contentKeys[key];
    }

    function getKeys() public view returns (string[] memory) {
        return oracle.getKeys();
    }

    function getContentMimeType(string memory key)
        public
        view
        returns (string memory)
    {
        Mod_ContentOracle.Content memory content = oracle.getContent(key);
        return content.mimeType;
    }

    function getContent() public view returns (bytes[] memory) {
        bytes[] memory keys = new bytes[](oracle.getKeys().length);
        for (uint256 i = 0; i < oracle.getKeys().length; i++) {
            keys[i] = contentKeys[oracle.getKeys()[i]];
        }
        return keys;
    }
}
