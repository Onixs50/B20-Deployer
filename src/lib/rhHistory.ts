export type RHAssetKind = "token" | "nft";

export interface RHDeployedAsset {
  kind: RHAssetKind;
  address: string;
  name: string;
  symbol: string;
  chainId: number;
  txHash: string | null;
  deployer: string;
  timestamp: number;
}

const KEY = "rhforge_history_v1";

function readAll(): RHDeployedAsset[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: RHDeployedAsset[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode, quota, etc.) — silently skip
  }
}

export function addDeployedRHAsset(entry: RHDeployedAsset) {
  const items = readAll();
  items.unshift(entry);
  writeAll(items.slice(0, 100));
}

export function getDeployedRHAssets(deployer?: string): RHDeployedAsset[] {
  const items = readAll();
  if (!deployer) return items;
  return items.filter((i) => i.deployer.toLowerCase() === deployer.toLowerCase());
}
