import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const words = ["دارایی", "استیبل‌کوین", "ممبرشیپ", "توکن پروژه"];

export function Hero({ onStart }: { onStart: () => void }) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % words.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden px-5 pt-14 pb-20 md:pt-20 md:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-forge-line bg-forge-panel/60 px-3.5 py-1.5 text-xs text-forge-faint"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forge-mint" />
            استاندارد بومی B20 — مستقیم روی هسته‌ی شبکه Base
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-display text-4xl font-bold leading-[1.25] md:text-5xl"
          >
            یک{" "}
            <span className="relative inline-block h-[1.25em] w-[7ch] align-bottom overflow-hidden">
              {words.map((w, i) => (
                <motion.span
                  key={w}
                  className="absolute inset-0 text-forge-blue"
                  initial={false}
                  animate={{
                    y: i === wordIndex ? 0 : i < wordIndex ? "-100%" : "100%",
                    opacity: i === wordIndex ? 1 : 0
                  }}
                  transition={{ duration: 0.45, ease: [0.2, 1, 0.3, 1] }}
                >
                  {w}
                </motion.span>
              ))}
            </span>{" "}
            بساز که واقعاً روی زنجیره زندگی می‌کنه.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-lg text-base leading-8 text-forge-faint"
          >
            بدون خط کد، بدون قرارداد سفارشی برای ممیزی. اسم، نماد و تعداد رو بده؛
            B20 Forge توکنت رو مستقیماً از طریق پیش‌کامپایل رسمی Base می‌سازه —
            روی تست‌نت برای امتحان، یا مین‌نت برای واقعی شدنش.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={onStart}
              className="group relative overflow-hidden rounded-xl bg-forge-blue px-7 py-3.5 font-display text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(0,82,255,0.4),0_16px_40px_-12px_rgba(0,82,255,0.6)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">شروع ساخت توکن</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
            <span className="font-mono text-xs text-forge-faint">
              رایگان تا قبل از امضای تراکنش دیپلوی
            </span>
          </motion.div>
        </div>

        <div className="relative flex items-center justify-center">
          <CoinStamp />
        </div>
      </div>
    </section>
  );
}

function CoinStamp() {
  return (
    <div className="relative h-72 w-72 md:h-80 md:w-80">
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(0,82,255,0.35), transparent 65%)" }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.svg
        viewBox="0 0 200 200"
        className="relative h-full w-full animate-float"
        initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 12, delay: 0.2 }}
      >
        <defs>
          <linearGradient id="coinFace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3D7CFF" />
            <stop offset="100%" stopColor="#0033A0" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#coinFace)" stroke="#0A0E1A" strokeWidth="6" />
        <circle cx="100" cy="100" r="74" fill="none" stroke="#E7ECFF" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 6" />
        <text x="100" y="115" textAnchor="middle" className="font-display" fontSize="52" fontWeight="700" fill="#E7ECFF">
          B20
        </text>
      </motion.svg>
      {/* orbiting mint particles */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-forge-mint"
          style={{ boxShadow: "0 0 12px 2px rgba(0,230,160,0.8)" }}
          animate={{
            x: [0, Math.cos((i * 2 * Math.PI) / 3) * 150],
            y: [0, Math.sin((i * 2 * Math.PI) / 3) * 150],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
