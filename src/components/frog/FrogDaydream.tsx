import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import princessImg from "@/assets/princess.png";

interface FrogDaydreamProps {
  size: number;
  isDaydreaming: boolean;
  daydreamPhase: "thinking" | "kiss" | "hearts" | "wakeup" | null;
}

export const FrogDaydream = memo(({ size, isDaydreaming, daydreamPhase }: FrogDaydreamProps) => {
  if (!isDaydreaming || !daydreamPhase) return null;

  const bubbleSize = size * 0.86;
  const bubbleX = size * 1.155;
  const bubbleY = -bubbleSize * 0.05;

  const showPrincess = daydreamPhase !== null && daydreamPhase !== "wakeup";
  // Kiss flies from princess lips toward Verdinho (bottom-left, growing)
  const showFlyingKiss = daydreamPhase === "kiss" || daydreamPhase === "hearts";

  return (
    <AnimatePresence>
      {isDaydreaming && (
        <motion.div
          className="absolute pointer-events-none z-50"
          style={{ top: bubbleY, left: bubbleX, width: bubbleSize, height: bubbleSize }}
          initial={{ opacity: 0, scale: 0.2, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.2, rotate: 10 }}
          transition={{ duration: 0.5, ease: "backOut" }}
        >
          {/* Comic-style thought bubble trail */}
          <svg className="absolute" style={{ bottom: -size * 0.12, left: -20, width: 30, height: 40 }}>
            <circle cx="22" cy="32" r="6" fill="white" stroke="#ddd" strokeWidth="1" />
            <circle cx="13" cy="20" r="4.5" fill="white" stroke="#ddd" strokeWidth="1" />
            <circle cx="6" cy="9" r="3" fill="white" stroke="#ddd" strokeWidth="1" />
          </svg>

          {/* Main comic thought cloud */}
          <motion.div
            className="relative w-full h-full overflow-visible flex items-center justify-center"
            style={{
              borderRadius: "50% 45% 48% 52% / 48% 50% 45% 52%",
              background: "radial-gradient(ellipse at 35% 30%, #ffffff, #fff8fc 40%, #ffe8f4 65%, #ffd6ec 85%, #ffc8e4)",
              boxShadow: `
                0 0 0 2.5px #d4a0b8,
                0 0 20px rgba(255, 105, 180, 0.25),
                0 8px 35px rgba(0,0,0,0.18),
                inset 0 4px 25px rgba(255,255,255,0.95),
                inset 0 -4px 15px rgba(255, 182, 193, 0.15)
              `,
              border: "2.5px solid #c990a8",
            }}
          >
            {/* Soft golden glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(255,215,0,0.12), transparent 60%)",
              }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Princess image */}
            <AnimatePresence>
              {showPrincess && (
                <motion.img
                  src={princessImg}
                  alt="Princesa beijando o sapo"
                  className="w-[88%] h-[88%] object-contain relative z-10"
                  style={{
                    filter: "drop-shadow(0 4px 12px rgba(255, 105, 180, 0.4)) drop-shadow(0 8px 25px rgba(0,0,0,0.3)) saturate(1.5) brightness(1.22) contrast(1.18)",
                  }}
                  initial={{ opacity: 0, scale: 0.6, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.3, rotate: 5 }}
                  transition={{ duration: 0.6, ease: "backOut" }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Flying kiss — exits bubble from princess lips, travels toward Verdinho's cheek, growing */}
          <AnimatePresence>
            {showFlyingKiss && (
              <motion.div
                className="absolute z-30 pointer-events-none"
                style={{
                  top: bubbleSize * 0.55,
                  left: -bubbleSize * 0.05,
                }}
                initial={{
                  opacity: 0,
                  scale: 0.15,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: [0, 1, 1, 1, 0.9, 0],
                  scale: [0.15, 0.3, 0.5, 0.75, 1, 1.1],
                  x: [0, -bubbleSize * 0.15, -bubbleSize * 0.35, -bubbleSize * 0.6, -bubbleSize * 0.85, -bubbleSize * 1.05],
                  y: [0, bubbleSize * 0.05, bubbleSize * 0.08, bubbleSize * 0.05, -bubbleSize * 0.02, -bubbleSize * 0.08],
                }}
                exit={{ opacity: 0, scale: 0.2 }}
                transition={{
                  duration: 3,
                  times: [0, 0.15, 0.35, 0.55, 0.8, 1],
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <svg
                  width={bubbleSize * 0.28}
                  height={bubbleSize * 0.24}
                  viewBox="0 0 60 50"
                  style={{ filter: "drop-shadow(0 2px 8px rgba(200,0,50,0.4))" }}
                >
                  {/* Upper lip */}
                  <path
                    d="M30 22 C30 22 22 8 12 14 C2 20 8 30 18 28 C22 27 26 24 30 28 C34 24 38 27 42 28 C52 30 58 20 48 14 C38 8 30 22 30 22Z"
                    fill="#cc1133"
                    opacity="0.9"
                  />
                  {/* Lower lip */}
                  <path
                    d="M18 28 C22 27 26 30 30 28 C34 30 38 27 42 28 C42 28 38 40 30 42 C22 40 18 28 18 28Z"
                    fill="#dd2244"
                    opacity="0.85"
                  />
                  {/* Lip shine */}
                  <ellipse cx="24" cy="18" rx="4" ry="2.5" fill="#ff4466" opacity="0.4" />
                  <ellipse cx="36" cy="18" rx="4" ry="2.5" fill="#ff4466" opacity="0.4" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FrogDaydream.displayName = "FrogDaydream";
