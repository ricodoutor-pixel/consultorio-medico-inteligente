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

  const bubbleSize = size * 1.2;
  const bubbleX = size * 0.5;
  const bubbleY = -bubbleSize * 0.2;

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
          {/* Thought bubble trail — more elegant */}
          <svg className="absolute" style={{ bottom: -size * 0.1, left: -16, width: 24, height: 32 }}>
            <circle cx="18" cy="25" r="4.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.9">
              <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="15" r="3.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.8">
              <animate attributeName="r" values="3;4;3" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="5" cy="6" r="2.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.7">
              <animate attributeName="r" values="2;3;2" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Main thought cloud — dreamy romantic scene */}
          <motion.div
            className="relative w-full h-full overflow-hidden flex items-center justify-center"
            style={{
              borderRadius: "50% 50% 48% 45%",
              background: "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.99), rgba(255,235,245,0.96) 40%, rgba(255,200,230,0.9) 70%, rgba(255,182,220,0.85))",
              boxShadow: `
                0 8px 40px rgba(255,105,180,0.4), 
                inset 0 4px 20px rgba(255,255,255,0.85), 
                0 0 60px rgba(255,182,193,0.35),
                0 0 100px rgba(255,105,180,0.2)
              `,
              border: "2px solid rgba(255,200,220,0.5)",
            }}
          >
            {/* Animated magical aura */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(255,215,0,0.2), rgba(255,182,193,0.15), transparent 65%)",
              }}
              animate={{ 
                scale: [1, 1.08, 1], 
                opacity: [0.4, 0.8, 0.4],
                rotate: [0, 5, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Secondary purple aura */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 70% 70%, rgba(139,92,246,0.1), transparent 50%)",
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Princess image with enhanced romantic effects */}
            <motion.img
              src={princessImg}
              alt="Princesa beijando o sapo"
              className="w-[92%] h-[92%] object-contain relative z-10"
              style={{
                filter: "drop-shadow(0 6px 16px rgba(255,105,180,0.5)) drop-shadow(0 0 12px rgba(255,215,0,0.4)) saturate(1.1) brightness(1.05)",
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

            {/* Sparkles overlay — more dynamic */}
            {[
              { cx: "6%", cy: "10%", dur: "1.3s", emoji: "✨", size: "9px" },
              { cx: "92%", cy: "14%", dur: "1.6s", emoji: "⭐", size: "10px" },
              { cx: "8%", cy: "85%", dur: "1.8s", emoji: "✨", size: "8px" },
              { cx: "88%", cy: "82%", dur: "1.4s", emoji: "💫", size: "9px" },
              { cx: "50%", cy: "5%", dur: "2s", emoji: "👑", size: "11px" },
              { cx: "20%", cy: "20%", dur: "1.2s", emoji: "✨", size: "7px" },
              { cx: "78%", cy: "25%", dur: "1.5s", emoji: "✨", size: "8px" },
              { cx: "15%", cy: "60%", dur: "1.7s", emoji: "💖", size: "8px" },
              { cx: "85%", cy: "55%", dur: "1.9s", emoji: "💕", size: "7px" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: s.cx, top: s.cy, fontSize: s.size }}
                animate={{ 
                  opacity: [0.2, 1, 0.2], 
                  scale: [0.6, 1.4, 0.6], 
                  rotate: [0, 180, 360],
                  y: [0, -3, 0],
                }}
                transition={{ duration: parseFloat(s.dur), repeat: Infinity, delay: i * 0.12 }}
              >
                {s.emoji}
              </motion.div>
            ))}

            {/* Kiss marks during kiss phase */}
            {(daydreamPhase === "kiss" || daydreamPhase === "hearts") && (
              <>
                <motion.div
                  className="absolute"
                  style={{ bottom: "15%", left: "10%", fontSize: "14px" }}
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: [0, 1.4, 1.1], rotate: [-25, 0, -8] }}
                  transition={{ duration: 0.6 }}
                >
                  💋
                </motion.div>
                <motion.div
                  className="absolute"
                  style={{ bottom: "28%", left: "5%", fontSize: "10px" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.85] }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                >
                  💕
                </motion.div>
                <motion.div
                  className="absolute"
                  style={{ top: "20%", right: "8%", fontSize: "9px" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.1, 0.9] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  💗
                </motion.div>
              </>
            )}

            {/* Floating hearts around princess during kiss */}
            {daydreamPhase === "kiss" && (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <motion.span
                    key={`float-heart-${i}`}
                    className="absolute"
                    style={{ 
                      left: `${20 + i * 18}%`, 
                      bottom: "55%",
                      fontSize: "10px",
                    }}
                    initial={{ y: 0, opacity: 0, scale: 0.5 }}
                    animate={{ y: -25, opacity: [0, 1, 0], scale: [0.5, 1.2, 0.8] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }}
                  >
                    {i % 2 === 0 ? "💗" : "💕"}
                  </motion.span>
                ))}
              </>
            )}

            {/* Soft vignette overlay */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(255,182,220,0.2) 100%)",
              }}
            />
          </motion.div>

          {/* Hearts explosion phase — more dramatic */}
          {daydreamPhase === "hearts" && (
            <div className="absolute inset-0">
              {Array.from({ length: 10 }).map((_, i) => {
                const angle = (i / 10) * Math.PI * 2;
                const dist = bubbleSize * 0.75;
                const emojis = ["💕", "👑", "✨", "💋", "💗", "⭐", "💖", "🌸", "💫", "🦋"];
                return (
                  <motion.span
                    key={i}
                    className="absolute pointer-events-none"
                    style={{ left: "50%", top: "50%", fontSize: "12px" }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist,
                      opacity: 0,
                      scale: 1.5,
                      rotate: 180,
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >
                    {emojis[i]}
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
