//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

//in order for the linter to work, it must access an actual valid file
import 'infinitymint/alpha/InfinityMint.sol';
import 'infinitymint/alpha/ERC721.sol';

contract Mod_Claimable is Authentication, InfinityMintObject {
    mapping(address => bool) private approvedDestinations;
    mapping(uint256 => Claimable) private claimables;
    mapping(address => mapping(address => mapping(uint256 => bool)))
        private claimed;
    mapping(address => mapping(address => mapping(uint256 => uint256[])))
        private storageTable;

    uint256 public currentClaimableId;

    /**
        Claim Types:
        
        0: PathId Overlayed Extension (overlays the data inside the claimable onto the token if possible)
        1: PathId Alternative Look Extension (used with Garys to add 3D files to the sneaker mints, extends the actual visual data)
        3: Token Extension (extends the token regardless of the path Id)
        4: Proof Of Moment (data must be token id + location of the proof of moment contract)
        5: Proof Of Redemption (data must be token id + location of the proof of redemption contract)
     */

    struct Claimable {
        uint256 claimType;
        bytes data;
        uint256 claimableId;
        uint256 tokenId;
        uint256 pathId;
        address parentDestination;
        address owner;
        bool anyParent;
        bool anyOwner;
        bool anyToken;
        bool isHidden;
        bool isPathSpecific;
        bool active;
    }

    function GetPotentialClaimables(uint256 tokenId, address parentDestination)
        public
        view
        returns (uint256[] memory result)
    {
        address ownerOf = ERC721(parentDestination).ownerOf(tokenId);
        InfinityObject memory token = InfinityMint(parentDestination)
            .storageController()
            .get(uint32(tokenId));
        uint256 count = 0;
        for (uint256 i = 0; i < currentClaimableId; ) {
            Claimable memory tempClaim = claimables[i];

            if (tempClaim.active != true) continue;

            if (
                tempClaim.anyToken &&
                tempClaim.anyParent &&
                !tempClaim.isPathSpecific
            ) count++;
            else {
                if (claimed[parentDestination][sender()][i]) continue;

                if (!tempClaim.anyToken && tempClaim.tokenId != tokenId)
                    continue;

                if (
                    !tempClaim.anyParent &&
                    tempClaim.parentDestination != parentDestination
                ) continue;

                if (!tempClaim.anyOwner && tempClaim.owner != ownerOf) continue;

                if (tempClaim.isHidden && tempClaim.owner != msg.sender)
                    continue;

                if (
                    tempClaim.isPathSpecific && tempClaim.pathId != token.pathId
                ) continue;

                count++;
            }

            unchecked {
                ++i;
            }
        }

        if (count == 0) return new uint256[](0);

        result = new uint256[](count);
        count = 0;
        for (uint256 i = 0; i < currentClaimableId; ) {
            Claimable memory tempClaim = claimables[i];

            if (tempClaim.active != true) continue;

            if (
                tempClaim.anyToken &&
                tempClaim.anyParent &&
                !tempClaim.isPathSpecific
            ) result[count++] = i;
            else {
                if (claimed[parentDestination][sender()][i]) continue;

                if (!tempClaim.anyToken && tempClaim.tokenId != tokenId)
                    continue;

                if (
                    !tempClaim.anyParent &&
                    tempClaim.parentDestination != parentDestination
                ) continue;

                if (!tempClaim.anyOwner && tempClaim.owner != ownerOf) continue;

                if (tempClaim.isHidden && tempClaim.owner != msg.sender)
                    continue;

                if (
                    tempClaim.isPathSpecific && tempClaim.pathId != token.pathId
                ) continue;

                result[count++] = i;
            }

            unchecked {
                ++i;
            }
        }
    }

    function updateClaimable(uint256 claimableId, bytes memory claimableRaw)
        public
    {
        require(claimableId < currentClaimableId);
        claimables[claimableId] = abi.decode(claimableRaw, (Claimable));
    }

    function pushClaimables(bytes[] memory claimablesRaw) public {
        for (uint256 i = 0; i < claimablesRaw.length; ) {
            claimables[currentClaimableId++] = abi.decode(
                claimablesRaw[i],
                (Claimable)
            );
            unchecked {
                ++i;
            }
        }
    }

    function setClaimable(bytes memory claimableRaw) public onlyApproved {
        claimables[currentClaimableId++] = abi.decode(
            claimableRaw,
            (Claimable)
        );
    }

    function getClaimable(uint256 claimId)
        public
        view
        returns (Claimable memory)
    {
        require(claimables[claimId].active == true);
        return claimables[claimId];
    }

    function getClaims(address parentDestination, uint256 tokenId)
        public
        view
        returns (uint256[] memory)
    {
        return storageTable[parentDestination][msg.sender][tokenId];
    }

    function claim(
        uint256 claimId,
        address parentDestination,
        uint256 tokenId
    ) public {
        require(approvedDestinations[parentDestination]);
        require(claimables[claimId].active);
        require(claimed[parentDestination][sender()][claimId] != true);
        require(
            claimables[claimId].anyToken != true ||
                claimables[claimId].tokenId == tokenId
        );

        if (claimables[claimId].isPathSpecific) {
            InfinityMint minter = InfinityMint(parentDestination);
            require(
                minter.storageController().get(uint32(tokenId)).pathId ==
                    claimables[claimId].pathId
            );
        }

        require(
            !claimables[claimId].anyParent ||
                claimables[claimId].parentDestination == parentDestination
        );

        ERC721 erc721 = ERC721(parentDestination);
        require(erc721.ownerOf(tokenId) == sender());

        claimed[parentDestination][sender()][claimId] = true;
        storageTable[parentDestination][sender()][tokenId].push(claimId);
    }

    constructor(address parentDestination) {
        approvedDestinations[parentDestination] = true;
    }
}
