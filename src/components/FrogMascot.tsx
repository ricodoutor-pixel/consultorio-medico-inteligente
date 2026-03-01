import { useState, useEffect, useRef, memo } from "react";
import { motion, useAnimation } from "framer-motion";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  mood?: "happy" | "thinking" | "excited" | "sleeping";
}

export const FrogMascot = memo(({ onClick, size = 56, mood = "happy" }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const controls = useAnimation();

  // Eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 2.5;
      const factor = Math.min(dist / 200, 1);
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOffset * factor,
        y: (dy / (dist || 1)) * maxOffset * factor,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Jump animation every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      controls.start({
        y: [0, -8, 0],
        rotate: [0, -3, 3, 0],
        transition: { duration: 0.6, ease: "easeInOut" },
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [controls]);

  const eyeScaleY = blink ? 0.1 : 1;
  const mouthPath = mood === "excited" ? "M 18 38 Q 25 44 32 38" :
                    mood === "thinking" ? "M 20 38 Q 25 38 30 38" :
                    mood === "sleeping" ? "M 20 37 Q 25 39 30 37" :
                    "M 19 37 Q 25 42 31 37";

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none focus:outline-none relative"
      aria-label="Pergunte ao Verdinho — Assistente IA"
      title="Pergunte ao Verdinho 🐸"
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.15 }}
      animate={controls}
      style={{ width: size, height: size }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 50 50"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Glow behind frog */}
        <defs>
          <radialGradient id="frogGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(152, 80%, 45%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(152, 80%, 45%)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bodyGrad" cx="40%" cy="30%">
            <stop offset="0%" stopColor="#6ee7a8" />
            <stop offset="60%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <radialGradient id="bellyGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="100%" stopColor="#86efac" />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        {isHovered && <circle cx="25" cy="28" r="24" fill="url(#frogGlow)" />}

        {/* Body */}
        <ellipse cx="25" cy="30" rx="14" ry="15" fill="url(#bodyGrad)" />

        {/* Belly */}
        <ellipse cx="25" cy="33" rx="9" ry="9" fill="url(#bellyGrad)" opacity="0.6" />

        {/* Left leg */}
        <ellipse cx="14" cy="42" rx="5" ry="3" fill="#22c55e" />
        <ellipse cx="14" cy="42" rx="3.5" ry="2" fill="#15803d" opacity="0.3" />

        {/* Right leg */}
        <ellipse cx="36" cy="42" rx="5" ry="3" fill="#22c55e" />
        <ellipse cx="36" cy="42" rx="3.5" ry="2" fill="#15803d" opacity="0.3" />

        {/* Left arm */}
        <ellipse cx="12" cy="30" rx="3" ry="2" fill="#22c55e" transform="rotate(-20 12 30)" />

        {/* Right arm holding leaf */}
        <ellipse cx="38" cy="30" rx="3" ry="2" fill="#22c55e" transform="rotate(20 38 30)" />
        
        {/* Small cannabis leaf in right hand */}
        <g transform="translate(40, 26) scale(0.35) rotate(15)">
          <path d="M0 12 C-3 8 -8 2 -4 -2 C-1 -4 0 0 0 0 C0 0 1 -4 4 -2 C8 2 3 8 0 12Z" fill="#15803d" />
          <path d="M0 8 C-6 4 -10 -2 -6 -4 C-3 -5 0 -1 0 -1 C0 -1 3 -5 6 -4 C10 -2 6 4 0 8Z" fill="#166534" transform="translate(0,-4)" />
          <line x1="0" y1="12" x2="0" y2="18" stroke="#15803d" strokeWidth="1.5" />
        </g>

        {/* Eye whites - left */}
        <ellipse cx="19" cy="22" rx="5.5" ry={blink ? 0.8 : 5.5} fill="white" />
        {/* Eye whites - right */}
        <ellipse cx="31" cy="22" rx="5.5" ry={blink ? 0.8 : 5.5} fill="white" />

        {/* Pupils - left */}
        {!blink && (
          <circle cx={19 + eyeOffset.x} cy={22 + eyeOffset.y} r="2.8" fill="#1a1a2e" />
        )}
        {/* Pupils - right */}
        {!blink && (
          <circle cx={31 + eyeOffset.x} cy={22 + eyeOffset.y} r="2.8" fill="#1a1a2e" />
        )}

        {/* Eye shine */}
        {!blink && (
          <>
            <circle cx={17.5 + eyeOffset.x * 0.5} cy={20.5 + eyeOffset.y * 0.5} r="1" fill="white" opacity="0.9" />
            <circle cx={29.5 + eyeOffset.x * 0.5} cy={20.5 + eyeOffset.y * 0.5} r="1" fill="white" opacity="0.9" />
          </>
        )}

        {/* Cheek blush */}
        <ellipse cx="13" cy="30" rx="3" ry="1.5" fill="#f472b6" opacity="0.25" />
        <ellipse cx="37" cy="30" rx="3" ry="1.5" fill="#f472b6" opacity="0.25" />

        {/* Mouth */}
        <path d={mouthPath} fill="none" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />

        {/* Crown */}
        <g transform="translate(25, 8)">
          <path d="M-8 4 L-6 -3 L-3 1 L0 -5 L3 1 L6 -3 L8 4 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="0" cy="-4" r="1.2" fill="#ef4444" />
          <circle cx="-5" cy="-1.5" r="0.8" fill="#3b82f6" />
          <circle cx="5" cy="-1.5" r="0.8" fill="#3b82f6" />
        </g>

        {/* Sleeping Zs */}
        {mood === "sleeping" && (
          <g>
            <text x="36" y="16" fontSize="6" fill="hsl(152,80%,45%)" fontWeight="bold" opacity="0.6">z</text>
            <text x="40" y="12" fontSize="8" fill="hsl(152,80%,45%)" fontWeight="bold" opacity="0.4">Z</text>
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {isHovered && (
        <motion.div
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold pointer-events-none bg-primary/20 border border-primary/30 text-primary"
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
