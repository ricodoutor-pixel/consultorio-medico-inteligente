import { useCallback, useEffect, useRef, useState, memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  jumpDistance?: number;
}

type AnimPhase = "rest" | "dance" | "happy" | "celebrate" | "thinking" | "wave" | "excited";

const ANIM_PHASES: AnimPhase[] = ["dance", "happy", "celebrate", "thinking", "wave", "excited"];

export const FrogMascot = memo(({ onClick, size = 120, jumpDistance = 90 }: FrogMascotProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [phase, setPhase] = useState<AnimPhase>("rest");

  const reduceMotion = useReducedMotion();
  const isCompact = size < 50;
  const effectiveJump = isCompact || reduceMotion ? 0 : jumpDistance;

  // Responsive sizing
  const stageWidth = isCompact ? size + 10 : size + effectiveJump + 40;
  const stageHeight = isCompact ? size * 1.4 : size * 1.8;

  // Phase cycle every 3 seconds
  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setPhase(ANIM_PHASES[Math.floor(Math.random() * ANIM_PHASES.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  // Blinking every 4-6s
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    };
    const interval = setInterval(() => {
      if (Math.random() > 0.4) blink();
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Smooth pupil tracking (debounced via rAF)
  const animatePupils = useCallback(() => {
    const lerp = 0.12;
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
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.min(Math.hypot(dx, dy) / 150, 1);
      const angle = Math.atan2(dy, dx);
      const maxOff = 5;
      targetOffset.current = {
        x: Math.cos(angle) * maxOff * dist,
        y: Math.sin(angle) * maxOff * dist,
      };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleClick = () => {
    setPhase(ANIM_PHASES[Math.floor(Math.random() * ANIM_PHASES.length)]);
    onClick?.();
  };

  // Mouth expression based on phase
  const getMouthPath = () => {
    switch (phase) {
      case "happy":
      case "celebrate":
      case "excited":
        return "M 70 110 Q 100 140 130 110"; // Big smile
      case "thinking":
        return "M 85 112 Q 100 118 115 112"; // Small O
      case "dance":
      case "wave":
        return "M 72 108 Q 100 135 128 108"; // Wide smile
      default:
        return "M 78 110 Q 100 128 122 110"; // Normal smile
    }
  };

  // Tongue visible on big smiles
  const showTongue = ["happy", "celebrate", "excited", "dance"].includes(phase);
  // Teeth visible
  const showTeeth = phase !== "rest" && phase !== "thinking";

  // Body animation based on phase
  const getBodyAnim = () => {
    switch (phase) {
      case "dance":
        return { rotate: [0, -12, 12, -12, 0], y: [0, -3, 0, -3, 0] };
      case "happy":
        return { y: [0, -10, 0], scale: [1, 1.03, 1] };
      case "celebrate":
        return { y: [0, -20, 0], rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] };
      case "thinking":
        return { rotate: [0, -8, -8, 0] };
      case "wave":
        return { y: [0, -2, 0] };
      case "excited":
        return { x: [0, -2, 2, -2, 2, 0], y: [0, -3, 0] };
      default:
        return { y: 0, rotate: 0 };
    }
  };

  const getBodyTransition = () => {
    const dur = phase === "celebrate" ? 0.8 : phase === "excited" ? 0.4 : 0.7;
    return {
      duration: dur,
      repeat: phase === "rest" ? 0 : Infinity,
      ease: "easeInOut" as const,
    };
  };

  // Left arm animation
  const getLeftArmAnim = () => {
    switch (phase) {
      case "wave":
        return { rotate: [0, -40, 20, -40, 20, 0] };
      case "dance":
        return { rotate: [0, -30, 15, -30, 0] };
      case "celebrate":
        return { rotate: [0, -60, -50, -60, 0] };
      case "thinking":
        return { rotate: [0, -25, -25, 0] }; // Hand on cheek
      case "excited":
        return { rotate: [0, -35, 10, -35, 0] };
      default:
        return { rotate: 0 };
    }
  };

  // Right arm animation
  const getRightArmAnim = () => {
    switch (phase) {
      case "wave":
        return { rotate: [0, 40, -20, 40, -20, 0] };
      case "dance":
        return { rotate: [0, 30, -15, 30, 0] };
      case "celebrate":
        return { rotate: [0, 60, 50, 60, 0] };
      case "excited":
        return { rotate: [0, 35, -10, 35, 0] };
      default:
        return { rotate: 0 };
    }
  };

  // Legs animation
  const getLegsAnim = () => {
    switch (phase) {
      case "dance":
      case "excited":
        return { y: [0, -5, 0], rotate: [0, -5, 5, 0] };
      case "celebrate":
      case "happy":
        return { y: [0, -8, 0] };
      default:
        return { y: 0, rotate: 0 };
    }
  };

  // Car orbit speed multiplier
  const carSpeed = phase === "dance" || phase === "excited" ? 6 : phase === "celebrate" ? 4 : 12;

  return (
    <div className="relative overflow-visible" style={{ width: stageWidth, height: stageHeight }}>
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("absolute left-0 bottom-0 cursor-pointer select-none focus:outline-none")}
        aria-label="Pergunte ao Verdinho — Assistente IA"
        title="Clique para conversar com Verdinho! 🐸👑"
        whileTap={{ scale: 0.94 }}
        animate={
          (phase === "happy" || phase === "celebrate") && !isCompact
            ? {
                x: [0, effectiveJump * 0.6, effectiveJump * 0.2, 0],
                y: [0, -size * 0.3, -size * 0.1, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={
          (phase === "happy" || phase === "celebrate") && !isCompact
            ? { duration: 1.5, times: [0, 0.4, 0.7, 1], ease: "easeInOut" }
            : { duration: 0.4, ease: "easeOut" }
        }
      >
        {/* Orbiting luxury cars */}
        {!isCompact && (
          <div className="absolute inset-0 pointer-events-none" style={{ width: size * 1.6, height: size * 1.6, left: -size * 0.3, top: -size * 0.15 }}>
            {[
              { emoji: "🏎️", color: "red", offset: 0 },     // Ferrari
              { emoji: "🚗", color: "yellow", offset: 90 },  // Lamborghini
              { emoji: "🚙", color: "black", offset: 180 },  // Porsche
              { emoji: "🚘", color: "blue", offset: 270 },   // Tesla
            ].map((car, i) => (
              <motion.span
                key={i}
                className="absolute text-[14px] md:text-[18px]"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                animate={{
                  rotate: [car.offset, car.offset + 360],
                  y: [0, -3, 0, 3, 0],
                }}
                transition={{
                  rotate: { duration: carSpeed, repeat: Infinity, ease: "linear" },
                  y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <span style={{
                  display: "inline-block",
                  transform: `rotate(-${car.offset}deg) translateX(${size * 0.55}px)`,
                }}>
                  {car.emoji}
                </span>
              </motion.span>
            ))}
          </div>
        )}

        <motion.svg
          ref={svgRef}
          viewBox="0 0 200 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size, height: size * 1.2 }}
          animate={getBodyAnim()}
          transition={getBodyTransition()}
        >
          <defs>
            <radialGradient id="bodyGrad" cx="0.4" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#81C784" />
              <stop offset="100%" stopColor="#66BB6A" />
            </radialGradient>
            <radialGradient id="bellyGrad" cx="0.5" cy="0.35" r="0.6">
              <stop offset="0%" stopColor="#A5D6A7" />
              <stop offset="100%" stopColor="#81C784" />
            </radialGradient>
            <radialGradient id="eyeIris" cx="0.4" cy="0.3" r="0.6">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#FFD700" />
            </radialGradient>
            <radialGradient id="crownGrad" cx="0.5" cy="0.2" r="0.8">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#FFD700" />
            </radialGradient>
          </defs>

          {/* === LEFT LEG (back, webbed foot) === */}
          <motion.g
            animate={getLegsAnim()}
            transition={{ duration: 0.5, repeat: phase !== "rest" ? Infinity : 0 }}
            style={{ transformOrigin: "70px 185px" }}
          >
            <ellipse cx="60" cy="190" rx="12" ry="16" fill="#66BB6A" transform="rotate(10 60 190)" />
            <ellipse cx="52" cy="210" rx="8" ry="14" fill="#66BB6A" transform="rotate(-8 52 210)" />
            {/* Webbed foot */}
            <ellipse cx="44" cy="228" rx="18" ry="6" fill="#66BB6A" />
            {/* Toes with webbing */}
            <ellipse cx="30" cy="226" rx="5" ry="3" fill="#81C784" />
            <ellipse cx="38" cy="224" rx="4" ry="3" fill="#81C784" />
            <ellipse cx="50" cy="224" rx="4" ry="3" fill="#81C784" />
            <ellipse cx="57" cy="226" rx="5" ry="3" fill="#81C784" />
            <ellipse cx="44" cy="226" rx="4" ry="2.5" fill="#81C784" />
          </motion.g>

          {/* === RIGHT LEG (back, webbed foot) === */}
          <motion.g
            animate={getLegsAnim()}
            transition={{ duration: 0.5, repeat: phase !== "rest" ? Infinity : 0, delay: 0.1 }}
            style={{ transformOrigin: "130px 185px" }}
          >
            <ellipse cx="140" cy="190" rx="12" ry="16" fill="#66BB6A" transform="rotate(-10 140 190)" />
            <ellipse cx="148" cy="210" rx="8" ry="14" fill="#66BB6A" transform="rotate(8 148 210)" />
            <ellipse cx="156" cy="228" rx="18" ry="6" fill="#66BB6A" />
            <ellipse cx="143" cy="226" rx="5" ry="3" fill="#81C784" />
            <ellipse cx="150" cy="224" rx="4" ry="3" fill="#81C784" />
            <ellipse cx="162" cy="224" rx="4" ry="3" fill="#81C784" />
            <ellipse cx="170" cy="226" rx="5" ry="3" fill="#81C784" />
            <ellipse cx="156" cy="226" rx="4" ry="2.5" fill="#81C784" />
          </motion.g>

          {/* === BODY (torso, sitting position) === */}
          <ellipse cx="100" cy="160" rx="38" ry="45" fill="url(#bodyGrad)" />

          {/* Body spots */}
          <circle cx="68" cy="145" r="4" fill="#2E7D32" opacity="0.4" />
          <circle cx="132" cy="148" r="3.5" fill="#2E7D32" opacity="0.4" />
          <circle cx="72" cy="170" r="3" fill="#2E7D32" opacity="0.35" />
          <circle cx="128" cy="175" r="3.2" fill="#2E7D32" opacity="0.35" />
          <circle cx="85" cy="185" r="2.5" fill="#2E7D32" opacity="0.3" />
          <circle cx="115" cy="182" r="2.8" fill="#2E7D32" opacity="0.3" />

          {/* === BELLY === */}
          <ellipse cx="100" cy="165" rx="22" ry="32" fill="url(#bellyGrad)" opacity="0.9" />

          {/* === ROYAL ROBE (purple mantle) === */}
          <path
            d="M 62 120 Q 58 130 55 160 Q 54 175 60 185 L 100 190 L 140 185 Q 146 175 145 160 Q 142 130 138 120 Z"
            fill="#9C27B0"
            opacity="0.85"
          />
          {/* Robe gold border */}
          <path
            d="M 62 120 Q 58 130 55 160 Q 54 175 60 185"
            stroke="#FFD700"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 138 120 Q 142 130 145 160 Q 146 175 140 185"
            stroke="#FFD700"
            strokeWidth="2"
            fill="none"
          />
          {/* Gold vertical stripes */}
          <line x1="80" y1="125" x2="78" y2="180" stroke="#FFD700" strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="120" x2="100" y2="185" stroke="#FFD700" strokeWidth="1.2" opacity="0.5" />
          <line x1="120" y1="125" x2="122" y2="180" stroke="#FFD700" strokeWidth="1" opacity="0.5" />
          {/* Gold clasp */}
          <circle cx="100" cy="128" r="4" fill="#FFD700" />
          <circle cx="100" cy="128" r="2" fill="#FFC700" />
          {/* Gold buttons */}
          <circle cx="100" cy="145" r="2.5" fill="#FFD700" />
          <circle cx="100" cy="162" r="2.5" fill="#FFD700" />

          {/* === LEFT ARM (with 4 fingers) === */}
          <motion.g
            animate={getLeftArmAnim()}
            transition={{
              duration: phase === "wave" ? 0.6 : 0.7,
              repeat: phase === "rest" ? 0 : Infinity,
            }}
            style={{ transformOrigin: "65px 135px" }}
          >
            <ellipse cx="48" cy="130" rx="12" ry="6" fill="#66BB6A" transform="rotate(-25 48 130)" />
            <ellipse cx="32" cy="120" rx="10" ry="5" fill="#66BB6A" transform="rotate(-45 32 120)" />
            {/* Hand with 4 fingers */}
            <circle cx="22" cy="112" r="5" fill="#66BB6A" />
            <circle cx="16" cy="106" r="3" fill="#66BB6A" />
            <circle cx="20" cy="104" r="3" fill="#66BB6A" />
            <circle cx="25" cy="105" r="3" fill="#66BB6A" />
            <circle cx="28" cy="108" r="2.5" fill="#66BB6A" />
            {/* Nails */}
            <circle cx="15" cy="104" r="1" fill="#000" opacity="0.3" />
            <circle cx="19" cy="102" r="1" fill="#000" opacity="0.3" />
            <circle cx="24" cy="103" r="1" fill="#000" opacity="0.3" />
            <circle cx="28" cy="106" r="0.8" fill="#000" opacity="0.3" />
          </motion.g>

          {/* === RIGHT ARM (with 4 fingers) === */}
          <motion.g
            animate={getRightArmAnim()}
            transition={{
              duration: phase === "wave" ? 0.6 : 0.7,
              repeat: phase === "rest" ? 0 : Infinity,
            }}
            style={{ transformOrigin: "135px 135px" }}
          >
            <ellipse cx="152" cy="130" rx="12" ry="6" fill="#66BB6A" transform="rotate(25 152 130)" />
            <ellipse cx="168" cy="120" rx="10" ry="5" fill="#66BB6A" transform="rotate(45 168 120)" />
            <circle cx="178" cy="112" r="5" fill="#66BB6A" />
            <circle cx="184" cy="106" r="3" fill="#66BB6A" />
            <circle cx="180" cy="104" r="3" fill="#66BB6A" />
            <circle cx="175" cy="105" r="3" fill="#66BB6A" />
            <circle cx="172" cy="108" r="2.5" fill="#66BB6A" />
            <circle cx="185" cy="104" r="1" fill="#000" opacity="0.3" />
            <circle cx="181" cy="102" r="1" fill="#000" opacity="0.3" />
            <circle cx="176" cy="103" r="1" fill="#000" opacity="0.3" />
            <circle cx="172" cy="106" r="0.8" fill="#000" opacity="0.3" />
          </motion.g>

          {/* === SCEPTER (in right hand area) === */}
          <motion.g
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "175px 130px" }}
          >
            <line x1="175" y1="70" x2="175" y2="135" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
            {/* Orb */}
            <circle cx="175" cy="66" r="8" fill="#E53935" />
            <circle cx="175" cy="66" r="5" fill="#EF5350" opacity="0.7" />
            <circle cx="172" cy="63" r="2" fill="#fff" opacity="0.5" />
          </motion.g>

          {/* === HEAD (large, oval) === */}
          <ellipse cx="100" cy="75" rx="45" ry="38" fill="url(#bodyGrad)" />

          {/* Head spots */}
          <circle cx="65" cy="65" r="3.5" fill="#2E7D32" opacity="0.45" />
          <circle cx="135" cy="65" r="3.5" fill="#2E7D32" opacity="0.45" />
          <circle cx="75" cy="85" r="2.5" fill="#2E7D32" opacity="0.35" />
          <circle cx="125" cy="83" r="2.3" fill="#2E7D32" opacity="0.35" />
          <circle cx="85" cy="95" r="2" fill="#2E7D32" opacity="0.3" />
          <circle cx="115" cy="94" r="2.2" fill="#2E7D32" opacity="0.3" />
          <circle cx="100" cy="60" r="2.8" fill="#2E7D32" opacity="0.4" />
          <circle cx="80" cy="55" r="2" fill="#2E7D32" opacity="0.35" />
          <circle cx="120" cy="55" r="2" fill="#2E7D32" opacity="0.35" />

          {/* === EYES (large, prominent, with gold iris) === */}
          {/* Left eye bulge */}
          <circle cx="75" cy="55" r="22" fill="#66BB6A" />
          <circle cx="75" cy="52" r="18" fill="#FFFFFF" />
          {/* Iris */}
          <circle cx={75 + pupilOffset.x * 0.6} cy={52 + pupilOffset.y * 0.6} r="12" fill="url(#eyeIris)" />

          {/* Right eye bulge */}
          <circle cx="125" cy="55" r="22" fill="#66BB6A" />
          <circle cx="125" cy="52" r="18" fill="#FFFFFF" />
          <circle cx={125 + pupilOffset.x * 0.6} cy={52 + pupilOffset.y * 0.6} r="12" fill="url(#eyeIris)" />

          {/* Pupils (track mouse) */}
          {!isBlinking && (
            <>
              <circle cx={75 + pupilOffset.x} cy={52 + pupilOffset.y} r={6} fill="#000000" />
              <circle cx={125 + pupilOffset.x} cy={52 + pupilOffset.y} r={6} fill="#000000" />
              {/* Eye highlights */}
              <circle cx={71 + pupilOffset.x * 0.6} cy={48 + pupilOffset.y * 0.6} r={2.5} fill="#fff" opacity="0.9" />
              <circle cx={121 + pupilOffset.x * 0.6} cy={48 + pupilOffset.y * 0.6} r={2.5} fill="#fff" opacity="0.9" />
            </>
          )}

          {/* Blinking eyelids */}
          {isBlinking && (
            <>
              <ellipse cx="75" cy="52" rx="18" ry="4" fill="#66BB6A" />
              <ellipse cx="125" cy="52" rx="18" ry="4" fill="#66BB6A" />
            </>
          )}

          {/* === MOUTH === */}
          <motion.path
            d={getMouthPath()}
            stroke="#000"
            strokeWidth="2.5"
            fill={showTongue ? "#E53935" : "none"}
            strokeLinecap="round"
            transition={{ duration: 0.25 }}
          />

          {/* Teeth */}
          {showTeeth && (
            <>
              <rect x="90" y="108" width="6" height="5" rx="1" fill="#FFFFFF" opacity="0.9" />
              <rect x="104" y="108" width="6" height="5" rx="1" fill="#FFFFFF" opacity="0.9" />
              <rect x="92" y="118" width="5" height="4" rx="1" fill="#FFFFFF" opacity="0.7" />
              <rect x="103" y="118" width="5" height="4" rx="1" fill="#FFFFFF" opacity="0.7" />
            </>
          )}

          {/* Tongue */}
          <AnimatePresence>
            {showTongue && (
              <motion.ellipse
                cx="100"
                cy="122"
                rx="8"
                ry="6"
                fill="#EC407A"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {/* === CROWN (7 spikes with spheres) === */}
          <motion.g
            animate={{ y: [0, -3, 0], rotate: [0, 1, -1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon
              points="55,40 60,15 67,28 74,5 81,22 88,0 95,18 100,8 105,18 112,0 119,22 126,5 133,28 140,15 145,40"
              fill="url(#crownGrad)"
              stroke="#FFC700"
              strokeWidth="1.2"
            />
            {/* 7 spheres on each spike */}
            <circle cx="60" cy="15" r="3.5" fill="#FFD700" />
            <circle cx="74" cy="5" r="3.5" fill="#FFD700" />
            <circle cx="88" cy="0" r="4" fill="#FFD700" />
            <circle cx="100" cy="8" r="3.5" fill="#FFD700" />
            <circle cx="112" cy="0" r="4" fill="#FFD700" />
            <circle cx="126" cy="5" r="3.5" fill="#FFD700" />
            <circle cx="140" cy="15" r="3.5" fill="#FFD700" />
            {/* Crown jewels */}
            <circle cx="88" cy="18" r="3" fill="#E53935" />
            <circle cx="112" cy="18" r="2.5" fill="#1E88E5" />
            <circle cx="100" cy="25" r="2.5" fill="#AB47BC" />
            {/* Glow */}
            <motion.circle
              cx="100" cy="10" r="20"
              fill="#FFD700"
              animate={{ opacity: [0.03, 0.12, 0.03], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          </motion.g>
        </motion.svg>

        {/* Thinking bubble */}
        <AnimatePresence>
          {phase === "thinking" && (
            <motion.div
              className="absolute -top-2 -right-2 text-lg pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              ❓
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebrate confetti */}
        <AnimatePresence>
          {phase === "celebrate" && !isCompact && (
            <>
              {["🎉", "✨", "💚", "⭐"].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute pointer-events-none text-xs"
                  style={{ left: `${20 + i * 20}%`, top: "10%" }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [-10, -30], x: [0, (i - 1.5) * 10] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                >
                  {emoji}
                </motion.span>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.2), transparent 70%)" }}
          animate={{ opacity: isHovered ? 0.9 : [0.05, 0.2, 0.05] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
});

FrogMascot.displayName = "FrogMascot";
