import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  jumpDistance?: number;
}

type FrogPhase = "rest" | "jump" | "wave" | "thinking";

export const FrogMascot = ({ onClick, size = 60, jumpDistance = 90 }: FrogMascotProps) => {
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
  const stageHeight = isCompact ? size * 1.45 : size * 2.1;

  const isJumping = phase === "jump";
  const isWaving = phase === "wave";
  const isThinking = phase === "thinking";

  useEffect(() => {
    if (reduceMotion) return;

    if (isCompact) {
      let idx = 0;
      const compactPhases: FrogPhase[] = ["rest", "wave", "rest", "thinking"];
      const interval = setInterval(() => {
        idx = (idx + 1) % compactPhases.length;
        setPhase(compactPhases[idx]);
      }, 3000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      setPhase("jump");
      window.setTimeout(() => setPhase("rest"), 1650);
    }, 3000);

    return () => clearInterval(interval);
  }, [isCompact, reduceMotion]);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      window.setTimeout(() => setIsBlinking(false), 130);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.58) blink();
    }, 2700);

    return () => clearInterval(interval);
  }, []);

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
      const maxOffset = 3.2;

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
    setPhase("wave");
    window.setTimeout(() => {
      setIsClicked(false);
      setPhase("rest");
    }, 900);
    onClick?.();
  };

  const mouthPath = isJumping || isClicked
    ? "M 18 33 Q 30 46 42 33"
    : isThinking
    ? "M 24 34 Q 30 36 36 34"
    : "M 20 33 Q 30 40 40 33";

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
        animate={
          isJumping && !isCompact
            ? {
                x: [0, effectiveJumpDistance, effectiveJumpDistance * 0.3, 0],
                y: [0, -size * 0.3, -size * 0.12, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={
          isJumping && !isCompact
            ? { duration: 1.65, times: [0, 0.45, 0.72, 1], ease: "easeInOut" }
            : { duration: 0.45, ease: "easeOut" }
        }
      >
        <svg ref={svgRef} viewBox="0 0 64 76" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size * 1.2 }}>
          <defs>
            <radialGradient id="frogHead" cx="0.38" cy="0.25" r="0.75">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(135 66% 38%)" />
            </radialGradient>
            <radialGradient id="frogBelly" cx="0.5" cy="0.4" r="0.8">
              <stop offset="0%" stopColor="hsl(50 85% 94%)" />
              <stop offset="100%" stopColor="hsl(54 72% 86%)" />
            </radialGradient>
          </defs>

          <motion.g
            animate={{ y: [0, -1.5, 0], scale: [1, 1.02, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon
              points="18,10 22,1 27,7 32,-1 37,7 42,1 46,10"
              fill="hsl(45 96% 52%)"
              stroke="hsl(42 88% 40%)"
              strokeWidth="0.7"
            />
            <motion.circle
              cx="32"
              cy="4"
              r="12"
              fill="hsl(48 100% 70%)"
              animate={{ opacity: [0.06, 0.18, 0.06], scale: [0.9, 1.08, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          </motion.g>

          <ellipse cx="32" cy="48" rx="16" ry="10" fill="url(#frogHead)" />
          <ellipse cx="32" cy="49" rx="11" ry="7" fill="url(#frogBelly)" opacity="0.92" />

          <motion.g
            animate={isJumping ? { rotate: [0, -12, 10, 0] } : isThinking ? { rotate: [0, 6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.8, repeat: isJumping ? Infinity : 0 }}
            style={{ transformOrigin: "9px 57px" }}
          >
            <line x1="9" y1="32" x2="9" y2="67" stroke="hsl(45 94% 52%)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="30" r="3.8" fill="hsl(var(--destructive))" />
            <circle cx="9" cy="30" r="2.1" fill="hsl(0 82% 74%)" opacity="0.65" />
          </motion.g>

          <motion.ellipse
            cx="17"
            cy="46"
            rx="6"
            ry="3.2"
            fill="hsl(136 66% 35%)"
            animate={{ rotate: isJumping ? [0, -30, 20, 0] : isWaving ? [0, -22, 15, -22, 0] : 0 }}
            transition={{ duration: isWaving ? 0.7 : 0.55, repeat: isWaving || isJumping ? Infinity : 0 }}
            style={{ transformOrigin: "23px 46px" }}
          />
          <motion.ellipse
            cx="47"
            cy="46"
            rx="6"
            ry="3.2"
            fill="hsl(136 66% 35%)"
            animate={{ rotate: isJumping ? [0, 30, -20, 0] : isWaving ? [0, 26, -18, 26, 0] : isThinking ? [0, 16, 0] : 0 }}
            transition={{ duration: isWaving ? 0.7 : 0.55, repeat: isWaving || isJumping ? Infinity : 0 }}
            style={{ transformOrigin: "41px 46px" }}
          />

          <motion.ellipse
            cx="22"
            cy="67"
            rx="8"
            ry="3.4"
            fill="hsl(136 62% 34%)"
            animate={isJumping ? { y: [0, -4, 0], rotate: [0, -12, 0] } : { y: 0, rotate: 0 }}
            transition={{ duration: 0.45, repeat: isJumping ? Infinity : 0 }}
          />
          <motion.ellipse
            cx="42"
            cy="67"
            rx="8"
            ry="3.4"
            fill="hsl(136 62% 34%)"
            animate={isJumping ? { y: [0, -4, 0], rotate: [0, 12, 0] } : { y: 0, rotate: 0 }}
            transition={{ duration: 0.45, repeat: isJumping ? Infinity : 0, delay: 0.22 }}
          />

          <ellipse cx="32" cy="28" rx="21" ry="17" fill="url(#frogHead)" />

          <circle cx="18" cy="23" r="1.5" fill="hsl(136 58% 30%)" opacity="0.55" />
          <circle cx="46" cy="23" r="1.5" fill="hsl(136 58% 30%)" opacity="0.55" />
          <circle cx="24" cy="36" r="1.4" fill="hsl(136 58% 30%)" opacity="0.32" />
          <circle cx="40" cy="36" r="1.4" fill="hsl(136 58% 30%)" opacity="0.32" />

          <circle cx="22" cy="18" r="9.2" fill="hsl(132 64% 46%)" />
          <circle cx="42" cy="18" r="9.2" fill="hsl(132 64% 46%)" />
          <circle cx="22" cy="17" r="6.6" fill="hsl(var(--background))" />
          <circle cx="42" cy="17" r="6.6" fill="hsl(var(--background))" />

          {!isBlinking && !isThinking && (
            <>
              <circle cx={22 + pupilOffset.x} cy={17 + pupilOffset.y} r={3.8} fill="hsl(var(--foreground))" />
              <circle cx={42 + pupilOffset.x} cy={17 + pupilOffset.y} r={3.8} fill="hsl(var(--foreground))" />
              <circle cx={20.7 + pupilOffset.x * 0.85} cy={15.8 + pupilOffset.y * 0.85} r={1.1} fill="hsl(var(--background))" opacity="0.95" />
              <circle cx={40.7 + pupilOffset.x * 0.85} cy={15.8 + pupilOffset.y * 0.85} r={1.1} fill="hsl(var(--background))" opacity="0.95" />
            </>
          )}

          {isThinking && !isBlinking && (
            <>
              <line x1="16" y1="17" x2="28" y2="17" stroke="hsl(var(--foreground))" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="36" y1="17" x2="48" y2="17" stroke="hsl(var(--foreground))" strokeWidth="1.6" strokeLinecap="round" />
            </>
          )}

          {isBlinking && (
            <>
              <ellipse cx="22" cy="17" rx="6.6" ry="2" fill="hsl(132 64% 46%)" />
              <ellipse cx="42" cy="17" rx="6.6" ry="2" fill="hsl(132 64% 46%)" />
            </>
          )}

          <motion.path
            d={mouthPath}
            stroke="hsl(var(--foreground))"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            transition={{ duration: 0.25 }}
          />

          <AnimatePresence>
            {(isJumping || isClicked) && (
              <motion.ellipse
                cx="32"
                cy="38"
                rx="5.2"
                ry="3.8"
                fill="hsl(356 70% 52%)"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        </svg>

        <AnimatePresence>
          {isJumping && !isCompact && (
            <motion.span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, repeat: Infinity }}
            >
              💚
            </motion.span>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.24), transparent 72%)" }}
          animate={{ opacity: isHovered ? 0.82 : [0.18, 0.34, 0.18] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
};
