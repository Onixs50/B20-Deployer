import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getDeployedRHAssets, type RHDeployedAsset } from "../../lib/rhHistory";
import { RH_CHAIN_META } from "../../lib/robinhoodChain";
import { useLang } from "../../lib/i18n";

const L = {
  title: { fa: "توکن‌ها و NFTهای من روی Robinhood Chain", en: "My Robinhood Chain tokens & NFTs" },
  empty: { fa: "هنوز چیزی دیپلوی نکردی.", en: "You haven't deployed anything yet." },
  manage: { fa: "مدیریت", en: "Manage" },
  note: { fa: "این لیست فقط توی همین مرورگر ذخیره می‌شه.", en: "This list is stored locally in this browser only." }
};

export function RHHistory({
  refreshKey,
  onManage
}: {
  refreshKey: number;
  onManage?: (asset: RHDeployedAsset) => void;
}) {
  const { address } = useAccount();
  const { lang } = useLang();
  const [items, setItems] = useState<RHDeployedAsset[]>([]);

  useEffect(() => {
    setItems(getDeployedRHAssets(address));
  }, [address, refreshKey]);

  if (!address || items.length === 0) return null;

  return (
    <section className="mx-auto mt-14 max-w-2xl px-5">
      <h2 className="mb-4 text-center font-display text-lg font-bold text-rh-ink">{L.title[lang]}</h2>
      <ul className="space-y-2">
        {items.map((asset) => {
          const meta = RH_CHAIN_META[asset.chainId as keyof typeof RH_CHAIN_META];
          return (
            <li
              key={asset.address + asset.timestamp}
              className="flex items-center gap-2 rounded-xl border border-rh-line bg-rh-panel/50 px-3.5 py-2.5 text-sm"
            >
              <a
                href={`${meta?.explorer ?? ""}/address/${asset.address}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-between gap-2 overflow-hidden"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="rounded-full bg-rh-yellow/15 px-1.5 py-0.5 text-[10px] font-semibold text-rh-yellow">
                    {asset.kind === "token" ? "ERC-20" : "ERC-721"}
                  </span>
                  <span className="truncate font-medium text-rh-ink">{asset.name}</span>
                  <span className="tabular text-rh-faint">({asset.symbol})</span>
                </span>
                <span className="shrink-0 text-xs text-rh-faint">{meta?.shortLabel}</span>
              </a>
              {onManage && (
                <button
                  onClick={() => onManage(asset)}
                  className="shrink-0 rounded-full bg-rh-yellow/15 px-2.5 py-1 text-[10px] font-semibold text-rh-yellow"
                >
                  {L.manage[lang]}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-center text-[11px] text-rh-faint/70">{L.note[lang]}</p>
    </section>
  );
}
