// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// NOTE for Remix users: OpenZeppelin Contracts 5.1's ERC721Enumerable/Pausable
// (imported below and in RHNFT.sol/RHToken.sol) use the `mcopy` opcode
// (EIP-5656), which only exists from the Cancun EVM upgrade onward. If you
// see "DeclarationError: Function mcopy not found" while compiling, it means
// Remix's target EVM version is set below Cancun — open the Solidity
// Compiler tab -> Advanced Configurations -> EVM Version, and set it to
// "cancun" (or "prague"/"default" if your Remix build defaults there).
// Robinhood Chain runs Arbitrum's ArbOS 20+ (Cancun opcodes included, live
// on Arbitrum since March 2024), so this is purely a compiler setting —
// nothing about the chain itself is the problem.

import {RHToken} from "./RHToken.sol";
import {RHNFT} from "./RHNFT.sol";

/// @title RHFactory
/// @notice Deploy this contract ONCE per network (mainnet + testnet) and put its
/// address in .env. Unlike B20 on Base, Robinhood Chain has no native asset
/// precompile — so unlike B20Launcher, this factory doesn't "activate" an
/// existing standard, it actually deploys a fresh RHToken/RHNFT contract
/// (real bytecode, via plain CREATE) on every call, and hands full ownership
/// straight to the caller in the same transaction.
contract RHFactory {
    event TokenCreated(address indexed creator, address indexed token, string name, string symbol);
    event NFTCreated(address indexed creator, address indexed collection, string name, string symbol);

    mapping(address => address[]) private _tokensOf;
    mapping(address => address[]) private _nftsOf;
    address[] public allTokens;
    address[] public allNFTs;

    function createToken(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 initialMint
    ) external returns (address token) {
        token = address(new RHToken(name, symbol, decimals, cap, initialMint, msg.sender));
        _tokensOf[msg.sender].push(token);
        allTokens.push(token);
        emit TokenCreated(msg.sender, token, name, symbol);
    }

    function createNFT(
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        bool folderMode,
        uint256 maxSupply,
        uint256 mintPriceWei,
        address royaltyReceiver,
        uint96 royaltyBps
    ) external returns (address collection) {
        collection = address(
            new RHNFT(
                name,
                symbol,
                baseURI,
                folderMode,
                maxSupply,
                mintPriceWei,
                royaltyReceiver,
                royaltyBps,
                msg.sender
            )
        );
        _nftsOf[msg.sender].push(collection);
        allNFTs.push(collection);
        emit NFTCreated(msg.sender, collection, name, symbol);
    }

    function tokensOf(address creator) external view returns (address[] memory) {
        return _tokensOf[creator];
    }

    function nftsOf(address creator) external view returns (address[] memory) {
        return _nftsOf[creator];
    }

    function allTokensCount() external view returns (uint256) {
        return allTokens.length;
    }

    function allNFTsCount() external view returns (uint256) {
        return allNFTs.length;
    }
}
