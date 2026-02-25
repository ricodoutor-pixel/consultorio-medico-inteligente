import { useState } from "react";
import { motion } from "framer-motion";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
}

export const FrogMascot = ({ onClick, size = 36 }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-pointer select-none focus:outline-none"
      style={{ width: size, height: size }}
      animate={{
        rotate: isHovered ? [0, -8, 8, -4, 0] : [0, 2, -2, 1, 0],
      }}
      transition={{
        duration: isHovered ? 0.5 : 4,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
      whileTap={{ scale: 0.9 }}
      aria-label="Falar com Verdinho — Assistente IA"
      title="Falar com Verdinho 🐸"
    >
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
        {/* Head shape */}
        <ellipse cx="32" cy="34" rx="26" ry="22" fill="hsl(152 80% 38%)" />
        <ellipse cx="32" cy="34" rx="26" ry="22" fill="url(#frogGrad)" />
        
        {/* Lighter belly/chin */}
        <ellipse cx="32" cy="42" rx="18" ry="12" fill="hsl(152 60% 55%)" opacity="0.4" />

        {/* Left eye bump */}
        <circle cx="18" cy="18" r="12" fill="hsl(152 80% 42%)" />
        <circle cx="18" cy="18" r="12" fill="url(#frogGrad2)" />
        {/* Right eye bump */}
        <circle cx="46" cy="18" r="12" fill="hsl(152 80% 42%)" />
        <circle cx="46" cy="18" r="12" fill="url(#frogGrad2)" />

        {/* Left eye white */}
        <circle cx="18" cy="16" r="8" fill="white" />
        {/* Right eye white */}
        <circle cx="46" cy="16" r="8" fill="white" />

        {/* Left pupil */}
        <motion.circle
          cx="18"
          cy="16"
          r="4.5"
          fill="hsl(240 20% 10%)"
          animate={{ cx: isHovered ? 20 : [17, 19, 18], cy: isHovered ? 15 : 16 }}
          transition={{ duration: isHovered ? 0.2 : 3, repeat: isHovered ? 0 : Infinity, repeatType: "mirror" }}
        />
        {/* Right pupil */}
        <motion.circle
          cx="46"
          cy="16"
          r="4.5"
          fill="hsl(240 20% 10%)"
          animate={{ cx: isHovered ? 48 : [45, 47, 46], cy: isHovered ? 15 : 16 }}
          transition={{ duration: isHovered ? 0.2 : 3, repeat: isHovered ? 0 : Infinity, repeatType: "mirror" }}
        />

        {/* Eye shine */}
        <circle cx="15" cy="13" r="2" fill="white" opacity="0.8" />
        <circle cx="43" cy="13" r="2" fill="white" opacity="0.8" />

        {/* Smile */}
        <motion.path
          d="M 20 40 Q 32 50 44 40"
          stroke="hsl(152 80% 25%)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          animate={{ d: isHovered ? "M 18 38 Q 32 54 46 38" : "M 20 40 Q 32 50 44 40" }}
          transition={{ duration: 0.3 }}
        />

        {/* Nostrils */}
        <circle cx="26" cy="32" r="1.5" fill="hsl(152 80% 25%)" opacity="0.5" />
        <circle cx="38" cy="32" r="1.5" fill="hsl(152 80% 25%)" opacity="0.5" />

        <defs>
          <radialGradient id="frogGrad" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="hsl(152 90% 52%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(152 80% 30%)" stopOpacity="0.2" />
          </radialGradient>
          <radialGradient id="frogGrad2" cx="0.4" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="hsl(152 90% 55%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(152 80% 45% / 0.3), transparent 70%)",
        }}
        animate={{ opacity: isHovered ? 1 : [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.button>
  );
};
