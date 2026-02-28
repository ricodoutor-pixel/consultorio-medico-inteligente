import { useCallback, useEffect, useRef, useState, memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  jumpDistance?: number;
}

type FrogPhase = "rest" | "jump" | "prince" | "wave";

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

  // Phase cycle
  useEffect(() => {
    if (reduceMotion) return;

    if (isCompact) {
      let idx = 0;
      const compactPhases: FrogPhase[] = ["rest", "prince", "rest", "wave"];
      const interval = setInterval(() => {
        idx = (idx + 1) % compactPhases.length;
        setPhase(compactPhases[idx]);
      }, 3000);
      return () => clearInterval(interval);
    }

    let timeout: number;
    const cycle = () => {
      setPhase("prince");
      timeout = window.setTimeout(() => {
        setPhase("jump");
        timeout = window.setTimeout(() => {
          setPhase("rest");
          timeout = window.setTimeout(cycle, 3000);
        }, 1650);
      }, 3000);
    };
    timeout = window.setTimeout(cycle, 2000);
    return () => clearTimeout(timeout);
  }, [isCompact, reduceMotion]);

  // Blinking
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
      const maxOffset = 2.8;
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

  const mouthPath = isPrince || isJumping || isClicked
    ? "M 28 42 Q 40 56 52 42"
    : "M 30 42 Q 40 50 50 42";

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
                y: [0, -size * 0.4, -size * 0.15, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={
          isJumping && !isCompact
            ? { duration: 1.65, times: [0, 0.45, 0.72, 1], ease: "easeInOut" }
            : { duration: 0.45, ease: "easeOut" }
        }
      >
        <svg
          ref={svgRef}
          viewBox="0 0 80 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size, height: size * 1.5 }}
        >
          <defs>
            <radialGradient id="frogBody" cx="0.4" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="hsl(120 60% 55%)" />
              <stop offset="100%" stopColor="hsl(120 55% 38%)" />
            </radialGradient>
            <radialGradient id="frogBelly" cx="0.5" cy="0.35" r="0.6">
              <stop offset="0%" stopColor="hsl(55 90% 88%)" />
              <stop offset="100%" stopColor="hsl(52 70% 75%)" />
            </radialGradient>
            <radialGradient id="eyeGlow" cx="0.4" cy="0.3" r="0.6">
              <stop offset="0%" stopColor="hsl(42 95% 65%)" />
              <stop offset="100%" stopColor="hsl(30 90% 50%)" />
            </radialGradient>
          </defs>

          {/* === CROWN === */}
          <motion.g
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon
              points="27,14 30,4 34,10 37,0 40,10 43,2 47,8 50,4 53,14"
              fill="hsl(45 96% 52%)"
              stroke="hsl(42 88% 40%)"
              strokeWidth="0.8"
            />
            <circle cx="37" cy="7" r="1.5" fill="hsl(0 70% 50%)" />
            <circle cx="43" cy="6" r="1" fill="hsl(200 70% 50%)" />
            <circle cx="31" cy="8" r="1" fill="hsl(280 60% 55%)" />
            <motion.circle
              cx="37" cy="3" r="8"
              fill="hsl(48 100% 70%)"
              animate={{ opacity: [0.04, 0.14, 0.04], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          </motion.g>

          {/* === HEAD === */}
          <ellipse cx="40" cy="28" rx="18" ry="16" fill="url(#frogBody)" />
          <circle cx="28" cy="24" r="1.8" fill="hsl(130 50% 30%)" opacity="0.5" />
          <circle cx="52" cy="24" r="1.8" fill="hsl(130 50% 30%)" opacity="0.5" />
          <circle cx="35" cy="38" r="1.3" fill="hsl(130 50% 30%)" opacity="0.35" />
          <circle cx="46" cy="37" r="1.2" fill="hsl(130 50% 30%)" opacity="0.3" />

          {/* === EYES === */}
          <circle cx="31" cy="18" r="9" fill="hsl(120 55% 45%)" />
          <circle cx="31" cy="17" r="7" fill="url(#eyeGlow)" />
          <circle cx="49" cy="18" r="9" fill="hsl(120 55% 45%)" />
          <circle cx="49" cy="17" r="7" fill="url(#eyeGlow)" />

          {!isBlinking && (
            <>
              <circle cx={31 + pupilOffset.x} cy={17 + pupilOffset.y} r={3.5} fill="hsl(0 0% 10%)" />
              <circle cx={49 + pupilOffset.x} cy={17 + pupilOffset.y} r={3.5} fill="hsl(0 0% 10%)" />
              <circle cx={29.5 + pupilOffset.x * 0.7} cy={15.5 + pupilOffset.y * 0.7} r={1.3} fill="hsl(0 0% 100%)" opacity="0.9" />
              <circle cx={47.5 + pupilOffset.x * 0.7} cy={15.5 + pupilOffset.y * 0.7} r={1.3} fill="hsl(0 0% 100%)" opacity="0.9" />
            </>
          )}

          {isBlinking && (
            <>
              <ellipse cx="31" cy="17" rx="7" ry="2" fill="hsl(120 55% 45%)" />
              <ellipse cx="49" cy="17" rx="7" ry="2" fill="hsl(120 55% 45%)" />
            </>
          )}

          {/* === MOUTH === */}
          <motion.path
            d={mouthPath}
            stroke="hsl(0 0% 15%)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            transition={{ duration: 0.25 }}
          />

          <AnimatePresence>
            {(isPrince || isJumping || isClicked) && (
              <motion.ellipse
                cx="40" cy="46" rx="6" ry="4"
                fill="hsl(0 65% 45%)"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {/* === BODY === */}
          <ellipse cx="40" cy="62" rx="15" ry="20" fill="url(#frogBody)" />
          <ellipse cx="40" cy="64" rx="10" ry="15" fill="url(#frogBelly)" opacity="0.92" />

          <circle cx="28" cy="55" r="2" fill="hsl(130 50% 30%)" opacity="0.4" />
          <circle cx="52" cy="58" r="1.8" fill="hsl(130 50% 30%)" opacity="0.4" />
          <circle cx="30" cy="70" r="1.5" fill="hsl(130 50% 30%)" opacity="0.35" />
          <circle cx="50" cy="72" r="1.6" fill="hsl(130 50% 30%)" opacity="0.35" />

          {/* === LEFT ARM === */}
          <motion.g
            animate={
              isPrince ? { rotate: [0, -15, 10, -15, 0] }
              : isWaving ? { rotate: [0, -25, 15, -25, 0] }
              : isJumping ? { rotate: [0, -30, 20, 0] }
              : { rotate: 0 }
            }
            transition={{
              duration: isPrince ? 1.5 : isWaving ? 0.7 : 0.55,
              repeat: isPrince || isWaving || isJumping ? Infinity : 0,
            }}
            style={{ transformOrigin: "26px 52px" }}
          >
            <ellipse cx="18" cy="50" rx="6" ry="3" fill="hsl(120 55% 42%)" transform="rotate(-30 18 50)" />
            <ellipse cx="10" cy="45" rx="5" ry="2.5" fill="hsl(120 55% 42%)" transform="rotate(-50 10 45)" />
            <circle cx="6" cy="40" r="2.5" fill="hsl(120 58% 48%)" />
            <circle cx="3" cy="37" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="5" cy="36" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="8" cy="37" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="9" cy="39" r="1.3" fill="hsl(120 58% 48%)" />
          </motion.g>

          {/* === RIGHT ARM === */}
          <motion.g
            animate={
              isPrince ? { rotate: [0, 15, -10, 15, 0] }
              : isWaving ? { rotate: [0, 25, -15, 25, 0] }
              : isJumping ? { rotate: [0, 30, -20, 0] }
              : { rotate: 0 }
            }
            transition={{
              duration: isPrince ? 1.5 : isWaving ? 0.7 : 0.55,
              repeat: isPrince || isWaving || isJumping ? Infinity : 0,
            }}
            style={{ transformOrigin: "54px 52px" }}
          >
            <ellipse cx="62" cy="50" rx="6" ry="3" fill="hsl(120 55% 42%)" transform="rotate(30 62 50)" />
            <ellipse cx="70" cy="45" rx="5" ry="2.5" fill="hsl(120 55% 42%)" transform="rotate(50 70 45)" />
            <circle cx="74" cy="40" r="2.5" fill="hsl(120 58% 48%)" />
            <circle cx="77" cy="37" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="75" cy="36" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="72" cy="37" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="71" cy="39" r="1.3" fill="hsl(120 58% 48%)" />
          </motion.g>

          {/* === SCEPTER === */}
          <motion.g
            animate={isPrince ? { rotate: [0, 5, -5, 0] } : { rotate: 0 }}
            transition={{ duration: 1.2, repeat: isPrince ? Infinity : 0 }}
            style={{ transformOrigin: "72px 55px" }}
          >
            <line x1="72" y1="30" x2="72" y2="60" stroke="hsl(45 94% 52%)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="72" cy="28" r="3.2" fill="hsl(0 70% 50%)" />
            <circle cx="72" cy="28" r="1.8" fill="hsl(0 82% 70%)" opacity="0.6" />
          </motion.g>

          {/* === LEFT LEG === */}
          <motion.g
            animate={
              isJumping ? { y: [0, -6, 0], rotate: [0, -15, 0] }
              : isPrince ? { rotate: [0, -5, 5, 0] }
              : { y: 0, rotate: 0 }
            }
            transition={{ duration: 0.5, repeat: isJumping || isPrince ? Infinity : 0 }}
            style={{ transformOrigin: "32px 78px" }}
          >
            <ellipse cx="30" cy="82" rx="6" ry="8" fill="hsl(120 55% 42%)" transform="rotate(10 30 82)" />
            <ellipse cx="26" cy="96" rx="4" ry="8" fill="hsl(120 55% 42%)" transform="rotate(-10 26 96)" />
            <ellipse cx="22" cy="106" rx="8" ry="3" fill="hsl(120 55% 42%)" />
            <circle cx="15" cy="105" r="1.8" fill="hsl(120 58% 48%)" />
            <circle cx="18" cy="103" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="26" cy="103" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="29" cy="105" r="1.8" fill="hsl(120 58% 48%)" />
          </motion.g>

          {/* === RIGHT LEG === */}
          <motion.g
            animate={
              isJumping ? { y: [0, -6, 0], rotate: [0, 15, 0] }
              : isPrince ? { rotate: [0, 8, -3, 0], y: [0, -3, 0] }
              : { y: 0, rotate: 0 }
            }
            transition={{ duration: 0.5, repeat: isJumping || isPrince ? Infinity : 0, delay: isJumping ? 0.15 : 0 }}
            style={{ transformOrigin: "48px 78px" }}
          >
            <ellipse cx="50" cy="82" rx="6" ry="8" fill="hsl(120 55% 42%)" transform="rotate(-10 50 82)" />
            <ellipse cx="54" cy="96" rx="4" ry="8" fill="hsl(120 55% 42%)" transform="rotate(10 54 96)" />
            <ellipse cx="58" cy="106" rx="8" ry="3" fill="hsl(120 55% 42%)" />
            <circle cx="51" cy="105" r="1.8" fill="hsl(120 58% 48%)" />
            <circle cx="54" cy="103" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="62" cy="103" r="1.5" fill="hsl(120 58% 48%)" />
            <circle cx="65" cy="105" r="1.8" fill="hsl(120 58% 48%)" />
          </motion.g>
        </svg>

        {/* Jump heart */}
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
