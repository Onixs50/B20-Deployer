// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RHToken
/// @notice Plain, ordinary ERC-20 with owner-gated mint/pause and holder-gated burn.
/// Unlike a B20 asset on Base, Robinhood Chain has no native token precompile —
/// every RHToken is real deployed bytecode, deployed for you by RHFactory.
contract RHToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    uint8 private immutable _decimals;

    /// @notice 0 means uncapped.
    uint256 public immutable cap;

    error CapExceeded(uint256 wouldBeSupply, uint256 cap_);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 cap_,
        uint256 initialMint_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        _decimals = decimals_;
        cap = cap_;

        if (initialMint_ > 0) {
            if (cap_ != 0 && initialMint_ > cap_) revert CapExceeded(initialMint_, cap_);
            _mint(owner_, initialMint_);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Mint new tokens. Owner only.
    function mint(address to, uint256 amount) external onlyOwner {
        if (cap != 0 && totalSupply() + amount > cap) revert CapExceeded(totalSupply() + amount, cap);
        _mint(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- required overrides (multiple-inheritance glue, OZ v5 style) ---

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
