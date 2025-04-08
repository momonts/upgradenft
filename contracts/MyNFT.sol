// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC721Upgradeable, ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable
{
    using Strings for uint256;

    uint256 public constant MAX_LEVEL = 2;
    uint256 public upgradeCost;
    mapping(uint256 => uint256) private _tokenLevels;

    event NFTUpgraded(uint256 indexed tokenId, uint256 newLevel);

    error TokenDoesNotExist(uint256 tokenId);
    error NotOwnerNorApproved(address sender, uint256 tokenId);
    error TokenAtMaxLevel(uint256 tokenId, uint256 maxLevel);
    error InsufficientPayment(uint256 provided, uint256 required);

    // Remove the constructor
    // constructor() {
    //     _disableInitializers();
    // }

    function initialize(address initialOwner) public initializer {
        __ERC721_init("Selyo Test", "ST");
        __ERC721Enumerable_init();
        __Ownable_init(initialOwner);

        upgradeCost = 0.01 ether;
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    )
        internal
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    function _baseURI() internal pure override returns (string memory) {
        return
            "https://raw.githubusercontent.com/momonts/upgradenft/refs/heads/main/metadata/";
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
        _tokenLevels[tokenId] = 0;
    }

    function tokenLevel(uint256 tokenId) public view returns (uint256) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }
        return _tokenLevels[tokenId];
    }

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

        _tokenLevels[tokenId]++;
        emit NFTUpgraded(tokenId, _tokenLevels[tokenId]);

        if (msg.value > upgradeCost) {
            payable(msg.sender).transfer(msg.value - upgradeCost);
        }
    }

    function setUpgradeCost(uint256 _newCost) public onlyOwner {
        upgradeCost = _newCost;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }

        string memory baseURI = _baseURI();
        uint256 level = _tokenLevels[tokenId];

        return
            string(
                abi.encodePacked(
                    baseURI,
                    tokenId.toString(),
                    level.toString(),
                    ".json"
                )
            );
    }
}
