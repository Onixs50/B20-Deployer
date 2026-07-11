// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Official Base standard library, imported straight from GitHub — Remix fetches
// these automatically. This guarantees the B20Factory param encoding is correct
// (it's versioned/structured, not a plain abi.encode, which is why the manual
// version reverted).
import {StdPrecompiles} from "https://github.com/base/base-std/blob/main/src/StdPrecompiles.sol";
import {IB20Factory} from "https://github.com/base/base-std/blob/main/src/interfaces/IB20Factory.sol";
import {IB20} from "https://github.com/base/base-std/blob/main/src/interfaces/IB20.sol";
import {B20Constants} from "https://github.com/base/base-std/blob/main/src/lib/B20Constants.sol";
import {B20FactoryLib} from "https://github.com/base/base-std/blob/main/src/lib/B20FactoryLib.sol";

/// @title B20Launcher
/// @notice Deploy this once, then call launchToken(...) to create your own B20 Asset token.
contract B20Launcher {
    event TokenLaunched(address indexed token, string name, string symbol, address indexed admin);

    /// @notice Helper: turns any text into a valid bytes32 salt.
    function makeSalt(string calldata anyText) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(anyText));
    }

    /// @notice Sanity check — call this first (free, view). Must return true.
    function isAssetFeatureActive() external view returns (bool) {
        return StdPrecompiles.ACTIVATION_REGISTRY.isActivated(keccak256("base.b20_asset"));
    }

    /// @param name        e.g. "My Onixia Token"
    /// @param symbol      e.g. "ONX"
    /// @param decimals    6 to 18
    /// @param initialSupplyCap  max total supply in smallest units (10**decimals). Use
    ///                          type(uint128).max for "no cap".
    /// @param initialMint amount to mint immediately to msg.sender, in smallest units. 0 to skip.
    /// @param salt        any bytes32 you choose (use makeSalt(...) to get one).
    function launchToken(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 initialSupplyCap,
        uint256 initialMint,
        bytes32 salt
    ) external returns (address token) {
        require(decimals >= 6 && decimals <= 18, "decimals must be 6-18");

        // Correct, official encoding — msg.sender becomes DEFAULT_ADMIN_ROLE holder.
        bytes memory params = B20FactoryLib.encodeAssetCreateParams(name, symbol, msg.sender, decimals);

        bytes[] memory initCalls = new bytes[](initialMint > 0 ? 3 : 2);
        initCalls[0] = B20FactoryLib.encodeGrantRole(B20Constants.MINT_ROLE, msg.sender);
        initCalls[1] = B20FactoryLib.encodeUpdateSupplyCap(initialSupplyCap);
        if (initialMint > 0) {
            initCalls[2] = abi.encodeWithSelector(IB20.mint.selector, msg.sender, initialMint);
        }

        token = StdPrecompiles.B20_FACTORY.createB20(
            IB20Factory.B20Variant.ASSET,
            salt,
            params,
            initCalls
        );

        emit TokenLaunched(token, name, symbol, msg.sender);
    }
}
