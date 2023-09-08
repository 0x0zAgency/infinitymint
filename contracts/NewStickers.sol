//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './ERC721.sol';
import './StickerOracle.sol';
import './Authentication.sol';
import './IntegrityInterface.sol';

contract NewStickers is ERC721, Authentication, IntegrityInterface {
    //has run a sucesful setup call

    //public vars
    StickerOracle public stickerOracle;
    address public erc721Destination;
    uint256 public tokenId;
    mapping(uint256 => Sticker) public stickers;

    //internal vars
    uint256 internal stickerId;
    mapping(uint256 => bytes) internal requests;
    string internal options; //allows a options object to be attached to this sticker control to specify various settings, like
    // for instance the price to submit a sticker or other shit they would like
    bool internal hasSetup; //initially will be to false and will not allow anybody to post sticker requests until the owner

    struct Sticker {
        uint256 stickerId;
        uint256 oracaleId;
        address owner;
        string stickerUri;
        bool utility; //if true, utility tokens are accepted onto the ERC721 for free.
        uint256 duration; //the length the sticker should stay on the token in seconds
        uint256 pps; //price per second
        uint256 creation;
        bool active;
        bool completed;
        bool valid;
    }

    constructor(
        address oracleDestination,
        address erc721,
        uint256 _tokenId,
        string memory tokenName,
        string memory tokenSymbol
    ) ERC721(tokenName, tokenSymbol) {
        stickerOracle = StickerOracle(oracleDestination);
        erc721Destination = erc721;
        tokenId = _tokenId;
    }

    /// @notice allows the owner of the contract to set a json array full of settings and other data on chain also takes IPFS url
    function setOptions(string memory _options) public onlyDeployer {
        options = _options;
    }

    /// @notice returns either a options object an IPFS location
    function getOptions() external view returns (string memory) {
        return options;
    }

    /// @notice Allows this contract to be linked to a token by the InfinityLinker
    function getIntegrity()
        public
        view
        override
        returns (
            address,
            address,
            uint256,
            bytes memory,
            bytes4
        )
    {
        return (
            address(this),
            deployer,
            tokenId,
            'new',
            type(IntegrityInterface).interfaceId
        );
    }

    function request(
        uint256 pps, //price per second (amount of tokens) the ad payer is willing to pay per second
        uint256 duration, //the duration of the ad (in seconds)
        bool utility, //if it is a utility sticker or not,
        bytes memory requestData
    ) public payable {
        require(utility == false || pps == 0, 'pps must be zero if untility');

        require(
            hasSetup,
            'deployer has not set up this stickers contract successfully'
        );

        StickerOracle.RegistrationObject memory obj = stickerOracle
            .findRegistration(_sender());
        require(
            obj.valid == true,
            'please register with sticker oracle first with the current address'
        );

        require(
            utility || stickerOracle.canAfford(pps, duration, _sender()),
            'cannot afford the PPS you have set for that duration currently'
        );
    }

    function getStickerCount() external view returns (uint256) {
        return stickerId;
    }

    function getActiveStickers()
        external
        view
        returns (uint256[] memory results)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < stickerId; ) {
            if (stickers[i].valid && stickers[i].active) count++;
            unchecked {
                ++i;
            }
        }

        results = new uint256[](count);
        count = 0;
        for (uint256 i = 0; i < stickerId; ) {
            if (stickers[i].valid && stickers[i].active) results[count++] = i;
            unchecked {
                ++i;
            }
        }
    }

    function getSticker(uint256 _stickerId)
        external
        view
        returns (Sticker memory sticker)
    {
        sticker = stickers[_stickerId];
        require(sticker.valid == true);
    }

    function setup() public onlyDeployer {
        require(hasSetup == false, 'has already set up');

        if (stickerOracle.verifyRegistration(tokenId, address(this))) {
            hasSetup = true;
            return;
        }

        //Will throw
        stickerOracle.registerDeploymentWithOracle(tokenId, address(this));
        hasSetup = true;
    }
}
