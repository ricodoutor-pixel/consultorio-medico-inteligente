import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogStoryScrollProps {
  show: boolean;
  size: number;
}

export const FrogStoryScroll = memo(({ show, size }: FrogStoryScrollProps) => {
  const containerW = Math.max(size * 3.5, 260);
  const containerH = Math.max(size * 3.5, 240);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute z-[100] pointer-events-none"
          style={{
            top: size + 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: containerW,
            height: containerH,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Black starfield background */}
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              background: "#000",
              borderRadius: 4,
            }}
          >
            {/* Tiny stars */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() > 0.7 ? 2 : 1,
                  height: Math.random() > 0.7 ? 2 : 1,
                  background: "#fff",
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.3 + Math.random() * 0.5,
                }}
              />
            ))}

            {/* Bottom fade to black for vanishing point illusion */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{
                height: "35%",
                background: "linear-gradient(0deg, #000 0%, transparent 100%)",
              }}
            />

            {/* Top fade */}
            <div
              className="absolute top-0 left-0 right-0 z-10"
              style={{
                height: "10%",
                background: "linear-gradient(180deg, #000 0%, transparent 100%)",
              }}
            />

            {/* 3D perspective crawl container */}
            <div
              className="absolute inset-0 flex justify-center overflow-hidden"
              style={{
                perspective: "350px",
                perspectiveOrigin: "50% 100%",
              }}
            >
              <div
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(25deg)",
                  transformOrigin: "50% 100%",
                  width: "90%",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                }}
              >
                <motion.div
                  className="text-center"
                  style={{ width: "100%" }}
                  initial={{ y: containerH }}
                  animate={{ y: -1800 }}
                  transition={{
                    duration: 45,
                    ease: "linear",
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  {/* Spacer top */}
                  <div style={{ height: containerH * 0.6 }} />

                  {/* Title block */}
                  <p style={{
                    color: "#4fc3f7",
                    fontSize: 13,
                    letterSpacing: 3,
                    marginBottom: 8,
                    fontWeight: 400,
                  }}>
                    Episódio I
                  </p>
                  <h2 style={{
                    color: "#ffd700",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 2,
                    lineHeight: 1.2,
                    marginBottom: 28,
                    textTransform: "uppercase",
                  }}>
                    A HISTÓRIA DO<br />VERDINHO
                  </h2>

                  {/* Main crawl text */}
                  {[
                    "Olá! Eu sou o Verdinho! 🐸",
                    "",
                    "Há muito tempo, em um reino distante e próspero, eu era um lindo príncipe, herdeiro de um grande castelo dourado.",
                    "",
                    "Apaixonado por uma linda princesa, vivíamos felizes, cercados de riquezas e amor verdadeiro. 👑",
                    "",
                    "Mas uma bruxa malvada, consumida por ciúmes e inveja do nosso amor, lançou um terrível feitiço sobre mim...",
                    "",
                    "E me transformou em um pequeno sapo! 🐸",
                    "",
                    "Agora, todas as noites, eu sonho com o beijo da minha princesa... 💋",
                    "",
                    "Para voltar a ser o príncipe lindo, milionário e próspero que eu era, e viver feliz em meu castelo com minha amada novamente. 💕",
                    "",
                    "Enquanto isso, estou aqui para ajudar você! ✨",
                    "",
                    "Fale comigo e eu farei o meu melhor por você! 💚",
                    "",
                    "— Verdinho, o Príncipe Sapo 🐸👑",
                  ].map((line, i) => (
                    <p
                      key={i}
                      style={{
                        color: "#ffd700",
                        fontSize: line === "" ? 0 : 15,
                        lineHeight: line === "" ? "18px" : "1.6",
                        fontWeight: 700,
                        marginBottom: line === "" ? 14 : 4,
                        letterSpacing: 0.5,
                        textAlign: "justify",
                        textAlignLast: "center",
                        padding: "0 8px",
                      }}
                    >
                      {line || "\u00A0"}
                    </p>
                  ))}

                  {/* Bottom spacer */}
                  <div style={{ height: 600 }} />
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
