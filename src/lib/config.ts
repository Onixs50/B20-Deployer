import { base, baseSepolia } from "viem/chains";
import type { Address } from "viem";

function readAddr(value: string | undefined, name: string): Address | undefined {
  if (!value) return undefined;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    console.error(`${name} در .env مقدار آدرس معتبری نیست:`, value);
    return undefined;
  }
  return value as Address;
}

export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined;

export const LAUNCHER_ADDRESSES: Partial<Record<number, Address>> = {
  [base.id]: readAddr(import.meta.env.VITE_LAUNCHER_ADDRESS_MAINNET, "VITE_LAUNCHER_ADDRESS_MAINNET"),
  [baseSepolia.id]: readAddr(import.meta.env.VITE_LAUNCHER_ADDRESS_TESTNET, "VITE_LAUNCHER_ADDRESS_TESTNET")
};

export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;
export const PINATA_GATEWAY = (import.meta.env.VITE_PINATA_GATEWAY as string | undefined) ?? "https://gateway.pinata.cloud";

// Hard IPFS-friendly image limits — many pinning/gateway services choke above these.
export const IMAGE_MAX_BYTES = 1_000_000; // 1 MB after compression
export const IMAGE_MAX_DIMENSION = 1024; // px, square recommended (logo use)
export const IMAGE_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
