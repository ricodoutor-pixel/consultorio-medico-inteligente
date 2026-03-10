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
  const bubbleX = size * 1.05;
  const bubbleY = -bubbleSize * 0.15;

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
            <circle cx="22" cy="32" r="6" fill="white" stroke="#222" strokeWidth="1.5" />
            <circle cx="13" cy="20" r="4.5" fill="white" stroke="#222" strokeWidth="1.5" />
            <circle cx="6" cy="9" r="3" fill="white" stroke="#222" strokeWidth="1.5" />
          </svg>

          {/* Main comic thought cloud */}
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
            {/* Comic-style inner bumps (cloud shape illusion) */}
            <div className="absolute inset-0 pointer-events-none" style={{
              borderRadius: "50% 45% 48% 52% / 48% 50% 45% 52%",
              boxShadow: `
                inset 8px -4px 0 -2px rgba(255,255,255,0.6),
                inset -6px 6px 0 -2px rgba(255,255,255,0.4)
              `,
            }} />

            {/* Soft golden glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(255,215,0,0.12), transparent 60%)",
              }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Princess image — clear and bright */}
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

            {/* Comic sparkles — small and clean */}
            {[
              { cx: "8%", cy: "10%", dur: "1.3s", emoji: "✨", size: "9px" },
              { cx: "90%", cy: "12%", dur: "1.6s", emoji: "⭐", size: "9px" },
              { cx: "10%", cy: "85%", dur: "1.8s", emoji: "✨", size: "8px" },
              { cx: "88%", cy: "80%", dur: "1.4s", emoji: "💫", size: "8px" },
              { cx: "50%", cy: "6%", dur: "2s", emoji: "👑", size: "10px" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: s.cx, top: s.cy, fontSize: s.size }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.6, 1.3, 0.6],
                }}
                transition={{ duration: parseFloat(s.dur), repeat: Infinity, delay: i * 0.15 }}
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
              </>
            )}

            {/* Floating hearts during kiss */}
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
          </motion.div>

          {/* Hearts explosion phase */}
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