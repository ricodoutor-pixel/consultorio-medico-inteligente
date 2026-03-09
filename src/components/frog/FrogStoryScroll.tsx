import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogStoryScrollProps {
  show: boolean;
  size: number;
}

const storyLines = [
  "Olá! Eu sou o Verdinho! 🐸",
  "",
  "Há muito tempo, em um reino",
  "distante e próspero, eu era",
  "um lindo príncipe, herdeiro",
  "de um grande castelo dourado.",
  "",
  "Apaixonado por uma linda",
  "princesa, vivíamos felizes,",
  "cercados de riquezas e",
  "amor verdadeiro. 👑",
  "",
  "Mas uma bruxa malvada,",
  "consumida por ciúmes e",
  "inveja do nosso amor,",
  "lançou um terrível feitiço",
  "sobre mim...",
  "",
  "E me transformou em",
  "um pequeno sapo! 🐸",
  "",
  "Agora, todas as noites,",
  "eu sonho com o beijo",
  "da minha princesa... 💋",
  "",
  "Para voltar a ser o príncipe",
  "lindo e próspero que eu era,",
  "e viver feliz em meu castelo",
  "com minha amada. 💕",
  "",
  "Enquanto isso, estou aqui",
  "para ajudar você! ✨",
  "",
  "— Verdinho, o Príncipe Sapo 👑",
];

export const FrogStoryScroll = memo(({ show, size }: FrogStoryScrollProps) => {
  const w = 220;
  const h = 180;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute z-[100] pointer-events-none"
          style={{
            top: size + 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: w,
            height: h,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              background: "#000",
              borderRadius: 6,
              border: "1px solid rgba(255,215,0,0.15)",
            }}
          >
            {/* Stars */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() > 0.7 ? 2 : 1,
                  height: Math.random() > 0.7 ? 2 : 1,
                  background: "#fff",
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.2 + Math.random() * 0.4,
                }}
              />
            ))}

            {/* Top fade */}
            <div
              className="absolute top-0 left-0 right-0 z-10"
              style={{
                height: "15%",
                background: "linear-gradient(180deg, #000 0%, transparent 100%)",
              }}
            />

            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{
                height: "25%",
                background: "linear-gradient(0deg, #000 0%, transparent 100%)",
              }}
            />

            {/* Perspective container */}
            <div
              className="absolute inset-0 flex justify-center overflow-hidden"
              style={{
                perspective: "300px",
                perspectiveOrigin: "50% 100%",
              }}
            >
              <div
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(20deg)",
                  transformOrigin: "50% 100%",
                  width: "88%",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                }}
              >
                <motion.div
                  style={{ width: "100%", textAlign: "center" }}
                  initial={{ y: h }}
                  animate={{ y: -1200 }}
                  transition={{
                    duration: 40,
                    ease: "linear",
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  {/* Top spacer */}
                  <div style={{ height: h * 0.5 }} />

                  <p style={{
                    color: "#4fc3f7",
                    fontSize: 10,
                    letterSpacing: 2,
                    marginBottom: 6,
                  }}>
                    Episódio I
                  </p>
                  <p style={{
                    color: "#ffd700",
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: 1,
                    lineHeight: 1.2,
                    marginBottom: 16,
                    textTransform: "uppercase",
                  }}>
                    A HISTÓRIA DO<br />VERDINHO
                  </p>

                  {storyLines.map((line, i) => (
                    <p
                      key={i}
                      style={{
                        color: "#ffd700",
                        fontSize: line === "" ? 0 : 11,
                        lineHeight: line === "" ? "10px" : "1.5",
                        fontWeight: 600,
                        marginBottom: line === "" ? 8 : 2,
                        padding: "0 4px",
                      }}
                    >
                      {line || "\u00A0"}
                    </p>
                  ))}

                  <div style={{ height: 400 }} />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

FrogStoryScroll.displayName = "FrogStoryScroll";
