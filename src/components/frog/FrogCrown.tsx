import { memo } from "react";
import { motion } from "framer-motion";

interface FrogCrownProps {
  size: number;
  isHovered: boolean;
}

export const FrogCrown = memo(({ size, isHovered }: FrogCrownProps) => {
  const crownW = size * 0.38;
  const crownH = size * 0.22;
  const crownX = (size - crownW) / 2;
  const crownY = -size * 0.08;

  return (
    <motion.svg
      className="absolute pointer-events-none z-30"
      initial={{ opacity: 0, y: -10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: isHovered ? 1.08 : 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        top: crownY - size * 0.02,
        left: crownX - size * 0.02,
        width: crownW + size * 0.04,
        height: crownH + size * 0.02,
        filter: isHovered
          ? "drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 0 16px rgba(255,215,0,0.4))"
          : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
      }}
      viewBox="0 0 120 70"
      fill="none"
    >
      <ellipse cx="60" cy="64" rx="45" ry="4" fill="rgba(0,0,0,0.15)" />
      <path d="M10 60 L10 30 L25 42 L40 8 L60 35 L80 8 L95 42 L110 30 L110 60 Z" fill="url(#crownGoldV3)" stroke="url(#crownStroke)" strokeWidth="2" />
      <path d="M15 55 L15 35 L27 44 L40 16 L60 38 L80 16 L93 44 L105 35 L105 55 Z" fill="url(#crownInner)" opacity="0.3" />
      <rect x="10" y="50" width="100" height="10" rx="2" fill="url(#crownBandV3)" />
      <rect x="10" y="50" width="100" height="2" fill="rgba(255,255,255,0.3)" />
      <circle cx="40" cy="16" r="6" fill="url(#rubyGem)" stroke="#8b1a1a" strokeWidth="1" />
      <circle cx="60" cy="40" r="5" fill="url(#sapphireGem)" stroke="#1a3a6b" strokeWidth="1" />
      <circle cx="80" cy="16" r="6" fill="url(#emeraldGem)" stroke="#0d5e2f" strokeWidth="1" />
      <circle cx="25" cy="38" r="3" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8" />
      <circle cx="95" cy="38" r="3" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8" />
      <circle cx="37" cy="13" r="2.5" fill="white" opacity="0.6" />
      <circle cx="57" cy="37" r="2" fill="white" opacity="0.6" />
      <circle cx="77" cy="13" r="2.5" fill="white" opacity="0.6" />
      <circle cx="40" cy="6" r="2" fill="#ffd700" />
      <circle cx="60" cy="32" r="1.5" fill="#ffd700" />
      <circle cx="80" cy="6" r="2" fill="#ffd700" />
      {/* Animated sparkle on crown */}
      {isHovered && (
        <>
          <circle cx="50" cy="12" r="1.5" fill="#fff" opacity="0.9">
            <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy="10" r="1" fill="#fff" opacity="0.7">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
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
  );
});

FrogCrown.displayName = "FrogCrown";
