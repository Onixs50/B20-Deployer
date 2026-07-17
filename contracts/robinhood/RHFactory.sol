// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RHToken} from "./RHToken.sol";

/// @title RHFactory
/// @notice Deploy this contract ONCE per network (mainnet + testnet) and put
/// its address in .env. Robinhood Chain has no native asset precompile — so
/// every call here deploys a fresh, real RHToken contract (via plain CREATE)
/// and hands full ownership straight to the caller in the same transaction.
contract RHFactory {
    event TokenCreated(address indexed creator, address indexed token, string name, string symbol);

    mapping(address => address[]) private _tokensOf;
    address[] public allTokens;

    function createToken(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 initialMint
    ) external returns (address token) {
        token = address(new RHToken(name, symbol, decimals, initialMint, msg.sender));
        _tokensOf[msg.sender].push(token);
        allTokens.push(token);
        emit TokenCreated(msg.sender, token, name, symbol);
    }

    function tokensOf(address creator) external view returns (address[] memory) {
        return _tokensOf[creator];
    }

    function allTokensCount() external view returns (uint256) {
        return allTokens.length;
    }
}
