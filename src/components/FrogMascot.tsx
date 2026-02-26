import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
}

export const FrogMascot = ({ onClick, size = 60 }: FrogMascotProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const animFrame = useRef<number>(0);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

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

  const h = size * 1.1;

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-pointer select-none focus:outline-none flex flex-col items-center"
      whileTap={{ scale: 0.92 }}
      animate={{ y: isClicked ? [0, -4, 0] : 0 }}
      transition={{ duration: 0.4 }}
      aria-label="Pergunte ao Verdinho — Assistente IA"
      title="Pergunte ao Verdinho 🐸"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 60 60"
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
          <filter id="fgGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Body / belly area */}
        <ellipse cx="30" cy="44" rx="14" ry="11" fill="url(#fgHead)" />
        <ellipse cx="30" cy="46" rx="10" ry="8" fill="url(#fgBelly)" opacity="0.7" />

        {/* Left arm */}
        <motion.ellipse
          cx="15" cy="40" rx="6" ry="3"
          fill="hsl(135 60% 40%)"
          animate={{ rotate: isHovered ? -15 : isClicked ? [0, -25, 25, 0] : 0 }}
          style={{ transformOrigin: "20px 40px" }}
          transition={{ duration: 0.4 }}
        />
        {/* Right arm */}
        <motion.ellipse
          cx="45" cy="40" rx="6" ry="3"
          fill="hsl(135 60% 40%)"
          animate={{ rotate: isHovered ? 15 : isClicked ? [0, 25, -25, 0] : 0 }}
          style={{ transformOrigin: "40px 40px" }}
          transition={{ duration: 0.4 }}
        />

        {/* Left foot */}
        <ellipse cx="20" cy="54" rx="7" ry="3" fill="hsl(135 55% 38%)" />
        {/* Right foot */}
        <ellipse cx="40" cy="54" rx="7" ry="3" fill="hsl(135 55% 38%)" />

        {/* Head */}
        <ellipse cx="30" cy="24" rx="20" ry="16" fill="url(#fgHead)" />

        {/* Spots */}
        <circle cx="14" cy="20" r="1.5" fill="hsl(140 50% 32%)" opacity="0.4" />
        <circle cx="46" cy="20" r="1.5" fill="hsl(140 50% 32%)" opacity="0.4" />
        <circle cx="18" cy="30" r="1" fill="hsl(140 50% 32%)" opacity="0.3" />
        <circle cx="42" cy="30" r="1" fill="hsl(140 50% 32%)" opacity="0.3" />

        {/* Cheeks blush */}
        <AnimatePresence>
          {(isHovered || isClicked) && (
            <>
              <motion.circle cx="13" cy="28" r="3.5" fill="hsl(350 70% 65%)"
                initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} />
              <motion.circle cx="47" cy="28" r="3.5" fill="hsl(350 70% 65%)"
                initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} />
            </>
          )}
        </AnimatePresence>

        {/* Eye bumps */}
        <circle cx="20" cy="14" r="9" fill="hsl(130 65% 48%)" />
        <circle cx="40" cy="14" r="9" fill="hsl(130 65% 48%)" />

        {/* Eye whites */}
        <circle cx="20" cy="13" r="6.5" fill="url(#fgEyeShine)" />
        <circle cx="40" cy="13" r="6.5" fill="url(#fgEyeShine)" />

        {/* Pupils - follow mouse */}
        {!isBlinking && (
          <>
            <circle
              cx={20 + pupilOffset.x}
              cy={13 + pupilOffset.y}
              r={isClicked ? 3 : 3.8}
              fill="hsl(30 80% 20%)"
            />
            <circle
              cx={40 + pupilOffset.x}
              cy={13 + pupilOffset.y}
              r={isClicked ? 3 : 3.8}
              fill="hsl(30 80% 20%)"
            />
            {/* Inner iris color (amber/orange like reference) */}
            <circle
              cx={20 + pupilOffset.x}
              cy={13 + pupilOffset.y}
              r={isClicked ? 2 : 2.5}
              fill="hsl(30 90% 35%)"
            />
            <circle
              cx={40 + pupilOffset.x}
              cy={13 + pupilOffset.y}
              r={isClicked ? 2 : 2.5}
              fill="hsl(30 90% 35%)"
            />
            {/* Pupil center */}
            <circle
              cx={20 + pupilOffset.x * 0.8}
              cy={12.5 + pupilOffset.y * 0.8}
              r={1.5}
              fill="hsl(0 0% 5%)"
            />
            <circle
              cx={40 + pupilOffset.x * 0.8}
              cy={12.5 + pupilOffset.y * 0.8}
              r={1.5}
              fill="hsl(0 0% 5%)"
            />
          </>
        )}

        {/* Blink eyelids */}
        {isBlinking && (
          <>
            <ellipse cx="20" cy="13" rx="6.5" ry="2" fill="hsl(130 65% 44%)" />
            <ellipse cx="40" cy="13" rx="6.5" ry="2" fill="hsl(130 65% 44%)" />
          </>
        )}

        {/* Eye sparkles */}
        <circle cx="17" cy="10" r="2" fill="white" opacity="0.9" />
        <circle cx="37" cy="10" r="2" fill="white" opacity="0.9" />
        <circle cx="19" cy="12" r="0.8" fill="white" opacity="0.5" />
        <circle cx="39" cy="12" r="0.8" fill="white" opacity="0.5" />

        {/* Nostrils */}
        <circle cx="26" cy="23" r="1" fill="hsl(140 60% 28%)" opacity="0.5" />
        <circle cx="34" cy="23" r="1" fill="hsl(140 60% 28%)" opacity="0.5" />

        {/* Mouth - happy smile */}
        <motion.path
          d="M 19 30 Q 30 40 41 30"
          stroke="hsl(140 70% 22%)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: isClicked
              ? "M 17 28 Q 30 44 43 28"
              : isHovered
              ? "M 18 29 Q 30 42 42 29"
              : "M 20 30 Q 30 38 40 30",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Open mouth */}
        <AnimatePresence>
          {isClicked && (
            <motion.ellipse
              cx="30" cy="34" rx="5" ry="4"
              fill="hsl(350 55% 42%)"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
        {isClicked && (
          <ellipse cx="30" cy="36" rx="3" ry="2" fill="hsl(340 60% 65%)" />
        )}

        {/* Crown when clicked */}
        <AnimatePresence>
          {isClicked && (
            <motion.g
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <polygon points="20,6 23,0 26,5 30,-2 34,5 37,0 40,6" fill="hsl(45 95% 55%)" />
              <circle cx="23" cy="1" r="1.2" fill="hsl(0 70% 50%)" />
              <circle cx="30" cy="-1" r="1.2" fill="hsl(220 70% 55%)" />
              <circle cx="37" cy="1" r="1.2" fill="hsl(0 70% 50%)" />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Label */}
      <span className="text-[9px] font-bold text-primary/70 mt-[-2px] whitespace-nowrap">
        pergunte ao verdinho!
      </span>

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
