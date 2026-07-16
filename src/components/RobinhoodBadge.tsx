import { motion } from "framer-motion";
import { useLang } from "../lib/i18n";

/**
 * Floating entry point into the separate Robinhood Chain page (/robinhood).
 * Plain <a href> on purpose — a real navigation, not client routing — so the
 * two apps stay fully isolated and nothing here can ever touch the B20/Base
 * flow's state or rendering.
 */
export function RobinhoodBadge() {
  const { lang } = useLang();

  return (
    <motion.a
      href="/robinhood"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.5 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full border border-[#FFDE59]/40 bg-[#151512] py-2 pl-2 pr-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-md"
    >
      <motion.span
        animate={{ rotate: [0, -10, 8, -6, 4, -2, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: "#FFDE59", transformOrigin: "50% 85%" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 L4 14 H10.5 L9 22 L20 9 H13 Z"
            fill="#0A0A08"
          />
        </svg>
      </motion.span>
      <span className="whitespace-nowrap font-display text-xs font-semibold text-[#FFEA8A]">
        {lang === "fa" ? "دیپلوی روی Robinhood Chain" : "Deploy on Robinhood Chain"}
      </span>
    </motion.a>
  );
}
