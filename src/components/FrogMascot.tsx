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
      const maxOffset = 2;
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

  const mouthPath = mood === "excited" ? "M 20 40 Q 25 46 30 40" :
                    mood === "thinking" ? "M 22 40 Q 25 40 28 40" :
                    mood === "sleeping" ? "M 22 39 Q 25 41 28 39" :
                    "M 20 39 Q 25 44 30 39";

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
        <defs>
          {/* Glow */}
          <radialGradient id="frogGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          {/* Body gradient - bright cheerful green */}
          <radialGradient id="bodyGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
          {/* Belly */}
          <radialGradient id="bellyGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </radialGradient>
          {/* Head bump gradient */}
          <radialGradient id="headGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#4ade80" />
          </radialGradient>
        </defs>

        {/* Ambient glow on hover */}
        {isHovered && <circle cx="25" cy="28" r="24" fill="url(#frogGlow)" />}

        {/* Back legs (behind body) */}
        <ellipse cx="13" cy="42" rx="6" ry="3.5" fill="#22c55e" />
        <ellipse cx="37" cy="42" rx="6" ry="3.5" fill="#22c55e" />
        {/* Toes */}
        <circle cx="8" cy="43" r="1.5" fill="#16a34a" />
        <circle cx="11" cy="44.5" r="1.5" fill="#16a34a" />
        <circle cx="14" cy="44.5" r="1.2" fill="#16a34a" />
        <circle cx="36" cy="44.5" r="1.2" fill="#16a34a" />
        <circle cx="39" cy="44.5" r="1.5" fill="#16a34a" />
        <circle cx="42" cy="43" r="1.5" fill="#16a34a" />

        {/* Body - round chubby frog */}
        <ellipse cx="25" cy="32" rx="15" ry="13" fill="url(#bodyGrad)" />

        {/* Belly patch */}
        <ellipse cx="25" cy="35" rx="10" ry="8" fill="url(#bellyGrad)" opacity="0.5" />

        {/* Front arms */}
        <ellipse cx="11" cy="34" rx="4" ry="2.5" fill="#22c55e" transform="rotate(-15 11 34)" />
        <ellipse cx="39" cy="34" rx="4" ry="2.5" fill="#22c55e" transform="rotate(15 39 34)" />
        {/* Front toes */}
        <circle cx="7.5" cy="35" r="1.2" fill="#16a34a" />
        <circle cx="9" cy="36.5" r="1.2" fill="#16a34a" />
        <circle cx="41" cy="36.5" r="1.2" fill="#16a34a" />
        <circle cx="42.5" cy="35" r="1.2" fill="#16a34a" />

        {/* Head - slightly wider on top */}
        <ellipse cx="25" cy="24" rx="14" ry="11" fill="url(#bodyGrad)" />

        {/* Eye bumps - the classic frog look! */}
        <circle cx="17" cy="17" r="6" fill="url(#headGrad)" />
        <circle cx="33" cy="17" r="6" fill="url(#headGrad)" />

        {/* Eye whites */}
        <circle cx="17" cy="17" r={blink ? 0.5 : 4.5} fill="white" />
        <circle cx="33" cy="17" r={blink ? 0.5 : 4.5} fill="white" />

        {/* Pupils */}
        {!blink && (
          <>
            <circle cx={17 + eyeOffset.x} cy={17 + eyeOffset.y} r="2.5" fill="#1a1a2e" />
            <circle cx={33 + eyeOffset.x} cy={17 + eyeOffset.y} r="2.5" fill="#1a1a2e" />
          </>
        )}

        {/* Eye shine */}
        {!blink && (
          <>
            <circle cx={15.5 + eyeOffset.x * 0.4} cy={15.5 + eyeOffset.y * 0.4} r="1.2" fill="white" opacity="0.95" />
            <circle cx={31.5 + eyeOffset.x * 0.4} cy={15.5 + eyeOffset.y * 0.4} r="1.2" fill="white" opacity="0.95" />
            <circle cx={18 + eyeOffset.x * 0.3} cy={18.5 + eyeOffset.y * 0.3} r="0.6" fill="white" opacity="0.6" />
            <circle cx={34 + eyeOffset.x * 0.3} cy={18.5 + eyeOffset.y * 0.3} r="0.6" fill="white" opacity="0.6" />
          </>
        )}

        {/* Nostrils */}
        <circle cx="22" cy="28" r="0.8" fill="#15803d" opacity="0.5" />
        <circle cx="28" cy="28" r="0.8" fill="#15803d" opacity="0.5" />

        {/* Cheek blush - rosy happy cheeks */}
        <ellipse cx="12" cy="30" rx="3.5" ry="2" fill="#f9a8d4" opacity="0.3" />
        <ellipse cx="38" cy="30" rx="3.5" ry="2" fill="#f9a8d4" opacity="0.3" />

        {/* Big happy smile */}
        <path d={mouthPath} fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />

        {/* Small cannabis leaf on head */}
        <g transform="translate(25, 10) scale(0.3) rotate(-5)">
          <path d="M0 8 C-4 4 -7 -1 -3 -3 C-1 -4 0 0 0 0 C0 0 1 -4 3 -3 C7 -1 4 4 0 8Z" fill="#15803d" />
          <path d="M0 5 C-5 2 -8 -3 -4 -4 C-2 -5 0 -1 0 -1 C0 -1 2 -5 4 -4 C8 -3 5 2 0 5Z" fill="#166534" transform="translate(0,-3)" />
          <line x1="0" y1="8" x2="0" y2="13" stroke="#15803d" strokeWidth="1.2" />
        </g>

        {/* Sleeping Zs */}
        {mood === "sleeping" && (
          <g>
            <text x="36" y="14" fontSize="5" fill="#22c55e" fontWeight="bold" opacity="0.6">z</text>
            <text x="40" y="10" fontSize="7" fill="#22c55e" fontWeight="bold" opacity="0.4">Z</text>
          </g>
        )}

        {/* Excited sparkles */}
        {mood === "excited" && (
          <g>
            <text x="6" y="14" fontSize="4" opacity="0.7">✨</text>
            <text x="40" y="12" fontSize="4" opacity="0.7">✨</text>
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
