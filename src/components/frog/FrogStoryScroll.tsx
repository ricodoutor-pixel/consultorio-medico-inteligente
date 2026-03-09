import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogStoryScrollProps {
  show: boolean;
  size: number;
}

const storyLines = [
  "🐸 Olá! Eu sou o Verdinho!",
  "",
  "Há muito tempo, em um reino distante...",
  "",
  "Eu era um lindo príncipe,",
  "herdeiro de um grande e próspero reino.",
  "",
  "Apaixonado por uma linda princesa,",
  "vivíamos felizes em nosso castelo dourado. 👑",
  "",
  "Mas uma bruxa malvada,",
  "consumida por ciúmes e inveja,",
  "lançou um terrível feitiço sobre mim... 🧙‍♀️",
  "",
  "E me transformou em um pequeno sapo! 🐸",
  "",
  "Agora, eu sonho todas as noites",
  "com o beijo da minha princesa... 💋",
  "",
  "Para voltar a ser o príncipe",
  "lindo e próspero que eu era,",
  "e viver feliz em meu castelo",
  "com minha amada novamente. 💕",
  "",
  "Enquanto isso, estou aqui",
  "para ajudar você! ✨",
  "",
  "Fale comigo e eu farei",
  "o meu melhor por você! 💚",
  "",
  "— Verdinho, o Príncipe Sapo 🐸👑",
];

export const FrogStoryScroll = memo(({ show, size }: FrogStoryScrollProps) => {
  const scrollHeight = storyLines.length * 28 + 200;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute z-[100] pointer-events-none"
          style={{
            top: size + 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: Math.max(size * 3.5, 220),
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Container with perspective for Star Wars effect */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={{
              height: Math.max(size * 4, 260),
              perspective: "400px",
              background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,30,0,0.9) 50%, rgba(0,0,0,0.85) 100%)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 0 30px rgba(76,175,80,0.05)",
            }}
          >
            {/* Top fade */}
            <div
              className="absolute top-0 left-0 right-0 z-10"
              style={{
                height: 40,
                background: "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, transparent 100%)",
              }}
            />

            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{
                height: 50,
                background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 100%)",
              }}
            />

            {/* Star Wars scrolling text */}
            <div
              className="absolute inset-0 flex justify-center"
              style={{
                transformStyle: "preserve-3d",
                transform: "rotateX(20deg)",
                transformOrigin: "50% 100%",
              }}
            >
              <motion.div
                className="text-center px-4"
                style={{ width: "100%" }}
                initial={{ y: "100%" }}
                animate={{ y: -scrollHeight }}
                transition={{
                  duration: storyLines.length * 1.8,
                  ease: "linear",
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                {/* Spacer */}
                <div style={{ height: 120 }} />

                {storyLines.map((line, i) => (
                  <p
                    key={i}
                    className="font-bold leading-relaxed"
                    style={{
                      fontSize: line === "" ? 8 : 13,
                      lineHeight: line === "" ? "12px" : "22px",
                      color: line.startsWith("🐸") || line.startsWith("—")
                        ? "#ffd700"
                        : line.includes("bruxa") || line.includes("feitiço")
                        ? "#ff6b6b"
                        : line.includes("princesa") || line.includes("💋") || line.includes("💕")
                        ? "#ffb8d0"
                        : "#4ade80",
                      textShadow: "0 0 10px rgba(74, 222, 128, 0.5)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {line || "\u00A0"}
                  </p>
                ))}

                {/* Spacer bottom */}
                <div style={{ height: 200 }} />
              </motion.div>
            </div>

            {/* Tiny stars background */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 2,
                  height: 2,
                  background: "#fff",
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.4,
                }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FrogStoryScroll.displayName = "FrogStoryScroll";
