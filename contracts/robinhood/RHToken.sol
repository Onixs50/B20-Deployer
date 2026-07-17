// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RHToken
/// @notice Plain, minimal ERC-20: owner-gated mint, holder-gated burn. Nothing
/// else — no pause, no cap, no precompile shortcuts (Robinhood Chain has none
/// of those, unlike B20 on Base) — just real, simple, deployed bytecode.
contract RHToken is ERC20, ERC20Burnable, Ownable {
    uint8 private immutable _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialMint_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        _decimals = decimals_;
        if (initialMint_ > 0) _mint(owner_, initialMint_);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Mint new tokens. Owner only.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
