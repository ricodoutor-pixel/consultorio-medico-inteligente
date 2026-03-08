import { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import verdinhoImg from "@/assets/verdinho-mascot.png";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  mood?: "happy" | "thinking" | "excited" | "sleeping" | "waving";
  enableJumpToNav?: boolean;
}

// Eye overlay positions (relative to the image) - tuned to the mascot image
const LEFT_EYE = { cx: 0.35, cy: 0.38 };
const RIGHT_EYE = { cx: 0.65, cy: 0.38 };
const EYE_RADIUS_RATIO = 0.065;
const PUPIL_RADIUS_RATIO = 0.04;
const MAX_EYE_OFFSET = 0.025;

export const FrogMascot = memo(({ onClick, size = 56, mood = "happy", enableJumpToNav = false }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [expression, setExpression] = useState(mood);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const bounceY = useMotionValue(0);
  const rotate = useTransform(bounceY, [-12, 0, 12], [-3, 0, 3]);

  // Update expression when mood changes
  useEffect(() => setExpression(mood), [mood]);

  // Eye tracking - follows mouse/touch
  useEffect(() => {
    const handlePointer = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.38;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = Math.min(dist / 300, 1);
      const maxOff = size * MAX_EYE_OFFSET;
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOff * factor,
        y: (dy / (dist || 1)) * maxOff * factor,
      });
    };

    const onMouse = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [size]);

  // Blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 2500 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, []);

  // Idle jump animation - small happy bounce
  useEffect(() => {
    const doJump = () => {
      controls.start({
        y: [0, -10, -2, -8, 0],
        transition: { duration: 0.7, ease: "easeInOut", times: [0, 0.3, 0.5, 0.7, 1] },
      });
    };
    const interval = setInterval(doJump, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [controls]);

  // Jump-to-nav animation (frog hops along the navbar and comes back)
  useEffect(() => {
    if (!enableJumpToNav) return;
    const doNavJump = async () => {
      // Hop right
      await controls.start({
        x: [0, 60, 120, 180, 200],
        y: [0, -15, 0, -15, 0],
        transition: { duration: 1.2, ease: "easeInOut" },
      });
      // Pause
      await new Promise(r => setTimeout(r, 400));
      // Hop back
      await controls.start({
        x: [200, 140, 80, 30, 0],
        y: [0, -15, 0, -12, 0],
        transition: { duration: 1.2, ease: "easeInOut" },
      });
    };
    const timeout = setTimeout(doNavJump, 8000);
    const interval = setInterval(doNavJump, 25000 + Math.random() * 10000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [controls, enableJumpToNav]);

  // Expression-based overlay effects
  const getExpressionEmoji = () => {
    switch (expression) {
      case "excited": return "✨";
      case "thinking": return "💭";
      case "sleeping": return "💤";
      case "waving": return "👋";
      default: return null;
    }
  };

  const emoji = getExpressionEmoji();
  const eyeR = size * EYE_RADIUS_RATIO;
  const pupilR = size * PUPIL_RADIUS_RATIO;

  return (
    <motion.button
      ref={containerRef as any}
      onClick={onClick}
      onMouseEnter={() => { setIsHovered(true); setExpression("excited"); }}
      onMouseLeave={() => { setIsHovered(false); setExpression(mood); }}
      className="cursor-pointer select-none focus:outline-none relative"
      aria-label="Pergunte ao Verdinho — Assistente IA"
      title="Pergunte ao Verdinho 🐸"
      whileTap={{ scale: 0.85, rotate: -8 }}
      whileHover={{ scale: 1.18 }}
      animate={controls}
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-lg"
        animate={{ 
          scale: isHovered ? 1.5 : 1,
          opacity: isHovered ? 0.6 : 0.2,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Mascot image */}
      <img
        src={verdinhoImg}
        alt="Verdinho - Assistente IA"
        width={size}
        height={size}
        className="relative z-10 drop-shadow-lg pointer-events-none"
        draggable={false}
      />

      {/* Eye overlay - invisible eye tracking layer */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
      >
        {/* Left eye pupil overlay */}
        {!blink && (
          <>
            <circle
              cx={size * LEFT_EYE.cx + eyeOffset.x}
              cy={size * LEFT_EYE.cy + eyeOffset.y}
              r={pupilR}
              fill="#111"
              opacity="0.85"
            />
            {/* Left eye shine */}
            <circle
              cx={size * LEFT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4}
              cy={size * LEFT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5}
              r={pupilR * 0.4}
              fill="white"
              opacity="0.9"
            />
          </>
        )}
        {/* Right eye pupil overlay */}
        {!blink && (
          <>
            <circle
              cx={size * RIGHT_EYE.cx + eyeOffset.x}
              cy={size * RIGHT_EYE.cy + eyeOffset.y}
              r={pupilR}
              fill="#111"
              opacity="0.85"
            />
            {/* Right eye shine */}
            <circle
              cx={size * RIGHT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4}
              cy={size * RIGHT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5}
              r={pupilR * 0.4}
              fill="white"
              opacity="0.9"
            />
          </>
        )}
        {/* Blink overlay */}
        {blink && (
          <>
            <line
              x1={size * LEFT_EYE.cx - eyeR}
              y1={size * LEFT_EYE.cy}
              x2={size * LEFT_EYE.cx + eyeR}
              y2={size * LEFT_EYE.cy}
              stroke="#2d8a4e"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={size * RIGHT_EYE.cx - eyeR}
              y1={size * RIGHT_EYE.cy}
              x2={size * RIGHT_EYE.cx + eyeR}
              y2={size * RIGHT_EYE.cy}
              stroke="#2d8a4e"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </>
        )}
      </svg>

      {/* Expression emoji */}
      {emoji && (
        <motion.span
          className="absolute -top-1 -right-1 z-30 text-xs pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          key={expression}
        >
          {emoji}
        </motion.span>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold pointer-events-none bg-primary/20 border border-primary/30 text-primary z-40"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Fale comigo! 🐸
        </motion.div>
      )}
    </motion.button>
  );
});

FrogMascot.displayName = "FrogMascot";
