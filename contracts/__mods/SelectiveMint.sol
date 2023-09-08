//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import 'contracts/ERC721.sol';
import 'contracts/InfinityMint.sol';
import 'contracts/InfinityMintAsset.sol';
import 'contracts/InfinityMintValues.sol';
import 'contracts/Royalty.sol';
import 'contracts/Authentication.sol';

contract Mod_SelectiveMint is Authentication, InfinityMintObject {
    InfinityMintAsset public assetController;
    InfinityMint public erc721;
    RandomNumber public randomNumberController;
    InfinityMintValues public valuesController;
    Royalty public royaltyController;

    constructor(
        address erc721Destination,
        address assetControllerDestination,
        address randomNumberControllerDestination,
        address valuesControllerDestination,
        address royaltyControllerDestination
    ) {
        erc721 = InfinityMint(erc721Destination);
        assetController = InfinityMintAsset(assetControllerDestination);
        randomNumberController = RandomNumber(
            randomNumberControllerDestination
        );
        valuesController = InfinityMintValues(valuesControllerDestination);
        royaltyController = Royalty(royaltyControllerDestination);
    }

    function balance() public view returns (uint256) {
        return address(this).balance;
    }

    function deposit() public onlyDeployer onlyOnce {
        require(balance() > 0, 'No balance to deposit to main erc721 contract');
        erc721.depositSystemRoyalty{ value: balance() }(0);
    }

    function mint(
        uint32 pathId,
        uint32[] memory assets,
        uint256 nameCount
    ) public payable onlyOnce {
        require(
            erc721.approved(sender()) ||
                erc721.deployer() == sender() ||
                value() == erc721.tokenPrice(),
            'Incorrect value'
        );
        require(assetController.isValidPath(pathId), 'Invalid Path');
        uint256[] memory pathSections = assetController.getPathSections(pathId);

        //checks that the asset lenght patches the path section length
        require(pathSections.length == assets.length, 'Invalid Sections');

        //loops each of the sections and gets the asset for that section and checks if the asset is valid for that section (is in the section)
        for (uint256 x = 0; x < pathSections.length; ) {
            uint256 pathSectionId = pathSections[x];
            uint256[] memory pathAssetIds = assetController.getSectionAssets(
                pathSectionId
            );
            bool found = false;

            for (uint256 y = 0; y < pathAssetIds.length; y++) {
                if (pathAssetIds[y] == assets[x]) {
                    found = true;
                    break;
                }
            }
            require(found, 'Invalid asset');
            unchecked {
                x++;
            }
        }

        if (nameCount <= 0) nameCount = 1;

        string[] memory names;

        if (!valuesController.isTrue('matchedMode'))
            names = assetController.getNames(nameCount, randomNumberController);
        else {
            names = new string[](2);
            names[0] = assetController.names(pathId);
            names[1] = erc721.symbol();
        }

        uint32[] memory colours = assetController.getColours(
            pathId,
            randomNumberController
        );

        erc721.depositSystemRoyalty{ value: value() }(0);
        erc721.implicitMint(
            sender(),
            pathId,
            assetController.getPathSize(pathId),
            colours,
            bytes(''),
            assets,
            names
        );
    }
}
