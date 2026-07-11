export const B20_BATCH_DISTRIBUTOR_ABI = [
  {
    type: "function",
    name: "batchTransfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "batchMint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" }
    ],
    outputs: []
  }
] as const;
