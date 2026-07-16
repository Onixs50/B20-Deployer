import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Spark {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

/** Rising yellow sparks behind the Robinhood page — same mechanism as the
 * main site's ForgeEmbers, restyled, kept as its own component so the two
 * pages never share (or fight over) visual state. */
export function RHGlow({ count = 26 }: { count?: number }) {
  const reduce = useReducedMotion();

  const sparks = useMemo<Spark[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 8 + Math.random() * 9,
      delay: Math.random() * 10,
      drift: (Math.random() - 0.5) * 70
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.left}vw`,
            bottom: -20,
            width: s.size,
            height: s.size,
            background: "#FFDE59",
            boxShadow: `0 0 ${s.size * 3}px ${s.size}px #FFDE5955`
          }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: "-110vh",
            x: [0, s.drift, 0],
            opacity: [0, 0.9, 0.9, 0]
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
            opacity: { times: [0, 0.1, 0.85, 1], duration: s.duration, repeat: Infinity }
          }}
        />
      ))}
    </div>
  );
}
