import { motion } from "framer-motion";
import { CREATOR_NAME, CREATOR_TWITTER, CREATOR_GITHUB } from "../lib/config";
import { useLang } from "../lib/i18n";

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-forge-line/70 px-5 py-8 text-center text-xs text-forge-faint">
      <p>{t("footer_testnet_first")}</p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mt-4 flex items-center justify-center gap-3"
      >
        <span>
          {t("footer_built_by")} <span className="font-display font-semibold text-forge-ink">{CREATOR_NAME}</span>
        </span>

        {CREATOR_TWITTER && (
          <a
            href={CREATOR_TWITTER}
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter / X"
            className="rounded-full border border-forge-line p-1.5 text-forge-faint transition-colors hover:border-forge-blue hover:text-forge-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9 2h3.3l-7.2 8.2L23.5 22h-6.7l-5.2-6.8L5.6 22H2.3l7.7-8.8L1 2h6.9l4.7 6.2L18.9 2zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20z" />
            </svg>
          </a>
        )}
        {CREATOR_GITHUB && (
          <a
            href={CREATOR_GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="rounded-full border border-forge-line p-1.5 text-forge-faint transition-colors hover:border-forge-blue hover:text-forge-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.61-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.04 1.53 1.04.89 1.55 2.34 1.1 2.91.84.09-.66.35-1.1.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.94-2.35 4.8-4.58 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
            </svg>
          </a>
        )}
      </motion.div>
    </footer>
  );
}
