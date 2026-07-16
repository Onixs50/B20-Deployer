import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import { useRHNetworkGuard, type RHNetwork } from "../../hooks/useRHNetworkGuard";
import { robinhoodChain, robinhoodChainTestnet, RH_CHAIN_META } from "../../lib/robinhoodChain";
import { useLang } from "../../lib/i18n";

const L = {
  title: { fa: "شبکه دیپلوی", en: "Deploy network" },
  switchNeeded: { fa: "کیف‌پولت روی شبکه‌ی دیگه‌ایه. برای ادامه باید روی", en: "Your wallet is on a different network. To continue, switch to" },
  switchCta: { fa: "الان سوییچ کن", en: "switch now" },
  switching: { fa: "در حال تعویض…", en: "Switching…" },
  okMain: { fa: "روی Robinhood مین‌نت وصل شدی", en: "Connected to Robinhood Mainnet" },
  okTest: { fa: "روی Robinhood تست‌نت وصل شدی", en: "Connected to Robinhood Testnet" },
  fail: { fa: "تعویض شبکه توی کیف‌پول رد شد یا انجام نشد.", en: "Network switch was rejected or failed." }
};

export function RHNetworkPicker({ selected, onSelect }: { selected: RHNetwork; onSelect: (n: RHNetwork) => void }) {
  const { lang } = useLang();
  const { isConnected, chainId } = useAccount();
  const { onRobinhoodChain, isSwitching, switchTo } = useRHNetworkGuard();

  async function handlePick(network: RHNetwork) {
    onSelect(network);
    if (!isConnected) return;
    const target = network === "mainnet" ? robinhoodChain.id : robinhoodChainTestnet.id;
    if (chainId === target) return;
    try {
      await switchTo(network);
      toast.success(network === "mainnet" ? L.okMain[lang] : L.okTest[lang]);
    } catch {
      toast.error(L.fail[lang]);
    }
  }

  return (
    <div className="rounded-2xl border border-rh-line bg-rh-panel/60 p-4">
      <p className="mb-3 font-display text-sm font-semibold text-rh-ink">{L.title[lang]}</p>
      <div className="grid grid-cols-2 gap-3">
        {(["testnet", "mainnet"] as RHNetwork[]).map((n) => {
          const meta = n === "mainnet" ? RH_CHAIN_META[robinhoodChain.id] : RH_CHAIN_META[robinhoodChainTestnet.id];
          const active = selected === n;
          return (
            <motion.button
              key={n}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePick(n)}
              className={`relative rounded-xl border px-4 py-3 text-right transition-all ${
                active ? "border-rh-yellow bg-rh-yellow/10" : "border-rh-line bg-transparent hover:border-rh-faint/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-rh-ink">{meta.shortLabel}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: meta.kind === "mainnet" ? "#FFDE59" : "#8A8A5C",
                    boxShadow: `0 0 8px ${meta.kind === "mainnet" ? "#FFDE59" : "#8A8A5C"}`
                  }}
                />
              </div>
              <span className="mt-1 block text-xs text-rh-faint">{meta.label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {isConnected && !onRobinhoodChain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-lg border border-rh-yellow/40 bg-rh-yellow/10 px-3 py-2.5 text-xs text-rh-yellow"
          >
            {L.switchNeeded[lang]}{" "}
            {(selected === "mainnet" ? RH_CHAIN_META[robinhoodChain.id] : RH_CHAIN_META[robinhoodChainTestnet.id]).label}{" "}
            —{" "}
            <button className="underline underline-offset-2" onClick={() => handlePick(selected)} disabled={isSwitching}>
              {isSwitching ? L.switching[lang] : L.switchCta[lang]}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
