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
        <img
          src={icon}
          alt={`Verdinho ${mood}`}
          className="w-10 h-10 rounded-full shrink-0"
          width={40}
          height={40}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${style.text}`}>
            Verdinho diz:
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {message}
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
