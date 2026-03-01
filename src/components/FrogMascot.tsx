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
      const maxOffset = 2.2;
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

  const mouthPath = mood === "excited" ? "M 18 42 Q 25 50 32 42" :
                    mood === "thinking" ? "M 21 43 Q 25 43 29 43" :
                    mood === "sleeping" ? "M 21 42 Q 25 44 29 42" :
                    "M 18 41 Q 25 48 32 41";

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
        viewBox="0 0 50 55"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          {/* Glow */}
          <radialGradient id="frogGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          {/* Body gradient - cheerful bright green */}
          <radialGradient id="bodyGrad" cx="40%" cy="30%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="40%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
          {/* Belly - creamy light */}
          <radialGradient id="bellyGrad" cx="50%" cy="35%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="60%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </radialGradient>
          {/* Eye bump gradient */}
          <radialGradient id="eyeBumpGrad" cx="45%" cy="35%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#22c55e" />
          </radialGradient>
          {/* Iris gradient */}
          <radialGradient id="irisGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#1e3a2f" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
        </defs>

        {/* Ambient glow on hover */}
        {isHovered && <circle cx="25" cy="30" r="26" fill="url(#frogGlow)" />}

        {/* ===== BACK LEGS ===== */}
        {/* Left back leg */}
        <ellipse cx="10" cy="46" rx="7" ry="4" fill="#22c55e" />
        <ellipse cx="10" cy="46" rx="5.5" ry="3" fill="#2dd36f" />
        {/* Left back toes */}
        <ellipse cx="4.5" cy="47" rx="2" ry="1.3" fill="#16a34a" transform="rotate(-20 4.5 47)" />
        <ellipse cx="7" cy="49" rx="2" ry="1.2" fill="#16a34a" transform="rotate(-5 7 49)" />
        <ellipse cx="10" cy="49.5" rx="1.8" ry="1.1" fill="#16a34a" />
        
        {/* Right back leg */}
        <ellipse cx="40" cy="46" rx="7" ry="4" fill="#22c55e" />
        <ellipse cx="40" cy="46" rx="5.5" ry="3" fill="#2dd36f" />
        {/* Right back toes */}
        <ellipse cx="45.5" cy="47" rx="2" ry="1.3" fill="#16a34a" transform="rotate(20 45.5 47)" />
        <ellipse cx="43" cy="49" rx="2" ry="1.2" fill="#16a34a" transform="rotate(5 43 49)" />
        <ellipse cx="40" cy="49.5" rx="1.8" ry="1.1" fill="#16a34a" />

        {/* ===== BODY ===== */}
        <ellipse cx="25" cy="35" rx="16" ry="14" fill="url(#bodyGrad)" />
        
        {/* Belly patch - warm creamy center */}
        <ellipse cx="25" cy="37" rx="11" ry="9" fill="url(#bellyGrad)" opacity="0.6" />

        {/* ===== FRONT ARMS ===== */}
        {/* Left arm */}
        <ellipse cx="10" cy="37" rx="5" ry="2.8" fill="#22c55e" transform="rotate(-12 10 37)" />
        <ellipse cx="10" cy="37" rx="3.5" ry="2" fill="#2dd36f" transform="rotate(-12 10 37)" />
        {/* Left hand toes */}
        <ellipse cx="5.5" cy="38" rx="1.5" ry="1" fill="#16a34a" transform="rotate(-25 5.5 38)" />
        <ellipse cx="7" cy="39.5" rx="1.5" ry="1" fill="#16a34a" transform="rotate(-10 7 39.5)" />
        
        {/* Right arm */}
        <ellipse cx="40" cy="37" rx="5" ry="2.8" fill="#22c55e" transform="rotate(12 40 37)" />
        <ellipse cx="40" cy="37" rx="3.5" ry="2" fill="#2dd36f" transform="rotate(12 40 37)" />
        {/* Right hand toes */}
        <ellipse cx="44.5" cy="38" rx="1.5" ry="1" fill="#16a34a" transform="rotate(25 44.5 38)" />
        <ellipse cx="43" cy="39.5" rx="1.5" ry="1" fill="#16a34a" transform="rotate(10 43 39.5)" />

        {/* ===== HEAD ===== */}
        <ellipse cx="25" cy="26" rx="15" ry="12" fill="url(#bodyGrad)" />

        {/* ===== EYE BUMPS ===== */}
        <circle cx="16" cy="17" r="7" fill="url(#eyeBumpGrad)" />
        <circle cx="34" cy="17" r="7" fill="url(#eyeBumpGrad)" />
        {/* Bump highlight */}
        <circle cx="14" cy="14.5" r="2.5" fill="#86efac" opacity="0.4" />
        <circle cx="32" cy="14.5" r="2.5" fill="#86efac" opacity="0.4" />

        {/* ===== EYES ===== */}
        {/* Eye whites */}
        <circle cx="16" cy="17" r={blink ? 0.8 : 5} fill="white" />
        <circle cx="34" cy="17" r={blink ? 0.8 : 5} fill="white" />

        {/* Blink lines */}
        {blink && (
          <>
            <line x1="12" y1="17" x2="20" y2="17" stroke="#15803d" strokeWidth="1" strokeLinecap="round" />
            <line x1="30" y1="17" x2="38" y2="17" stroke="#15803d" strokeWidth="1" strokeLinecap="round" />
          </>
        )}

        {/* Irises & Pupils */}
        {!blink && (
          <>
            {/* Iris */}
            <circle cx={16 + eyeOffset.x} cy={17 + eyeOffset.y} r="3" fill="url(#irisGrad)" />
            <circle cx={34 + eyeOffset.x} cy={17 + eyeOffset.y} r="3" fill="url(#irisGrad)" />
            {/* Pupil */}
            <circle cx={16 + eyeOffset.x} cy={17 + eyeOffset.y} r="1.8" fill="#000" />
            <circle cx={34 + eyeOffset.x} cy={17 + eyeOffset.y} r="1.8" fill="#000" />
          </>
        )}

        {/* Eye shine / sparkle */}
        {!blink && (
          <>
            <circle cx={14.2 + eyeOffset.x * 0.3} cy={15.2 + eyeOffset.y * 0.3} r="1.5" fill="white" opacity="0.95" />
            <circle cx={32.2 + eyeOffset.x * 0.3} cy={15.2 + eyeOffset.y * 0.3} r="1.5" fill="white" opacity="0.95" />
            <circle cx={17.5 + eyeOffset.x * 0.2} cy={18.5 + eyeOffset.y * 0.2} r="0.7" fill="white" opacity="0.6" />
            <circle cx={35.5 + eyeOffset.x * 0.2} cy={18.5 + eyeOffset.y * 0.2} r="0.7" fill="white" opacity="0.6" />
          </>
        )}

        {/* ===== NOSE ===== */}
        {/* Rounded nose bump */}
        <ellipse cx="25" cy="30" rx="4" ry="2.5" fill="#2dd36f" />
        {/* Nostrils */}
        <ellipse cx="22.5" cy="30.5" rx="1" ry="0.7" fill="#15803d" opacity="0.6" />
        <ellipse cx="27.5" cy="30.5" rx="1" ry="0.7" fill="#15803d" opacity="0.6" />

        {/* ===== CHEEKS ===== */}
        <ellipse cx="9" cy="30" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.35" />
        <ellipse cx="41" cy="30" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.35" />

        {/* ===== MOUTH ===== */}
        <path d={mouthPath} fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        {/* Tongue peek for happy mood */}
        {mood === "happy" && (
          <ellipse cx="25" cy="45.5" rx="2.5" ry="1.5" fill="#f87171" opacity="0.7" />
        )}

        {/* ===== SMALL CANNABIS LEAF ON HEAD ===== */}
        <g transform="translate(25, 9) scale(0.35) rotate(-8)">
          <path d="M0 8 C-4 4 -7 -1 -3 -3 C-1 -4 0 0 0 0 C0 0 1 -4 3 -3 C7 -1 4 4 0 8Z" fill="#15803d" />
          <path d="M0 5 C-5 2 -8 -3 -4 -4 C-2 -5 0 -1 0 -1 C0 -1 2 -5 4 -4 C8 -3 5 2 0 5Z" fill="#166534" transform="translate(0,-3)" />
          <line x1="0" y1="8" x2="0" y2="13" stroke="#15803d" strokeWidth="1.2" />
        </g>

        {/* ===== MOOD INDICATORS ===== */}
        {mood === "sleeping" && (
          <g>
            <text x="38" y="13" fontSize="5" fill="#22c55e" fontWeight="bold" opacity="0.6">z</text>
            <text x="42" y="9" fontSize="7" fill="#22c55e" fontWeight="bold" opacity="0.4">Z</text>
          </g>
        )}
        {mood === "excited" && (
          <g>
            <text x="4" y="12" fontSize="4" opacity="0.7">✨</text>
            <text x="42" y="10" fontSize="4" opacity="0.7">✨</text>
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
