import { useEffect, useState } from "react";
import { useFrogMood, FrogMood } from "@/hooks/useFrogMood";
import { motion } from "framer-motion";

const DOCTOR_IMG = "/dr-verdinho-doctor.png";

const moodImages: Record<FrogMood, string> = {
  happy: DOCTOR_IMG,
  warning: "/frog-warning.png",
  critical: "/frog-critical.png",
  in_call: "/frog-happy.png", // mesmo asset, recolorido via filtro CSS
};

/** Frases de boas-vindas do Dr. Verdinho (primeira impressão, igual para todos) */
const DOCTOR_GREETINGS = [
  "Olá! Sou o Dr. Verdinho, seu guia na Mega Clínica Digital 🩺",
  "Pronto para cuidar de você hoje 💚",
  "Vamos acompanhar seu tratamento juntos 🌿",
];

/** Carrossel de sapinhos — troca a cada 5 minutos */
const FROG_CAROUSEL: { src: string; phrase: string }[] = [
  { src: DOCTOR_IMG, phrase: "Olá! Sou o Dr. Verdinho, seu guia na Mega Clínica Digital 🩺" },
  { src: "/dr-verdinho-mascot.png", phrase: "Seu tratamento é acompanhado de perto 💚" },
  { src: "/frog-happy.png", phrase: "Que bom te ver por aqui! Vamos em frente 🌿" },
  { src: "/dr-verdinho.png", phrase: "Dica: mantenha seu cadastro sempre atualizado 📋" },
  { src: "/dr-verdinho-splash.webp", phrase: "Cuidar da saúde é um hábito diário 🌱" },
];

/** Tempo (ms) de cada sapinho no carrossel */
const DOCTOR_PHASE_MS = 5 * 60 * 1000;

export function FrogMoodBanner() {
  const { mood, message } = useFrogMood();
  const [frogIndex, setFrogIndex] = useState(0);
  const [greeting] = useState(
    () => DOCTOR_GREETINGS[Math.floor(Math.random() * DOCTOR_GREETINGS.length)]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setFrogIndex((i) => (i + 1) % FROG_CAROUSEL.length);
    }, DOCTOR_PHASE_MS);
    return () => clearInterval(interval);
  }, []);

  const showDoctor = mood === "happy";
  const currentFrog = FROG_CAROUSEL[frogIndex];
  const imgSrc = showDoctor ? currentFrog.src : moodImages[mood];
  const doctorMessage = frogIndex === 0 ? greeting : currentFrog.phrase;



  return (
    <div className="flex flex-col items-center gap-1 py-3">
      {/* Dr. Verdinho flutuante — PNG transparente, sem moldura */}
      <motion.img
        key={imgSrc}
        src={imgSrc}
        alt={showDoctor ? "Dr. Verdinho — Planta y Raiz" : `Verdinho ${mood}`}
        width={140}
        height={140}
        decoding="async"
        loading="eager"
        className={`${showDoctor ? "w-[140px] h-[140px]" : "w-[72px] h-[72px]"} object-contain drop-shadow-[0_12px_24px_rgba(34,197,94,0.35)]`}
        style={
          mood === "in_call" && !showDoctor
            ? { filter: "hue-rotate(180deg) saturate(1.15) drop-shadow(0 0 8px rgba(56,189,248,0.55))" }
            : undefined
        }
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { duration: 0.4 },
          scale: { duration: 0.4 },
          y: { duration: mood === "in_call" ? 1.6 : 2.8, repeat: Infinity, ease: "easeInOut" },
        }}
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
      <motion.div
        key={showDoctor ? `frog-${frogIndex}` : mood}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-1 px-3 py-1.5 rounded-lg text-xs font-medium text-center max-w-[260px] ${
          showDoctor
            ? "bg-primary/10 text-primary border border-primary/20"
            : mood === "warning"
            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            : mood === "critical"
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
        }`}
      >
        {showDoctor ? doctorMessage : message}
      </motion.div>


    </div>
  );
}
