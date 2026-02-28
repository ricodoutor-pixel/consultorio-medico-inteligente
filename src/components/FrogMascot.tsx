import { useCallback, useEffect, useRef, useState, memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  jumpDistance?: number;
}

type FrogPhase = "rest" | "jump" | "prince" | "wave" | "dance" | "celebrate";

export const FrogMascot = memo(({ onClick, size = 60, jumpDistance = 90 }: FrogMascotProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [phase, setPhase] = useState<FrogPhase>("rest");

  const reduceMotion = useReducedMotion();
  const isCompact = size < 40;
  const effectiveJumpDistance = isCompact || reduceMotion ? 0 : jumpDistance;
  const stageWidth = isCompact ? size + 10 : size + effectiveJumpDistance + 28;
  const stageHeight = isCompact ? size * 2 : size * 2.6;

  const isJumping = phase === "jump";
  const isPrince = phase === "prince";
  const isWaving = phase === "wave";
  const isDancing = phase === "dance";
  const isCelebrating = phase === "celebrate";
  const isExcited = isPrince || isDancing || isCelebrating;

  // Phase cycle — 3s between animations
  useEffect(() => {
    if (reduceMotion) return;
    const phases: FrogPhase[] = ["rest", "prince", "dance", "jump", "wave", "celebrate"];
    let idx = 0;

    if (isCompact) {
      const interval = setInterval(() => {
        idx = (idx + 1) % phases.length;
        setPhase(phases[idx]);
      }, 3000);
      return () => clearInterval(interval);
    }

    let timeout: number;
    const cycle = () => {
      idx = (idx + 1) % phases.length;
      setPhase(phases[idx]);
      const duration = phases[idx] === "jump" ? 1650 : phases[idx] === "celebrate" ? 2500 : 2000;
      timeout = window.setTimeout(() => {
        setPhase("rest");
        timeout = window.setTimeout(cycle, 1000);
      }, duration);
    };
    timeout = window.setTimeout(cycle, 2000);
    return () => clearTimeout(timeout);
  }, [isCompact, reduceMotion]);

  // Blinking — every 4-6s
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      window.setTimeout(() => setIsBlinking(false), 200);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.5) blink();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Smooth pupil tracking
  const animatePupils = useCallback(() => {
    const lerp = 0.14;
    currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * lerp;
    currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * lerp;
    setPupilOffset({ x: currentOffset.current.x, y: currentOffset.current.y });
    frameRef.current = requestAnimationFrame(animatePupils);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animatePupils);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animatePupils]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const clampedDistance = Math.min(distance / 130, 1);
      const angle = Math.atan2(dy, dx);
      const maxOffset = 3.5;
      targetOffset.current = {
        x: Math.cos(angle) * maxOffset * clampedDistance,
        y: Math.sin(angle) * maxOffset * clampedDistance,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    setPhase("celebrate");
    window.setTimeout(() => {
      setIsClicked(false);
      setPhase("rest");
    }, 1200);
    onClick?.();
  };

  // Mouth expression changes with phase
  const mouthPath = isCelebrating || isClicked
    ? "M 28 44 Q 40 60 52 44" // big open smile
    : isDancing || isPrince
    ? "M 28 42 Q 40 56 52 42" // wide smile
    : isWaving
    ? "M 30 42 Q 40 52 50 42" // friendly smile
    : "M 30 42 Q 40 50 50 42"; // resting smile

  return (
    <div className="relative overflow-visible" style={{ width: stageWidth, height: stageHeight }}>
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("absolute left-0 bottom-0 cursor-pointer select-none focus:outline-none")}
        aria-label="Pergunte ao Verdinho — Assistente IA"
        title="Pergunte ao Verdinho 🐸"
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.05 }}
        animate={
          isJumping && !isCompact
            ? {
                x: [0, effectiveJumpDistance, effectiveJumpDistance * 0.3, 0],
                y: [0, -size * 0.4, -size * 0.15, 0],
              }
            : isDancing
            ? { rotate: [0, -8, 8, -8, 0] }
            : isCelebrating
            ? { y: [0, -size * 0.3, 0], scale: [1, 1.1, 1] }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={
          isJumping && !isCompact
            ? { duration: 1.65, times: [0, 0.45, 0.72, 1], ease: "easeInOut" }
            : isDancing
            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            : isCelebrating
            ? { duration: 0.8, repeat: 2, ease: "easeOut" }
            : { duration: 0.45, ease: "easeOut" }
        }
      >
        <svg
          ref={svgRef}
          viewBox="0 0 100 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size, height: size * 1.4 }}
        >
          <defs>
            <radialGradient id="frogBody2" cx="0.4" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#66BB6A" />
              <stop offset="100%" stopColor="#2E7D32" />
            </radialGradient>
            <radialGradient id="frogBelly2" cx="0.5" cy="0.35" r="0.6">
              <stop offset="0%" stopColor="#A5D6A7" />
              <stop offset="100%" stopColor="#81C784" />
            </radialGradient>
            <radialGradient id="eyeIris" cx="0.4" cy="0.3" r="0.6">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFA000" />
            </radialGradient>
            <radialGradient id="crownGold" cx="0.5" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#FFE44D" />
              <stop offset="100%" stopColor="#FFD700" />
            </radialGradient>
            <radialGradient id="scepterOrb" cx="0.35" cy="0.3" r="0.6">
              <stop offset="0%" stopColor="#FF6659" />
              <stop offset="100%" stopColor="#E53935" />
            </radialGradient>
          </defs>

          {/* === ROYAL MANTLE (behind body) === */}
          <motion.g
            animate={isDancing ? { rotate: [0, -3, 3, 0] } : { rotate: 0 }}
            transition={{ duration: 1.5, repeat: isDancing ? Infinity : 0 }}
            style={{ transformOrigin: "50px 55px" }}
          >
            <path
              d="M 22 52 C 18 55, 12 80, 18 100 L 28 95 L 50 100 L 72 95 L 82 100 C 88 80, 82 55, 78 52 L 50 48 Z"
              fill="#9C27B0"
              opacity="0.9"
            />
            <path
              d="M 22 52 C 18 55, 12 80, 18 100 L 28 95 L 50 100 L 72 95 L 82 100 C 88 80, 82 55, 78 52 L 50 48 Z"
              stroke="#FFD700"
              strokeWidth="1.2"
              fill="none"
            />
            {/* Gold stripes on mantle */}
            <line x1="35" y1="55" x2="33" y2="90" stroke="#FFD700" strokeWidth="0.6" opacity="0.5" />
            <line x1="50" y1="50" x2="50" y2="95" stroke="#FFD700" strokeWidth="0.6" opacity="0.5" />
            <line x1="65" y1="55" x2="67" y2="90" stroke="#FFD700" strokeWidth="0.6" opacity="0.5" />
            {/* Gold clasp */}
            <circle cx="50" cy="52" r="3" fill="#FFD700" />
            <circle cx="50" cy="52" r="1.5" fill="#E53935" />
          </motion.g>

          {/* === BODY === */}
          <ellipse cx="50" cy="72" rx="18" ry="24" fill="url(#frogBody2)" />
          {/* Belly */}
          <ellipse cx="50" cy="74" rx="12" ry="18" fill="url(#frogBelly2)" opacity="0.92" />
          {/* Skin spots */}
          <circle cx="34" cy="62" r="2.2" fill="#2E7D32" opacity="0.45" />
          <circle cx="66" cy="65" r="2" fill="#2E7D32" opacity="0.45" />
          <circle cx="36" cy="82" r="1.8" fill="#2E7D32" opacity="0.4" />
          <circle cx="64" cy="84" r="1.6" fill="#2E7D32" opacity="0.4" />
          <circle cx="42" cy="56" r="1.5" fill="#2E7D32" opacity="0.35" />
          <circle cx="58" cy="57" r="1.5" fill="#2E7D32" opacity="0.35" />
          <circle cx="50" cy="88" r="1.3" fill="#2E7D32" opacity="0.3" />
          <circle cx="40" cy="76" r="1.2" fill="#2E7D32" opacity="0.25" />

          {/* === HEAD === */}
          <ellipse cx="50" cy="35" rx="22" ry="18" fill="url(#frogBody2)" />
          {/* Head spots */}
          <circle cx="35" cy="30" r="2" fill="#2E7D32" opacity="0.5" />
          <circle cx="65" cy="30" r="2" fill="#2E7D32" opacity="0.5" />
          <circle cx="42" cy="45" r="1.5" fill="#2E7D32" opacity="0.35" />
          <circle cx="58" cy="44" r="1.3" fill="#2E7D32" opacity="0.3" />
          <circle cx="50" cy="28" r="1.8" fill="#2E7D32" opacity="0.3" />

          {/* === EYES (large, prominent) === */}
          {/* Eye sockets */}
          <circle cx="37" cy="24" r="11" fill="#4CAF50" />
          <circle cx="63" cy="24" r="11" fill="#4CAF50" />
          {/* Whites */}
          <circle cx="37" cy="23" r="9" fill="#FFFFFF" />
          <circle cx="63" cy="23" r="9" fill="#FFFFFF" />
          {/* Iris - gold */}
          <circle cx="37" cy="23" r="6" fill="url(#eyeIris)" />
          <circle cx="63" cy="23" r="6" fill="url(#eyeIris)" />

          {!isBlinking ? (
            <>
              {/* Pupils - track mouse */}
              <circle cx={37 + pupilOffset.x} cy={23 + pupilOffset.y} r={3.5} fill="#000000" />
              <circle cx={63 + pupilOffset.x} cy={23 + pupilOffset.y} r={3.5} fill="#000000" />
              {/* Eye shine */}
              <circle cx={35 + pupilOffset.x * 0.5} cy={20.5 + pupilOffset.y * 0.5} r={1.8} fill="#FFFFFF" opacity="0.9" />
              <circle cx={61 + pupilOffset.x * 0.5} cy={20.5 + pupilOffset.y * 0.5} r={1.8} fill="#FFFFFF" opacity="0.9" />
              <circle cx={38.5 + pupilOffset.x * 0.3} cy={25 + pupilOffset.y * 0.3} r={0.8} fill="#FFFFFF" opacity="0.5" />
              <circle cx={64.5 + pupilOffset.x * 0.3} cy={25 + pupilOffset.y * 0.3} r={0.8} fill="#FFFFFF" opacity="0.5" />
            </>
          ) : (
            <>
              {/* Blinking */}
              <ellipse cx="37" cy="23" rx="9" ry="2" fill="#4CAF50" />
              <ellipse cx="63" cy="23" rx="9" ry="2" fill="#4CAF50" />
            </>
          )}

          {/* === MOUTH (red with expression) === */}
          <motion.path
            d={mouthPath}
            stroke="#C62828"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            transition={{ duration: 0.25 }}
          />

          {/* Tongue + open mouth for excited states */}
          <AnimatePresence>
            {(isExcited || isClicked) && (
              <motion.g
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ellipse cx="50" cy="50" rx="8" ry="5" fill="#E53935" />
                {/* Tongue */}
                <motion.ellipse
                  cx="50" cy="54" rx="4" ry="3"
                  fill="#EC407A"
                  animate={{ y: [0, 1.5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                {/* Teeth */}
                <rect x="43" y="45" width="3" height="3" rx="1" fill="#FFFFFF" />
                <rect x="54" y="45" width="3" height="3" rx="1" fill="#FFFFFF" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* === CROWN (7 spikes with spheres) === */}
          <motion.g
            animate={{ y: [0, -2, 0], rotate: isExcited ? [0, 3, -3, 0] : 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon
              points="25,16 28,3 32,12 36,-1 40,10 44,-2 48,8 52,0 56,10 60,-1 64,8 68,3 71,16"
              fill="url(#crownGold)"
              stroke="#FFC700"
              strokeWidth="0.8"
            />
            {/* Crown spheres on each peak */}
            <circle cx="28" cy="4" r="2" fill="#FFE44D" />
            <circle cx="36" cy="0" r="2" fill="#FFE44D" />
            <circle cx="44" cy="-1" r="2.5" fill="#FFE44D" />
            <circle cx="52" cy="1" r="2" fill="#FFE44D" />
            <circle cx="60" cy="0" r="2" fill="#FFE44D" />
            <circle cx="68" cy="4" r="2" fill="#FFE44D" />
            {/* Crown jewels */}
            <circle cx="44" cy="8" r="2" fill="#E53935" />
            <circle cx="52" cy="7" r="1.5" fill="#2196F3" />
            <circle cx="36" cy="9" r="1.5" fill="#9C27B0" />
            <circle cx="60" cy="8" r="1.5" fill="#4CAF50" />
            {/* Glow */}
            <motion.circle
              cx="48" cy="5" r="12"
              fill="#FFD700"
              animate={{ opacity: [0.03, 0.12, 0.03], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          </motion.g>

          {/* === LEFT ARM === */}
          <motion.g
            animate={
              isDancing ? { rotate: [0, -35, 20, -35, 0] }
              : isPrince ? { rotate: [0, -15, 10, -15, 0] }
              : isWaving ? { rotate: [0, -25, 15, -25, 0] }
              : isCelebrating ? { rotate: [0, -45, -40, -45, 0] }
              : isJumping ? { rotate: [0, -30, 20, 0] }
              : { rotate: 0 }
            }
            transition={{
              duration: isDancing ? 0.8 : isPrince ? 1.5 : isWaving ? 0.7 : 0.55,
              repeat: isExcited || isWaving || isJumping ? Infinity : 0,
            }}
            style={{ transformOrigin: "32px 58px" }}
          >
            <ellipse cx="22" cy="56" rx="7" ry="3.5" fill="#66BB6A" transform="rotate(-30 22 56)" />
            <ellipse cx="13" cy="50" rx="6" ry="3" fill="#66BB6A" transform="rotate(-50 13 50)" />
            {/* Hand with 4 fingers */}
            <circle cx="8" cy="44" r="3" fill="#81C784" />
            <circle cx="4" cy="41" r="1.8" fill="#81C784" />
            <circle cx="6" cy="39" r="1.8" fill="#81C784" />
            <circle cx="9" cy="39" r="1.8" fill="#81C784" />
            <circle cx="11" cy="41" r="1.5" fill="#81C784" />
          </motion.g>

          {/* === RIGHT ARM + SCEPTER === */}
          <motion.g
            animate={
              isDancing ? { rotate: [0, 35, -20, 35, 0] }
              : isPrince ? { rotate: [0, 15, -10, 15, 0] }
              : isWaving ? { rotate: [0, 25, -15, 25, 0] }
              : isCelebrating ? { rotate: [0, 45, 40, 45, 0] }
              : isJumping ? { rotate: [0, 30, -20, 0] }
              : { rotate: 0 }
            }
            transition={{
              duration: isDancing ? 0.8 : isPrince ? 1.5 : isWaving ? 0.7 : 0.55,
              repeat: isExcited || isWaving || isJumping ? Infinity : 0,
            }}
            style={{ transformOrigin: "68px 58px" }}
          >
            <ellipse cx="78" cy="56" rx="7" ry="3.5" fill="#66BB6A" transform="rotate(30 78 56)" />
            <ellipse cx="87" cy="50" rx="6" ry="3" fill="#66BB6A" transform="rotate(50 87 50)" />
            {/* Hand holding scepter */}
            <circle cx="92" cy="44" r="3" fill="#81C784" />

            {/* SCEPTER */}
            <motion.g
              animate={isPrince ? { rotate: [0, 8, -8, 0] } : { rotate: 0 }}
              transition={{ duration: 1.2, repeat: isPrince ? Infinity : 0 }}
              style={{ transformOrigin: "92px 44px" }}
            >
              <line x1="92" y1="10" x2="92" y2="48" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="92" cy="8" r="5" fill="url(#scepterOrb)" />
              <circle cx="90" cy="6" r="1.5" fill="#FFFFFF" opacity="0.5" />
            </motion.g>
          </motion.g>

          {/* === LEFT LEG === */}
          <motion.g
            animate={
              isJumping ? { y: [0, -6, 0], rotate: [0, -15, 0] }
              : isDancing ? { rotate: [0, -10, 10, 0], y: [0, -3, 0] }
              : isPrince ? { rotate: [0, -5, 5, 0] }
              : { y: 0, rotate: 0 }
            }
            transition={{ duration: 0.5, repeat: isJumping || isExcited ? Infinity : 0 }}
            style={{ transformOrigin: "40px 92px" }}
          >
            <ellipse cx="36" cy="96" rx="7" ry="10" fill="#66BB6A" transform="rotate(10 36 96)" />
            <ellipse cx="30" cy="112" rx="5" ry="10" fill="#66BB6A" transform="rotate(-10 30 112)" />
            {/* Foot with webbing */}
            <ellipse cx="24" cy="124" rx="10" ry="4" fill="#66BB6A" />
            {/* 5 toes with webbing */}
            <circle cx="15" cy="123" r="2.2" fill="#81C784" />
            <circle cx="19" cy="121" r="1.8" fill="#81C784" />
            <circle cx="24" cy="120" r="1.8" fill="#81C784" />
            <circle cx="29" cy="121" r="1.8" fill="#81C784" />
            <circle cx="33" cy="123" r="2.2" fill="#81C784" />
            {/* Webbing between toes */}
            <path d="M 17 122 L 21 120 L 19 123 Z" fill="#81C784" opacity="0.5" />
            <path d="M 22 120 L 26 119 L 24 122 Z" fill="#81C784" opacity="0.5" />
            <path d="M 27 120 L 31 120 L 29 123 Z" fill="#81C784" opacity="0.5" />
          </motion.g>

          {/* === RIGHT LEG === */}
          <motion.g
            animate={
              isJumping ? { y: [0, -6, 0], rotate: [0, 15, 0] }
              : isDancing ? { rotate: [0, 10, -10, 0], y: [0, -3, 0] }
              : isPrince ? { rotate: [0, 8, -3, 0], y: [0, -3, 0] }
              : { y: 0, rotate: 0 }
            }
            transition={{ duration: 0.5, repeat: isJumping || isExcited ? Infinity : 0, delay: isJumping ? 0.15 : 0 }}
            style={{ transformOrigin: "60px 92px" }}
          >
            <ellipse cx="64" cy="96" rx="7" ry="10" fill="#66BB6A" transform="rotate(-10 64 96)" />
            <ellipse cx="70" cy="112" rx="5" ry="10" fill="#66BB6A" transform="rotate(10 70 112)" />
            {/* Foot with webbing */}
            <ellipse cx="76" cy="124" rx="10" ry="4" fill="#66BB6A" />
            <circle cx="67" cy="123" r="2.2" fill="#81C784" />
            <circle cx="71" cy="121" r="1.8" fill="#81C784" />
            <circle cx="76" cy="120" r="1.8" fill="#81C784" />
            <circle cx="81" cy="121" r="1.8" fill="#81C784" />
            <circle cx="85" cy="123" r="2.2" fill="#81C784" />
            <path d="M 69 122 L 73 120 L 71 123 Z" fill="#81C784" opacity="0.5" />
            <path d="M 74 120 L 78 119 L 76 122 Z" fill="#81C784" opacity="0.5" />
            <path d="M 79 120 L 83 120 L 81 123 Z" fill="#81C784" opacity="0.5" />
          </motion.g>
        </svg>

        {/* Celebration effects */}
        <AnimatePresence>
          {(isCelebrating || isJumping) && !isCompact && (
            <>
              <motion.span
                className="absolute -top-2 left-1/4 text-[10px] pointer-events-none"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <motion.span
                className="absolute -top-1 right-1/4 text-[10px] pointer-events-none"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, repeat: Infinity, delay: 0.3 }}
              >
                🌿
              </motion.span>
              <motion.span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, repeat: Infinity }}
              >
                💚
              </motion.span>
            </>
          )}
        </AnimatePresence>

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.24), transparent 72%)" }}
          animate={{ opacity: isHovered ? 0.82 : [0.1, 0.25, 0.1] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
});

FrogMascot.displayName = "FrogMascot";
