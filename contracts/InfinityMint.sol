//SPDX-License-Identifier: UNLICENSED
//0x0zAgency 2023
pragma solidity ^0.8.0;

//
import './ERC721.sol';
import './InfinityMintStorage.sol';
import './Royalty.sol';
import './Authentication.sol';
import './Minter.sol';
import './InfinityMintObject.sol';

/// @title ERC721 InfinityMint v0.1.1.4
/// @author 0x0zAgency
/// @notice This is the main contract for an InfinityMint. It is responsible for the suite working together to create a fully dynamic and modular NFT system.
/// @dev
contract InfinityMint is ERC721, Authentication, InfinityMintObject {
     string public constant version = "0.69.1.4";  // <-- Add a version variable
    /// @notice Interface set to the location of the storage controller, is set in constructor and cannot be modified.
    InfinityMintStorage public storageController;

    /// @notice Interface set to the location of the minter controller which controls how InfinityMint mints, is set in constructor and can be modified through setDestinations
    Minter public minterController;

    /// @notice Interface set to the location of the values controller responsible for managing global variables across the smart contract syste,, is set in constructor and cannot be modified.
    InfinityMintValues public valuesController;

    /// @notice Interface set to the location of the royalty controller which controls how  picks random numbers and primes, is set in constructor and can be modified through setDestinations
    Royalty public royaltyController;

    /// @dev will be changed to TokenMinted soon
    event TokenMinted(
        uint32 tokenId,
        bytes encodedData,
        address indexed sender
    );

    /// @dev will be changed to TokenPreviewMinted soon
    event TokenPreviewMinted(
        uint32 tokenId,
        bytes encodedData,
        address indexed sender
    );

    /// @notice Fired when ever a preview has been completed
    event TokenPreviewComplete(address indexed sender, uint256 previewCount);

    /// @notice numerical increment of the current tokenId
    uint32 public currentTokenId;

    /// @notice will disallow mints if set to true
    bool public mintsEnabled;

    /// @notice InfinityMint Constructor takes tokenName and tokenSymbol and the various destinations of controller contracts
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address storageContract,
        address valuesContract,
        address minterContract,
        address royaltyContract
    ) ERC721(tokenName, tokenSymbol) {
        //storage controller cannot be rewired
        storageController = InfinityMintStorage(storageContract); //address of the storage controlller
        //values controller cannot be rewired
        valuesController = InfinityMintValues(valuesContract);
        //
        royaltyController = Royalty(royaltyContract);
        minterController = Minter(minterContract);
    }

    function setControllers(
        address storageContract,
        address valuesContract,
        address minterContract,
        address royaltyContract
    ) public onlyApproved {
        storageController = InfinityMintStorage(storageContract); //address of the storage controlller
        //values controller cannot be rewired
        valuesController = InfinityMintValues(valuesContract);
        //
        royaltyController = Royalty(royaltyContract);
        minterController = Minter(minterContract);
    }

    /// @notice the total supply of tokens
    /// @dev Returns the max supply of tokens, not the amount that have been minted. (so the tokenId)
    function totalSupply() public view returns (uint256) {
        return valuesController.tryGetValue('maxSupply');
    }

    /// @notice Toggles mints allowing people to either mint or not mint tokens.
    function setMintsEnabled(bool value) public onlyApproved {
        mintsEnabled = value;
    }

    /// @notice Returns a selection of preview mints, these are ghost NFTs which can be chosen from. Their generation values are based off of eachover due to the nature of the number system.
    /// @dev This method is the most gas intensive method in InfinityMint, how ever there is a trade off in the fact that that MintPreview is insanely cheap and does not need a lot of gas. I suggest using low previewCount values of about 2 or 3. Anything higher is dependant in your project configuartion and how much you care about gas prices.
    function getPreview() public {
        require(
            verifyMint(0, false),
            'failed mint check: mints are disabled, mints are at a max supply'
        ); //does not check the price

        //if the user has already had their daily preview mints
        require(
            valuesController.tryGetValue('previewCount') > 0,
            'previews are disabled'
        );

        //the preview timer will default to zero unless a preview has already been minted so there for it can be used like a check
        require(
            block.timestamp > storageController.getPreviewTimestamp(sender()),
            'please mint previews or wait until preview counter is up'
        );

        //minter controller will store the previews for us
        uint256 previewCount = minterController.getPreview(
            currentTokenId,
            sender()
        );

        //get cooldown of previews
        uint256 cooldownPeriod = valuesController.tryGetValue(
            'previewCooldownSeconds'
        );
        //if it is 0 (not set), set to 60 seconds
        if (cooldownPeriod == 0) cooldownPeriod = 60;
        //set it
        storageController.setPreviewTimestamp(
            sender(),
            block.timestamp + cooldownPeriod
        );

        //once done, emit an event
        emit TokenPreviewComplete(sender(), previewCount);
    }

    /// @notice Mints a preview. Index is relative to the sender and is the index of the preview in the users preview list
    /// @dev This will wipe other previews once called.
    /// @param index the index of the preview to mint
    function mintPreview(uint32 index) public payable onlyOnce {
        uint256 value = (msg.value);
        require(
            verifyMint(value, !approved[sender()]),
            'failed mint verification'
        ); //will not check the price for approved members

        completeMint(
            minterController.mintPreview(index, currentTokenId, sender()),
            sender(),
            true,
            value
        );
    }

    /// @notice Allows approved or the deployer to pick exactly what token they would like to mint. Does not check if assets/colours/mintData is valid. Implicitly assets what ever.
    /// @dev This is the cheapest way to get InfinityMint to mint something as it literally decides no values on chain. This method can also be called by a rollup solution or something or be used as a way to literally mint anything.
    /// @param receiver the address to receive the mint
    /// @param pathId the pathid you want to mint
    /// @param pathSize the size of this path (for colour generation)
    /// @param colours the colours of this token
    /// @param assets the assets for this token
    function implicitMint(
        address receiver,
        uint32 pathId,
        uint32 pathSize,
        uint32[] memory colours,
        bytes memory mintData,
        uint32[] memory assets,
        string[] memory names
    ) public onlyApproved {
        require(
            currentTokenId != valuesController.tryGetValue('maxSupply'),
            'max supply has been reached raise it before minting'
        );

        //if we are incremental or matched mode we want to set the last path id (which is actually the next one) to be plus one of the current
        //path id in case an on chain mint occurs
        if (
            valuesController.isTrue('incrementalMode') ||
            valuesController.isTrue('matchedMode')
        ) minterController.assetController().setLastPathId(pathId + 1);

        completeMint(
            createInfinityObject(
                currentTokenId,
                pathId,
                pathSize,
                assets,
                names,
                colours,
                mintData,
                receiver,
                new address[](0)
            ),
            receiver,
            false,
            value()
        );

        
    }

    /// @notice Returns the current price of a mint.
    /// @dev the royalty controller actually controls the token price so in order to change it you must send tx to that contract.
    function tokenPrice() public view returns (uint256) {
        return royaltyController.tokenPrice();
    }

    /// @notice Public method to mint a token but taking input data in the form of packed bytes
    /// @dev must have byteMint enabled in valuesController
    function mintArguments(bytes memory data) public payable onlyOnce {
        require(
            valuesController.isTrue('byteMint'),
            'must mint with mint instead of byteMint'
        );
        require(data.length != 0, 'length of bytes is zero');

        _mint(data);
    }

    /// @notice Public method to mint a token taking no bytes argument
    function mint() public payable onlyOnce {
        require(
            !valuesController.isTrue('byteMint'),
            'must mint with byteMint instead of mint'
        );

        _mint(bytes(''));
    }

    /// @notice returns the tokenURI for a token, will return the
    function tokenURI(uint256 tokenId) public view override returns (string memory result) {
        require(tokenId < currentTokenId, 'tokenURI for non-existent token');

        // Updated the default result to the provided JSON link // Set this up before you deploy the infinity minter
        
        result = 'https://ipfs.io/ipfs/bafybeiec52bo6scqfwcqbvs4rdvs6ph2xjc5vactocim3cbcmlmupkd5z4/partytime_default_uri.json';

        string memory defaultTokenURI = storageController.getOption(address(this), 'defaultTokenURI');
        // Assuming this is JSON or URI is http address...
        // This must have in it somewhere the key "default": true else the react application will think that this is an actual tokenURI

        if (bytes(defaultTokenURI).length != 0) result = defaultTokenURI;

        address owner = ownerOf(tokenId);
        string memory currentTokenURI = uri[tokenId];

        if (storageController.tokenFlag(uint32(tokenId), 'forceTokenURI') && bytes(currentTokenURI).length != 0) {
            result = currentTokenURI;
        } else if (storageController.flag(owner, 'usingRoot') || storageController.flag(address(this), 'usingRoot')) {
            // If the owner of the token is using the root, then return the address of the owner, if the project is using a root, return this current address
            address selector = storageController.flag(owner, 'usingRoot') ? owner : address(this);
            // Gets the root of the tokenURI destination, could be anything, HTTP link or more.
            string memory root = storageController.getOption(selector, 'root');
            // The prefix to add to the end or the stitch, by default .json will be added unless the boolean inside of the
            // values controller called "removeDefaultSuffix" is true.
            string memory rootSuffix = storageController.getOption(selector, 'rootSuffix');
            if (bytes(rootSuffix).length == 0 && !valuesController.isTrue('removeDefaultSuffix')) rootSuffix = '.json';

            if (bytes(root).length != 0) result = InfinityMintUtil.filepath(root, InfinityMintUtil.toString(tokenId), rootSuffix);
        } else if (bytes(currentTokenURI).length != 0) {
            result = currentTokenURI;
        }

        return result;
}

    /// @notice Allows you to withdraw your earnings from the contract.
    /// @dev The totals that the sender can withdraw is managed by the royalty controller
    function withdraw() public onlyOnce {
        uint256 total = royaltyController.values(sender());
        require(total > 0, 'no balance to withdraw');
        require(
            address(this).balance - total >= 0,
            'cannot afford to withdraw'
        );

        total = royaltyController.dispenseRoyalty(sender()); //will revert if bad, results in the value to be deposited. Has Re-entry protection.
        require(total > 0, 'value returned from royalty controller is bad');

        (bool success, ) = sender().call{ value: total }('');
        require(success, 'did not transfer successfully');
    }

    /// @notice this can only be called by sticker contracts and is used to pay back the contract owner their sticker cut TODO: Turn this into a non static function capable of accepting payments not just from the sticker
    /// @dev the amount that is paid into this function is defined by the sticker price set by the token owner. The royalty controller cuts up the deposited tokens even more depending on if there are any splits.
    function depositStickerRoyalty(uint32 tokenId) public payable onlyOnce {
        InfinityObject memory temp = storageController.get(tokenId);
        //if the sender isn't the sticker contract attached to this token
        require(
            storageController.validDestination(tokenId, 1),
            'sticker contract not set'
        );
        require(
            sender() == temp.destinations[1],
            'Sender must be the sticker contract attached to this token'
        );

        //if the value is less than 100 and we cannot split it up efficiently then do not incre
        if (value() == 0 || value() > 100)
            //increment
            royaltyController.incrementBalance(
                value(),
                royaltyController.SPLIT_TYPE_STICKER()
            );
        else revert('value given must be over 100, or zero');
    }

    /// @notice Allows approved contracts to deposit royalty types
    function depositSystemRoyalty(
        uint32 royaltyType
    ) public payable onlyOnce onlyApproved {
        require(msg.value >= 0, 'not allowed to deposit zero values');
        require(
            royaltyType != royaltyController.SPLIT_TYPE_STICKER(),
            "can't deposit sticker royalties here"
        );

        //increment
        royaltyController.incrementBalance(msg.value, royaltyType);
        //dont revert allow deposit
    }

    /// @notice Gets the pathId of a token.
    /// @dev must be split up into chunks of 32
    function getPathId(uint32 tokenId) external view returns (uint256) {
        return storageController.get(tokenId).pathId;
    }

    /// @notice Allows the ability for multiple tokens to be transfered at once.
    /// @dev must be split up into chunks of 32
    function transferBatch(
        uint256[] memory tokenIds,
        address destination
    ) public {
        require(tokenIds.length < 32, 'please split up into chunks of 32');
        for (uint256 i = 0; i < tokenIds.length; ) {
            safeTransferFrom(sender(), destination, tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    /// @notice See {ERC721}
    function beforeTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(
            storageController.tokenFlag(uint32(tokenId), 'locked') != true,
            'This token is locked and needs to be unlocked before it can be transfered'
        );

        //transfer it in storage
        storageController.transfer(to, uint32(tokenId));

        if (!valuesController.isTrue('disableRegisteredTokens')) {
            storageController.addToRegisteredTokens(to, uint32(tokenId));

            if (from != address(0x0))
                storageController.deleteFromRegisteredTokens(
                    from,
                    uint32(tokenId)
                );
        }
    }

    /// @notice sets the token URI
    /// @dev you need to call this from an approved address for the token
    /// @param tokenId the tokenId
    /// @param json an IFPS link or a
    function setTokenURI(uint32 tokenId, string memory json) public {
        require(
            isApprovedOrOwner(sender(), tokenId),
            'is not Owner, approved or approved for all'
        );
        uri[tokenId] = json;
    }

    /// @notice Mints a token and stores its data inside of the storage contract, increments royalty totals and emits event.
    /// @dev This is called after preview mint, implicit mint and normal mints to finish up the transaction. We also wipe previous previews the address might have secretly inside the storageController.set method.
    /// @param data the InfinityMint token data,
    /// @param mintReceiver the sender or what should be tx.origin address
    /// @param isPreviewMint is true if the mint was from a preview
    /// @param mintPrice the value of the msg
    function completeMint(
        InfinityMintObject.InfinityObject memory data,
        address mintReceiver,
        bool isPreviewMint,
        uint256 mintPrice
    ) private {
        //mint it
        ERC721.mint(mintReceiver, currentTokenId, data.mintData);
        //store it, also registers it for look up + deletes previous previews
        storageController.set(currentTokenId, data);
        setTokenURI(currentTokenId,'https://ipfs.io/ipfs/bafybeiec52bo6scqfwcqbvs4rdvs6ph2xjc5vactocim3cbcmlmupkd5z4/partytime_default_uri.json');
        //added for fast on chain look up on ganache basically, in a live environment registeredTokens should be disabled
        if (!valuesController.isTrue('disableRegisteredTokens'))
            storageController.addToRegisteredTokens(
                mintReceiver,
                currentTokenId
            );
        //deletes previews and preview timestamp so they can receive more previews
        storageController.deletePreview(
            mintReceiver,
            valuesController.tryGetValue('previewCount')
        );

        //increment balance inside of royalty controller
        royaltyController.incrementBalance(
            mintPrice,
            royaltyController.SPLIT_TYPE_MINT()
        );

        if (isPreviewMint) {
            //if true then its a preview mint
            emit TokenPreviewMinted(
                currentTokenId++,
                encode(data),
                mintReceiver
            );
            return;
        }

        emit TokenMinted(currentTokenId++, encode(data), mintReceiver);
    }

    /// @notice Mints a new ERC721 InfinityMint Token
    /// @dev Takes no arguments. You dont have to pay for the mint if you are approved (or the deployer)
    function _mint(bytes memory data) private {
        //check if mint is valid
        require(
            verifyMint(value(), !approved[sender()]),
            'failed mint check: mints are disabled, mints are at a max supply or you did not pay enough'
        );
        completeMint(
            minterController.mint(currentTokenId, sender(), data),
            sender(),
            false,
            value()
        );
    }

    /// @notice checks the transaction to see if it is valid
    /// @dev checks if the price is the current token price and if mints are disabled and if the maxSupply hasnt been met
    /// @param mintPrice the value of the current message
    /// @param checkPrice if we should check the current price
    function verifyMint(
        uint256 mintPrice,
        bool checkPrice
    ) private view returns (bool) {
        if (!mintsEnabled) return false;

        if (currentTokenId >= valuesController.tryGetValue('maxSupply'))
            return false;

        if (checkPrice && mintPrice != royaltyController.tokenPrice())
            return false;

        return true;
    }
}
