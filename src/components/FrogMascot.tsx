import { memo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import verdinhoImg from "@/assets/verdinho-mascot.png";
import { useFrogAnimations, FrogExpression } from "./frog/useFrogAnimations";
import { FrogEyes } from "./frog/FrogEyes";
import { FrogMouth } from "./frog/FrogMouth";
import { FrogAccessories } from "./frog/FrogAccessories";
import { FrogDaydream } from "./frog/FrogDaydream";
import { FrogCrown } from "./frog/FrogCrown";
import { FrogLoveHearts } from "./frog/FrogLoveHearts";
import { FrogStoryScroll } from "./frog/FrogStoryScroll";
import { FrogDoctorMode } from "./frog/FrogDoctorMode";

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
  const [isTouched, setIsTouched] = useState(false);
  const lastTapRef = useRef(0);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleInteraction = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta < 400) {
      onClick?.();
      setIsTouched(false);
    } else {
      setIsTouched(true);
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = setTimeout(() => setIsTouched(false), 2500);
    }
  }, [onClick]);

  const displaySize = isTouched ? size * 2.2 : size;

  return (
    <motion.button
      ref={anim.containerRef as any}
      onClick={handleInteraction}
      onMouseEnter={anim.onHoverStart}
      onMouseLeave={anim.onHoverEnd}
      className="cursor-pointer select-none focus:outline-none relative"
      aria-label="Toque duas vezes para falar com o Verdinho — Assistente IA"
      title="Toque 2x para conversar com o Verdinho 🐸"
      whileTap={{ scale: 0.9, rotate: -5 }}
      whileHover={{ scale: 2 }}
      animate={anim.controls}
      initial={{ width: displaySize, height: displaySize }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ width: displaySize, height: displaySize }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-lg"
        animate={{
          scale: isTouched ? 1.8 : anim.isHovered ? 1.6 : anim.messageBounce ? 1.4 : 1,
          opacity: isTouched ? 0.7 : anim.isHovered ? 0.6 : anim.messageBounce ? 0.5 : 0.2,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Touch indicator ring */}
      {isTouched && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/60"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, repeat: 2 }}
        />
      )}

      {/* Message bounce pulse */}
      {anim.messageBounce && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8, repeat: 2 }}
        />
      )}

      {/* BODY layer — breathing scale (always visible, doctor overlays on top) */}
      <motion.div
        className="relative z-10"
        animate={{ scaleY: anim.breathScale }}
        transition={{ duration: 0 }}
        style={{ transformOrigin: "50% 100%" }}
      >
        <img
          src={verdinhoImg}
          alt=""
          width={displaySize}
          height={displaySize}
          className="drop-shadow-lg pointer-events-none"
          style={{ clipPath: `inset(${displaySize * 0.45}px 0 0 0)` }}
          draggable={false}
        />

        <FrogAccessories
          size={displaySize}
          isWaving={anim.isWaving}
          expression={anim.expression}
          cheekBlush={anim.cheekBlush}
        />
      </motion.div>

      {/* HEAD layer — 3D perspective (always visible) */}
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
            width={displaySize}
            height={displaySize}
            className={`pointer-events-none ${anim.isDoctorMode ? '' : 'drop-shadow-lg'}`}
            style={{ 
            clipPath: anim.isDoctorMode 
                ? `inset(${displaySize * 0.15}px 0 ${displaySize * 0.48}px 0)` 
                : `inset(0 0 ${displaySize * 0.48}px 0)` 
            }}
            draggable={false}
          />
          {/* Prince Crown — only appears after princess kiss, NOT in doctor mode */}
          <AnimatePresence>
            {anim.showCrown && !anim.isDoctorMode && <FrogCrown size={displaySize} isHovered={anim.isHovered || isTouched} />}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Doctor Mode overlay (coat, stethoscope, clipboard — on top of frog) */}
      <FrogDoctorMode
        size={displaySize}
        isDoctor={anim.isDoctorMode}
        lookingAtChart={anim.lookingAtChart}
      />

      {/* Eyes + Mouth SVG overlay */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        viewBox={`0 0 ${displaySize} ${displaySize}`}
        width={displaySize}
        height={displaySize}
      >
        <FrogEyes
          size={displaySize}
          expression={anim.expression}
          blink={anim.blink}
          eyeOffset={anim.eyeOffset}
          eyeSparkle={anim.eyeSparkle}
        />
        <FrogMouth
          size={displaySize}
          expression={anim.expression}
          smile={anim.smile}
          isHovered={anim.isHovered || isTouched}
          tongueOut={anim.tongueOut}
        />
      </svg>

      {/* Waving arm — hidden during doctor mode */}
      {anim.isWaving && !anim.isDoctorMode && (
        <motion.svg
          className="absolute z-30 pointer-events-none"
          style={{
            right: -displaySize * 0.15,
            top: displaySize * 0.3,
            width: displaySize * 0.4,
            height: displaySize * 0.5,
          }}
          viewBox="0 0 40 50"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -20, 12, -15, 8, 0] }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <path d="M 5 44 Q 4 34 7 26 Q 9 21 12 17 Q 15 13 18 10" stroke="#3d8b3d" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M 5 44 Q 4 34 7 26 Q 9 21 12 17 Q 15 13 18 10" stroke="#5bb85b" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M 5 44 Q 4 34 7 26 Q 9 21 12 17 Q 15 13 18 10" stroke="#6ecf6e" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 6 40 Q 5 32 8 24 Q 11 19 14 14" stroke="#8de88d" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
          <ellipse cx="19" cy="9" rx="6" ry="5" fill="#5bb85b" />
          <ellipse cx="19" cy="9" rx="4.5" ry="3.5" fill="#6ecf6e" opacity="0.7" />
          <ellipse cx="14" cy="4" rx="2.2" ry="2.8" fill="#5bb85b" transform="rotate(-12 14 4)" />
          <ellipse cx="19" cy="2.5" rx="2.2" ry="3" fill="#5bb85b" />
          <ellipse cx="24" cy="4" rx="2.2" ry="2.8" fill="#5bb85b" transform="rotate(12 24 4)" />
          <circle cx="14" cy="2.5" r="1.4" fill="#4a9e4a" opacity="0.8" />
          <circle cx="19" cy="1" r="1.4" fill="#4a9e4a" opacity="0.8" />
          <circle cx="24" cy="2.5" r="1.4" fill="#4a9e4a" opacity="0.8" />
        </motion.svg>
      )}

      {/* Expression emoji */}
      {emoji && !anim.isDaydreaming && !anim.isDoctorMode && (
        <motion.span
          className="absolute -top-1 -right-1 z-40 text-xs pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          key={anim.expression}
        >
          {emoji}
        </motion.span>
      )}

      {/* Love hearts */}
      <FrogLoveHearts size={displaySize} show={anim.isDaydreaming && !anim.isDoctorMode} />

      {/* Daydream bubble */}
      <FrogDaydream size={displaySize} isDaydreaming={anim.isDaydreaming} daydreamPhase={anim.daydreamPhase} />

      {/* Star Wars story scroll on hover */}
      <FrogStoryScroll show={anim.isHovered || isTouched} size={displaySize} />

      {/* Tooltip hint for double-tap */}
      {isTouched && (
        <motion.div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm text-foreground text-[11px] font-bold px-4 py-2 rounded-full shadow-xl whitespace-nowrap z-50 border border-primary/30"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
        >
          Toque 2x para conversar com nosso assistente IA Verdinho 💬🐸
        </motion.div>
      )}
    </motion.button>
  );
});

FrogMascot.displayName = "FrogMascot";
