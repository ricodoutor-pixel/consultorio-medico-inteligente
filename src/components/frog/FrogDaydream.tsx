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
          {/* Comic-style thought bubble trail — no dark outlines */}
          <svg className="absolute" style={{ bottom: -size * 0.12, left: -20, width: 30, height: 40 }}>
            <circle cx="22" cy="32" r="6" fill="white" stroke="#ddd" strokeWidth="1" />
            <circle cx="13" cy="20" r="4.5" fill="white" stroke="#ddd" strokeWidth="1" />
            <circle cx="6" cy="9" r="3" fill="white" stroke="#ddd" strokeWidth="1" />
          </svg>

          {/* Main comic thought cloud — princess only */}
          <motion.div
            className="relative w-full h-full overflow-hidden flex items-center justify-center"
            style={{
              borderRadius: "50% 45% 48% 52% / 48% 50% 45% 52%",
              background: "radial-gradient(ellipse at 35% 30%, #ffffff, #fff8fc 50%, #fff0f6 80%, #ffe8f0)",
              boxShadow: `
                0 0 0 3px #222,
                0 0 0 5px white,
                0 8px 30px rgba(0,0,0,0.25),
                inset 0 4px 20px rgba(255,255,255,0.9)
              `,
              border: "3px solid #333",
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

            {/* Princess image — only element inside bubble */}
            <motion.img
              src={princessImg}
              alt="Princesa beijando o sapo"
              className="w-[90%] h-[90%] object-contain relative z-10"
              style={{
                filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25)) saturate(1.25) brightness(1.12) contrast(1.08)",
              }}
              animate={
                daydreamPhase === "kiss"
                  ? {
                      scale: [1, 1.1, 1.05, 1.1, 1],
                      rotate: [0, -3, 3, -2, 0],
                      y: [0, -3, 0, -2, 0],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FrogDaydream.displayName = "FrogDaydream";
