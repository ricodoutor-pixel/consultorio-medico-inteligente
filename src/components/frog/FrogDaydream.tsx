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

          {/* Main thought cloud with princess image - enhanced romantic scene */}
          <motion.div
            className="relative w-full h-full overflow-hidden flex items-center justify-center"
            style={{
              borderRadius: "50% 50% 50% 45%",
              background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.98), rgba(255,220,240,0.94), rgba(255,182,220,0.75))",
              boxShadow: "0 6px 30px rgba(255,105,180,0.35), inset 0 3px 15px rgba(255,255,255,0.7), 0 0 40px rgba(255,182,193,0.3)",
            }}
          >
            {/* Magical aura behind princess */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(255,215,0,0.15), rgba(255,182,193,0.1), transparent 70%)",
              }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Princess image with enhanced effects */}
            <motion.img
              src={princessImg}
              alt="Princesa beijando o sapo"
              className="w-[88%] h-[88%] object-contain"
              style={{
                filter: "drop-shadow(0 4px 12px rgba(255,105,180,0.4)) drop-shadow(0 0 8px rgba(255,215,0,0.3))",
              }}
              animate={
                daydreamPhase === "kiss"
                  ? { 
                      scale: [1, 1.08, 1.03, 1.08, 1], 
                      rotate: [0, -2, 2, -1, 0],
                      filter: [
                        "drop-shadow(0 4px 12px rgba(255,105,180,0.4)) drop-shadow(0 0 8px rgba(255,215,0,0.3))",
                        "drop-shadow(0 4px 20px rgba(255,105,180,0.6)) drop-shadow(0 0 15px rgba(255,215,0,0.5))",
                        "drop-shadow(0 4px 12px rgba(255,105,180,0.4)) drop-shadow(0 0 8px rgba(255,215,0,0.3))",
                      ]
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Enhanced sparkles overlay */}
            {[
              { cx: "8%", cy: "12%", dur: "1.4s", emoji: "✨" },
              { cx: "88%", cy: "18%", dur: "1.7s", emoji: "⭐" },
              { cx: "12%", cy: "82%", dur: "1.9s", emoji: "✨" },
              { cx: "85%", cy: "80%", dur: "1.5s", emoji: "💫" },
              { cx: "50%", cy: "8%", dur: "2.1s", emoji: "👑" },
              { cx: "25%", cy: "25%", dur: "1.3s", emoji: "✨" },
              { cx: "75%", cy: "30%", dur: "1.6s", emoji: "✨" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute text-[7px]"
                style={{ left: s.cx, top: s.cy }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.3, 0.7], rotate: [0, 180, 360] }}
                transition={{ duration: parseFloat(s.dur), repeat: Infinity, delay: i * 0.15 }}
              >
                {s.emoji}
              </motion.div>
            ))}

            {/* Kiss marks during kiss phase */}
            {(daydreamPhase === "kiss" || daydreamPhase === "hearts") && (
              <>
                <motion.div
                  className="absolute text-[12px]"
                  style={{ bottom: "18%", left: "12%" }}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: [0, 1.3, 1], rotate: [-20, 0, -10] }}
                  transition={{ duration: 0.5 }}
                >
                  💋
                </motion.div>
                <motion.div
                  className="absolute text-[8px]"
                  style={{ bottom: "30%", left: "8%" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.1, 0.9], opacity: [0, 1, 0.8] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  💕
                </motion.div>
              </>
            )}

            {/* Floating hearts around princess */}
            {daydreamPhase === "kiss" && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={`float-heart-${i}`}
                    className="absolute text-[8px]"
                    style={{ left: `${30 + i * 20}%`, bottom: "60%" }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: -20, opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                  >
                    💗
                  </motion.span>
                ))}
              </>
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
