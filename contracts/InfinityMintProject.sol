//SPDX-License-Identifier: UNLICENSED
//0xTinman.eth 2021
pragma solidity ^0.8.0;

import './Authentication.sol';

contract InfinityMintProject is InfinityMintObject, Authentication {
    mapping(uint256 => bytes) internal projects;
    mapping(uint256 => bytes) internal tags;
    mapping(bytes => bytes) internal interactions;
    uint256 internal nextVersion = 0;
    uint256 internal outputVersion = 0;

    function getVersions() external view returns (uint256) {
        return nextVersion;
    }

    function getCurrentTag() external view returns (bytes memory) {
        return tags[outputVersion];
    }

    function getCurrentVersion() external view returns (uint256) {
        return outputVersion;
    }

    function setInitialProject(bytes memory project) public onlyDeployer {
        require(nextVersion == 0, 'initial project already set');
        projects[nextVersion] = project;
        tags[nextVersion] = 'initial';
        interactions['initial'] = abi.encode(
            sender(),
            block.timestamp,
            block.number,
            project.length
        );
        outputVersion = 0;
        unchecked {
            ++nextVersion;
        }
    }

    function setVersion(uint256 version) public onlyApproved {
        require(version < nextVersion && version > 0, 'invalid version');
        require(projects[version].length != 0, 'blank project set');
        outputVersion = version;
    }

    function getProject() external view returns (bytes memory) {
        bytes memory result = projects[outputVersion];
        if (result.length == 0) return bytes("{'local':true}"); //try and force local infinity mint mode
        return result;
    }

    function getUpdates() external view returns (bytes[] memory updates) {
        updates = new bytes[](nextVersion);

        for (uint256 i = 0; i < nextVersion; ) {
            updates[i] = interactions[tags[i]];

            unchecked {
                ++i;
            }
        }
    }

    function updateProject(
        bytes memory project,
        bytes memory tag,
        bool setAsCurrentVersion
    ) public onlyApproved {
        require(bytes(project).length != 0, 'blank project set');
        require(bytes(tag).length != 0, 'blank tag set');
        require(interactions[tag].length == 0, 'tag already set');
        require(nextVersion != 0, 'initial project not set by deployer');
        projects[nextVersion] = project;
        tags[nextVersion] = tag;
        interactions[tag] = abi.encode(
            sender(),
            block.timestamp,
            block.number,
            project.length
        );
        unchecked {
            if (setAsCurrentVersion) outputVersion = nextVersion;
            ++nextVersion;
        }
    }
}
