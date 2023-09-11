//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

//in order for the linter to work, it must access an actual valid file
import 'contracts/ERC721.sol'; //all of these will be remapped by Initial to point to where the file actually is
import 'contracts/InfinityMint.sol';

contract Mod_FlagManager is Authentication, InfinityMintObject {
    InfinityMint erc721;
    InfinityMintStorage storageController;

    event OptionUpdated(string option, address indexed sender, string newValue);

    event FlagUpdated(
        string flag,
        uint256 tokenId,
        address indexed sender,
        bool oldValue,
        bool newValue
    );

    constructor(address erc721Destination, address storageDestination) {
        erc721 = InfinityMint(erc721Destination);
        storageController = InfinityMintStorage(storageDestination);
    }

    function getTokenFlag(
        address addr,
        uint256 tokenId,
        string memory optionKey
    ) external view returns (string memory) {
        string memory key = InfinityMintUtil.toString(tokenId);
        return storageController.getOption(addr, string.concat(key, optionKey));
    }

    function setTokenFlag(
        uint256 tokenId,
        string memory optionKey,
        string memory optionValue
    ) public {
        require(erc721.isApprovedOrOwner(sender(), tokenId));
        string memory key = InfinityMintUtil.toString(tokenId);

        storageController.setOption(
            sender(),
            string.concat(key, optionKey),
            optionValue
        );
        emit OptionUpdated(
            string.concat(key, optionKey),
            sender(),
            optionValue
        );
    }
}
