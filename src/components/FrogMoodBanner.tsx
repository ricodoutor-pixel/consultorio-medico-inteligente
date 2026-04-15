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
  const { mood, message } = useFrogMood();

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {/* Cabeça do Verdinho sem fundo/moldura */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 64 64" className="w-14 h-14 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
          {/* Cabeça */}
          <ellipse cx="32" cy="34" rx="26" ry="22" fill={mood === "critical" ? "#ef4444" : mood === "warning" ? "#eab308" : "#22c55e"} />
          {/* Olhos - protuberâncias */}
          <circle cx="20" cy="18" r="10" fill={mood === "critical" ? "#ef4444" : mood === "warning" ? "#eab308" : "#22c55e"} />
          <circle cx="44" cy="18" r="10" fill={mood === "critical" ? "#ef4444" : mood === "warning" ? "#eab308" : "#22c55e"} />
          {/* Olhos brancos */}
          <circle cx="20" cy="17" r="6" fill="#ffffff" />
          <circle cx="44" cy="17" r="6" fill="#ffffff" />
          {/* Pupilas */}
          <circle cx="21" cy="17" r="3" fill="#1a1a2e" />
          <circle cx="45" cy="17" r="3" fill="#1a1a2e" />
          {/* Brilho nos olhos */}
          <circle cx="19" cy="15" r="1.2" fill="#ffffff" opacity="0.9" />
          <circle cx="43" cy="15" r="1.2" fill="#ffffff" opacity="0.9" />
          {/* Narinas */}
          <circle cx="28" cy="30" r="1.5" fill="#15803d" opacity="0.6" />
          <circle cx="36" cy="30" r="1.5" fill="#15803d" opacity="0.6" />
          {/* Boca */}
          {mood === "happy" && (
            <path d="M 20 38 Q 32 46 44 38" stroke="#15803d" strokeWidth="2" fill="none" />
          )}
          {mood === "warning" && (
            <line x1="22" y1="39" x2="42" y2="39" stroke="#92400e" strokeWidth="2" />
          )}
          {mood === "critical" && (
            <path d="M 22 42 Q 32 36 42 42" stroke="#7f1d1d" strokeWidth="2" fill="none" />
          )}
        </svg>
      </motion.div>

      {/* Texto padrão */}
      <p className="text-sm font-bold text-foreground leading-tight text-center">
        Planta y Raiz
      </p>
      <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">
        Mega Clínica Digital
      </p>
    </div>
  );
}
