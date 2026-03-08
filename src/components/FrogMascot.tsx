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
  const [isWaving, setIsWaving] = useState(false);
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

  // Idle bounce in place (no horizontal movement)
  useEffect(() => {
    const doJump = () => {
      controls.start({
        y: [0, -14, -4, -10, 0],
        transition: { duration: 0.7, ease: "easeInOut", times: [0, 0.3, 0.5, 0.7, 1] },
      });
    };
    const interval = setInterval(doJump, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [controls]);

  // Wave animation every 30 seconds
  useEffect(() => {
    const doWave = () => {
      setIsWaving(true);
      setExpression("waving");
      setTimeout(() => {
        setIsWaving(false);
        setExpression(mood);
      }, 2000);
    };
    const timeout = setTimeout(doWave, 15000);
    const interval = setInterval(doWave, 30000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [mood]);

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
  const crownW = size * 0.42;
  const crownH = size * 0.25;
  const crownX = (size - crownW) / 2;
  const crownY = size * 0.01;

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

      {/* BODY layer — stays completely still */}
      <div className="relative z-10">
        <img
          src={verdinhoImg}
          alt=""
          width={size}
          height={size}
          className="drop-shadow-lg pointer-events-none"
          style={{ clipPath: `inset(${size * 0.45}px 0 0 0)` }}
          draggable={false}
        />

        {/* Bow tie — on neck area */}
        <svg
          className="absolute pointer-events-none z-30"
          style={{ top: size * 0.58, left: (size - size * 0.3) / 2, width: size * 0.3, height: size * 0.18 }}
          viewBox="0 0 60 34"
          fill="none"
        >
          <path d="M30 17 L2 2 L2 32 Z" fill="white" stroke="#d4d4d4" strokeWidth="1.5" />
          <path d="M30 17 L58 2 L58 32 Z" fill="white" stroke="#d4d4d4" strokeWidth="1.5" />
          <circle cx="30" cy="17" r="5" fill="white" stroke="#d4d4d4" strokeWidth="1.5" />
          {/* Shine on knot */}
          <circle cx="28" cy="15" r="1.5" fill="white" opacity="0.8" />
        </svg>

        {/* Waving arm */}
        {isWaving && (
          <motion.svg
            className="absolute pointer-events-none z-40"
            style={{ top: size * 0.42, right: -size * 0.1, width: size * 0.35, height: size * 0.35 }}
            viewBox="0 0 50 50"
            fill="none"
            animate={{ rotate: [0, -20, 15, -20, 15, 0] }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          >
            {/* Little frog arm waving */}
            <path
              d="M10 40 Q15 25 25 15 Q30 10 35 8"
              stroke="#4ade80"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Hand */}
            <circle cx="35" cy="8" r="5" fill="#4ade80" />
            <path d="M33 4 L31 1" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
            <path d="M36 3 L36 0" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
            <path d="M39 4 L41 1" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          </motion.svg>
        )}
      </div>

      {/* HEAD layer — 3D perspective rotation following mouse */}
      <div
        className="absolute inset-0 z-20"
        style={{ perspective: 600 }}
      >
        <motion.div
          className="w-full h-full"
          animate={{
            rotateY: headRotation.x,
            rotateX: headRotation.y,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.6 }}
          style={{ transformStyle: "preserve-3d", transformOrigin: "50% 55%" }}
        >
          <img
            src={verdinhoImg}
            alt="Verdinho - Assistente IA"
            width={size}
            height={size}
            className="drop-shadow-lg pointer-events-none"
            style={{ clipPath: `inset(0 0 ${size * 0.48}px 0)` }}
            draggable={false}
          />

          {/* Prince crown - refined with hover glow */}
          <motion.svg
            className="absolute pointer-events-none z-30"
            style={{
              top: crownY - size * 0.02,
              left: crownX - size * 0.02,
              width: crownW + size * 0.04,
              height: crownH + size * 0.02,
              filter: isHovered ? "drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 0 16px rgba(255,215,0,0.4))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
            }}
            animate={{
              scale: isHovered ? 1.08 : 1,
            }}
            transition={{ duration: 0.3 }}
            viewBox="0 0 120 70"
            fill="none"
          >
            {/* Crown shadow */}
            <ellipse cx="60" cy="64" rx="45" ry="4" fill="rgba(0,0,0,0.15)" />
            {/* Crown body */}
            <path
              d="M10 60 L10 30 L25 42 L40 8 L60 35 L80 8 L95 42 L110 30 L110 60 Z"
              fill="url(#crownGoldV3)"
              stroke="url(#crownStroke)"
              strokeWidth="2"
            />
            {/* Crown inner details */}
            <path
              d="M15 55 L15 35 L27 44 L40 16 L60 38 L80 16 L93 44 L105 35 L105 55 Z"
              fill="url(#crownInner)"
              opacity="0.3"
            />
            {/* Crown band with ornament */}
            <rect x="10" y="50" width="100" height="10" rx="2" fill="url(#crownBandV3)" />
            <rect x="10" y="50" width="100" height="2" fill="rgba(255,255,255,0.3)" />
            {/* Main gems with glow */}
            <circle cx="40" cy="16" r="6" fill="url(#rubyGem)" stroke="#8b1a1a" strokeWidth="1" />
            <circle cx="60" cy="40" r="5" fill="url(#sapphireGem)" stroke="#1a3a6b" strokeWidth="1" />
            <circle cx="80" cy="16" r="6" fill="url(#emeraldGem)" stroke="#0d5e2f" strokeWidth="1" />
            {/* Small accent gems */}
            <circle cx="25" cy="38" r="3" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8" />
            <circle cx="95" cy="38" r="3" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8" />
            {/* Gem highlights */}
            <circle cx="37" cy="13" r="2.5" fill="white" opacity="0.6" />
            <circle cx="57" cy="37" r="2" fill="white" opacity="0.6" />
            <circle cx="77" cy="13" r="2.5" fill="white" opacity="0.6" />
            {/* Crown tip ornaments */}
            <circle cx="40" cy="6" r="2" fill="#ffd700" />
            <circle cx="60" cy="32" r="1.5" fill="#ffd700" />
            <circle cx="80" cy="6" r="2" fill="#ffd700" />
            <defs>
              <linearGradient id="crownGoldV3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff5b8" />
                <stop offset="20%" stopColor="#ffe066" />
                <stop offset="50%" stopColor="#ffd700" />
                <stop offset="75%" stopColor="#f0a500" />
                <stop offset="100%" stopColor="#cc8800" />
              </linearGradient>
              <linearGradient id="crownStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a017" />
                <stop offset="100%" stopColor="#8b6914" />
              </linearGradient>
              <linearGradient id="crownInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff5b8" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
              <linearGradient id="crownBandV3" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e6a200" />
                <stop offset="25%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#fff5b8" />
                <stop offset="75%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#e6a200" />
              </linearGradient>
              <radialGradient id="rubyGem" cx="0.35" cy="0.35">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="60%" stopColor="#e74c3c" />
                <stop offset="100%" stopColor="#8b1a1a" />
              </radialGradient>
              <radialGradient id="sapphireGem" cx="0.35" cy="0.35">
                <stop offset="0%" stopColor="#74b9ff" />
                <stop offset="60%" stopColor="#2980b9" />
                <stop offset="100%" stopColor="#1a3a6b" />
              </radialGradient>
              <radialGradient id="emeraldGem" cx="0.35" cy="0.35">
                <stop offset="0%" stopColor="#55efc4" />
                <stop offset="60%" stopColor="#27ae60" />
                <stop offset="100%" stopColor="#0d5e2f" />
              </radialGradient>
            </defs>
          </motion.svg>
        </motion.div>
      </div>

      {/* Eyes + Smile SVG overlay */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
      >
        {isSleeping && (
          <>
            <path d={`M ${size * LEFT_EYE.cx - pupilR * 1.5} ${size * LEFT_EYE.cy} Q ${size * LEFT_EYE.cx} ${size * LEFT_EYE.cy + pupilR} ${size * LEFT_EYE.cx + pupilR * 1.5} ${size * LEFT_EYE.cy}`} fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round" />
            <path d={`M ${size * RIGHT_EYE.cx - pupilR * 1.5} ${size * RIGHT_EYE.cy} Q ${size * RIGHT_EYE.cx} ${size * RIGHT_EYE.cy + pupilR} ${size * RIGHT_EYE.cx + pupilR * 1.5} ${size * RIGHT_EYE.cy}`} fill="none" stroke="#2d8a4e" strokeWidth={1.5} strokeLinecap="round" />
          </>
        )}
        {isConfused && !blink && (
          <>
            <circle cx={size * LEFT_EYE.cx} cy={size * LEFT_EYE.cy} r={pupilR * 0.8} fill="none" stroke="#111" strokeWidth={1.2} />
            <path d={`M ${size * LEFT_EYE.cx} ${size * LEFT_EYE.cy - pupilR * 0.4} A ${pupilR * 0.4} ${pupilR * 0.4} 0 1 1 ${size * LEFT_EYE.cx + pupilR * 0.4} ${size * LEFT_EYE.cy}`} fill="none" stroke="#111" strokeWidth={1} />
            <circle cx={size * RIGHT_EYE.cx} cy={size * RIGHT_EYE.cy} r={pupilR * 0.8} fill="none" stroke="#111" strokeWidth={1.2} />
            <path d={`M ${size * RIGHT_EYE.cx} ${size * RIGHT_EYE.cy - pupilR * 0.4} A ${pupilR * 0.4} ${pupilR * 0.4} 0 1 1 ${size * RIGHT_EYE.cx + pupilR * 0.4} ${size * RIGHT_EYE.cy}`} fill="none" stroke="#111" strokeWidth={1} />
          </>
        )}
        {!blink && !isSleeping && !isConfused && (
          <>
            <circle cx={size * LEFT_EYE.cx + eyeOffset.x} cy={size * LEFT_EYE.cy + eyeOffset.y} r={pupilR} fill="#111" opacity="0.85" />
            <circle cx={size * LEFT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4} cy={size * LEFT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5} r={pupilR * 0.38} fill="white" opacity="0.9" />
            <circle cx={size * RIGHT_EYE.cx + eyeOffset.x} cy={size * RIGHT_EYE.cy + eyeOffset.y} r={pupilR} fill="#111" opacity="0.85" />
            <circle cx={size * RIGHT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4} cy={size * RIGHT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5} r={pupilR * 0.38} fill="white" opacity="0.9" />
          </>
        )}
        {blink && !isSleeping && (
          <>
            <line x1={size * LEFT_EYE.cx - pupilR * 1.2} y1={size * LEFT_EYE.cy} x2={size * LEFT_EYE.cx + pupilR * 1.2} y2={size * LEFT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
            <line x1={size * RIGHT_EYE.cx - pupilR * 1.2} y1={size * RIGHT_EYE.cy} x2={size * RIGHT_EYE.cx + pupilR * 1.2} y2={size * RIGHT_EYE.cy} stroke="#2d8a4e" strokeWidth={2} strokeLinecap="round" />
          </>
        )}
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
