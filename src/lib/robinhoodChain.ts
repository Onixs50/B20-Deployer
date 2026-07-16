import { defineChain } from "viem";

// Robinhood Chain — Arbitrum-Orbit L2, EVM-compatible, ETH for gas.
// Public mainnet launched July 1, 2026. Not (yet) part of viem's built-in
// chain list, so it's hand-defined here the same way any new chain is added
// to viem/wagmi. Source: https://docs.robinhood.com/chain/connecting/

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] }
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" }
  },
  testnet: false
});

export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] }
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://explorer.testnet.chain.robinhood.com" }
  },
  testnet: true
});

export const RH_CHAIN_META = {
  [robinhoodChain.id]: {
    label: "Robinhood مین‌نت",
    shortLabel: "Mainnet",
    kind: "mainnet" as const,
    explorer: "https://robinhoodchain.blockscout.com",
    faucet: undefined as string | undefined
  },
  [robinhoodChainTestnet.id]: {
    label: "Robinhood تست‌نت",
    shortLabel: "Testnet",
    kind: "testnet" as const,
    explorer: "https://explorer.testnet.chain.robinhood.com",
    faucet: "https://faucet.testnet.chain.robinhood.com"
  }
} as const;

export function isRobinhoodChain(chainId: number | undefined): chainId is 4663 | 46630 {
  return chainId === robinhoodChain.id || chainId === robinhoodChainTestnet.id;
}
