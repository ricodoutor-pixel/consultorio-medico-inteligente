import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
}

type Personality = "happy" | "crowned" | "dancing" | "waving" | "jumping";

const PERSONALITIES: Personality[] = ["happy", "crowned", "dancing", "waving", "jumping"];

export const FrogMascot = ({ onClick, size = 60 }: FrogMascotProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [personality, setPersonality] = useState<Personality>("happy");
  const [bounceX, setBounceX] = useState(0);
  const animFrame = useRef<number>(0);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  // Cycle personality every 3 seconds
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % PERSONALITIES.length;
      setPersonality(PERSONALITIES[idx]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Side-to-side hopping movement
  useEffect(() => {
    let dir = 1;
    const interval = setInterval(() => {
      dir *= -1;
      setBounceX(dir * 6);
      setTimeout(() => setBounceX(0), 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Smooth mouse tracking with lerp
  const animate = useCallback(() => {
    const lerp = 0.12;
    currentOffset.current.x += (targetOffset.current.x - currentOffset.current.x) * lerp;
    currentOffset.current.y += (targetOffset.current.y - currentOffset.current.y) * lerp;
    setPupilOffset({ x: currentOffset.current.x, y: currentOffset.current.y });
    animFrame.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [animate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = 3.5;
      const factor = Math.min(dist / 120, 1);
      const angle = Math.atan2(dy, dx);
      targetOffset.current = {
        x: Math.cos(angle) * maxMove * factor,
        y: Math.sin(angle) * maxMove * factor,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Random blink
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    };
    const interval = setInterval(() => {
      if (Math.random() < 0.35) blink();
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1800);
    onClick?.();
  };

  const h = size * 1.15;
  const showCrown = personality === "crowned" || isClicked;
  const isDancing = personality === "dancing";
  const isWaving = personality === "waving";
  const isJumping = personality === "jumping";

  // Personality-based body animation
  const bodyAnimation = () => {
    if (isDancing) return { rotate: [0, -8, 8, -8, 8, 0], transition: { duration: 0.8, repeat: Infinity } };
    if (isJumping) return { y: [0, -8, 0, -5, 0], transition: { duration: 0.6, repeat: Infinity } };
    if (isClicked) return { y: [0, -4, 0] };
    return { y: 0 };
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-pointer select-none focus:outline-none flex flex-col items-center"
      whileTap={{ scale: 0.92 }}
      animate={{ x: bounceX, ...bodyAnimation() }}
      transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
      aria-label="Pergunte ao Verdinho — Assistente IA"
      title="Pergunte ao Verdinho 🐸"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 60 66"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: h }}
      >
        <defs>
          <radialGradient id="fgHead" cx="0.35" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="hsl(130 70% 55%)" />
            <stop offset="100%" stopColor="hsl(140 65% 38%)" />
          </radialGradient>
          <radialGradient id="fgBelly" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="hsl(80 60% 82%)" />
            <stop offset="100%" stopColor="hsl(120 40% 65%)" />
          </radialGradient>
          <radialGradient id="fgEyeShine" cx="0.3" cy="0.25" r="0.5">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="hsl(0 0% 96%)" />
          </radialGradient>
        </defs>

        {/* Golden Crown */}
        <AnimatePresence>
          {showCrown && (
            <motion.g
              initial={{ opacity: 0, y: 6, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.5 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <polygon points="18,8 22,0 26,6 30,-2 34,6 38,0 42,8" fill="hsl(45 95% 55%)" stroke="hsl(40 90% 45%)" strokeWidth="0.5" />
              <circle cx="22" cy="1.5" r="1.5" fill="hsl(0 70% 50%)" />
              <circle cx="30" cy="-0.5" r="1.5" fill="hsl(220 70% 55%)" />
              <circle cx="38" cy="1.5" r="1.5" fill="hsl(130 70% 50%)" />
              {/* Crown sparkles */}
              <motion.circle cx="15" cy="2" r="1" fill="hsl(45 100% 70%)"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.circle cx="45" cy="2" r="1" fill="hsl(45 100% 70%)"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Body / belly area */}
        <ellipse cx="30" cy="48" rx="14" ry="11" fill="url(#fgHead)" />
        <ellipse cx="30" cy="50" rx="10" ry="8" fill="url(#fgBelly)" opacity="0.7" />

        {/* Left arm */}
        <motion.ellipse
          cx="15" cy="44" rx="6" ry="3"
          fill="hsl(135 60% 40%)"
          animate={{
            rotate: isWaving ? [0, -30, 20, -30, 20, 0] :
              isDancing ? [0, -20, 20, -20, 0] :
              isHovered ? -15 : isClicked ? [0, -25, 25, 0] : 0,
          }}
          style={{ transformOrigin: "20px 44px" }}
          transition={{ duration: isWaving ? 0.8 : 0.4, repeat: isWaving ? Infinity : 0 }}
        />
        {/* Right arm */}
        <motion.ellipse
          cx="45" cy="44" rx="6" ry="3"
          fill="hsl(135 60% 40%)"
          animate={{
            rotate: isWaving ? [0, 30, -20, 30, -20, 0] :
              isDancing ? [0, 20, -20, 20, 0] :
              isHovered ? 15 : isClicked ? [0, 25, -25, 0] : 0,
          }}
          style={{ transformOrigin: "40px 44px" }}
          transition={{ duration: isWaving ? 0.8 : 0.4, repeat: isWaving ? Infinity : 0 }}
        />

        {/* Left foot */}
        <motion.ellipse cx="20" cy="58" rx="7" ry="3" fill="hsl(135 55% 38%)"
          animate={isDancing ? { rotate: [0, -15, 15, 0], y: [0, -2, 0] } : {}}
          transition={{ duration: 0.5, repeat: isDancing ? Infinity : 0 }}
        />
        {/* Right foot */}
        <motion.ellipse cx="40" cy="58" rx="7" ry="3" fill="hsl(135 55% 38%)"
          animate={isDancing ? { rotate: [0, 15, -15, 0], y: [0, -2, 0] } : {}}
          transition={{ duration: 0.5, repeat: isDancing ? Infinity : 0, delay: 0.25 }}
        />

        {/* Head */}
        <ellipse cx="30" cy="26" rx="20" ry="16" fill="url(#fgHead)" />

        {/* Spots */}
        <circle cx="14" cy="22" r="1.5" fill="hsl(140 50% 32%)" opacity="0.4" />
        <circle cx="46" cy="22" r="1.5" fill="hsl(140 50% 32%)" opacity="0.4" />

        {/* Cheeks blush */}
        <AnimatePresence>
          {(isHovered || isClicked || personality !== "happy") && (
            <>
              <motion.circle cx="13" cy="30" r="3.5" fill="hsl(350 70% 65%)"
                initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} />
              <motion.circle cx="47" cy="30" r="3.5" fill="hsl(350 70% 65%)"
                initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} />
            </>
          )}
        </AnimatePresence>

        {/* Eye bumps */}
        <circle cx="20" cy="16" r="9" fill="hsl(130 65% 48%)" />
        <circle cx="40" cy="16" r="9" fill="hsl(130 65% 48%)" />

        {/* Eye whites */}
        <circle cx="20" cy="15" r="6.5" fill="url(#fgEyeShine)" />
        <circle cx="40" cy="15" r="6.5" fill="url(#fgEyeShine)" />

        {/* Pupils - follow mouse */}
        {!isBlinking && (
          <>
            <circle cx={20 + pupilOffset.x} cy={15 + pupilOffset.y} r={3.8} fill="hsl(30 80% 20%)" />
            <circle cx={40 + pupilOffset.x} cy={15 + pupilOffset.y} r={3.8} fill="hsl(30 80% 20%)" />
            <circle cx={20 + pupilOffset.x} cy={15 + pupilOffset.y} r={2.5} fill="hsl(30 90% 35%)" />
            <circle cx={40 + pupilOffset.x} cy={15 + pupilOffset.y} r={2.5} fill="hsl(30 90% 35%)" />
            <circle cx={20 + pupilOffset.x * 0.8} cy={14.5 + pupilOffset.y * 0.8} r={1.5} fill="hsl(0 0% 5%)" />
            <circle cx={40 + pupilOffset.x * 0.8} cy={14.5 + pupilOffset.y * 0.8} r={1.5} fill="hsl(0 0% 5%)" />
          </>
        )}

        {/* Blink eyelids */}
        {isBlinking && (
          <>
            <ellipse cx="20" cy="15" rx="6.5" ry="2" fill="hsl(130 65% 44%)" />
            <ellipse cx="40" cy="15" rx="6.5" ry="2" fill="hsl(130 65% 44%)" />
          </>
        )}

        {/* Eye sparkles */}
        <circle cx="17" cy="12" r="2" fill="white" opacity="0.9" />
        <circle cx="37" cy="12" r="2" fill="white" opacity="0.9" />
        <circle cx="19" cy="14" r="0.8" fill="white" opacity="0.5" />
        <circle cx="39" cy="14" r="0.8" fill="white" opacity="0.5" />

        {/* Nostrils */}
        <circle cx="26" cy="25" r="1" fill="hsl(140 60% 28%)" opacity="0.5" />
        <circle cx="34" cy="25" r="1" fill="hsl(140 60% 28%)" opacity="0.5" />

        {/* Mouth */}
        <motion.path
          d="M 20 32 Q 30 40 40 32"
          stroke="hsl(140 70% 22%)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: isDancing || isClicked
              ? "M 17 30 Q 30 46 43 30"
              : isHovered || isWaving
              ? "M 18 31 Q 30 44 42 31"
              : "M 20 32 Q 30 40 40 32",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Open mouth for dancing/clicked */}
        <AnimatePresence>
          {(isClicked || isDancing) && (
            <motion.ellipse
              cx="30" cy="37" rx="5" ry="4"
              fill="hsl(350 55% 42%)"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
        {(isClicked || isDancing) && (
          <ellipse cx="30" cy="39" rx="3" ry="2" fill="hsl(340 60% 65%)" />
        )}

        {/* Bow tie for waving personality */}
        {isWaving && (
          <g>
            <polygon points="26,42 30,44 26,46" fill="hsl(0 70% 50%)" />
            <polygon points="34,42 30,44 34,46" fill="hsl(0 70% 50%)" />
            <circle cx="30" cy="44" r="1.5" fill="hsl(45 90% 55%)" />
          </g>
        )}
      </svg>

      {/* Floating emojis when personality changes */}
      <AnimatePresence>
        {isDancing && (
          <motion.span
            className="absolute -top-2 -right-1 text-xs pointer-events-none"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            🎶
          </motion.span>
        )}
        {showCrown && !isDancing && (
          <motion.span
            className="absolute -top-2 -left-1 text-xs pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            ✨
          </motion.span>
        )}
        {isJumping && (
          <motion.span
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            💚
          </motion.span>
        )}
      </AnimatePresence>

      {/* Sparkle trail when moving */}
      <AnimatePresence>
        {isHovered && (
          <>
            <motion.span
              className="absolute -top-3 left-0 text-[10px] pointer-events-none"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -12, x: [-4, 4, -4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              ✨
            </motion.span>
            <motion.span
              className="absolute -top-1 right-0 text-[10px] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0], y: -10 }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            >
              🌿
            </motion.span>
          </>
        )}
      </AnimatePresence>

      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(140 70% 45% / 0.2), transparent 70%)" }}
        animate={{ opacity: isHovered ? 0.8 : [0.15, 0.35, 0.15] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
    </motion.button>
  );
};
