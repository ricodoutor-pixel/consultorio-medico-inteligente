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

  // Eye + head tracking from mouse
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
      // Head follows mouse: tilt left/right and up/down
      const headX = Math.max(-15, Math.min(15, (dx / 400) * 15));
      const headY = Math.max(-8, Math.min(8, (dy / 400) * 8));
      setHeadRotation({ x: headX, y: headY });
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
        x: [0, 60, 120, 180, 200],
        y: [0, -15, 0, -15, 0],
        transition: { duration: 1.2, ease: "easeInOut" },
      });
      await new Promise(r => setTimeout(r, 400));
      await controls.start({
        x: [200, 140, 80, 30, 0],
        y: [0, -15, 0, -12, 0],
        transition: { duration: 1.2, ease: "easeInOut" },
      });
    };
    const timeout = setTimeout(doNavJump, 8000);
    const interval = setInterval(doNavJump, 25000 + Math.random() * 10000);
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
      whileHover={{ scale: 1.15 }}
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

      {/* Mascot with head tilt */}
      <motion.div
        className="relative z-10"
        animate={{ rotate: headTilt }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <img
          src={verdinhoImg}
          alt="Verdinho - Assistente IA"
          width={size}
          height={size}
          className="drop-shadow-lg pointer-events-none"
          draggable={false}
        />

        {/* Prince crown */}
        <svg
          className="absolute pointer-events-none z-30"
          style={{ top: crownY, left: crownX, width: crownW, height: crownH }}
          viewBox="0 0 100 60"
          fill="none"
        >
          <path
            d="M5 55 L5 25 L20 38 L35 12 L50 32 L65 12 L80 38 L95 25 L95 55 Z"
            fill="url(#crownGold)"
            stroke="#b8860b"
            strokeWidth="2"
          />
          <circle cx="35" cy="20" r="4" fill="#e74c3c" />
          <circle cx="50" cy="36" r="3" fill="#3498db" />
          <circle cx="65" cy="20" r="4" fill="#2ecc71" />
          <defs>
            <linearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#ffb300" />
              <stop offset="100%" stopColor="#e6a200" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Eyes + Smile SVG overlay */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
      >
        {/* Pupils */}
        {!blink && (
          <>
            <circle cx={size * LEFT_EYE.cx + eyeOffset.x} cy={size * LEFT_EYE.cy + eyeOffset.y} r={pupilR} fill="#111" opacity="0.85" />
            <circle cx={size * LEFT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4} cy={size * LEFT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5} r={pupilR * 0.38} fill="white" opacity="0.9" />
            <circle cx={size * RIGHT_EYE.cx + eyeOffset.x} cy={size * RIGHT_EYE.cy + eyeOffset.y} r={pupilR} fill="#111" opacity="0.85" />
            <circle cx={size * RIGHT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4} cy={size * RIGHT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5} r={pupilR * 0.38} fill="white" opacity="0.9" />
          </>
        )}
        {/* Blink */}
        {blink && (
          <>
            <line x1={size * LEFT_EYE.cx - pupilR * 1.2} y1={size * LEFT_EYE.cy} x2={size * LEFT_EYE.cx + pupilR * 1.2} y2={size * LEFT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
            <line x1={size * RIGHT_EYE.cx - pupilR * 1.2} y1={size * RIGHT_EYE.cy} x2={size * RIGHT_EYE.cx + pupilR * 1.2} y2={size * RIGHT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
          </>
        )}
        {/* Smile */}
        {smileCurve && (
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
