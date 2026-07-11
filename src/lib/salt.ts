import { keccak256, toBytes } from "viem";
import type { Address } from "viem";

/**
 * Mirrors the contract's makeSalt(string): keccak256(abi.encodePacked(text)),
 * which for a plain string is just keccak256 of its UTF-8 bytes. We compute it
 * locally (no RPC round-trip needed since it's pure) but keep the exact same
 * algorithm the contract uses, so calling the contract's own makeSalt with the
 * same text always reproduces this value.
 */
export function computeSalt(text: string): `0x${string}` {
  return keccak256(toBytes(text));
}

/**
 * Builds the seed text used to derive a token's salt: name + symbol + the
 * deployer's own address. Scoping by address means two different wallets can
 * both launch a token called "My Token" / "MYT" without colliding, while the
 * same wallet re-submitting the identical form reliably lands on the same
 * salt (idempotent retries, no accidental double deploys).
 */
export function saltSeed(name: string, symbol: string, deployer: Address, attempt = 0): string {
  const base = `${name.trim()}::${symbol.trim().toUpperCase()}::${deployer.toLowerCase()}`;
  return attempt === 0 ? base : `${base}::${attempt}`;
}
