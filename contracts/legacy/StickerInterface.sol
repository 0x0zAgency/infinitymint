//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

interface StickerInterface {
    function acceptRequest(address sender, uint32 index) external;

    function addRequest(bytes memory packed) external payable;

    function withdrawRequest(uint32 index) external;

    function denyRequest(address sender, uint32 index) external;

    function getStickers() external view returns (uint32[] memory result);

    function verifyAuthenticity() external view returns (bool);

    function getSticker(uint32 stickerId)
        external
        view
        returns (bytes memory result);

    function getRequests() external view returns (bytes[] memory result);

    function getRequestCount() external view returns (uint256);

    function getStickerCount() external view returns (uint256);

    function getMyRequests() external view returns (bytes[] memory result);
}
