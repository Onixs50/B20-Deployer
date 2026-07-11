// Minimal IB20 interface — the parts the management dashboard needs.
// This is the same interface every B20 token exposes natively (it's not our
// code, it's the chain's own precompiled token standard), so this ABI works
// against ANY B20 token address, not just ones launched through our launcher.
export const B20_TOKEN_ABI = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "supplyCap", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "burn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  { type: "function", name: "pause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "unpause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "grantRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "revokeRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" }
    ],
    outputs: []
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false }
    ],
    anonymous: false
  }
] as const;

// keccak256("MINT_ROLE") etc — same identifiers B20Constants uses onchain.
// DEFAULT_ADMIN_ROLE is the OpenZeppelin-style zero bytes32.
import { keccak256, toBytes } from "viem";

// OpenZeppelin-style: DEFAULT_ADMIN_ROLE is the all-zero bytes32.
export const DEFAULT_ADMIN_ROLE = ("0x" + "0".repeat(64)) as `0x${string}`;

// Role identifiers are keccak256 of the role name — computed at runtime with
// viem instead of hand-typed hex, so there's no risk of a mistyped constant
// (that's exactly the class of bug that broke the Remix salt earlier).
export const B20_ROLE_NAMES = {
  MINT_ROLE: "MINT_ROLE",
  BURN_ROLE: "BURN_ROLE",
  PAUSE_ROLE: "PAUSE_ROLE",
  UNPAUSE_ROLE: "UNPAUSE_ROLE"
} as const;

export function roleHash(name: keyof typeof B20_ROLE_NAMES): `0x${string}` {
  return keccak256(toBytes(name));
}
