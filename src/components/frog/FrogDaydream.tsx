import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogDaydreamProps {
  size: number;
  isDaydreaming: boolean;
  daydreamPhase: "thinking" | "kiss" | "hearts" | "wakeup" | null;
}

export const FrogDaydream = memo(({ size, isDaydreaming, daydreamPhase }: FrogDaydreamProps) => {
  if (!isDaydreaming || !daydreamPhase) return null;

  const bubbleSize = size * 1.1;
  // Position to the RIGHT of the frog
  const bubbleX = size * 0.75;
  const bubbleY = -bubbleSize * 0.55;

  return (
    <AnimatePresence>
      {isDaydreaming && (
        <motion.div
          className="absolute pointer-events-none z-50"
          style={{ top: bubbleY, left: bubbleX, width: bubbleSize, height: bubbleSize }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.4, ease: "backOut" }}
        >
          {/* Thought bubble trail — from left side toward frog */}
          <svg className="absolute" style={{ bottom: -size * 0.05, left: -12, width: 20, height: 24 }}>
            <circle cx="14" cy="18" r="4" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.8" />
            <circle cx="8" cy="11" r="3" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.7" />
            <circle cx="4" cy="5" r="2" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6" />
          </svg>

          {/* Main thought bubble */}
          <motion.div
            className="relative w-full h-full rounded-full border border-border/30 overflow-hidden"
            style={{
              background: "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.95), rgba(255,230,240,0.9))",
              boxShadow: "0 4px 20px rgba(255,105,180,0.2), inset 0 2px 10px rgba(255,255,255,0.5)",
            }}
          >
            {/* Girlfriend frog inside bubble */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              {/* Background hearts */}
              <circle cx="15" cy="20" r="3" fill="#ffb6c1" opacity="0.3">
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="85" cy="25" r="2.5" fill="#ffb6c1" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.8s" repeatCount="indefinite" />
              </circle>

              {/* Sapinha (girlfriend frog) */}
              <ellipse cx="50" cy="48" rx="22" ry="20" fill="#7dd87d" />
              <ellipse cx="50" cy="48" rx="20" ry="18" fill="#8ae68a" />
              
              {/* Eye bumps */}
              <ellipse cx="40" cy="36" rx="8" ry="7" fill="#8ae68a" />
              <ellipse cx="60" cy="36" rx="8" ry="7" fill="#8ae68a" />
              
              {/* Eyes */}
              <ellipse cx="40" cy="36" rx="5" ry="5.5" fill="white" />
              <ellipse cx="60" cy="36" rx="5" ry="5.5" fill="white" />
              <circle cx="41" cy="36" r="3" fill="#2d1b69" />
              <circle cx="61" cy="36" r="3" fill="#2d1b69" />
              <circle cx="39.5" cy="34.5" r="1.2" fill="white" opacity="0.9" />
              <circle cx="59.5" cy="34.5" r="1.2" fill="white" opacity="0.9" />

              {/* Long eyelashes */}
              <line x1="35" y1="32" x2="33" y2="29" stroke="#2d1b69" strokeWidth="1" strokeLinecap="round" />
              <line x1="37" y1="31" x2="36" y2="28" stroke="#2d1b69" strokeWidth="1" strokeLinecap="round" />
              <line x1="55" y1="31" x2="54" y2="28" stroke="#2d1b69" strokeWidth="1" strokeLinecap="round" />
              <line x1="57" y1="32" x2="55" y2="29" stroke="#2d1b69" strokeWidth="1" strokeLinecap="round" />

              {/* Cheek blush */}
              <circle cx="33" cy="46" r="4" fill="#ff9cad" opacity="0.4" />
              <circle cx="67" cy="46" r="4" fill="#ff9cad" opacity="0.4" />

              {/* Red lipstick mouth */}
              <path d="M 42 52 Q 46 56 50 54 Q 54 56 58 52" fill="#e74c3c" stroke="#c0392b" strokeWidth="0.8" />
              <path d="M 42 52 Q 50 49 58 52" fill="#ff4757" stroke="#c0392b" strokeWidth="0.5" />
              <ellipse cx="48" cy="51" rx="2" ry="0.8" fill="white" opacity="0.4" />

              {/* Bow/flower on head */}
              <circle cx="32" cy="28" r="4" fill="#ff6b81" />
              <circle cx="28" cy="25" r="3" fill="#ff6b81" />
              <circle cx="34" cy="24" r="3" fill="#ff6b81" />
              <circle cx="30" cy="22" r="3" fill="#ff6b81" />
              <circle cx="31" cy="26" r="2" fill="#ffd700" />

              {/* Kiss mark during kiss phase */}
              {(daydreamPhase === "kiss" || daydreamPhase === "hearts") && (
                <g opacity="0.9">
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <path
                      d="M 72 48 Q 74 45 77 46 Q 79 44 81 46 Q 82 48 80 50 Q 78 52 77 50 Q 75 52 73 50 Q 71 48 72 48"
                      fill="#e74c3c"
                      opacity="0.8"
                    />
                  </motion.g>
                </g>
              )}
            </svg>

            {/* Floating kiss emojis */}
            {daydreamPhase === "kiss" && (
              <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {["💋", "💋"].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-xs"
                    style={{ left: `${25 + i * 30}%`, top: `${60 + i * 10}%` }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], y: -15 }}
                    transition={{ delay: i * 0.3, duration: 1 }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Hearts explosion */}
          {daydreamPhase === "hearts" && (
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, i) => {
                const angle = (i / 10) * Math.PI * 2;
                const dist = bubbleSize * 0.7;
                return (
                  <motion.span
                    key={i}
                    className="absolute text-sm pointer-events-none"
                    style={{ left: "50%", top: "50%" }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0,
                      scale: 1.5,
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  >
                    {i % 3 === 0 ? "💕" : i % 3 === 1 ? "❤️" : "💖"}
                  </motion.span>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FrogDaydream.displayName = "FrogDaydream";
