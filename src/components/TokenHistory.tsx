import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { getDeployedTokens, type DeployedToken } from "../lib/history";
import { CHAIN_META } from "../lib/chains";
import { useLang } from "../lib/i18n";

export function TokenHistory({ refreshKey }: { refreshKey: number }) {
  const { address } = useAccount();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DeployedToken[]>([]);

  useEffect(() => {
    setItems(getDeployedTokens(address));
  }, [address, refreshKey, open]);

  if (!address || items.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="mb-3 max-h-80 w-72 overflow-y-auto rounded-2xl border border-forge-line bg-forge-panel/95 p-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-xs font-semibold">{t("history_title")}</p>
              <button onClick={() => setOpen(false)} className="text-xs text-forge-faint hover:text-forge-ink">
                {t("history_close")}
              </button>
            </div>
            {items.length === 0 ? (
              <p className="py-3 text-center text-xs text-forge-faint">{t("history_empty")}</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((token) => {
                  const meta = CHAIN_META[token.chainId as keyof typeof CHAIN_META];
                  return (
                    <li key={token.address + token.timestamp}>
                      <a
                        href={`${meta?.explorer ?? ""}/token/${token.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-forge-line/70 px-2.5 py-2 text-xs transition-colors hover:border-forge-blue"
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: meta?.color ?? "#7C88B8" }}
                          />
                          <span className="font-medium text-forge-ink">{token.name}</span>
                          <span className="tabular text-forge-faint">({token.symbol})</span>
                        </span>
                        <span className="text-forge-faint">{meta?.shortLabel}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-center text-[10px] text-forge-faint/70">{t("history_note")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 rounded-full border border-forge-line bg-forge-panel/90 px-4 py-2.5 text-xs font-medium text-forge-ink shadow-lg backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forge-mint opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-forge-mint" />
        </span>
        {t("header_history")}
        <span className="rounded-full bg-forge-blue/20 px-1.5 py-0.5 text-[10px] text-forge-blue tabular">
          {items.length}
        </span>
      </motion.button>
    </div>
  );
}
