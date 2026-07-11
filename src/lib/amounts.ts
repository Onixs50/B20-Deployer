import { parseUnits, formatUnits } from "viem";

/**
 * Validates a human-typed quantity string against a given token decimals count.
 * Only accepts plain integers or decimals with up to `decimals` fractional digits —
 * no scientific notation, no thousands separators — so there is exactly one way
 * to read "1000" and it always means 1000 whole tokens, never 1000 base units.
 */
export function isValidQuantityInput(raw: string, decimals: number): boolean {
  if (raw.trim() === "") return false;
  const pattern = new RegExp(`^\\d+(\\.\\d{1,${Math.max(decimals, 1)}})?$`);
  return pattern.test(raw.trim());
}

/**
 * Converts a human quantity ("1000", "0.5") into the exact base-unit BigInt
 * the contract expects, using viem's string-based parseUnits so there is no
 * floating point rounding anywhere in the path.
 */
export function toBaseUnits(raw: string, decimals: number): bigint {
  return parseUnits(raw.trim(), decimals);
}

export function fromBaseUnits(value: bigint, decimals: number): string {
  return formatUnits(value, decimals);
}

/** Pretty-print with grouping for display only — never used for on-chain math. */
export function formatDisplay(raw: string): string {
  const [int, frac] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${grouped}.${frac}` : grouped;
}
