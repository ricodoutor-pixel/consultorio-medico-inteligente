import { memo } from "react";
import { motion } from "framer-motion";
import verdinhoImg from "@/assets/verdinho-mascot.png";
import { useFrogAnimations, FrogExpression } from "./frog/useFrogAnimations";
import { FrogEyes } from "./frog/FrogEyes";
import { FrogMouth } from "./frog/FrogMouth";
import { FrogAccessories } from "./frog/FrogAccessories";
import { FrogDaydream } from "./frog/FrogDaydream";
import { FrogCrown } from "./frog/FrogCrown";
import { FrogLoveHearts } from "./frog/FrogLoveHearts";
import { FrogStoryScroll } from "./frog/FrogStoryScroll";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  mood?: FrogExpression;
  enableJumpToNav?: boolean;
  hasNewMessage?: boolean;
}

const getExpressionEmoji = (expression: FrogExpression) => {
  switch (expression) {
    case "excited": return "✨";
    case "thinking": return "💭";
    case "sleeping": return "💤";
    case "waving": return "👋";
    case "confused": return "❓";
    case "love": return "💕";
    case "dizzy": return "💫";
    case "surprised": return "😲";
    case "singing": return "🎵";
    case "laughing": return "😂";
    case "crying": return "😢";
    case "cool": return "😎";
    case "sneeze": return "🤧";
    case "angry": return "😤";
    default: return null;
  }
};

export const FrogMascot = memo(({ onClick, size = 64, mood = "happy", enableJumpToNav = false, hasNewMessage = false }: FrogMascotProps) => {
  const anim = useFrogAnimations(mood, hasNewMessage, size);
  const emoji = getExpressionEmoji(anim.expression);

  return (
    <motion.button
      ref={anim.containerRef as any}
      onClick={onClick}
      onMouseEnter={anim.onHoverStart}
      onMouseLeave={anim.onHoverEnd}
      className="cursor-pointer select-none focus:outline-none relative"
      aria-label="Pergunte ao Verdinho — Assistente IA"
      title="Pergunte ao Verdinho 🐸"
      whileTap={{ scale: 0.85, rotate: -8 }}
      whileHover={{ scale: 2.5 }}
      animate={anim.controls}
      style={{ width: size, height: size }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-lg"
        animate={{
          scale: anim.isHovered ? 1.6 : anim.messageBounce ? 1.4 : 1,
          opacity: anim.isHovered ? 0.6 : anim.messageBounce ? 0.5 : 0.2,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Message bounce pulse */}
      {anim.messageBounce && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8, repeat: 2 }}
        />
      )}

      {/* BODY layer — breathing scale */}
      <motion.div
        className="relative z-10"
        animate={{ scaleY: anim.breathScale }}
        transition={{ duration: 0 }}
        style={{ transformOrigin: "50% 100%" }}
      >
        <img
          src={verdinhoImg}
          alt=""
          width={size}
          height={size}
          className="drop-shadow-lg pointer-events-none"
          style={{ clipPath: `inset(${size * 0.45}px 0 0 0)` }}
          draggable={false}
        />

        <FrogAccessories
          size={size}
          isWaving={anim.isWaving}
          expression={anim.expression}
          cheekBlush={anim.cheekBlush}
        />
      </motion.div>

      {/* HEAD layer — 3D perspective */}
      <div className="absolute inset-0 z-20" style={{ perspective: 600 }}>
        <motion.div
          className="w-full h-full"
          animate={{
            rotateY: anim.headRotation.x,
            rotateX: anim.headRotation.y,
            rotate: anim.headTilt,
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
          {/* Prince Crown */}
          <FrogCrown size={size} isHovered={anim.isHovered} />
        </motion.div>
      </div>

      {/* Eyes + Mouth SVG overlay */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
      >
        <FrogEyes
          size={size}
          expression={anim.expression}
          blink={anim.blink}
          eyeOffset={anim.eyeOffset}
          eyeSparkle={anim.eyeSparkle}
        />
        <FrogMouth
          size={size}
          expression={anim.expression}
          smile={anim.smile}
          isHovered={anim.isHovered}
          tongueOut={anim.tongueOut}
        />
      </svg>

      {/* Waving arm — right side, organic frog arm */}
      {anim.isWaving && (
        <motion.svg
          className="absolute z-30 pointer-events-none"
          style={{
            right: -size * 0.18,
            top: size * 0.28,
            width: size * 0.45,
            height: size * 0.55,
          }}
          viewBox="0 0 45 55"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -25, 15, -20, 10, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          {/* Upper arm with volume */}
          <path
            d="M 6 48 Q 4 38 8 30 Q 10 25 14 20 Q 17 16 20 12"
            stroke="#4a9e4a"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 6 48 Q 4 38 8 30 Q 10 25 14 20 Q 17 16 20 12"
            stroke="#6ecf6e"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {/* Highlight on arm */}
          <path
            d="M 7 44 Q 6 36 9 28 Q 12 22 16 17"
            stroke="#8de88d"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
          {/* Hand — rounder, frog-like */}
          <ellipse cx="21" cy="11" rx="6.5" ry="5.5" fill="#6ecf6e" />
          <ellipse cx="21" cy="11" rx="5" ry="4" fill="#7ed87e" opacity="0.6" />
          {/* Frog fingers — rounded webbed tips */}
          <ellipse cx="16" cy="5" rx="2.5" ry="3" fill="#6ecf6e" transform="rotate(-15 16 5)" />
          <ellipse cx="21" cy="3.5" rx="2.5" ry="3.2" fill="#6ecf6e" />
          <ellipse cx="26" cy="5" rx="2.5" ry="3" fill="#6ecf6e" transform="rotate(15 26 5)" />
          {/* Finger pads */}
          <circle cx="16" cy="3.5" r="1.5" fill="#5bb85b" opacity="0.7" />
          <circle cx="21" cy="2" r="1.5" fill="#5bb85b" opacity="0.7" />
          <circle cx="26" cy="3.5" r="1.5" fill="#5bb85b" opacity="0.7" />
        </motion.svg>
      )}

      {/* Expression emoji */}
      {emoji && !anim.isDaydreaming && (
        <motion.span
          className="absolute -top-1 -right-1 z-40 text-xs pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          key={anim.expression}
        >
          {emoji}
        </motion.span>
      )}

      {/* Love hearts floating from eyes when remembering the princess */}
      <FrogLoveHearts
        size={size}
        show={anim.expression === "love" || anim.isDaydreaming}
      />

      {/* Daydream bubble — the princess kissing Verdinho's cheek */}
      <FrogDaydream
        size={size}
        isDaydreaming={anim.isDaydreaming}
        daydreamPhase={anim.daydreamPhase}
      />

      {/* Star Wars story scroll on hover */}
      <FrogStoryScroll show={anim.isHovered} size={size} />
    </motion.button>
  );
});

FrogMascot.displayName = "FrogMascot";
