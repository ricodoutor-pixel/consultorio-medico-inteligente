import { useState, useEffect, useRef, useCallback } from "react";
import { useAnimation } from "framer-motion";

export type FrogExpression =
  | "happy" | "thinking" | "excited" | "sleeping" | "waving"
  | "confused" | "love" | "dizzy" | "angry" | "surprised"
  | "singing" | "laughing" | "crying" | "cool" | "sneeze";

const ALL_MOODS: FrogExpression[] = [
  "happy", "thinking", "confused", "sleeping", "excited",
  "love", "dizzy", "surprised", "singing", "laughing",
  "crying", "cool", "sneeze"
];

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

  // 3D head tracking
  useEffect(() => {
    const handlePointer = (clientX: number, clientY: number) => {
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
    window.addEventListener("mousemove", onMouse);
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

  // Breathing animation
  useEffect(() => {
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

  // Random personality shifts — varied expressions (every 12-20s, lasts 4s)
  useEffect(() => {
    const interval = setInterval(() => {
      const safeMoods = ALL_MOODS.filter(mood => mood !== "love" && mood !== "angry");
      const m = safeMoods[Math.floor(Math.random() * safeMoods.length)];
      setAutoMood(m as FrogExpression);
      setExpression(m as FrogExpression);

      if (m === "surprised") { setCheekBlush(0.4); setEyeSparkle(true); }
      if (m === "surprised") setEyeSparkle(true);
      if (m === "sneeze") setSneezing(true);
      if (m === "laughing") setIsBouncing(true);
      if (m === "cool") setHeadTilt(-5);

      setTimeout(() => {
        setAutoMood(null);
        setExpression(baseMood);
        setCheekBlush(0);
        setEyeSparkle(false);
        setSneezing(false);
        setIsBouncing(false);
        setHeadTilt(0);
      }, 4000);
    }, 12000 + Math.random() * 8000);
    return () => clearInterval(interval);
  }, [baseMood]);

  // Idle bounce
  useEffect(() => {
    const doJump = () => {
      controls.start({
        y: [0, -14, -4, -10, 0],
        transition: { duration: 0.7, ease: "easeInOut", times: [0, 0.3, 0.5, 0.7, 1] },
      });
    };
    const interval = setInterval(doJump, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [controls]);

  // Waving arm every 20s
  useEffect(() => {
    const doWave = () => {
      setIsWaving(true);
      setExpression("waving");
      setTimeout(() => {
        setIsWaving(false);
        setExpression(baseMood);
      }, 1800);
    };
    const interval = setInterval(doWave, 20000);
    return () => clearInterval(interval);
  }, [baseMood]);

  // Daydream sequence every 30s
  useEffect(() => {
    const doDaydream = () => {
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

      setTimeout(() => {
        setDaydreamPhase("wakeup");
        setIsDaydreaming(false);
        setExpression("confused");
        setCheekBlush(0);
        setEyeSparkle(false);
      }, 5000);

      setTimeout(() => {
        setDaydreamPhase(null);
        setExpression(baseMood);
      }, 7000);
    };
    const timeout = setTimeout(doDaydream, 5000);
    const interval = setInterval(doDaydream, 15000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [baseMood]);

  // Tongue flick every 20s (not during doctor mode)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDoctorMode) {
        setTongueOut(true);
        setTimeout(() => setTongueOut(false), 600);
      }
    }, 20000 + Math.random() * 10000);
    return () => clearInterval(interval);
  }, [isDoctorMode]);

  // Doctor mode — every 30s, lasts 10s
  useEffect(() => {
    const doDoctorMode = () => {
      setIsDoctorMode(true);
      setShowCrown(false);
      setIsDaydreaming(false);
      setDaydreamPhase(null);
      setIsWaving(false);
      setExpression("thinking");
      setLookingAtChart(true);

      // Look at chart for 3s, then look at patient for 3s, repeat
      const chartCycle = setInterval(() => {
        setLookingAtChart(prev => !prev);
      }, 3000);

      setTimeout(() => {
        clearInterval(chartCycle);
        setIsDoctorMode(false);
        setLookingAtChart(false);
        setExpression(baseMood);
      }, 10000);
    };

    const interval = setInterval(doDoctorMode, 30000);
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
