//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './IERC721.sol';
import './ERC165.sol';
import './IERC165.sol';

/// @title ERC-721 Infinity Mint Implementation
/// @author 0xTinman.eth
/// @notice This is a basic ERC721 Implementation that is designed to be as simple and gas efficient as possible.
/// @dev This contract supports tokenURI (the Metadata extension) but does not include the Enumerable extension.
contract ERC721 is ERC165, IERC721, IERC721Metadata {
    ///@notice Storage for the tokens
    ///@dev indexed by tokenId
    mapping(uint256 => address) internal tokens; //(slot 0)
    ///@notice Storage the token metadata
    ///@dev indexed by tokenId
    mapping(uint256 => string) internal uri; //(slot 1)
    ///@notice Storage the token metadata
    ///@dev indexed by tokenId
    mapping(uint256 => address) internal approvedTokens; //(slot 2)
    ///@notice Stores approved operators for the addresses tokens.
    mapping(address => mapping(address => bool)) internal operators; //(slot 3)
    ///@notice Stores the balance of tokens
    mapping(address => uint256) internal balance; //(slot 4)

    ///@notice The name of the ERC721
    string internal _name; //(slot 5)
    ///@notice The Symbol of the ERC721
    string internal _symbol; //(slot 6)

    /**
        @notice ERC721 Constructor takes tokenName and tokenSymbol
     */
    constructor(string memory tokenName, string memory tokenSymbol) {
        _name = tokenName;
        _symbol = tokenSymbol;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     * @notice this is used by opensea/polyscan to detect our ERC721
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
        @notice blanceOf returns the number of tokens an address currently holds.
     */
    function balanceOf(address _owner) public view override returns (uint256) {
        return balance[_owner];
    }

    /**
        @notice Returns the owner of a current token
        @dev will Throw if the token does not exist
     */
    function ownerOf(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (address)
    {
        require(exists(_tokenId), 'invalid tokenId');
        return tokens[_tokenId];
    }

    /**
        @notice Will approve an operator for the senders tokens
    */
    function setApprovalForAll(address _operator, bool _approved)
        public
        override
    {
        operators[_sender()][_operator] = _approved;
        emit ApprovalForAll(_sender(), _operator, _approved);
    }

    /**
        @notice Will returns true if the operator is approved by the owner address
    */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool)
    {
        return operators[_owner][_operator];
    }

    /**
        @notice Returns the tokens URI Metadata object
    */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return uri[_tokenId];
    }

    /**
        @notice Returns the name of the ERC721  for display on places like Etherscan
    */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
        @notice Returns the symbol of the ERC721 for display on places like Polyscan
    */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
        @notice Returns the approved adress for this token.
    */
    function getApproved(uint256 _tokenId)
        public
        view
        override
        returns (address)
    {
        return approvedTokens[_tokenId];
    }

    /**
        @notice Sets an approved adress for this token
        @dev will Throw if tokenId does not exist
    */
    function approve(address _to, uint256 _tokenId) public override {
        address owner = ERC721.ownerOf(_tokenId);

        require(_to != owner, 'cannot approve owner');
        require(
            _sender() == owner || isApprovedForAll(owner, _sender()),
            'ERC721: approve caller is not token owner or approved for all'
        );
        approvedTokens[_tokenId] = _to;
        emit Approval(owner, _to, _tokenId);
    }

    /**
        @notice Mints a token.
        @dev If you are transfering a token to a contract the contract will make sure that it can recieved the ERC721 (implements a IERC721Receiver) if it does not it will revert the transcation. Emits a {Transfer} event.
    */
    function mint(
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) internal {
        require(_to != address(0x0), '0x0 mint');
        require(!exists(_tokenId), 'already minted');

        balance[_to] += 1;
        tokens[_tokenId] = _to;

        emit Transfer(address(0x0), _to, _tokenId);

        //check that the ERC721 has been received
        require(
            checkERC721Received(_sender(), address(this), _to, _tokenId, _data)
        );
    }

    /**
        @notice Returns true if a token exists.
     */
    function exists(uint256 _tokenId) public view returns (bool) {
        return tokens[_tokenId] != address(0x0);
    }

    /// @notice Is ran before every transfer, overwrite this function with your own logic
    /// @dev Must return true else will revert
    function beforeTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal virtual {}

    /**
        @notice Transfers a token fsrom one address to another. Use safeTransferFrom as that will double check that the address you send this token too is a contract that can actually receive it.
		@dev Emits a {Transfer} event.
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) public virtual override {
        require(
            isApprovedOrOwner(_sender(), _tokenId),
            'not approved or owner'
        );
        require(_from != address(0x0), 'sending to null address');

        //before the transfer
        beforeTransfer(_from, _to, _tokenId);

        delete approvedTokens[_tokenId];
        balance[_from] -= 1;
        balance[_to] += 1;
        tokens[_tokenId] = _to;

        emit Transfer(_from, _to, _tokenId);
    }

    /// @notice will returns true if the address is apprroved for all, approved operator or is the owner of a token
    /// @dev same as open zepps
    function isApprovedOrOwner(address addr, uint256 tokenId)
        public
        view
        returns (bool)
    {
        address owner = ERC721.ownerOf(tokenId);
        return (addr == owner ||
            isApprovedForAll(owner, addr) ||
            getApproved(tokenId) == addr);
    }

    /**
        @notice Just like transferFrom except we will check if the to address is a contract and is an IERC721Receiver implementer
		@dev Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) public virtual override {
        _safeTransferFrom(_from, _to, _tokenId, _data);
    }

    /**
        @notice Just like the method above except with no data field we pass to the implemeting contract.
		@dev Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) public virtual override {
        _safeTransferFrom(_from, _to, _tokenId, '');
    }

    /**
        @notice Internal method to transfer the token and require that checkERC721Recieved is equal to true.
     */
    function _safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) private {
        transferFrom(_from, _to, _tokenId);
        //check that it implements an IERC721 receiver if it is a contract
        require(
            checkERC721Received(_sender(), _from, _to, _tokenId, _data),
            'ERC721 Receiver Confirmation Is Bad'
        );
    }

    /**
        @notice Checks first if the to address is a contract, if it is it will confirm that the contract is an ERC721 implentor by confirming the selector returned as documented in the ERC721 standard. If the to address isnt a contract it will just return true. Based on the code inside of OpenZeppelins ERC721
     */
    function checkERC721Received(
        address _operator,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) private returns (bool) {
        if (!isContract(_to)) return true;

        try
            IERC721Receiver(_to).onERC721Received(
                _operator,
                _from,
                _tokenId,
                _data
            )
        returns (bytes4 confirmation) {
            return (confirmation == IERC721Receiver.onERC721Received.selector);
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert('This contract does not implement an IERC721Receiver');
            } else {
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }

    ///@notice secures msg.sender so it cannot be changed
    function _sender() internal view returns (address) {
        return (msg.sender);
    }

    ///@notice Returns true if the address is a contract
    ///@dev Sometimes doesnt work and contracts might be disgused as addresses
    function isContract(address _address) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_address)
        }
        return size > 0;
    }
}
