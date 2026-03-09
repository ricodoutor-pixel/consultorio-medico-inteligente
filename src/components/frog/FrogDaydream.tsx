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
  const bubbleX = size * 0.75;
  const bubbleY = -bubbleSize * 0.25;

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
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              {/* Sparkles background */}
              <circle cx="12" cy="18" r="1.5" fill="#ffd700" opacity="0.6">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="88" cy="22" r="1.5" fill="#ffd700" opacity="0.5">
                <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="18" cy="78" r="1" fill="#ffd700" opacity="0.4">
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="82" cy="75" r="1" fill="#ffd700" opacity="0.4">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.6s" repeatCount="indefinite" />
              </circle>

              {/* === PRINCESS === */}
              {/* Long blonde hair */}
              <ellipse cx="62" cy="42" rx="18" ry="22" fill="#f5d76e" />
              <ellipse cx="62" cy="50" rx="16" ry="20" fill="#f7dc6f" />
              {/* Hair flowing down */}
              <path d="M 46 42 Q 42 55 44 68 Q 46 72 50 70" fill="#f5d76e" />
              <path d="M 78 42 Q 82 55 80 68 Q 78 72 74 70" fill="#f5d76e" />

              {/* Princess head */}
              <ellipse cx="62" cy="42" rx="12" ry="13" fill="#fde8d0" />

              {/* Princess crown */}
              <polygon points="52,32 54,24 57,30 60,22 63,30 66,24 69,30 72,26 72,33" fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
              <circle cx="57" cy="28" r="1.2" fill="#e74c3c" />
              <circle cx="63" cy="26" r="1.2" fill="#3498db" />
              <circle cx="69" cy="28" r="1.2" fill="#2ecc71" />

              {/* Princess eyes (closed, kissing) */}
              <path d="M 57 40 Q 59 38 61 40" stroke="#2d1b69" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              {/* Long eyelashes */}
              <line x1="56" y1="39" x2="54" y2="37" stroke="#2d1b69" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="58" y1="38" x2="57" y2="36" stroke="#2d1b69" strokeWidth="0.8" strokeLinecap="round" />

              {/* Princess cheek blush */}
              <circle cx="68" cy="44" r="3" fill="#ff9cad" opacity="0.5" />

              {/* Princess red lips (puckered for kiss) */}
              <ellipse cx="56" cy="47" rx="3" ry="2.5" fill="#e74c3c" />
              <path d="M 53.5 46.5 Q 56 44.5 58.5 46.5" fill="#ff4757" />
              <ellipse cx="55.5" cy="46" rx="1" ry="0.5" fill="white" opacity="0.4" />

              {/* Princess dress hint */}
              <path d="M 55 55 Q 52 62 48 72 Q 62 75 76 72 Q 72 62 69 55" fill="#ff69b4" />
              <path d="M 55 55 Q 52 62 48 72 Q 62 75 76 72 Q 72 62 69 55" fill="url(#dressGradient)" />
              <defs>
                <linearGradient id="dressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff69b4" />
                  <stop offset="100%" stopColor="#ff1493" />
                </linearGradient>
              </defs>

              {/* === VERDINHO (small frog prince) === */}
              {/* Frog body */}
              <ellipse cx="38" cy="52" rx="14" ry="12" fill="#5bb85b" />
              <ellipse cx="38" cy="52" rx="12" ry="10" fill="#6ecf6e" />

              {/* Frog eye bumps */}
              <ellipse cx="32" cy="42" rx="5" ry="5" fill="#6ecf6e" />
              <ellipse cx="44" cy="42" rx="5" ry="5" fill="#6ecf6e" />

              {/* Frog eyes (closed, happy receiving kiss) */}
              <path d="M 30 42 Q 32 40 34 42" stroke="#2d1b69" strokeWidth="1" fill="none" strokeLinecap="round" />
              <path d="M 42 42 Q 44 40 46 42" stroke="#2d1b69" strokeWidth="1" fill="none" strokeLinecap="round" />

              {/* Frog blush */}
              <circle cx="28" cy="50" r="3" fill="#ff9cad" opacity="0.5" />

              {/* Frog happy mouth */}
              <path d="M 32 54 Q 38 58 44 54" stroke="#2d6b2d" strokeWidth="1" fill="none" strokeLinecap="round" />

              {/* Tiny crown on frog (future prince!) */}
              <polygon points="33,38 34,34 36,37 38,33 40,37 42,34 43,38" fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />

              {/* Kiss mark between them */}
              {(daydreamPhase === "kiss" || daydreamPhase === "hearts") && (
                <g>
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    {/* Kiss sparkle */}
                    <circle cx="50" cy="47" r="2" fill="#ffd700" opacity="0.8">
                      <animate attributeName="r" values="1;3;1" dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                    <path d="M 48 46 L 49 44 L 50 46 L 51 44 L 52 46" stroke="#ffd700" strokeWidth="0.5" fill="none" />
                  </motion.g>
                </g>
              )}

              {/* Magic transformation sparkles */}
              <circle cx="30" cy="60" r="1" fill="#ffd700" opacity="0.5">
                <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="46" cy="58" r="1" fill="#ffd700" opacity="0.5">
                <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.4s" />
              </circle>
            </svg>

            {/* Floating kiss emojis */}
            {daydreamPhase === "kiss" && (
              <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {["💋", "✨", "👑"].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-xs"
                    style={{ left: `${20 + i * 25}%`, top: `${55 + i * 8}%` }}
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
                    {i % 4 === 0 ? "💕" : i % 4 === 1 ? "👑" : i % 4 === 2 ? "✨" : "💖"}
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
