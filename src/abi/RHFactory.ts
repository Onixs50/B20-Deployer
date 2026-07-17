export const RH_FACTORY_ABI = [
  {
    type: "function",
    name: "createToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "decimals", type: "uint8" },
      { name: "initialMint", type: "uint256" }
    ],
    outputs: [{ name: "token", type: "address" }]
  },
  {
    type: "function",
    name: "tokensOf",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "address[]" }]
  },
  {
    type: "event",
    name: "TokenCreated",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false }
    ],
    anonymous: false
  }
] as const;
