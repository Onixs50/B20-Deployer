import { motion } from "framer-motion";
import { useLang } from "../lib/i18n";

export function Header() {
  const { lang, toggle, t } = useLang();

  return (
    <header className="sticky top-0 z-40 border-b border-forge-line/70 bg-forge-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <motion.svg
            width="30"
            height="30"
            viewBox="0 0 40 40"
            initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
          >
            <circle cx="20" cy="20" r="18" fill="#0052FF" />
            <path
              d="M13 20 L18 26 L27 14"
              stroke="#E7ECFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </motion.svg>
          <span className="font-display text-lg font-bold tracking-tight">
            B20 <span className="text-forge-blue">{t("brand")}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.94 }}
            className="rounded-full border border-forge-line px-3 py-1.5 font-mono text-xs font-medium text-forge-faint transition-colors hover:border-forge-blue hover:text-forge-ink"
          >
            {lang === "fa" ? "EN" : "فا"}
          </motion.button>
          <appkit-button balance="hide" />
        </div>
      </div>
    </header>
  );
}
