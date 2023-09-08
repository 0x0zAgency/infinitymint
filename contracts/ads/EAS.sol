//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './../ERC721.sol';
import './EASObjects.sol';
import './EASContainer.sol';
import './EASWallet.sol';
import './IEASManager.sol';
import './IEASReceiver.sol';
import './IEASRegistry.sol';

/**
	Each Chain gets an EAS
 */
contract EAS is ERC721, EASObjects {
    EASContainer container;

    uint256 stickerId;
    uint256 managerId;
    mapping(uint256 => address) managers;
    mapping(address => bool) registeredManagers;

    event ManagerRegistered(
        address indexed sender,
        address managerDestination,
        uint256 managerId
    );

    constructor(address containerDestination)
        ERC721('Ethereum Ad Service', 'EAS')
    {
        container = EASContainer(containerDestination);
    }

    function registerManager(address managerDestination) public {
        require(!registeredManagers[managerDestination], 'already registered');
        require(
            type(IEASManager).interfaceId ==
                IEASRegistry(managerDestination).registerInterface()
        );

        registeredManagers[managerDestination] = true;
        managers[managerId] = managerDestination;

        emit ManagerRegistered(sender(), managerDestination, managerId++);
    }

    function createToken(string memory uri) public {
        require(bytes(uri).length > 1024, 'please upload to IPFS');

        EASWallet wallet = new EASWallet(stickerId, address(this));
        wallet.transferOwnership(sender());
        wallet.setPrivilages(address(this), true);
        container.set(
            EASObject(
                stickerId,
                address(this),
                address(0x0),
                uri,
                block.timestamp,
                block.timestamp,
                true
            )
        );
        ERC721.mint(sender(), stickerId++, '');
    }
}
