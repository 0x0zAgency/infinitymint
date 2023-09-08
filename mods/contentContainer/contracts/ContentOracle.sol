//0xTinman.eth 2021
pragma solidity ^0.8.0;

import 'infinitymint/alpha/InfinityMint.sol';
import 'infinitymint/alpha/Authentication.sol';
import 'infinitymint/alpha/InfinityMintObject.sol';

contract Mod_ContentOracle is Authentication, InfinityMintObject {
    mapping(string => Content) public contentKeys;
    string[] public contentKeysArray;
    InfinityMint internal erc721;

    struct Content {
        string key;
        string mimeType;
        string content;
        uint256 version;
        bool active;
        bytes data;
    }

    constructor(address erc721Destination) {
        erc721 = InfinityMint(erc721Destination);
    }

    function setKey(string memory key, Content memory content)
        public
        onlyApproved
    {
        contentKeys[key] = content;
        contentKeysArray.push(key);
    }

    function setActive(string memory key, bool active) public onlyApproved {
        contentKeys[key].active = active;
    }

    function isActive(string memory key) public view returns (bool) {
        return contentKeys[key].active;
    }

    function setVersion(string memory key, uint256 version)
        public
        onlyApproved
    {
        contentKeys[key].version = version;
    }

    function getContent(string memory key)
        public
        view
        returns (Content memory)
    {
        return contentKeys[key];
    }

    function deleteKey(string memory key) public onlyApproved {
        for (uint256 i = 0; i < contentKeysArray.length; i++) {
            if (
                keccak256(abi.encodePacked(contentKeysArray[i])) ==
                keccak256(abi.encodePacked(key))
            ) {
                contentKeysArray[i] = contentKeysArray[
                    contentKeysArray.length - 1
                ];
                contentKeysArray.pop();
                break;
            }
        }

        delete contentKeys[key];
    }

    function getKeys() public view returns (string[] memory) {
        return contentKeysArray;
    }

    function isValidKey(string memory key) public view returns (bool) {
        for (uint256 i = 0; i < contentKeysArray.length; i++) {
            if (
                keccak256(abi.encodePacked(contentKeysArray[i])) ==
                keccak256(abi.encodePacked(key))
            ) {
                return true;
            }
        }
        return false;
    }
}
