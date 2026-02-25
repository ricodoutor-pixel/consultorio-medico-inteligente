import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
}

export const FrogMascot = ({ onClick, size = 36 }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000);
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative cursor-pointer select-none focus:outline-none"
      style={{ width: size, height: size * 1.3 }}
      animate={{
        y: isClicked ? [0, -6, 0, -3, 0] : isHovered ? [0, -2, 0] : [0, 1, -1, 0],
      }}
      transition={{
        duration: isClicked ? 0.6 : isHovered ? 0.8 : 3,
        repeat: isClicked ? 0 : Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
      whileTap={{ scale: 0.9 }}
      aria-label="Falar com Verdinho — Assistente IA"
      title="Falar com Verdinho 🐸"
    >
      <svg viewBox="0 0 64 84" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size * 1.3 }}>
        {/* Body */}
        <ellipse cx="32" cy="58" rx="18" ry="20" fill="hsl(152 75% 38%)" />
        <ellipse cx="32" cy="58" rx="18" ry="20" fill="url(#bodyGrad)" />
        
        {/* Belly */}
        <ellipse cx="32" cy="62" rx="13" ry="14" fill="hsl(152 50% 55%)" opacity="0.5" />

        {/* Left leg */}
        <motion.ellipse
          cx="18" cy="76" rx="8" ry="4"
          fill="hsl(152 70% 35%)"
          animate={{ rotate: isClicked ? [0, -15, 15, 0] : 0 }}
          transition={{ duration: 0.4 }}
        />
        {/* Right leg */}
        <motion.ellipse
          cx="46" cy="76" rx="8" ry="4"
          fill="hsl(152 70% 35%)"
          animate={{ rotate: isClicked ? [0, 15, -15, 0] : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Left arm */}
        <motion.ellipse
          cx="14" cy="54" rx="5" ry="3.5"
          fill="hsl(152 70% 35%)"
          animate={{ rotate: isHovered ? -20 : isClicked ? [0, -30, 30, 0] : 0 }}
          style={{ transformOrigin: "18px 54px" }}
          transition={{ duration: isClicked ? 0.5 : 0.3 }}
        />
        {/* Right arm */}
        <motion.ellipse
          cx="50" cy="54" rx="5" ry="3.5"
          fill="hsl(152 70% 35%)"
          animate={{ rotate: isHovered ? 20 : isClicked ? [0, 30, -30, 0] : 0 }}
          style={{ transformOrigin: "46px 54px" }}
          transition={{ duration: isClicked ? 0.5 : 0.3 }}
        />

        {/* Head */}
        <ellipse cx="32" cy="30" rx="22" ry="18" fill="hsl(152 80% 40%)" />
        <ellipse cx="32" cy="30" rx="22" ry="18" fill="url(#headGrad)" />

        {/* Cheeks - blush when clicked */}
        <AnimatePresence>
          {(isHovered || isClicked) && (
            <>
              <motion.circle
                cx="16" cy="34" r="4"
                fill="hsl(350 70% 65%)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
              />
              <motion.circle
                cx="48" cy="34" r="4"
                fill="hsl(350 70% 65%)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Left eye bump */}
        <circle cx="20" cy="16" r="10" fill="hsl(152 80% 44%)" />
        {/* Right eye bump */}
        <circle cx="44" cy="16" r="10" fill="hsl(152 80% 44%)" />

        {/* Left eye white */}
        <circle cx="20" cy="15" r="7" fill="white" />
        {/* Right eye white */}
        <circle cx="44" cy="15" r="7" fill="white" />

        {/* Left pupil */}
        <motion.circle
          cx="20" cy="15" r="4"
          fill="hsl(240 20% 10%)"
          animate={{
            cx: isClicked ? [20, 22, 18, 20] : isHovered ? 22 : [19, 21, 20],
            cy: isClicked ? [15, 13, 13, 15] : isHovered ? 14 : 15,
            r: isClicked ? [4, 3, 3, 4] : 4,
          }}
          transition={{ duration: isClicked ? 0.8 : isHovered ? 0.2 : 3, repeat: isClicked ? 0 : Infinity, repeatType: "mirror" }}
        />
        {/* Right pupil */}
        <motion.circle
          cx="44" cy="15" r="4"
          fill="hsl(240 20% 10%)"
          animate={{
            cx: isClicked ? [44, 46, 42, 44] : isHovered ? 46 : [43, 45, 44],
            cy: isClicked ? [15, 13, 13, 15] : isHovered ? 14 : 15,
            r: isClicked ? [4, 3, 3, 4] : 4,
          }}
          transition={{ duration: isClicked ? 0.8 : isHovered ? 0.2 : 3, repeat: isClicked ? 0 : Infinity, repeatType: "mirror" }}
        />

        {/* Eye sparkle */}
        <circle cx="17" cy="12" r="2" fill="white" opacity="0.9" />
        <circle cx="41" cy="12" r="2" fill="white" opacity="0.9" />
        <circle cx="19" cy="14" r="0.8" fill="white" opacity="0.5" />
        <circle cx="43" cy="14" r="0.8" fill="white" opacity="0.5" />

        {/* Nostrils */}
        <circle cx="27" cy="28" r="1.2" fill="hsl(152 80% 25%)" opacity="0.5" />
        <circle cx="37" cy="28" r="1.2" fill="hsl(152 80% 25%)" opacity="0.5" />

        {/* Mouth / Smile */}
        <motion.path
          d="M 20 36 Q 32 44 44 36"
          stroke="hsl(152 80% 22%)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: isClicked
              ? "M 18 34 Q 32 52 46 34"
              : isHovered
              ? "M 19 35 Q 32 48 45 35"
              : "M 21 36 Q 32 44 43 36",
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Open mouth when clicked */}
        <AnimatePresence>
          {isClicked && (
            <motion.ellipse
              cx="32" cy="40" rx="6" ry="4"
              fill="hsl(350 60% 40%)"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* Tiny crown / sparkles when clicked */}
        <AnimatePresence>
          {isClicked && (
            <>
              <motion.text
                x="24" y="6" fontSize="8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4 }}
              >✨</motion.text>
              <motion.text
                x="36" y="8" fontSize="7"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >👑</motion.text>
            </>
          )}
        </AnimatePresence>

        <defs>
          <radialGradient id="headGrad" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="hsl(152 90% 55%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(152 80% 30%)" stopOpacity="0.15" />
          </radialGradient>
          <radialGradient id="bodyGrad" cx="0.5" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="hsl(152 85% 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>

      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(152 80% 45% / 0.25), transparent 70%)" }}
        animate={{ opacity: isClicked ? [1, 0.5, 1] : isHovered ? 0.9 : [0.2, 0.5, 0.2] }}
        transition={{ duration: isClicked ? 0.4 : 2, repeat: Infinity }}
      />
    </motion.button>
  );
};
