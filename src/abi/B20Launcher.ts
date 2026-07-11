export const B20_LAUNCHER_ABI = [
  {
    type: "function",
    name: "makeSalt",
    stateMutability: "pure",
    inputs: [{ name: "anyText", type: "string" }],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "isAssetFeatureActive",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "launchToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "decimals", type: "uint8" },
      { name: "initialSupplyCap", type: "uint256" },
      { name: "initialMint", type: "uint256" },
      { name: "salt", type: "bytes32" }
    ],
    outputs: [{ name: "token", type: "address" }]
  },
  {
    type: "event",
    name: "TokenLaunched",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "admin", type: "address", indexed: true }
    ],
    anonymous: false
  }
] as const;
