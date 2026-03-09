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

  const bubbleSize = size * 1.05;
  const bubbleX = size * 0.55;
  const bubbleY = -bubbleSize * 0.15;

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
          {/* Thought bubble trail */}
          <svg className="absolute" style={{ bottom: -size * 0.08, left: -14, width: 20, height: 26 }}>
            <circle cx="15" cy="20" r="3.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.85" />
            <circle cx="8" cy="12" r="2.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.75" />
            <circle cx="4" cy="5" r="2" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6" />
          </svg>

          {/* Main thought cloud with princess image */}
          <motion.div
            className="relative w-full h-full overflow-hidden flex items-center justify-center"
            style={{
              borderRadius: "50% 50% 50% 45%",
              background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.97), rgba(255,220,240,0.92), rgba(255,182,220,0.7))",
              boxShadow: "0 4px 20px rgba(255,105,180,0.25), inset 0 2px 10px rgba(255,255,255,0.6)",
            }}
          >
            {/* Princess image */}
            <motion.img
              src={princessImg}
              alt="Princesa"
              className="w-[85%] h-[85%] object-contain drop-shadow-md"
              animate={
                daydreamPhase === "kiss"
                  ? { scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }
                  : { scale: 1 }
              }
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Sparkles overlay */}
            {[
              { cx: "10%", cy: "15%", dur: "1.5s" },
              { cx: "85%", cy: "20%", dur: "1.8s" },
              { cx: "15%", cy: "80%", dur: "2s" },
              { cx: "80%", cy: "85%", dur: "1.6s" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute text-[6px]"
                style={{ left: s.cx, top: s.cy }}
                animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: parseFloat(s.dur), repeat: Infinity }}
              >
                ✨
              </motion.div>
            ))}

            {/* Kiss mark during kiss phase */}
            {(daydreamPhase === "kiss" || daydreamPhase === "hearts") && (
              <motion.div
                className="absolute text-[10px]"
                style={{ bottom: "15%", left: "15%" }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4 }}
              >
                💋
              </motion.div>
            )}
          </motion.div>

          {/* Hearts explosion phase */}
          {daydreamPhase === "hearts" && (
            <div className="absolute inset-0">
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const dist = bubbleSize * 0.65;
                return (
                  <motion.span
                    key={i}
                    className="absolute text-xs pointer-events-none"
                    style={{ left: "50%", top: "50%" }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0,
                      scale: 1.3,
                    }}
                    transition={{ duration: 1.3, ease: "easeOut" }}
                  >
                    {i % 4 === 0 ? "💕" : i % 4 === 1 ? "👑" : i % 4 === 2 ? "✨" : "💋"}
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
