//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './EAS.sol';
import './EASContainer.sol';
import './EASReceiver.sol';
import './IEASManager.sol';

/**
	Each Mint gets an EAS Manager
 */
contract EASManager is EASObjects, ERC721, Authentication, IEASReceiver {
    EAS minter;
    EASContainer container;

    struct Campaign {
        uint256 campaignCount;
        uint256 stickerId;
        address owner;
        address minter;
        address[] receivers;
        bool allReceivers;
        uint256 lengthInHours;
        uint256 runs;
        uint256 bounty;
        bool hasStarted;
        bool valid;
    }

    uint256 activeCampaignId;
    uint256 campaignCount;

    mapping(uint256 => Campaign) campaigns;
    mapping(address => mapping(uint256 => bool)) activeCampaigns;
    mapping(address => bool) registeredReceivers;
    mapping(uint256 => uint256) activeCampaignIdToStickerId;

    address[] public allReceivers;

    event StartedCampaign(
        address indexed sender,
        uint256 campaignId,
        Campaign,
        bool isGlobal
    );
    event ActivatedCampaign(
        address indexed sender,
        uint256 campaignId,
        address receiverDestination
    );

    constructor(address minterDestination, address containerDestination)
        ERC721('EAS Campaign Manager', 'EAS-M')
    {
        minter = EAS(minterDestination);
        container = EASContainer(containerDestination);
    }

    function registerInterface() public pure returns (bytes4) {
        return type(IEASManager).interfaceId;
    }

    function registerReceiver(address receiverDestination) public {
        require(
            !registeredReceivers[receiverDestination],
            'already registered'
        );
        EASReceiver receiver = EASReceiver(receiverDestination);

        require(
            receiver.registerInterface() == type(IEASReceiver).interfaceId,
            'interfaceId mismatch'
        );
        require(
            receiver.isAuthenticated(sender()),
            'must be authenticated with receiver'
        );
        require(receiver.minter() == address(minter), 'minter mismatch');
        require(receiver.manager() == address(this), 'manager mismatch');
        require(
            receiver.isAuthenticated(address(this)),
            'manager is not approved'
        );

        registeredReceivers[receiverDestination] = true;
        allReceivers.push(receiverDestination);
    }

    function get(uint256 id) external view returns (Campaign memory) {
        require(campaigns[id].valid == true);
        return campaigns[id];
    }

    function activateCampaign(uint256 campaignId, address receiverDestination)
        public
    {
        require(campaigns[campaignId].valid, 'Invalid campaign');
        require(
            !activeCampaigns[receiverDestination][campaignId],
            'already active campaign'
        );

        EASWallet wallet = EASWallet(
            container.get(campaigns[campaignId].stickerId).EASWalletDestination
        );
        require(
            wallet.getBalance() - campaigns[campaignId].bounty >= 0,
            'campaign owner cannot afford bounty'
        );

        if (!campaigns[campaignId].allReceivers) {
            bool found = false;
            for (uint256 i = 0; i < campaigns[campaignId].receivers.length; ) {
                if (campaigns[campaignId].receivers[i] == receiverDestination) {
                    found = true;
                    break;
                }
                unchecked {
                    ++i;
                }
            }

            require(found, 'receiver destination is not open to this campaign');
        }

        activeCampaigns[receiverDestination][campaignId] = true;
        mint(receiverDestination, activeCampaignId, '');
        activeCampaignIdToStickerId[activeCampaignId] = campaigns[campaignId]
            .stickerId;
        campaigns[campaignId].runs++;
        emit ActivatedCampaign(sender(), campaignId, receiverDestination);
    }

    function createGlobalCampaign(
        uint256 stickerId,
        uint256 lengthInHours,
        uint256 bounty
    ) public payable {
        _createCampaign(stickerId, new address[](0), lengthInHours, bounty);
    }

    function _createCampaign(
        uint256 stickerId,
        address[] memory receivers,
        uint256 lengthInHours,
        uint256 bounty
    ) private {
        require(lengthInHours > 0);
        require(
            minter.isApprovedOrOwner(sender(), stickerId),
            'sender be approved'
        );
        require(
            minter.isApprovedOrOwner(address(this), stickerId),
            'must approved this manager with your EADS token'
        );
        EASWallet wallet = EASWallet(
            container.get(stickerId).EASWalletDestination
        );
        require(
            wallet.getBalance() - bounty >= 0,
            'cannot afford a single bounty please load up EAS Wallet'
        );
        require(
            wallet.isAuthenticated(address(this)),
            'must approved this manager with your EADS wallet'
        );

        campaigns[campaignCount] = Campaign(
            campaignCount,
            stickerId,
            sender(),
            address(minter),
            receivers,
            receivers.length == 0,
            lengthInHours,
            0,
            bounty,
            false,
            true
        );

        campaignCount++;
    }

    function createCampaign(
        uint256 stickerId,
        address receiverDestination,
        uint256 lengthInHours,
        uint256 bounty
    ) public {
        address[] memory receivers = new address[](1);
        receivers[0] = receiverDestination;
        _createCampaign(stickerId, receivers, lengthInHours, bounty);
    }
}
