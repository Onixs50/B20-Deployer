import { motion } from "framer-motion";
import { useLang } from "../lib/i18n";

const steps = [
  {
    icon: (
      <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ),
    fa: { title: "فرم رو پر کن", desc: "اسم، نماد، تعداد و در صورت تمایل یه لوگو." },
    en: { title: "Fill the form", desc: "Name, symbol, supply, and an optional logo." }
  },
  {
    icon: (
      <path
        d="M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    fa: { title: "امضا کن", desc: "یه تراکنش، مستقیم از پیش‌کامپایل رسمی Base." },
    en: { title: "Sign it", desc: "One transaction, straight through Base's official precompile." }
  },
  {
    icon: (
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
    fa: { title: "تموم!", desc: "توکنت زنده‌ست، آماده‌ی دیدن روی Basescan." },
    en: { title: "Done", desc: "Your token is live, ready to view on Basescan." }
  }
];

export function HowItWorks() {
  const { lang } = useLang();
  return (
    <section className="px-5 pb-4">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            whileHover={{ y: -4 }}
            className="relative rounded-2xl border border-forge-line bg-forge-panel/50 p-5"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: i * 0.12 + 0.15 }}
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-forge-blue/15 text-forge-blue"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {s.icon}
              </svg>
            </motion.div>
            <span className="absolute end-5 top-5 font-mono text-3xl font-bold text-forge-line select-none">
              0{i + 1}
            </span>
            <h3 className="font-display text-sm font-semibold">{s[lang].title}</h3>
            <p className="mt-1 text-xs leading-6 text-forge-faint">{s[lang].desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
