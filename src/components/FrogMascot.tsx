import { memo } from "react";
import { motion } from "framer-motion";
import verdinhoImg from "@/assets/verdinho-mascot.png";
import { useFrogAnimations, FrogExpression } from "./frog/useFrogAnimations";
import { FrogEyes } from "./frog/FrogEyes";
import { FrogMouth } from "./frog/FrogMouth";
import { FrogAccessories } from "./frog/FrogAccessories";
import { FrogDaydream } from "./frog/FrogDaydream";
import { FrogCrown } from "./frog/FrogCrown";

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
      whileHover={{ scale: 3 }}
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

      {/* Waving arm — right side */}
      {anim.isWaving && (
        <motion.svg
          className="absolute z-30 pointer-events-none"
          style={{
            right: -size * 0.2,
            top: size * 0.3,
            width: size * 0.4,
            height: size * 0.5,
          }}
          viewBox="0 0 40 50"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -25, 15, -20, 10, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          {/* Arm */}
          <path
            d="M 5 45 Q 8 30 15 20 Q 18 15 22 10"
            stroke="#5bb85b"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Hand */}
          <circle cx="22" cy="10" r="5" fill="#6ecf6e" />
          {/* Fingers */}
          <path d="M 19 6 Q 17 3 18 1" stroke="#6ecf6e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 22 5 Q 22 2 23 0" stroke="#6ecf6e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 25 6 Q 27 3 28 1" stroke="#6ecf6e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
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

      {/* Daydream bubble — positioned to the RIGHT */}
      <FrogDaydream
        size={size}
        isDaydreaming={anim.isDaydreaming}
        daydreamPhase={anim.daydreamPhase}
      />

      {/* Hover tooltip */}
      {anim.isHovered && (
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
