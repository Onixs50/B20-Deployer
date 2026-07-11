import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { useNetworkGuard, type LaunchNetwork } from "../hooks/useNetworkGuard";
import { CHAIN_META } from "../lib/chains";
import { useLang } from "../lib/i18n";
import toast from "react-hot-toast";

export function NetworkPicker({
  selected,
  onSelect
}: {
  selected: LaunchNetwork;
  onSelect: (n: LaunchNetwork) => void;
}) {
  const { isConnected, chainId } = useAccount();
  const { onSupportedChain, isSwitching, switchTo } = useNetworkGuard();
  const { t } = useLang();

  async function handlePick(network: LaunchNetwork) {
    onSelect(network);
    if (!isConnected) return;
    const target = network === "mainnet" ? base.id : baseSepolia.id;
    if (chainId === target) return;
    try {
      await switchTo(network);
      toast.success(network === "mainnet" ? t("network_switch_ok_main") : t("network_switch_ok_test"));
    } catch {
      toast.error(t("network_switch_fail"));
    }
  }

  return (
    <div className="rounded-2xl border border-forge-line bg-forge-panel/60 p-4">
      <p className="mb-3 font-display text-sm font-semibold text-forge-ink">{t("network_title")}</p>
      <div className="grid grid-cols-2 gap-3">
        {(["testnet", "mainnet"] as LaunchNetwork[]).map((n) => {
          const meta = n === "mainnet" ? CHAIN_META[base.id] : CHAIN_META[baseSepolia.id];
          const active = selected === n;
          return (
            <motion.button
              key={n}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePick(n)}
              className={`relative rounded-xl border px-4 py-3 text-right transition-all ${
                active
                  ? "border-forge-blue bg-forge-blue/10"
                  : "border-forge-line bg-transparent hover:border-forge-faint/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold">{meta.shortLabel}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                />
              </div>
              <span className="mt-1 block text-xs text-forge-faint">{meta.label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isConnected && !onSupportedChain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-lg border border-forge-amber/40 bg-forge-amber/10 px-3 py-2.5 text-xs text-forge-amber"
          >
            {t("network_switch_needed")} {CHAIN_META[selected === "mainnet" ? base.id : baseSepolia.id].label}{" "}
            —{" "}
            <button
              className="underline underline-offset-2"
              onClick={() => handlePick(selected)}
              disabled={isSwitching}
            >
              {isSwitching ? t("network_switching") : t("network_switch_cta")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
