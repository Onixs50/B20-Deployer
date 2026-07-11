import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#0052FF", "#00E6A0", "#FFB020"];

interface Ember {
  id: number;
  left: number; // vw
  size: number; // px
  duration: number; // s
  delay: number; // s
  color: string;
  drift: number; // px, horizontal wander
}

/**
 * A quiet field of rising embers behind the page — keeps the "forging a
 * token" metaphor alive without competing with foreground content. Fixed,
 * pointer-events-none, and skipped entirely for prefers-reduced-motion.
 */
export function ForgeEmbers({ count = 22 }: { count?: number }) {
  const reduce = useReducedMotion();

  const embers = useMemo<Ember[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 9 + Math.random() * 10,
      delay: Math.random() * 12,
      color: COLORS[i % COLORS.length],
      drift: (Math.random() - 0.5) * 60
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.left}vw`,
            bottom: -20,
            width: e.size,
            height: e.size,
            background: e.color,
            boxShadow: `0 0 ${e.size * 3}px ${e.size}px ${e.color}55`
          }}
          initial={{ y: 0, x: 0, opacity: 0 }}
          animate={{
            y: "-110vh",
            x: [0, e.drift, 0],
            opacity: [0, 0.8, 0.8, 0]
          }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: "linear",
            opacity: { times: [0, 0.1, 0.85, 1], duration: e.duration, repeat: Infinity }
          }}
        />
      ))}
    </div>
  );
}
