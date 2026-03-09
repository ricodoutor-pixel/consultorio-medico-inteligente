import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogDaydreamProps {
  size: number;
  isDaydreaming: boolean;
  daydreamPhase: "thinking" | "kiss" | "hearts" | "wakeup" | null;
}

export const FrogDaydream = memo(({ size, isDaydreaming, daydreamPhase }: FrogDaydreamProps) => {
  if (!isDaydreaming || !daydreamPhase) return null;

  const bubbleSize = size * 1.17;
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
          {/* Thought bubble trail — dots leading from Verdinho's head */}
          <svg className="absolute" style={{ bottom: -size * 0.08, left: -16, width: 24, height: 30 }}>
            <circle cx="18" cy="24" r="4.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.85" />
            <circle cx="10" cy="15" r="3.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.75" />
            <circle cx="5" cy="7" r="2.5" fill="white" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6" />
          </svg>

          {/* Main thought cloud — the princess kissing Verdinho's cheek */}
          <motion.div
            className="relative w-full h-full overflow-hidden"
            style={{
              borderRadius: "50% 50% 50% 45%",
              background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.97), rgba(255,220,240,0.92), rgba(255,182,220,0.7))",
              boxShadow: "0 6px 30px rgba(255,105,180,0.25), inset 0 3px 15px rgba(255,255,255,0.6), 0 0 60px rgba(255,182,193,0.15)",
            }}
          >
            <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="dressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff69b4" />
                  <stop offset="100%" stopColor="#c71585" />
                </linearGradient>
                <radialGradient id="skinGlow" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#fff5ee" />
                  <stop offset="100%" stopColor="#fde8d0" />
                </radialGradient>
                <radialGradient id="magicGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ambient sparkles */}
              {[
                { cx: 10, cy: 15, r: 1.5, dur: "1.5s" },
                { cx: 108, cy: 18, r: 1.8, dur: "1.8s" },
                { cx: 14, cy: 95, r: 1.2, dur: "2s" },
                { cx: 105, cy: 90, r: 1, dur: "1.6s" },
                { cx: 60, cy: 8, r: 1.5, dur: "1.3s" },
              ].map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#ffd700" opacity="0.5">
                  <animate attributeName="opacity" values="0.2;0.9;0.2" dur={s.dur} repeatCount="indefinite" />
                </circle>
              ))}

              {/* === PRINCESS (right side, leaning to kiss) === */}

              {/* Long flowing blonde hair */}
              <ellipse cx="80" cy="40" rx="22" ry="28" fill="#f5d76e" />
              <ellipse cx="80" cy="48" rx="20" ry="25" fill="#f7dc6f" />
              {/* Hair cascading down */}
              <path d="M 60 38 Q 54 52 56 72 Q 58 78 64 76" fill="#f5d76e" opacity="0.9" />
              <path d="M 100 38 Q 106 52 104 72 Q 102 78 96 76" fill="#f5d76e" opacity="0.9" />
              {/* Hair highlights */}
              <path d="M 70 30 Q 72 45 70 55" stroke="#fff8dc" strokeWidth="1.2" fill="none" opacity="0.6" />
              <path d="M 88 32 Q 90 47 88 57" stroke="#fff8dc" strokeWidth="1" fill="none" opacity="0.5" />

              {/* Princess head */}
              <ellipse cx="80" cy="40" rx="14" ry="15" fill="url(#skinGlow)" />

              {/* Tiara/Crown — ornate */}
              <polygon points="66,30 69,18 73,26 77,15 81,26 85,17 89,26 93,20 94,30" fill="#ffd700" stroke="#daa520" strokeWidth="0.6" />
              {/* Crown jewels */}
              <circle cx="73" cy="23" r="1.8" fill="#e74c3c">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="81" cy="20" r="2" fill="#4169e1">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="89" cy="23" r="1.8" fill="#2ecc71">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite" />
              </circle>
              {/* Crown gold details */}
              <circle cx="77" cy="19" r="1" fill="#ffd700" />
              <circle cx="85" cy="19" r="1" fill="#ffd700" />

              {/* Princess eye — closed, swooning */}
              <path d="M 77 38 Q 80 35 83 38" stroke="#2d1b69" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              {/* Long lashes */}
              <line x1="76" y1="37" x2="73.5" y2="34.5" stroke="#2d1b69" strokeWidth="0.9" strokeLinecap="round" />
              <line x1="78.5" y1="36" x2="77.5" y2="33" stroke="#2d1b69" strokeWidth="0.9" strokeLinecap="round" />
              <line x1="81" y1="35.5" x2="81" y2="33" stroke="#2d1b69" strokeWidth="0.7" strokeLinecap="round" />

              {/* Princess cheek blush */}
              <circle cx="88" cy="44" r="3.5" fill="#ff9cad" opacity="0.45" />

              {/* Princess nose (subtle) */}
              <path d="M 78 42 Q 77 44 78.5 44.5" stroke="#e8c4a0" strokeWidth="0.8" fill="none" />

              {/* Princess lips — puckered, kissing LEFT toward Verdinho's cheek */}
              <ellipse cx="72" cy="48" rx="3.5" ry="2.8" fill="#e74c3c" />
              <path d="M 69 47 Q 72 44.5 75 47" fill="#ff4757" />
              <ellipse cx="71" cy="47" rx="1.2" ry="0.6" fill="white" opacity="0.35" />

              {/* Princess dress */}
              <path d="M 70 55 Q 65 68 60 85 Q 80 90 100 85 Q 95 68 90 55" fill="url(#dressGrad)" />
              {/* Dress sparkle details */}
              <circle cx="75" cy="70" r="1" fill="white" opacity="0.4" />
              <circle cx="85" cy="75" r="0.8" fill="white" opacity="0.3" />
              <circle cx="80" cy="65" r="0.6" fill="#ffd700" opacity="0.5" />

              {/* Princess arm reaching toward Verdinho */}
              <path d="M 70 55 Q 60 52 52 50" stroke="url(#skinGlow)" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="52" cy="50" r="3" fill="#fde8d0" />

              {/* === VERDINHO'S CHEEK (left side, being kissed) === */}

              {/* Verdinho's head — round frog face */}
              <ellipse cx="38" cy="50" rx="18" ry="17" fill="#5bb85b" />
              <ellipse cx="38" cy="50" rx="16" ry="15" fill="#6ecf6e" />

              {/* Eye bumps */}
              <ellipse cx="30" cy="38" rx="6" ry="5.5" fill="#6ecf6e" />
              <ellipse cx="46" cy="38" rx="6" ry="5.5" fill="#6ecf6e" />

              {/* Verdinho eyes — closed, blushing from kiss */}
              <path d="M 27 38 Q 30 35 33 38" stroke="#2d6b2d" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M 43 38 Q 46 35 49 38" stroke="#2d6b2d" strokeWidth="1.2" fill="none" strokeLinecap="round" />

              {/* Verdinho deep blush from being kissed */}
              <circle cx="25" cy="50" r="4" fill="#ff9cad" opacity="0.55">
                <animate attributeName="opacity" values="0.35;0.6;0.35" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="51" cy="50" r="4" fill="#ff9cad" opacity="0.55">
                <animate attributeName="opacity" values="0.35;0.6;0.35" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {/* Verdinho dreamy smile */}
              <path d="M 30 55 Q 38 62 46 55" stroke="#2d6b2d" strokeWidth="1.3" fill="none" strokeLinecap="round" />

              {/* Lipstick kiss mark on Verdinho's cheek! */}
              {(daydreamPhase === "kiss" || daydreamPhase === "hearts") && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
                >
                  {/* Red kiss mark */}
                  <ellipse cx="50" cy="46" rx="3" ry="2" fill="#e74c3c" opacity="0.8" transform="rotate(-15 50 46)" />
                  <path d="M 48 45 Q 50 43 52 45" fill="#ff4757" opacity="0.7" />
                  {/* Kiss sparkle burst */}
                  <circle cx="52" cy="44" r="1.5" fill="#ffd700" opacity="0.9">
                    <animate attributeName="r" values="1;2.5;1" dur="0.7s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="0.7s" repeatCount="indefinite" />
                  </circle>
                </motion.g>
              )}

              {/* Magic aura around the kiss — transformation magic */}
              {(daydreamPhase === "kiss" || daydreamPhase === "hearts") && (
                <>
                  <circle cx="55" cy="47" r="8" fill="url(#magicGlow)">
                    <animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  {/* Tiny stars */}
                  {[
                    { x: 20, y: 30, d: "0s" }, { x: 55, y: 25, d: "0.3s" },
                    { x: 15, y: 65, d: "0.6s" }, { x: 50, y: 68, d: "0.9s" },
                  ].map((s, i) => (
                    <text key={i} x={s.x} y={s.y} fontSize="6" opacity="0.7">
                      <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={s.d} repeatCount="indefinite" />
                      ✦
                    </text>
                  ))}
                </>
              )}

              {/* Verdinho's tiny prince crown (memory of who he was) */}
              <polygon points="30,34 32,28 35,32 38,26 41,32 44,28 46,34" fill="#ffd700" stroke="#daa520" strokeWidth="0.4" opacity="0.7">
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
              </polygon>
            </svg>

            {/* Floating emojis during kiss phase */}
            {daydreamPhase === "kiss" && (
              <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {["💋", "✨", "👑", "💕"].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-xs"
                    style={{ left: `${15 + i * 20}%`, top: `${50 + i * 6}%` }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 0], y: -20 }}
                    transition={{ delay: i * 0.25, duration: 1.2 }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Hearts explosion phase */}
          {daydreamPhase === "hearts" && (
            <div className="absolute inset-0">
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const dist = bubbleSize * 0.75;
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
                    transition={{ duration: 1.3, ease: "easeOut" }}
                  >
                    {i % 5 === 0 ? "💕" : i % 5 === 1 ? "👑" : i % 5 === 2 ? "✨" : i % 5 === 3 ? "💖" : "💋"}
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
