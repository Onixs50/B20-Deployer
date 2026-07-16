import { motion } from "framer-motion";
import { useLang } from "../../lib/i18n";

const L = {
  back: { fa: "برگشت به B20 Forge", en: "Back to B20 Forge" },
  brand: { fa: "لانچر", en: "Launcher" }
};

export function RHHeader() {
  const { lang, toggle } = useLang();

  return (
    <header className="sticky top-0 z-40 border-b border-rh-line/70 bg-rh-black/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="/robinhood" className="flex items-center gap-2.5">
          <motion.svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
          >
            <path d="M12 2 L4 14 H10.5 L9 22 L20 9 H13 Z" fill="#FFDE59" />
          </motion.svg>
          <span className="font-display text-lg font-bold tracking-tight text-rh-ink">
            Robinhood <span className="text-rh-yellow">{L.brand[lang]}</span>
          </span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="hidden rounded-full border border-rh-line px-3 py-1.5 font-mono text-xs font-medium text-rh-faint transition-colors hover:border-rh-yellow hover:text-rh-ink sm:inline-block"
          >
            {L.back[lang]}
          </a>
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.94 }}
            className="rounded-full border border-rh-line px-3 py-1.5 font-mono text-xs font-medium text-rh-faint transition-colors hover:border-rh-yellow hover:text-rh-ink"
          >
            {lang === "fa" ? "EN" : "فا"}
          </motion.button>
          <appkit-button balance="hide" />
        </div>
      </div>
    </header>
  );
}
