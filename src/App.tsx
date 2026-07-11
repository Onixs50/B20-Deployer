import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LaunchForm } from "./components/LaunchForm";
import { TokenHistory } from "./components/TokenHistory";
import { TokenManager } from "./components/TokenManager";
import { Footer } from "./components/Footer";
import type { DeployedToken } from "./lib/history";
import { useLang } from "./lib/i18n";
import "./lib/appkit"; // side-effect: initializes Reown AppKit once

export default function App() {
  const formRef = useRef<HTMLDivElement>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [managing, setManaging] = useState<DeployedToken | null>(null);
  const { t } = useLang();

  return (
    <div className="min-h-screen">
      <Header />
      <Hero onStart={() => formRef.current?.scrollIntoView({ behavior: "smooth" })} />
      <HowItWorks />
      <div ref={formRef} className="px-5 pb-24 pt-10">
        <LaunchForm onDeployed={() => setHistoryVersion((v) => v + 1)} />
      </div>
      <Footer />
      <TokenHistory refreshKey={historyVersion} onManage={(token) => setManaging(token)} />

      <AnimatePresence>
        {managing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setManaging(null);
            }}
          >
            <div className="w-full max-w-2xl">
              <div className="mb-3 flex justify-end">
                <button
                  onClick={() => setManaging(null)}
                  className="rounded-full border border-forge-line bg-forge-panel px-4 py-1.5 text-xs font-semibold text-forge-ink"
                >
                  {t("manage_close")}
                </button>
              </div>
              <TokenManager tokenAddress={managing.address as `0x${string}`} chainId={managing.chainId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
