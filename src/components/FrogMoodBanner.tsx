import { useState } from "react";
import { X } from "lucide-react";
import { useFrogMood, FrogMood } from "@/hooks/useFrogMood";
import { motion, AnimatePresence } from "framer-motion";

const moodStyles: Record<FrogMood, { bg: string; border: string; text: string }> = {
  happy: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
  },
};

export function FrogMoodBanner() {
  const { mood, message, icon } = useFrogMood();
  const [dismissed, setDismissed] = useState(false);
  const style = moodStyles[mood];

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${style.bg} ${style.border} border rounded-xl p-3 mx-4 mb-4 flex items-center gap-3`}
      >
        {/* Animated breathing frog head */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="shrink-0"
        >
          <svg viewBox="0 0 60 60" className="w-12 h-12 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="26" fill={mood === "critical" ? "#ef4444" : mood === "warning" ? "#eab308" : "#10b981"} />
            <circle cx="22" cy="24" r="4" fill="#ffffff" />
            <circle cx="38" cy="24" r="4" fill="#ffffff" />
            <circle cx="22" cy="24" r="2" fill="#000000" className="animate-pulse" />
            <circle cx="38" cy="24" r="2" fill="#000000" className="animate-pulse" />
            {mood === "happy" && (
              <path d="M 22 36 Q 30 42 38 36" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            )}
            {mood === "warning" && (
              <line x1="22" y1="37" x2="38" y2="37" stroke="#ffffff" strokeWidth="2.5" />
            )}
            {mood === "critical" && (
              <path d="M 22 40 Q 30 34 38 40" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            )}
          </svg>
        </motion.div>

        {/* Speech bubble */}
        <div className="flex-1 min-w-0 relative">
          <div className="absolute -left-2 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-muted/50 border-b-[6px] border-b-transparent" />
          <div className="bg-muted/30 rounded-lg px-3 py-2">
            <p className={`text-xs font-bold ${style.text}`}>
              Verdinho diz:
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {message}
            </p>
          </div>
        </div>

        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
