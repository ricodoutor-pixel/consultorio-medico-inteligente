import { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import verdinhoImg from "@/assets/verdinho-mascot.png";

interface FrogMascotProps {
  onClick?: () => void;
  size?: number;
  mood?: "happy" | "thinking" | "excited" | "sleeping" | "waving";
  enableJumpToNav?: boolean;
}

// Paw print component that appears during jumps
const PawPrint = memo(({ x, y, delay, flip }: { x: number; y: number; delay: number; flip?: boolean }) => (
  <motion.div
    className="fixed pointer-events-none z-[60]"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 0.6, 0.4, 0], scale: [0.3, 1, 0.9, 0.5] }}
    transition={{ duration: 1.8, delay, ease: "easeOut" }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ transform: flip ? "scaleX(-1)" : "none" }}>
      {/* Main pad */}
      <ellipse cx="12" cy="15" rx="5.5" ry="4.5" fill="hsl(var(--primary))" opacity="0.5" />
      {/* Toe beans */}
      <circle cx="7" cy="9" r="2.2" fill="hsl(var(--primary))" opacity="0.45" />
      <circle cx="12" cy="7" r="2.2" fill="hsl(var(--primary))" opacity="0.45" />
      <circle cx="17" cy="9" r="2.2" fill="hsl(var(--primary))" opacity="0.45" />
    </svg>
  </motion.div>
));
PawPrint.displayName = "PawPrint";

// Eye overlay positions (relative to the image)
const LEFT_EYE = { cx: 0.35, cy: 0.32 };
const RIGHT_EYE = { cx: 0.62, cy: 0.32 };
const PUPIL_RADIUS_RATIO = 0.05;
const MAX_EYE_OFFSET = 0.03;

export const FrogMascot = memo(({ onClick, size = 64, mood = "happy", enableJumpToNav = false }: FrogMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headRotate, setHeadRotate] = useState(0);
  const [blink, setBlink] = useState(false);
  const [expression, setExpression] = useState(mood);
  const [isJumping, setIsJumping] = useState(false);
  const [pawPrints, setPawPrints] = useState<{ id: number; x: number; y: number; flip: boolean; delay: number }[]>([]);
  const [smileWidth, setSmileWidth] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const pawIdRef = useRef(0);

  useEffect(() => setExpression(mood), [mood]);

  // Eye tracking + head rotation following mouse/touch
  useEffect(() => {
    const handlePointer = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.32;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = Math.min(dist / 300, 1);
      const maxOff = size * MAX_EYE_OFFSET;
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOff * factor,
        y: (dy / (dist || 1)) * maxOff * factor,
      });
      // Head rotation towards mouse (max ±15 degrees)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const headTilt = Math.max(-15, Math.min(15, dx / 15));
      setHeadRotate(headTilt);
      // Smile widens when mouse is closer
      setSmileWidth(dist < 200 ? 1.3 : 1);
    };

    const onMouse = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [size]);

  // Blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, 2500 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, []);

  // Spawn paw prints during jump
  const spawnPawPrints = useCallback((startX: number, startY: number, direction: number, count: number) => {
    const newPrints: typeof pawPrints = [];
    for (let i = 0; i < count; i++) {
      pawIdRef.current++;
      newPrints.push({
        id: pawIdRef.current,
        x: startX + direction * (i * 40 + Math.random() * 15),
        y: startY + (i % 2 === 0 ? -3 : 3) + Math.random() * 6,
        flip: direction < 0,
        delay: i * 0.12,
      });
    }
    setPawPrints(prev => [...prev, ...newPrints]);
    // Clean up old paw prints after animation
    setTimeout(() => {
      setPawPrints(prev => prev.filter(p => !newPrints.find(np => np.id === p.id)));
    }, 3000);
  }, []);

  // Idle bounce - real frog-like sideways hop
  useEffect(() => {
    const doHop = async () => {
      if (isJumping) return;
      setIsJumping(true);
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        spawnPawPrints(rect.left + rect.width / 2, rect.bottom, 1, 2);
      }
      
      await controls.start({
        x: [0, 15, 25, 15, 0],
        y: [0, -18, -6, -14, 0],
        rotate: [0, -8, 2, -5, 0],
        scaleX: [1, 1.15, 0.9, 1.1, 1],
        scaleY: [1, 0.85, 1.15, 0.9, 1],
        transition: { duration: 0.8, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] },
      });
      setIsJumping(false);
    };
    const interval = setInterval(doHop, 4500 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [controls, isJumping, spawnPawPrints]);

  // Jump-to-nav: sideways frog hop along menu, with paw prints
  useEffect(() => {
    if (!enableJumpToNav) return;
    
    const doNavJump = async () => {
      if (isJumping) return;
      setIsJumping(true);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        spawnPawPrints(rect.left + rect.width, rect.bottom, 1, 6);
      }

      // Hop right with frog-like squash and stretch
      const hopCount = 5;
      const hopDist = 220;
      const hopHeight = 20;
      
      for (let i = 0; i < hopCount; i++) {
        const progress = (i + 1) / hopCount;
        await controls.start({
          x: hopDist * progress,
          y: [0, -hopHeight, 0],
          rotate: [-10, 5, -3],
          scaleX: [1.15, 0.85, 1],
          scaleY: [0.85, 1.2, 1],
          transition: { duration: 0.22, ease: "easeOut" },
        });
      }

      // Pause and look around
      await controls.start({
        rotate: [0, 8, -5, 0],
        transition: { duration: 0.6 },
      });

      // Spawn paw prints going back
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        spawnPawPrints(rect.left + rect.width + 220, rect.bottom, -1, 6);
      }

      // Hop back
      for (let i = 0; i < hopCount; i++) {
        const progress = 1 - (i + 1) / hopCount;
        await controls.start({
          x: hopDist * progress,
          y: [0, -hopHeight, 0],
          rotate: [10, -5, 3],
          scaleX: [1.15, 0.85, 1],
          scaleY: [0.85, 1.2, 1],
          transition: { duration: 0.22, ease: "easeOut" },
        });
      }

      await controls.start({
        x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1,
        transition: { duration: 0.15 },
      });
      
      setIsJumping(false);
    };

    const timeout = setTimeout(doNavJump, 6000);
    const interval = setInterval(doNavJump, 20000 + Math.random() * 10000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [controls, enableJumpToNav, isJumping, spawnPawPrints]);

  // Expression emoji
  const getExpressionEmoji = () => {
    switch (expression) {
      case "excited": return "✨";
      case "thinking": return "💭";
      case "sleeping": return "💤";
      case "waving": return "👋";
      default: return null;
    }
  };

  const emoji = getExpressionEmoji();
  const pupilR = size * PUPIL_RADIUS_RATIO;

  return (
    <>
      {/* Paw prints rendered in fixed position */}
      <AnimatePresence>
        {pawPrints.map((paw) => (
          <PawPrint key={paw.id} x={paw.x} y={paw.y} delay={paw.delay} flip={paw.flip} />
        ))}
      </AnimatePresence>

      <motion.button
        ref={containerRef as any}
        onClick={onClick}
        onMouseEnter={() => { setIsHovered(true); setExpression("excited"); }}
        onMouseLeave={() => { setIsHovered(false); setExpression(mood); }}
        className="cursor-pointer select-none focus:outline-none relative"
        aria-label="Pergunte ao Verdinho — Assistente IA"
        title="Pergunte ao Verdinho 🐸"
        whileTap={{ scale: 0.82, rotate: -12 }}
        whileHover={{ scale: 1.2 }}
        animate={controls}
        style={{ width: size, height: size }}
      >
        {/* 3D-like shadow beneath frog */}
        <motion.div
          className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 rounded-full bg-black/15 blur-sm"
          style={{ width: size * 0.7, height: size * 0.15 }}
          animate={{
            scaleX: isJumping ? 0.5 : isHovered ? 1.3 : 1,
            opacity: isJumping ? 0.1 : 0.2,
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Glow ring */}
        <motion.div
          className="absolute inset-[-6px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
          }}
          animate={{
            scale: isHovered ? 1.6 : 1.1,
            opacity: isHovered ? 0.8 : 0.3,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Main mascot image with head rotation */}
        <motion.div
          className="relative z-10"
          animate={{
            rotateZ: headRotate,
            rotateY: headRotate * 0.5,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          style={{
            perspective: "600px",
            transformStyle: "preserve-3d",
          }}
        >
          <img
            src={verdinhoImg}
            alt="Verdinho - Assistente IA com coroa dourada"
            width={size}
            height={size}
            className="drop-shadow-[0_4px_12px_rgba(16,185,129,0.3)] pointer-events-none"
            style={{
              filter: `drop-shadow(0 ${isJumping ? 8 : 3}px ${isJumping ? 16 : 8}px rgba(16,185,129,0.35))`,
            }}
            draggable={false}
          />

          {/* Eye overlay - tracking pupils */}
          <svg
            className="absolute inset-0 z-20 pointer-events-none"
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
          >
            {!blink && (
              <>
                {/* Left pupil */}
                <circle
                  cx={size * LEFT_EYE.cx + eyeOffset.x}
                  cy={size * LEFT_EYE.cy + eyeOffset.y}
                  r={pupilR}
                  fill="#111"
                  opacity="0.85"
                />
                <circle
                  cx={size * LEFT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4}
                  cy={size * LEFT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5}
                  r={pupilR * 0.45}
                  fill="white"
                  opacity="0.95"
                />
                {/* Right pupil */}
                <circle
                  cx={size * RIGHT_EYE.cx + eyeOffset.x}
                  cy={size * RIGHT_EYE.cy + eyeOffset.y}
                  r={pupilR}
                  fill="#111"
                  opacity="0.85"
                />
                <circle
                  cx={size * RIGHT_EYE.cx + eyeOffset.x * 0.3 - pupilR * 0.4}
                  cy={size * RIGHT_EYE.cy + eyeOffset.y * 0.3 - pupilR * 0.5}
                  r={pupilR * 0.45}
                  fill="white"
                  opacity="0.95"
                />
              </>
            )}
            {/* Blink */}
            {blink && (
              <>
                <line
                  x1={size * LEFT_EYE.cx - size * 0.06}
                  y1={size * LEFT_EYE.cy}
                  x2={size * LEFT_EYE.cx + size * 0.06}
                  y2={size * LEFT_EYE.cy}
                  stroke="#2d8a4e"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <line
                  x1={size * RIGHT_EYE.cx - size * 0.06}
                  y1={size * RIGHT_EYE.cy}
                  x2={size * RIGHT_EYE.cx + size * 0.06}
                  y2={size * RIGHT_EYE.cy}
                  stroke="#2d8a4e"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </>
            )}
            {/* Smile overlay */}
            <motion.path
              d={`M ${size * 0.38} ${size * 0.48} Q ${size * 0.5} ${size * (0.48 + 0.06 * smileWidth)} ${size * 0.62} ${size * 0.48}`}
              fill="none"
              stroke="#2d8a4e"
              strokeWidth={1.8}
              strokeLinecap="round"
              opacity={0.7}
            />
          </svg>
        </motion.div>

        {/* Expression emoji */}
        {emoji && (
          <motion.span
            className="absolute -top-2 -right-2 z-30 text-sm pointer-events-none"
            initial={{ opacity: 0, scale: 0, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            key={expression}
          >
            {emoji}
          </motion.span>
        )}

        {/* Hover speech bubble */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold pointer-events-none bg-primary/20 border border-primary/30 text-primary z-40 backdrop-blur-sm"
              initial={{ opacity: 0, y: 6, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.8 }}
            >
              Fale comigo! 🐸✨
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
});

FrogMascot.displayName = "FrogMascot";
