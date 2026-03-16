import { useState, useEffect, useRef, useCallback } from "react";
import { useAnimation } from "framer-motion";

export type FrogExpression =
  | "happy" | "thinking" | "excited" | "sleeping" | "waving"
  | "confused" | "love" | "dizzy" | "angry" | "surprised"
  | "singing" | "laughing" | "crying" | "cool" | "sneeze";

const ALL_MOODS: FrogExpression[] = [
  "happy", "thinking", "sleeping", "excited",
  "love", "dizzy", "surprised", "singing", "laughing",
  "crying", "cool", "sneeze"
];

// Detect Android for performance optimizations
const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

export function useFrogAnimations(baseMood: FrogExpression, hasNewMessage: boolean, size: number) {
  const [isHovered, setIsHovered] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headRotation, setHeadRotation] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [smile, setSmile] = useState(false);
  const [expression, setExpression] = useState<FrogExpression>(baseMood);
  const [messageBounce, setMessageBounce] = useState(false);
  const [autoMood, setAutoMood] = useState<FrogExpression | null>(null);
  const [isWaving, setIsWaving] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isDaydreaming, setIsDaydreaming] = useState(false);
  const [daydreamPhase, setDaydreamPhase] = useState<"thinking" | "kiss" | "hearts" | "wakeup" | null>(null);
  const [breathScale, setBreathScale] = useState(1);
  const [tongueOut, setTongueOut] = useState(false);
  const [cheekBlush, setCheekBlush] = useState(0);
  const [eyeSparkle, setEyeSparkle] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [sneezing, setSneezing] = useState(false);
  const [showCrown, setShowCrown] = useState(false);
  const [isDoctorMode, setIsDoctorMode] = useState(false);
  const [lookingAtChart, setLookingAtChart] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const MAX_EYE_OFFSET = 0.025;

  useEffect(() => { if (!autoMood) setExpression(baseMood); }, [baseMood, autoMood]);

  // 3D head tracking — throttled on Android
  useEffect(() => {
    let rafId: number | null = null;
    let lastUpdate = 0;
    const throttleMs = isAndroid ? 100 : 16; // Android: 10fps, Desktop: 60fps

    const handlePointer = (clientX: number, clientY: number) => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = Math.min(dist / 300, 1);
      const maxOff = size * MAX_EYE_OFFSET;
      setEyeOffset({
        x: (dx / (dist || 1)) * maxOff * factor,
        y: (dy / (dist || 1)) * maxOff * factor,
      });
      setHeadRotation({
        x: Math.max(-25, Math.min(25, (dx / 300) * 25)),
        y: Math.max(-15, Math.min(15, -(dy / 300) * 15)),
      });
    };
    const onMouse = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [size]);

  // Blinking — double blink sometimes
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
      if (Math.random() < 0.3) {
        setTimeout(() => {
          setBlink(true);
          setTimeout(() => setBlink(false), 100);
        }, 250);
      }
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Smile cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setSmile(true);
      setTimeout(() => setSmile(false), 1200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Breathing animation — CSS-based on Android, rAF on desktop
  useEffect(() => {
    if (isAndroid) {
      // Use simpler interval-based breathing on Android to save CPU
      const interval = setInterval(() => {
        const t = Date.now() / 1000;
        setBreathScale(1 + Math.sin(t * 1.2) * 0.015);
      }, 200); // 5fps is enough for subtle breathing
      return () => clearInterval(interval);
    }

    let frame: number;
    let start = Date.now();
    const animate = () => {
      const t = (Date.now() - start) / 1000;
      setBreathScale(1 + Math.sin(t * 1.2) * 0.015);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Random personality shifts — longer intervals on Android
  useEffect(() => {
    const baseInterval = isAndroid ? 25000 : 20000;
    const randomExtra = isAndroid ? 15000 : 12000;
    const interval = setInterval(() => {
      if (isDoctorMode) return;
      const safeMoods = ALL_MOODS.filter(mood => mood !== "love" && mood !== "angry");
      const m = safeMoods[Math.floor(Math.random() * safeMoods.length)];
      setAutoMood(m as FrogExpression);
      setExpression(m as FrogExpression);

      if (m === "surprised") { setCheekBlush(0.4); setEyeSparkle(true); }
      if (m === "sneeze") setSneezing(true);
      if (m === "laughing") setIsBouncing(true);
      if (m === "cool") setHeadTilt(-5);

      setTimeout(() => {
        setAutoMood(null);
        if (!isDoctorMode) setExpression(baseMood);
        setCheekBlush(0);
        setEyeSparkle(false);
        setSneezing(false);
        setIsBouncing(false);
        setHeadTilt(0);
      }, 4000);
    }, baseInterval + Math.random() * randomExtra);
    return () => clearInterval(interval);
  }, [baseMood, isDoctorMode]);

  // Idle bounce — less frequent on Android
  useEffect(() => {
    const baseInterval = isAndroid ? 6000 : 4000;
    const doJump = () => {
      if (isDoctorMode) return;
      controls.start({
        y: [0, -14, -4, -10, 0],
        transition: { duration: 0.7, ease: "easeInOut", times: [0, 0.3, 0.5, 0.7, 1] },
      });
    };
    const interval = setInterval(doJump, baseInterval + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [controls, isDoctorMode]);

  // Waving arm — less frequent on Android
  useEffect(() => {
    const waveInterval = isAndroid ? 30000 : 20000;
    const doWave = () => {
      if (isDoctorMode) return;
      setIsWaving(true);
      setExpression("waving");
      setTimeout(() => {
        setIsWaving(false);
        if (!isDoctorMode) setExpression(baseMood);
      }, 1800);
    };
    const interval = setInterval(doWave, waveInterval);
    return () => clearInterval(interval);
  }, [baseMood, isDoctorMode]);

  // Daydream sequence — longer intervals on Android
  useEffect(() => {
    const daydreamInterval = isAndroid ? 35000 : 25000;
    const initialDelay = isAndroid ? 12000 : 8000;
    const doDaydream = () => {
      if (isDoctorMode) return;
      setIsDaydreaming(true);
      setDaydreamPhase("thinking");
      setExpression("love");
      setCheekBlush(0.8);
      setEyeSparkle(true);

      setTimeout(() => {
        setDaydreamPhase("kiss");
        setShowCrown(true);
        setTimeout(() => setShowCrown(false), 10000);
      }, 2000);

      setTimeout(() => { setDaydreamPhase("hearts"); }, 3500);

      // 3 bounces when receiving the kiss
      setTimeout(() => {
        controls.start({
          y: [0, -18, 0, -12, 0, -8, 0],
          transition: { duration: 0.9, ease: "easeInOut", times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1] },
        });
      }, 2500);

      setTimeout(() => {
        setDaydreamPhase("wakeup");
        setIsDaydreaming(false);
        setExpression("happy");
        setCheekBlush(0);
        setEyeSparkle(false);
      }, 10000);

      setTimeout(() => {
        setDaydreamPhase(null);
        if (!isDoctorMode) setExpression(baseMood);
      }, 12000);
    };
    const timeout = setTimeout(doDaydream, initialDelay);
    const interval = setInterval(doDaydream, daydreamInterval);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [baseMood, isDoctorMode]);

  // Tongue flick — less frequent on Android
  useEffect(() => {
    const baseInterval = isAndroid ? 30000 : 20000;
    const interval = setInterval(() => {
      if (!isDoctorMode) {
        setTongueOut(true);
        setTimeout(() => setTongueOut(false), 600);
      }
    }, baseInterval + Math.random() * 10000);
    return () => clearInterval(interval);
  }, [isDoctorMode]);

  // Doctor mode — less frequent on Android
  useEffect(() => {
    const doctorInterval = isAndroid ? 50000 : 40000;
    const doDoctorMode = () => {
      setIsDoctorMode(true);
      setShowCrown(false);
      setIsDaydreaming(false);
      setDaydreamPhase(null);
      setIsWaving(false);
      setExpression("thinking");
      setLookingAtChart(true);
      setEyeOffset({ x: size * 0.025, y: size * 0.01 });

      const chartCycle = setInterval(() => {
        setLookingAtChart(prev => {
          const next = !prev;
          setEyeOffset(next ? { x: size * 0.025, y: size * 0.01 } : { x: -size * 0.01, y: 0 });
          return next;
        });
      }, 3000);

      setTimeout(() => {
        clearInterval(chartCycle);
        setIsDoctorMode(false);
        setLookingAtChart(false);
        setExpression(baseMood);
      }, 10000);
    };

    const interval = setInterval(doDoctorMode, doctorInterval);
    return () => clearInterval(interval);
  }, [baseMood]);

  // New message bounce
  useEffect(() => {
    if (hasNewMessage) {
      setMessageBounce(true);
      setExpression("excited");
      const t = setTimeout(() => { setMessageBounce(false); setExpression(baseMood); }, 1500);
      return () => clearTimeout(t);
    }
  }, [hasNewMessage, baseMood]);

  const onHoverStart = useCallback(() => {
    setIsHovered(true);
    setExpression("excited");
    setCheekBlush(0.4);
    setEyeSparkle(true);
  }, []);

  const onHoverEnd = useCallback(() => {
    setIsHovered(false);
    setExpression(baseMood);
    setCheekBlush(0);
    setEyeSparkle(false);
  }, [baseMood]);

  return {
    containerRef, controls, isHovered, eyeOffset, headRotation, blink, smile,
    expression, messageBounce, isWaving, isBouncing, breathScale, tongueOut,
    cheekBlush, eyeSparkle, headTilt, sneezing, isDaydreaming, daydreamPhase,
    showCrown, isDoctorMode, lookingAtChart, onHoverStart, onHoverEnd,
  };
}
