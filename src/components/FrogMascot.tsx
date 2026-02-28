import { useEffect, useState, useRef, memo, useCallback } from "react";
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
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [clickCount, setClickCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const reduceMotion = useReducedMotion();
  const isCompact = size < 40;
  const effectiveJumpDistance = isCompact || reduceMotion ? 0 : jumpDistance;
  const stageWidth = isCompact ? size + 10 : size + effectiveJumpDistance + 28;
  const stageHeight = isCompact ? size + 6 : size + 14;

  const images = [verdinhoKiss, verdinhoScepter];

  const isJumping = phase === "jump";
  const isDancing = phase === "dance";
  const isCelebrating = phase === "celebrate";

  // Mouse tracking for eye-follow effect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || isCompact) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / window.innerWidth;
    const dy = (e.clientY - cy) / window.innerHeight;
    setMouseOffset({ x: dx * 6, y: dy * 4 });
  }, [isCompact]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

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
      const duration = phases[idx] === "jump" ? 1650 : phases[idx] === "celebrate" ? 2500 : 2200;
      timeout = window.setTimeout(() => {
        setPhase("rest");
        timeout = window.setTimeout(cycle, 1200);
      }, duration);
    };
    timeout = window.setTimeout(cycle, 2500);
    return () => clearTimeout(timeout);
  }, [reduceMotion]);

  const handleClick = () => {
    setIsClicked(true);
    setClickCount(prev => prev + 1);
    setPhase("celebrate");
    setImageIndex(prev => (prev + 1) % 2);
    window.setTimeout(() => {
      setIsClicked(false);
      setPhase("rest");
    }, 1200);
    onClick?.();
  };

  // Emoji particles on click
  const clickEmojis = ["✨", "🌿", "💚", "🐸", "👑", "🌱", "💫"];
  const currentEmoji = clickEmojis[clickCount % clickEmojis.length];

  return (
    <div
      ref={containerRef}
      className="relative overflow-visible"
      style={{ width: stageWidth, height: stageHeight }}
    >
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("absolute left-0 bottom-0 cursor-pointer select-none focus:outline-none")}
        aria-label="Pergunte ao Verdinho — Assistente IA"
        title="Pergunte ao Verdinho 🐸"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.15 }}
        animate={
          isJumping && !isCompact
            ? {
                x: [0, effectiveJumpDistance, effectiveJumpDistance * 0.3, 0],
                y: [0, -size * 0.55, -size * 0.2, 0],
              }
            : isDancing
            ? { rotate: [0, -14, 14, -14, 14, 0] }
            : isCelebrating
            ? { y: [0, -size * 0.45, 0], scale: [1, 1.2, 1] }
            : {
                x: mouseOffset.x,
                y: mouseOffset.y,
                rotate: mouseOffset.x * 2,
              }
        }
        transition={
          isJumping && !isCompact
            ? { duration: 1.65, times: [0, 0.45, 0.72, 1], ease: "easeInOut" }
            : isDancing
            ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
            : isCelebrating
            ? { duration: 0.6, repeat: 2, ease: "easeOut" }
            : { duration: 0.6, ease: "easeOut" }
        }
      >
        {/* Glow ring behind mascot */}
        <motion.div
          className="absolute inset-[-6px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(152 80% 45% / 0.25), hsl(270 60% 60% / 0.1), transparent 70%)",
          }}
          animate={{
            opacity: isHovered ? 1 : [0.2, 0.5, 0.2],
            scale: isHovered ? 1.3 : [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={imageIndex}
            className="relative"
            style={{ width: size, height: size }}
            initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
            transition={{ duration: 0.4, ease: "backOut" }}
          >
            <img
              src={images[imageIndex]}
              alt="Verdinho - Assistente IA"
              className="w-full h-full object-contain rounded-full"
              style={{
                filter: "drop-shadow(0 0 8px hsl(152 80% 45% / 0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                mixBlendMode: "multiply",
              }}
              draggable={false}
            />
            {/* Green overlay tint for better integration */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, transparent 60%, hsl(152 80% 45% / 0.08) 100%)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Crown sparkle effect */}
        {!isCompact && (
          <motion.span
            className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
            animate={{
              opacity: [0, 1, 0],
              y: [-2, -6, -2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          >
            👑
          </motion.span>
        )}

        {/* Celebration / Jump particles */}
        <AnimatePresence>
          {(isCelebrating || isJumping || isClicked) && !isCompact && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={`particle-${i}-${clickCount}`}
                  className="absolute pointer-events-none text-xs"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: "50%",
                  }}
                  initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [-10 - i * 8, -25 - i * 12],
                    x: [(i - 1.5) * 10, (i - 1.5) * 18],
                    scale: [0.5, 1.2, 0],
                    rotate: [0, (i % 2 === 0 ? 1 : -1) * 30],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                >
                  {["✨", "🌿", "💚", "🐸"][i]}
                </motion.span>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Speech bubble on hover */}
        <AnimatePresence>
          {isHovered && !isCompact && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold pointer-events-none"
              style={{
                background: "hsl(152 80% 45% / 0.2)",
                border: "1px solid hsl(152 80% 45% / 0.3)",
                color: "hsl(152 80% 45%)",
              }}
              initial={{ opacity: 0, y: 5, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              Fale comigo! 🐸
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring on click */}
        <AnimatePresence>
          {isClicked && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: "2px solid hsl(152 80% 45% / 0.6)" }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
});

FrogMascot.displayName = "FrogMascot";
