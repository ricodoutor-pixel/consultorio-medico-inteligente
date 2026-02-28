import { useEffect, useState, memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import verdinhoKiss from "@/assets/verdinho-kiss.jpg";
import verdinhoScepter from "@/assets/verdinho-scepter.jpg";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  jumpDistance?: number;
}

type FrogPhase = "rest" | "jump" | "prince" | "wave" | "dance" | "celebrate";

export const FrogMascot = memo(({ onClick, size = 60, jumpDistance = 90 }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [phase, setPhase] = useState<FrogPhase>("rest");
  const [imageIndex, setImageIndex] = useState(0);

  const reduceMotion = useReducedMotion();
  const isCompact = size < 40;
  const effectiveJumpDistance = isCompact || reduceMotion ? 0 : jumpDistance;
  const stageWidth = isCompact ? size + 10 : size + effectiveJumpDistance + 28;
  const stageHeight = isCompact ? size + 6 : size + 10;

  const images = [verdinhoKiss, verdinhoScepter];

  const isJumping = phase === "jump";
  const isDancing = phase === "dance";
  const isCelebrating = phase === "celebrate";

  // Phase cycle
  useEffect(() => {
    if (reduceMotion) return;
    const phases: FrogPhase[] = ["rest", "prince", "dance", "jump", "wave", "celebrate"];
    let idx = 0;

    let timeout: number;
    const cycle = () => {
      idx = (idx + 1) % phases.length;
      setPhase(phases[idx]);
      setImageIndex(prev => (prev + 1) % 2);
      const duration = phases[idx] === "jump" ? 1650 : phases[idx] === "celebrate" ? 2500 : 2000;
      timeout = window.setTimeout(() => {
        setPhase("rest");
        timeout = window.setTimeout(cycle, 1000);
      }, duration);
    };
    timeout = window.setTimeout(cycle, 2000);
    return () => clearTimeout(timeout);
  }, [reduceMotion]);

  const handleClick = () => {
    setIsClicked(true);
    setPhase("celebrate");
    setImageIndex(prev => (prev + 1) % 2);
    window.setTimeout(() => {
      setIsClicked(false);
      setPhase("rest");
    }, 1200);
    onClick?.();
  };

  return (
    <div className="relative overflow-visible" style={{ width: stageWidth, height: stageHeight }}>
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("absolute left-0 bottom-0 cursor-pointer select-none focus:outline-none")}
        aria-label="Pergunte ao Verdinho — Assistente IA"
        title="Pergunte ao Verdinho 🐸"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.12 }}
        animate={
          isJumping && !isCompact
            ? {
                x: [0, effectiveJumpDistance, effectiveJumpDistance * 0.3, 0],
                y: [0, -size * 0.5, -size * 0.2, 0],
              }
            : isDancing
            ? { rotate: [0, -12, 12, -12, 0] }
            : isCelebrating
            ? { y: [0, -size * 0.4, 0], scale: [1, 1.15, 1] }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={
          isJumping && !isCompact
            ? { duration: 1.65, times: [0, 0.45, 0.72, 1], ease: "easeInOut" }
            : isDancing
            ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
            : isCelebrating
            ? { duration: 0.6, repeat: 2, ease: "easeOut" }
            : { duration: 0.45, ease: "easeOut" }
        }
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={imageIndex}
            src={images[imageIndex]}
            alt="Verdinho - Assistente IA"
            className="rounded-full object-contain drop-shadow-lg"
            style={{ width: size, height: size }}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
            transition={{ duration: 0.35 }}
            draggable={false}
          />
        </AnimatePresence>

        {/* Celebration effects */}
        <AnimatePresence>
          {(isCelebrating || isJumping) && !isCompact && (
            <>
              <motion.span
                className="absolute -top-2 left-1/4 text-[10px] pointer-events-none"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <motion.span
                className="absolute -top-1 right-1/4 text-[10px] pointer-events-none"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], y: -15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, repeat: Infinity, delay: 0.3 }}
              >
                🌿
              </motion.span>
              <motion.span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, repeat: Infinity }}
              >
                💚
              </motion.span>
            </>
          )}
        </AnimatePresence>

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)" }}
          animate={{ opacity: isHovered ? 0.9 : [0.1, 0.3, 0.1] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        />
      </motion.button>
    </div>
  );
});

FrogMascot.displayName = "FrogMascot";
