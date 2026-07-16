import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount, useSwitchChain } from "wagmi";
import { RHHeader } from "./components/RHHeader";
import { RHHero } from "./components/RHHero";
import { RHGlow } from "./components/RHGlow";
import { RHTokenForm } from "./components/RHTokenForm";
import { RHNFTForm } from "./components/RHNFTForm";
import { RHHistory } from "./components/RHHistory";
import { RHTokenManagerPanel } from "./components/RHTokenManagerPanel";
import { RHNFTManagerPanel } from "./components/RHNFTManagerPanel";
import { RHFooter } from "./components/RHFooter";
import { robinhoodChain, isRobinhoodChain } from "../lib/robinhoodChain";
import { useLang } from "../lib/i18n";
import type { RHDeployedAsset } from "../lib/rhHistory";
import "../lib/appkit"; // side-effect: initializes Reown AppKit (safe to import again, module is cached)

const L = {
  tabToken: { fa: "توکن (ERC-20)", en: "Token (ERC-20)" },
  tabNFT: { fa: "مجموعه NFT (ERC-721)", en: "NFT collection (ERC-721)" },
  close: { fa: "بستن", en: "Close" }
};

export default function RobinhoodApp() {
  const { lang } = useLang();
  const { isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [tab, setTab] = useState<"token" | "nft">("token");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [managing, setManaging] = useState<RHDeployedAsset | null>(null);
  const attemptedAutoSwitch = useRef(false);

  useEffect(() => {
    document.title = lang === "fa" ? "Robinhood Chain — دیپلوی توکن و NFT" : "Robinhood Chain — Token & NFT Deployer";
  }, [lang]);

  // Best-effort: if a wallet is already connected but sitting on some other
  // chain, nudge it onto Robinhood mainnet once when this page loads. If the
  // wallet rejects it or there's no wallet yet, the in-form network picker
  // still handles it — this is just a convenience, never a blocker.
  useEffect(() => {
    if (attemptedAutoSwitch.current) return;
    if (isConnected && !isRobinhoodChain(chainId)) {
      attemptedAutoSwitch.current = true;
      switchChainAsync({ chainId: robinhoodChain.id }).catch(() => {});
    }
  }, [isConnected, chainId, switchChainAsync]);

  return (
    <div className="relative min-h-screen bg-rh-black text-rh-ink" dir={lang === "fa" ? "rtl" : "ltr"}>
      <RHGlow />
      <div className="relative z-10">
        <RHHeader />
        <RHHero />

        <div className="mx-auto mb-8 flex max-w-2xl justify-center gap-2 px-5">
          <button
            onClick={() => setTab("token")}
            className={`flex-1 rounded-xl border px-4 py-3 font-display text-sm font-semibold transition-colors ${
              tab === "token" ? "border-rh-yellow bg-rh-yellow/10 text-rh-yellow" : "border-rh-line text-rh-faint hover:text-rh-ink"
            }`}
          >
            {L.tabToken[lang]}
          </button>
          <button
            onClick={() => setTab("nft")}
            className={`flex-1 rounded-xl border px-4 py-3 font-display text-sm font-semibold transition-colors ${
              tab === "nft" ? "border-rh-yellow bg-rh-yellow/10 text-rh-yellow" : "border-rh-line text-rh-faint hover:text-rh-ink"
            }`}
          >
            {L.tabNFT[lang]}
          </button>
        </div>

        <div className="px-5 pb-16">
          {tab === "token" ? (
            <RHTokenForm onDeployed={() => setHistoryVersion((v) => v + 1)} />
          ) : (
            <RHNFTForm onDeployed={() => setHistoryVersion((v) => v + 1)} />
          )}
        </div>

        <RHHistory refreshKey={historyVersion} onManage={(asset) => setManaging(asset)} />

        <RHFooter />
      </div>

      <AnimatePresence>
        {managing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-10 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setManaging(null);
            }}
          >
            <div className="w-full max-w-2xl">
              <div className="mb-3 flex justify-end">
                <button
                  onClick={() => setManaging(null)}
                  className="rounded-full border border-rh-line bg-rh-panel px-4 py-1.5 text-xs font-semibold text-rh-ink"
                >
                  {L.close[lang]}
                </button>
              </div>
              {managing.kind === "token" ? (
                <RHTokenManagerPanel tokenAddress={managing.address as `0x${string}`} chainId={managing.chainId} />
              ) : (
                <RHNFTManagerPanel nftAddress={managing.address as `0x${string}`} chainId={managing.chainId} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
