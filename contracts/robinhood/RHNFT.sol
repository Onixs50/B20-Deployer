// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title RHNFT
/// @notice Ordinary ERC-721 collection — public paid mint, owner airdrop mint,
/// optional supply cap, optional marketplace royalty (ERC-2981). Deployed for
/// you by RHFactory, one contract per collection, real bytecode (no precompile
/// shortcuts exist for NFTs on Robinhood Chain).
contract RHNFT is ERC721, ERC721Enumerable, ERC721Pausable, ERC721Burnable, ERC2981, Ownable {
    using Strings for uint256;

    /// @notice 0 means uncapped.
    uint256 public immutable maxSupply;

    /// @notice If true, tokenURI() is "<baseURI><id>.json" — the standard
    /// per-token collection folder layout. If false, every token returns the
    /// exact baseURI as-is — the simplest path for a single-image
    /// community/membership drop where every holder shares one artwork.
    bool public immutable folderMode;

    uint256 public mintPriceWei;
    string private _baseTokenURI;
    uint256 private _nextId = 1;

    error SoldOut();
    error WrongPayment(uint256 sent, uint256 required);
    error NoWithdrawable();

    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newPriceWei);
    event Withdrawn(address to, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        bool folderMode_,
        uint256 maxSupply_,
        uint256 mintPriceWei_,
        address royaltyReceiver_,
        uint96 royaltyBps_,
        address owner_
    ) ERC721(name_, symbol_) Ownable(owner_) {
        _baseTokenURI = baseURI_;
        folderMode = folderMode_;
        maxSupply = maxSupply_;
        mintPriceWei = mintPriceWei_;
        if (royaltyReceiver_ != address(0) && royaltyBps_ > 0) {
            _setDefaultRoyalty(royaltyReceiver_, royaltyBps_);
        }
    }

    /// @notice Public paid mint. Anyone can call; pay `mintPriceWei * quantity`.
    function mint(uint256 quantity) external payable {
        if (quantity == 0) revert("quantity=0");
        uint256 required = mintPriceWei * quantity;
        if (msg.value != required) revert WrongPayment(msg.value, required);
        _mintBatch(msg.sender, quantity);
    }

    /// @notice Free mint for the owner — airdrops, team allocation, etc.
    function ownerMint(address to, uint256 quantity) external onlyOwner {
        _mintBatch(to, quantity);
    }

    function _mintBatch(address to, uint256 quantity) internal {
        if (maxSupply != 0 && _nextId - 1 + quantity > maxSupply) revert SoldOut();
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, _nextId);
            _nextId++;
        }
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setMintPrice(uint256 newPriceWei) external onlyOwner {
        mintPriceWei = newPriceWei;
        emit MintPriceUpdated(newPriceWei);
    }

    function setRoyalty(address receiver, uint96 bps) external onlyOwner {
        _setDefaultRoyalty(receiver, bps);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        if (bal == 0) revert NoWithdrawable();
        (bool ok, ) = owner().call{value: bal}("");
        require(ok, "withdraw failed");
        emit Withdrawn(owner(), bal);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function totalMinted() external view returns (uint256) {
        return _nextId - 1;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseURI();
        if (bytes(base).length == 0) return "";
        if (!folderMode) return base;
        return string.concat(base, tokenId.toString(), ".json");
    }

    // --- required overrides (multiple-inheritance glue, OZ v5 style) ---

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
