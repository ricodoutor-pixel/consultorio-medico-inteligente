import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogChestHeartProps {
  size: number;
  show: boolean;
}

/**
 * A small red heart that appears on Verdinho's chest when daydreaming,
 * pulses in size, and disappears when the princess disappears.
 */
export const FrogChestHeart = memo(({ size, show }: FrogChestHeartProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            top: size * 0.55,
            left: size * 0.43,
            zIndex: 45,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.4, ease: "backOut" }}
        >
          <motion.svg
            width={size * 0.13}
            height={size * 0.13}
            viewBox="0 0 24 24"
            animate={{
              scale: [1, 1.35, 1, 1.3, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              filter: "drop-shadow(0 2px 6px rgba(220, 20, 60, 0.5))",
            }}
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#dc143c"
            />
            {/* Shine */}
            <ellipse cx="8.5" cy="7.5" rx="2.5" ry="2" fill="#ff4466" opacity="0.4" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FrogChestHeart.displayName = "FrogChestHeart";
