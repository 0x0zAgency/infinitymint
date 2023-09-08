//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './InfinityMint.sol';
import './Asset.sol';
import './InfinityMintValues.sol';
import './Royalty.sol';

/// @title InfinityMint API
/// @author 0xTinman.eth
/// @notice The purpose of this contract is to act as a service to provide data in a web3 or web2 context. You will find methods for data retrival here for previews, tokens, and stickers. and it is advised that you use get from here and not actual storage contract!
/// @dev
contract InfinityMintApi is InfinityMintObject {
    InfinityMint public erc721;
    InfinityMintStorage public storageController;
    Asset public assetController;
    InfinityMintValues public valuesController;
    Royalty public royaltyController;

    constructor(
        address erc721Destination,
        address storageestination,
        address assetDestination,
        address valuesDestination,
        address royaltyDestination
    ) {
        erc721 = InfinityMint(erc721Destination);
        storageController = InfinityMintStorage(storageestination);
        assetController = Asset(assetDestination);
        valuesController = InfinityMintValues(valuesDestination);
        royaltyController = Royalty(royaltyDestination);
    }

    function getPrice() external view returns (uint256) {
        return royaltyController.tokenPrice();
    }

    function ownerOf(uint32 tokenId) external view returns (address result) {
        result = storageController.getOwner(tokenId);

        require(result != address(0x0), 'bad address');
    }

    function isPreviewBlocked(address sender) external view returns (bool) {
        //returns true only if the current time stamp is less than the preview timestamp
        return block.timestamp < storageController.getPreviewTimestamp(sender);
    }

    function isMintsEnabled() external view returns (bool) {
        return erc721.mintsEnabled();
    }

    /// @notice only returns a maximum of 256 tokens use offchain retrival services to obtain token information on owner!
    function allTokens(address owner)
        public
        view
        returns (uint32[] memory tokens)
    {
        require(
            !valuesController.isTrue('disableRegisteredTokens'),
            'all tokens method is disabled'
        );

        return storageController.getAllRegisteredTokens(owner);
    }

    function getRaw(uint32 tokenId) external view returns (bytes memory) {
        if (tokenId < 0 || tokenId >= erc721.currentTokenId()) revert();

        InfinityObject memory data = storageController.get(tokenId);

        return encode(data);
    }

    function balanceOf(address sender) external view returns (uint256) {
        return erc721.balanceOf(sender);
    }

    /// @notice gets the balance of a wallet associated with a tokenId
    function getBalanceOfWallet(uint32 tokenId) public view returns (uint256) {
        address addr = getLink(tokenId, 0);
        if (addr == address(0x0)) return 0;
        (bool success, bytes memory returnData) = addr.staticcall(
            abi.encodeWithSignature('getBalance')
        );

        if (!success) return 0;

        return abi.decode(returnData, (uint256));
    }

    function get(uint32 tokenId) external view returns (InfinityObject memory) {
        return storageController.get(tokenId);
    }

    function getWalletContract(uint32 tokenId)
        public
        view
        returns (address result)
    {
        return getLink(tokenId, 0);
    }

    function getLink(uint32 tokenId, uint256 index)
        public
        view
        returns (address)
    {
        if (tokenId > storageController.get(tokenId).destinations.length)
            return address(0x0);

        return storageController.get(tokenId).destinations[index];
    }

    function getStickerContract(uint32 tokenId)
        public
        view
        returns (address result)
    {
        return getLink(tokenId, 1);
    }

    function getPreviewTimestamp(address addr) public view returns (uint256) {
        return storageController.getPreviewTimestamp(addr);
    }

    function getPreviewCount(address addr) public view returns (uint256 count) {
        //find previews
        InfinityMintObject.InfinityObject[] memory previews = storageController
            .findPreviews(addr, valuesController.tryGetValue('previewCount'));

        //since mappings initialize their values at defaults we need to check if we are owner
        count = 0;
        for (uint256 i = 0; i < previews.length; ) {
            if (previews[i].owner == addr) count++;

            unchecked {
                ++i;
            }
        }
    }

    function allPreviews(address addr) external view returns (uint32[] memory) {
        require(addr != address(0x0), 'cannot view previews for null address');

        //find previews
        InfinityMintObject.InfinityObject[] memory previews = storageController
            .findPreviews(addr, valuesController.tryGetValue('previewCount'));

        //since mappings initialize their values at defaults we need to check if we are owner
        uint256 count = 0;
        for (uint256 i = 0; i < previews.length; ) {
            if (previews[i].owner == addr) count++;
            unchecked {
                ++i;
            }
        }

        if (count > 0) {
            uint32[] memory rPreviews = new uint32[](count);
            count = 0;
            for (uint256 i = 0; i < previews.length; ) {
                rPreviews[count++] = uint32(i);
                unchecked {
                    ++i;
                }
            }

            return rPreviews;
        }

        return new uint32[](0);
    }

    function getPreview(uint32 index)
        public
        view
        returns (InfinityObject memory)
    {
        return storageController.getPreviewAt(sender(), index);
    }

    function totalMints() external view returns (uint32) {
        return erc721.currentTokenId();
    }

    //the total amount of tokens
    function totalSupply() external view returns (uint256) {
        return valuesController.tryGetValue('maxSupply');
    }
}
