// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is Initializable, ERC721Upgradeable, OwnableUpgradeable {
    using Strings for uint256;

    // Maximum level an NFT can reach
    uint256 public constant MAX_LEVEL = 3;

    // Cost to upgrade NFT (could be modified to increase with levels)
    uint256 public upgradeCost;

    // Mapping from token ID to its current level
    mapping(uint256 => uint256) private _tokenLevels;

    // Event emitted when an NFT is upgraded
    event NFTUpgraded(uint256 indexed tokenId, uint256 newLevel);

    // Custom errors
    error TokenDoesNotExist(uint256 tokenId);
    error NotOwnerNorApproved(address sender, uint256 tokenId);
    error TokenAtMaxLevel(uint256 tokenId, uint256 maxLevel);
    error InsufficientPayment(uint256 provided, uint256 required);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __ERC721_init("Selyo Test", "ST");
        __Ownable_init(initialOwner);

        // Set a default upgrade cost
        upgradeCost = 0.01 ether;
    }

    // Separate function to set upgrade cost after initialization
    function setInitialUpgradeCost(uint256 _upgradeCost) public onlyOwner {
        upgradeCost = _upgradeCost;
    }

    function _baseURI() internal pure override returns (string memory) {
        return
            "https://raw.githubusercontent.com/momonts/upgradenft/refs/heads/main/metadata/";
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
        // Initialize the token level to 0
        _tokenLevels[tokenId] = 1;
    }

    /**
     * @dev Returns the current level of a token
     */
    function tokenLevel(uint256 tokenId) public view returns (uint256) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }
        return _tokenLevels[tokenId];
    }

    /**
     * @dev Upgrades a token's level
     * Requirements:
     * - The caller must own the token or be approved
     * - The token must not be at max level
     * - The caller must send enough ETH to cover the upgrade cost
     */
    function upgradeNFT(uint256 tokenId) public payable {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }

        if (
            owner != msg.sender &&
            getApproved(tokenId) != msg.sender &&
            !isApprovedForAll(owner, msg.sender)
        ) {
            revert NotOwnerNorApproved(msg.sender, tokenId);
        }

        if (_tokenLevels[tokenId] >= MAX_LEVEL) {
            revert TokenAtMaxLevel(tokenId, MAX_LEVEL);
        }

        if (msg.value < upgradeCost) {
            revert InsufficientPayment(msg.value, upgradeCost);
        }

        // Increase the token's level
        _tokenLevels[tokenId]++;

        // Emit the upgrade event
        emit NFTUpgraded(tokenId, _tokenLevels[tokenId]);

        // Return any excess payment
        if (msg.value > upgradeCost) {
            payable(msg.sender).transfer(msg.value - upgradeCost);
        }
    }

    /**
     * @dev Updates the upgrade cost
     * Only callable by the owner
     */
    function setUpgradeCost(uint256 _newCost) public onlyOwner {
        upgradeCost = _newCost;
    }

    /**
     * @dev Withdraws the contract's balance to the owner
     * Only callable by the owner
     */
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Override tokenURI to include the token's level in the metadata
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }

        string memory baseURI = _baseURI();
        uint256 level = _tokenLevels[tokenId];

        // Return baseURI/tokenId-level.json
        return
            string(
                abi.encodePacked(
                    baseURI,
                    tokenId.toString(),
                    "-",
                    level.toString(),
                    ".json"
                )
            );
    }
}
