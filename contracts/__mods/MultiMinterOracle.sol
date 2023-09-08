//will be put into the project
//0xTinman.eth 2021
pragma solidity ^0.8.0;

//InfinityMint authentication system
import 'contracts/Authentication.sol';

contract Mod_MultiMinterOracle is Authentication {
    mapping(address => bool) public multiMinters;

    function registerMultiMinter(address _multiMinter) public onlyApproved {
        multiMinters[_multiMinter] = true;
    }

    function revokeMultiMinter(address _multiMinter) public onlyApproved {
        multiMinters[_multiMinter] = false;
    }

    function isMultiMinter(address _multiMinter) public view returns (bool) {
        return multiMinters[_multiMinter];
    }
}
