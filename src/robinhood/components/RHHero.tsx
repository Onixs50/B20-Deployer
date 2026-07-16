import { motion } from "framer-motion";
import { useLang } from "../../lib/i18n";

const L = {
  badge: {
    fa: "شبکه Robinhood Chain — زنده از ۱ ژوئیه ۲۰۲۶",
    en: "Robinhood Chain — live since July 1, 2026"
  },
  titlePrefix: { fa: "توکن یا NFT بساز روی", en: "Launch a token or NFT on" },
  titleBrand: { fa: "Robinhood Chain", en: "Robinhood Chain" },
  desc: {
    fa: "بر خلاف B20 روی Base، اینجا استاندارد پیش‌کامپایل‌شده‌ای وجود نداره — پس این بخش برات یک قرارداد ERC-20 یا ERC-721 واقعی دیپلوی می‌کنه، مالکیتش کامل مال کیف‌پول توئه، همون لحظه.",
    en: "Unlike B20 on Base, there's no native asset precompile here — so this deploys a real ERC-20 or ERC-721 contract, fully owned by your wallet the moment it lands."
  }
};

export function RHHero() {
  const { lang } = useLang();
  return (
    <section className="relative overflow-hidden px-5 pb-10 pt-14 text-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-rh-yellow/30 bg-rh-yellow/10 px-4 py-1.5 font-mono text-xs text-rh-yellow"
      >
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-rh-yellow"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        {L.badge[lang]}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight text-rh-ink sm:text-4xl"
      >
        {L.titlePrefix[lang]} <span className="text-rh-yellow">{L.titleBrand[lang]}</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-rh-faint sm:text-base"
      >
        {L.desc[lang]}
      </motion.p>
    </section>
  );
}
