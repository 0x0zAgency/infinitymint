//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './../Authentication.sol';
import './EASObjects.sol';

contract EASContainer is EASObjects, Authentication {
    mapping(uint256 => EASObject) globalObjects;

    function set(EASObject memory object) public onlyApproved {
        globalObjects[object.stickerId] = object;
    }

    function get(uint256 stickerId) external view returns (EASObject memory) {
        require(globalObjects[stickerId].valid);
        return globalObjects[stickerId];
    }
}
