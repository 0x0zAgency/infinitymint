//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './../Minter.sol';
import './../InfinityMintObject.sol';

contract SelectiveMinter is Minter, InfinityMintObject {
    /*
     */
    constructor(
        address valuesContract,
        address storageContract,
        address assetContract,
        address randomNumberContract
    )
        Minter(
            valuesContract,
            storageContract,
            assetContract,
            randomNumberContract
        )
    {}

    function mintPreview(
        uint32 index,
        uint32 currentTokenId,
        address sender
    )
        external
        view
        virtual
        override
        onlyApproved
        returns (InfinityObject memory)
    {
        InfinityObject memory temp = storageController.getPreviewAt(
            sender,
            index
        );

        //check the owner to see if its the same
        if (temp.owner != sender) revert('bad owner');
        if (temp.currentTokenId != index) revert('bad index');

        return
            createInfinityObject(
                currentTokenId,
                temp.pathId,
                temp.pathSize,
                temp.assets,
                temp.names,
                temp.colours,
                temp.mintData,
                temp.owner,
                temp.destinations
            );
    }

    /**

     */
    function getPreview(uint32 currentTokenId, address sender)
        external
        virtual
        override
        onlyApproved
        returns (uint256 previewCount)
    {
        previewCount = valuesController.tryGetValue('previewCount');
        if (previewCount == 0) return previewCount;

        uint256 nameCount = randomNumberController.getMaxNumber(
            valuesController.tryGetValue('nameCount')
        );

        //pick parent to base previews off of
        Asset.PartialStruct memory temp = assetController.pickPath(
            currentTokenId,
            randomNumberController
        );

        //return it into a real object
        InfinityObject memory obj = createInfinityObject(
            0, //in this context this is the "preview Id", and we start at zero
            assetController.getNextPath(),
            temp.pathSize,
            temp.assets,
            temp.names,
            temp.colours,
            temp.mintData,
            sender,
            new address[](0)
        );

        //store it
        storageController.setPreview(sender, 0, obj);

        //start at index 1 as we have done 0, base all future previews off of zero
        for (uint32 i = 1; i < previewCount; ) {
            obj.currentTokenId = i;
            //get new assets
            obj.assets = assetController.getRandomAsset(
                obj.pathId,
                randomNumberController
            );
            //get new colours
            obj.colours = assetController.getColours(
                obj.pathId,
                randomNumberController
            );
            //get new names
            obj.names = assetController.getNames(
                nameCount,
                randomNumberController
            );

            //store this variantion
            storageController.setPreview(sender, i, obj);

            unchecked {
                ++i;
            }
        }

        return previewCount;
    }

    /*

    */
    function mint(
        uint32 currentTokenId,
        address sender,
        bytes memory mintData
    ) public virtual override onlyApproved returns (InfinityObject memory) {
        Asset.PartialStruct memory temp = assetController.pickPath(
            abi.decode(mintData, (uint32)),
            currentTokenId,
            randomNumberController
        );

        return
            createInfinityObject(
                currentTokenId,
                assetController.getNextPath(),
                temp.pathSize,
                temp.assets,
                temp.names,
                temp.colours,
                temp.mintData,
                sender,
                new address[](0)
            );
    }
}
