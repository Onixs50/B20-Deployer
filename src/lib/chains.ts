import { base, baseSepolia } from "viem/chains";

// Only these two networks are supported anywhere in the app.
export const SUPPORTED_CHAINS = [base, baseSepolia] as const;

export const CHAIN_META = {
  [base.id]: {
    label: "Base مین‌نت",
    shortLabel: "Mainnet",
    kind: "mainnet" as const,
    explorer: "https://basescan.org",
    color: "#0052FF"
  },
  [baseSepolia.id]: {
    label: "Base تست‌نت (Sepolia)",
    shortLabel: "Testnet",
    kind: "testnet" as const,
    explorer: "https://sepolia.basescan.org",
    color: "#FFB020"
  }
} as const;

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export function isSupportedChain(chainId: number | undefined): chainId is SupportedChainId {
  return chainId === base.id || chainId === baseSepolia.id;
}
