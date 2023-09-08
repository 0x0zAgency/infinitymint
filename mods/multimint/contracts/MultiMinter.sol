//SPDX-License-Identifier: UNLICENSED
//import erc721
//simple erc721 with a token URI managed by owner
//versioned token URI?????
//will be put into the project
//0xTinman.eth 2023
pragma solidity ^0.8.0;

import 'contracts/InfinityMint.sol';
import 'contracts/Authentication.sol';
import 'contracts/InfinityMintObject.sol';

contract Mod_MultiMinter is ERC721, Authentication, InfinityMintObject {
    string public constant version = "0.69.0";  // <-- Add a version variable
    mapping(uint256 => string) public currentTokenUri;
    uint256 public currentTokenUriIndex;
    uint256 public tokenId;
    uint256 public tokenPrice;
    InfinityMint internal erc721;

    event Mint(address indexed sender, uint256 tokenId, string firstMintedURI);

    /// @notice InfinityMint Constructor takes tokenName and tokenSymbol and the various destinations of controller contracts
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address erc721Destination,
        uint256 _tokenPrice
    ) ERC721(tokenName, tokenSymbol) {
        tokenPrice = _tokenPrice;
        erc721 = InfinityMint(erc721Destination);
    }

    //sets the current tokenURI to use in the mints
    function setCurrentTokenURI(uint256 tokenUriIndex) public onlyApproved {
        require(
            bytes(currentTokenUri[tokenUriIndex]).length > 0,
            'no token uri set here'
        );
        currentTokenUriIndex = tokenUriIndex;
    }

    //sets the token URI that people can mint
    function setTokenURI(uint256 tokenUriIndex, string memory newTokenURI)
        public
        onlyApproved
    {
        require(bytes(newTokenURI).length > 0, 'empty token URI');
        currentTokenUri[tokenUriIndex] = newTokenURI;
    }

    //set the price of the mint
    function setPrice(uint256 _tokenPrice) public onlyApproved {
        tokenPrice = _tokenPrice;
    }

    function getSelectedTokenURI() external view returns (uint256) {
        return tokenId;
    }

    function getCurrentTokenURI() external view returns (string memory) {
        return currentTokenUri[currentTokenUriIndex];
    }

    //returns how many mints
    function totalMints() external view returns (uint256) {
        return tokenId;
    }

    //Mints a new ERC721 token, giving it the URI of the current tokenURIIndex
    function mint() public payable {
        //checks price is what we have set it too
        require(
            value() == tokenPrice || approved[sender()] || sender() == deployer,
            'bad price'
        );
        require(
            bytes(currentTokenUri[currentTokenUriIndex]).length > 0,
            'owner has not set up uri'
        );
        //deposit the current price of this mint back to the InfinityMint controller
        erc721.depositSystemRoyalty{ value: value() }(0);
        //mint a new token to the sender with the current token ID and then send no bytes to their wallet
        ERC721.mint(sender(), tokenId, bytes('')); // <- third param is sent to contracts/wallets kind of like sharing code, i can put code here that will be passed
        uri[tokenId] = currentTokenUri[currentTokenUriIndex]; //sets the tokenURI of the token (the look) to be the one which is currently selected by the owner
        emit Mint(sender(), tokenId++, currentTokenUri[currentTokenUriIndex]);
    }
}
