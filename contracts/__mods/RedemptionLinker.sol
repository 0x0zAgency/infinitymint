//SPDX-License-Identifier: UNLICENSED
//0xTinman 2021
pragma solidity ^0.8.0;

import 'contracts/ERC721.sol';
import 'contracts/InfinityMintLinker.sol';
import './Redemption.sol';

contract Mod_RedemptionLinker is ERC721, Authentication, InfinityMintObject {
    string forcedUri;
    Mod_Redemption redemption;
    InfinityMintLinker linker;
    ERC721 parent;

    struct ProofOfRedemption {
        bool valid;
        uint256 redemptionTokenId;
        uint256 redeemedToken;
        address redeemer;
        uint256 time;
    }

    struct Map {
        bool valid;
        uint256 redemptionTokenId;
        uint256 parentTokenId;
    }

    mapping(uint256 => ProofOfRedemption) redemptions;
    mapping(uint256 => Map) tokenIdTable;
    uint256 redemptionTokenId;

    constructor(
        string memory _tokenURI,
        string memory _tokenName,
        string memory _tokenSymbol,
        address redemptionDestination,
        address linkerDestination,
        address parentERC721
    ) ERC721(_tokenName, _tokenSymbol) {
        redemption = Mod_Redemption(redemptionDestination);
        linker = InfinityMintLinker(linkerDestination);
        forcedUri = _tokenURI;
        parent = ERC721(parentERC721);
        redemptionTokenId = 0;
    }

    function setForcedTokenURI(string memory uri) public onlyDeployer {
        forcedUri = uri;
    }

    function forceMint(address sender) public onlyDeployer {
        mint(sender, redemptionTokenId, bytes(''));
        redemptionTokenId = redemptionTokenId + 1;
    }

    function mintProofOfRedemption(uint256 parentTokenId) public {
        require(
            parent.isApprovedOrOwner(sender(), parentTokenId),
            'sender does not own token'
        );
        require(tokenIdTable[parentTokenId].valid == false, 'already redeemed');
        require(
            redemption.hasRedeemed(parentTokenId),
            'has not been redeemed through redemption contract'
        );

        mint(sender(), redemptionTokenId, bytes(''));
        
        // Set the tokenURI of the minted token to the provided file path
        uri[redemptionTokenId] = "https://ipfs.io/ipfs/bafybeid6ydc6icfza2zmt46mfjbrewi2dsq5lrmzgpaqqsymzkntlfphrm/partytime_default_proof_uri.json";

        linker.forceLink(parentTokenId, 'proof_of_redemption', address(this));
        tokenIdTable[parentTokenId] = Map(
            true,
            redemptionTokenId,
            parentTokenId
        );
        redemptions[redemptionTokenId] = ProofOfRedemption(
            true,
            redemptionTokenId,
            parentTokenId,
            sender(),
            block.timestamp
        );

        redemptionTokenId = redemptionTokenId + 1;
    }

    function canGetProofOfRedemption(uint256 parentTokenId)
        external
        view
        returns (bool)
    {
        if (!parent.exists(parentTokenId)) return false;

        return
            parent.isApprovedOrOwner(sender(), parentTokenId) &&
            redemption.hasRedeemed(parentTokenId) &&
            tokenIdTable[parentTokenId].valid == false;
    }

    function get(uint256 tokenId)
        external
        view
        returns (ProofOfRedemption memory)
    {
        return redemptions[tokenId];
    }

    function getProofOfRedemption(uint256 parentTokenId)
        external
        view
        returns (ProofOfRedemption memory)
    {
        require(tokenIdTable[parentTokenId].valid, 'invalid PoR');
        return (redemptions[tokenIdTable[parentTokenId].redemptionTokenId]);
    }

    function setTokenURI(uint256 _tokenId, string memory _newURI)
        public
        onlyApproved
    {
        uri[_tokenId] = _newURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (bytes(uri[_tokenId]).length == 0) return forcedUri;

        return uri[_tokenId];
    }
}
