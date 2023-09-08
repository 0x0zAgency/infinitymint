//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import 'infinitymint/alpha/InfinityMintObject.sol';
import 'infinitymint/alpha/InfinityMintLinker.sol';
import 'infinitymint/alpha/ERC721.sol';
import 'infinitymint/alpha/Authentication.sol';

contract Mod_CloneMachineOracle is Authentication, InfinityMintObject {
    mapping(uint256 => address[]) internal heldMinters;

    function addPermissions(uint256 cloneId, address[] memory addresses)
        public
        onlyApproved
    {
        require(addresses.length > 0, 'no addresses given');
        heldMinters[cloneId] = new address[](addresses.length);
        for (uint256 i = 0; i < addresses.length; ) {
            require(
                Authentication(addresses[i]).deployer() == address(this),
                'one or more addresses still needs its privillages transfered to this contract'
            );

            heldMinters[cloneId][i] = addresses[i];
            unchecked {
                ++i;
            }
        }
    }

    function transferPermissions(uint256 cloneId, address newOwner)
        public
        onlyApproved
    {
        require(heldMinters[cloneId].length != 0, 'bad clone id');

        for (uint256 i = 0; i < heldMinters[cloneId].length; ) {
            Authentication(heldMinters[cloneId][i]).transferOwnership(newOwner);
            unchecked {
                ++i;
            }
        }

        delete heldMinters[cloneId];
    }
}
