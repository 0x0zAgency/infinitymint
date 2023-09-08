//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

library InfinityMintUtil {
    function toString(
        uint256 _i
    ) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return '0';
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function filepath(
        string memory directory,
        string memory file,
        string memory extension
    ) internal pure returns (string memory) {
        return string.concat(directory, file, extension);
    }

    //checks if two strings (or bytes) are equal
    function isEqual(bytes memory s1, bytes memory s2) external pure returns (bool) {
    if (s1.length != s2.length) return false;
    for (uint256 i = 0; i < s1.length; i++) {
        if (s1[i] != s2[i]) return false;
    }
    return true;
}

}
