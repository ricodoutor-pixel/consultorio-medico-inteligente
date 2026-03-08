import { useState, useEffect, useRef, memo } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import verdinhoImg from "@/assets/verdinho-mascot.png";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  mood?: "happy" | "thinking" | "excited" | "sleeping" | "waving" | "confused";
  enableJumpToNav?: boolean;
  hasNewMessage?: boolean;
}

// Eye positions relative to image
const LEFT_EYE = { cx: 0.35, cy: 0.38 };
const RIGHT_EYE = { cx: 0.65, cy: 0.38 };
const PUPIL_RADIUS_RATIO = 0.045;
const MAX_EYE_OFFSET = 0.025;

export const FrogMascot = memo(({ onClick, size = 64, mood = "happy", enableJumpToNav = false, hasNewMessage = false }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headRotation, setHeadRotation] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [smile, setSmile] = useState(false);
  const [expression, setExpression] = useState(mood);
  const [messageBounce, setMessageBounce] = useState(false);
  const [autoMood, setAutoMood] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const bounceY = useMotionValue(0);
  const rotate = useTransform(bounceY, [-12, 0, 12], [-3, 0, 3]);

  useEffect(() => { if (!autoMood) setExpression(mood); }, [mood, autoMood]);

  // 3D head tracking (MetaMask-style perspective rotation)
  useEffect(() => {
    const handlePointer = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = Math.min(dist / 300, 1);
      const maxOff = size * MAX_EYE_OFFSET;
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOff * factor,
        y: (dy / (dist || 1)) * maxOff * factor,
      });
      // 3D perspective head rotation — rotateY for left/right, rotateX for up/down
      const rotY = Math.max(-25, Math.min(25, (dx / 300) * 25));
      const rotX = Math.max(-15, Math.min(15, -(dy / 300) * 15));
      setHeadRotation({ x: rotY, y: rotX });
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
      setTimeout(() => setBlink(false), 130);
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Smile every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setSmile(true);
      setTimeout(() => setSmile(false), 1200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Random personality shifts every 8-15s
  useEffect(() => {
    const moods: Array<"happy" | "thinking" | "confused" | "sleeping" | "excited"> = ["happy", "thinking", "confused", "sleeping", "excited"];
    const interval = setInterval(() => {
      const m = moods[Math.floor(Math.random() * moods.length)];
      setAutoMood(m);
      setExpression(m);
      setTimeout(() => { setAutoMood(null); setExpression(mood); }, 3000);
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
  }, [mood]);

  // Idle bounce
  useEffect(() => {
    const doJump = () => {
      controls.start({
        y: [0, -12, -3, -9, 0],
        transition: { duration: 0.7, ease: "easeInOut", times: [0, 0.3, 0.5, 0.7, 1] },
      });
    };
    const interval = setInterval(doJump, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [controls]);

  // Jump-to-nav
  useEffect(() => {
    if (!enableJumpToNav) return;
    const doNavJump = async () => {
      await controls.start({
        x: [0, 25, 50, 70, 80],
        y: [0, -10, 0, -10, 0],
        transition: { duration: 1, ease: "easeInOut" },
      });
      await new Promise(r => setTimeout(r, 300));
      await controls.start({
        x: [80, 55, 35, 15, 0],
        y: [0, -10, 0, -8, 0],
        transition: { duration: 1, ease: "easeInOut" },
      });
    };
    const timeout = setTimeout(doNavJump, 10000);
    const interval = setInterval(doNavJump, 20000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [controls, enableJumpToNav]);

  // New message micro-interaction
  useEffect(() => {
    if (hasNewMessage) {
      setMessageBounce(true);
      setExpression("excited");
      const t = setTimeout(() => {
        setMessageBounce(false);
        setExpression(mood);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [hasNewMessage, mood]);

  const getExpressionEmoji = () => {
    switch (expression) {
      case "excited": return "✨";
      case "thinking": return "💭";
      case "sleeping": return "💤";
      case "waving": return "👋";
      case "confused": return "❓";
      default: return null;
    }
  };

  const isSleeping = expression === "sleeping";
  const isConfused = expression === "confused";

  const emoji = getExpressionEmoji();
  const pupilR = size * PUPIL_RADIUS_RATIO;
  const smileCurve = smile || isHovered;

  // Crown dimensions
  const crownW = size * 0.38;
  const crownH = size * 0.22;
  const crownX = (size - crownW) / 2;
  const crownY = size * 0.02;

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
      whileHover={{ scale: 3 }}
      animate={controls}
      style={{ width: size, height: size }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-lg"
        animate={{
          scale: isHovered ? 1.6 : messageBounce ? 1.4 : 1,
          opacity: isHovered ? 0.6 : messageBounce ? 0.5 : 0.2,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Message bounce pulse */}
      {messageBounce && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8, repeat: 2 }}
        />
      )}

      {/* 3D Head container — MetaMask-style perspective tilt, body stays still */}
      <motion.div
        className="relative z-10"
        style={{ perspective: 400, transformStyle: "preserve-3d" }}
      >
        <motion.div
          animate={{
            rotateY: headRotation.x,
            rotateX: headRotation.y,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.8 }}
          style={{ transformStyle: "preserve-3d" }}
        >
        <img
          src={verdinhoImg}
          alt="Verdinho - Assistente IA"
          width={size}
          height={size}
          className="drop-shadow-lg pointer-events-none"
          draggable={false}
        />

        {/* Clip top of image to remove green hair */}
        <div
          className="absolute pointer-events-none z-20"
          style={{ top: 0, left: 0, width: size, height: size * 0.12, background: 'transparent' }}
        />

        {/* Prince crown - refined */}
        <svg
          className="absolute pointer-events-none z-30 drop-shadow-md"
          style={{ top: crownY - size * 0.02, left: crownX - size * 0.02, width: crownW + size * 0.04, height: crownH + size * 0.02 }}
          viewBox="0 0 110 65"
          fill="none"
        >
          {/* Crown base with shadow */}
          <path
            d="M8 58 L8 28 L22 40 L38 10 L55 34 L72 10 L88 40 L102 28 L102 58 Z"
            fill="url(#crownGoldV2)"
            stroke="#96700a"
            strokeWidth="2.5"
          />
          {/* Crown band */}
          <rect x="8" y="48" width="94" height="10" rx="2" fill="url(#crownBand)" opacity="0.6" />
          {/* Gems */}
          <circle cx="38" cy="18" r="5" fill="#e74c3c" stroke="#a83228" strokeWidth="1" />
          <circle cx="55" cy="38" r="4" fill="#2980b9" stroke="#1a5276" strokeWidth="1" />
          <circle cx="72" cy="18" r="5" fill="#27ae60" stroke="#1a7a42" strokeWidth="1" />
          {/* Gem shine */}
          <circle cx="36" cy="16" r="1.5" fill="white" opacity="0.7" />
          <circle cx="53" cy="36" r="1.2" fill="white" opacity="0.7" />
          <circle cx="70" cy="16" r="1.5" fill="white" opacity="0.7" />
          <defs>
            <linearGradient id="crownGoldV2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe066" />
              <stop offset="40%" stopColor="#ffd700" />
              <stop offset="70%" stopColor="#ffb300" />
              <stop offset="100%" stopColor="#cc8800" />
            </linearGradient>
            <linearGradient id="crownBand" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#fff1a8" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bow tie */}
        <svg
          className="absolute pointer-events-none z-30"
          style={{ top: size * 0.72, left: (size - size * 0.28) / 2, width: size * 0.28, height: size * 0.16 }}
          viewBox="0 0 60 34"
          fill="none"
        >
          <path d="M30 17 L2 2 L2 32 Z" fill="white" stroke="#e0e0e0" strokeWidth="1.5" />
          <path d="M30 17 L58 2 L58 32 Z" fill="white" stroke="#e0e0e0" strokeWidth="1.5" />
          <circle cx="30" cy="17" r="5" fill="white" stroke="#e0e0e0" strokeWidth="1.5" />
        </svg>
        </motion.div>
      </motion.div>

      {/* Eyes + Smile SVG overlay */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
      >
        {/* Sleeping eyes */}
        {isSleeping && (
          <>
            <path d={`M ${size * LEFT_EYE.cx - pupilR * 1.5} ${size * LEFT_EYE.cy} Q ${size * LEFT_EYE.cx} ${size * LEFT_EYE.cy + pupilR} ${size * LEFT_EYE.cx + pupilR * 1.5} ${size * LEFT_EYE.cy}`} fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round" />
            <path d={`M ${size * RIGHT_EYE.cx - pupilR * 1.5} ${size * RIGHT_EYE.cy} Q ${size * RIGHT_EYE.cx} ${size * RIGHT_EYE.cy + pupilR} ${size * RIGHT_EYE.cx + pupilR * 1.5} ${size * RIGHT_EYE.cy}`} fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round" />
          </>
        )}
        {/* Confused spiral eyes */}
        {isConfused && !blink && (
          <>
            <circle cx={size * LEFT_EYE.cx} cy={size * LEFT_EYE.cy} r={pupilR * 0.8} fill="none" stroke="#111" strokeWidth={1.2} />
            <path d={`M ${size * LEFT_EYE.cx} ${size * LEFT_EYE.cy - pupilR * 0.4} A ${pupilR * 0.4} ${pupilR * 0.4} 0 1 1 ${size * LEFT_EYE.cx + pupilR * 0.4} ${size * LEFT_EYE.cy}`} fill="none" stroke="#111" strokeWidth={1} />
            <circle cx={size * RIGHT_EYE.cx} cy={size * RIGHT_EYE.cy} r={pupilR * 0.8} fill="none" stroke="#111" strokeWidth={1.2} />
            <path d={`M ${size * RIGHT_EYE.cx} ${size * RIGHT_EYE.cy - pupilR * 0.4} A ${pupilR * 0.4} ${pupilR * 0.4} 0 1 1 ${size * RIGHT_EYE.cx + pupilR * 0.4} ${size * RIGHT_EYE.cy}`} fill="none" stroke="#111" strokeWidth={1} />
          </>
        )}
        {/* Normal pupils */}
        {!blink && !isSleeping && !isConfused && (
          <>
            <circle cx={size * LEFT_EYE.cx + eyeOffset.x} cy={size * LEFT_EYE.cy + eyeOffset.y} r={pupilR} fill="#111" opacity="0.85" />
            <circle cx={size * LEFT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4} cy={size * LEFT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5} r={pupilR * 0.38} fill="white" opacity="0.9" />
            <circle cx={size * RIGHT_EYE.cx + eyeOffset.x} cy={size * RIGHT_EYE.cy + eyeOffset.y} r={pupilR} fill="#111" opacity="0.85" />
            <circle cx={size * RIGHT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4} cy={size * RIGHT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5} r={pupilR * 0.38} fill="white" opacity="0.9" />
          </>
        )}
        {/* Blink */}
        {blink && !isSleeping && (
          <>
            <line x1={size * LEFT_EYE.cx - pupilR * 1.2} y1={size * LEFT_EYE.cy} x2={size * LEFT_EYE.cx + pupilR * 1.2} y2={size * LEFT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
            <line x1={size * RIGHT_EYE.cx - pupilR * 1.2} y1={size * RIGHT_EYE.cy} x2={size * RIGHT_EYE.cx + pupilR * 1.2} y2={size * RIGHT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
          </>
        )}
        {/* Smile / confused mouth */}
        {isConfused && (
          <path
            d={`M ${size * 0.43} ${size * 0.56} Q ${size * 0.47} ${size * 0.52} ${size * 0.53} ${size * 0.57} Q ${size * 0.56} ${size * 0.53} ${size * 0.58} ${size * 0.56}`}
            fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round"
          />
        )}
        {smileCurve && !isConfused && !isSleeping && (
          <path
            d={`M ${size * 0.4} ${size * 0.54} Q ${size * 0.5} ${size * 0.62} ${size * 0.6} ${size * 0.54}`}
            fill="none"
            stroke="#2d8a4e"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Expression emoji */}
      {emoji && (
        <motion.span
          className="absolute -top-1 -right-1 z-40 text-xs pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          key={expression}
        >
          {emoji}
        </motion.span>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold pointer-events-none bg-primary/20 border border-primary/30 text-primary z-50"
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
