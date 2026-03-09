import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogLoveHeartsProps {
  size: number;
  show: boolean;
}

/**
 * Small hearts that float up from Verdinho's eyes when he remembers the princess.
 * The cursed prince dreams of the kiss that will break the spell...
 */
export const FrogLoveHearts = memo(({ size, show }: FrogLoveHeartsProps) => {
  if (!show) return null;

  const hearts = [
    { delay: 0, startX: size * 0.32, color: "#ff6b81" },
    { delay: 0.15, startX: size * 0.38, color: "#e74c3c" },
    { delay: 0.3, startX: size * 0.62, color: "#ff6b81" },
    { delay: 0.45, startX: size * 0.68, color: "#e74c3c" },
    { delay: 0.6, startX: size * 0.35, color: "#ff4757" },
    { delay: 0.75, startX: size * 0.65, color: "#ff4757" },
  ];

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-30 pointer-events-none">
        {hearts.map((h, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: h.startX, top: size * 0.32 }}
            initial={{ opacity: 0, y: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, -size * 0.2, -size * 0.45, -size * 0.7],
              x: [0, (i % 2 === 0 ? -1 : 1) * size * 0.12, (i % 2 === 0 ? 1 : -1) * size * 0.06, 0],
              scale: [0.3, 0.7, 0.5, 0.2],
            }}
            transition={{
              delay: h.delay,
              duration: 1.8,
              ease: "easeOut",
              repeat: 1,
              repeatDelay: 0.5,
            }}
          >
            <svg width={size * 0.1} height={size * 0.1} viewBox="0 0 20 20">
              <path
                d="M10 17 C5 12 1 9 1 5.5 C1 3 3 1 5.5 1 C7.5 1 9 2.5 10 4 C11 2.5 12.5 1 14.5 1 C17 1 19 3 19 5.5 C19 9 15 12 10 17Z"
                fill={h.color}
                opacity="0.85"
              />
            </svg>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
});

FrogLoveHearts.displayName = "FrogLoveHearts";
