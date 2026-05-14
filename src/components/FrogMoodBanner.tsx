import { useFrogMood, FrogMood } from "@/hooks/useFrogMood";
import { motion } from "framer-motion";

const moodImages: Record<FrogMood, string> = {
  happy: "/frog-happy.png",
  warning: "/frog-warning.png",
  critical: "/frog-critical.png",
  in_call: "/frog-happy.png", // mesmo asset, recolorido via filtro CSS
};

export function FrogMoodBanner() {
  const { mood, message } = useFrogMood();

  return (
    <div className="flex flex-col items-center gap-1 py-3">
      {/* Cabeça do Verdinho — imagem real, sem fundo, sem moldura */}
      <motion.img
        src={moodImages[mood]}
        alt={`Verdinho ${mood}`}
        width={72}
        height={72}
        className="w-[72px] h-[72px] drop-shadow-lg object-contain"
        style={
          mood === "in_call"
            ? { filter: "hue-rotate(180deg) saturate(1.15) drop-shadow(0 0 8px rgba(56,189,248,0.55))" }
            : undefined
        }
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: mood === "in_call" ? 1.4 : 2.5, repeat: Infinity, ease: "easeInOut" }}
        draggable={false}
      />

      {/* Texto padrão internacional */}
      <p className="text-base font-bold text-foreground leading-tight text-center">
        Planta y Raiz
      </p>
      <p className="text-xs text-muted-foreground font-medium -mt-0.5">
        Mega Clínica Digital
      </p>

      {/* Balão contextual */}
      {mood !== "happy" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1 px-3 py-1.5 rounded-lg text-xs font-medium text-center max-w-[260px] ${
            mood === "warning"
              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              : mood === "critical"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
          }`}
        >
          {message}
        </motion.div>
      )}
    </div>
  );
}
