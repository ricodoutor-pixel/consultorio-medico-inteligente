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

  // Kiss mark appears in "thinking" phase, princess appears in "kiss" phase
  const showKissMark = daydreamPhase === "thinking";
  const showPrincess = daydreamPhase === "kiss" || daydreamPhase === "hearts";

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
            className="relative w-full h-full overflow-hidden flex items-center justify-center"
            style={{
              borderRadius: "50% 45% 48% 52% / 48% 50% 45% 52%",
              background: "radial-gradient(ellipse at 35% 30%, #ffffff, #fff8fc 50%, #fff0f6 80%, #ffe8f0)",
              boxShadow: `
                0 0 0 2px #e0c0d0,
                0 8px 30px rgba(0,0,0,0.15),
                inset 0 4px 20px rgba(255,255,255,0.9)
              `,
              border: "2px solid #d4a0b8",
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

            {/* Lipstick kiss mark — appears first, grows, then fades before princess */}
            <AnimatePresence>
              {showKissMark && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-20"
                  initial={{ opacity: 0, scale: 0.1 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.1, 0.4, 0.7, 0.9] }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ duration: 1.8, times: [0, 0.3, 0.7, 1], ease: "easeOut" }}
                >
                  <svg
                    width={bubbleSize * 0.5}
                    height={bubbleSize * 0.4}
                    viewBox="0 0 60 50"
                    style={{ filter: "drop-shadow(0 2px 8px rgba(200,0,50,0.3))" }}
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
                    <ellipse cx="30" cy="35" rx="5" ry="2" fill="#ee3355" opacity="0.3" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Princess image — appears after kiss mark fades */}
            <AnimatePresence>
              {showPrincess && (
                <motion.img
                  src={princessImg}
                  alt="Princesa beijando o sapo"
                  className="w-[90%] h-[90%] object-contain relative z-10"
                  style={{
                    filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.35)) saturate(1.45) brightness(1.18) contrast(1.15)",
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: [1, 1.1, 1.05, 1.1, 1],
                    rotate: [0, -3, 3, -2, 0],
                    y: [0, -3, 0, -2, 0],
                  }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FrogDaydream.displayName = "FrogDaydream";
