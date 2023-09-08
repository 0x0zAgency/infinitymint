//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './RaritySVG.sol';

contract RarityImage is RaritySVG {
    constructor(string memory _tokenName, address valuesContract)
        RaritySVG(_tokenName, valuesContract)
    {
        tokenName = _tokenName;
        assetsType = 'image'; //returns an image (png, jpeg)
    }
}
