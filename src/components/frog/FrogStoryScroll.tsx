import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FrogStoryScrollProps {
  show: boolean;
  size: number;
}

const storyLines = [
  "Olá! Eu sou o Verdinho! 🐸",
  "",
  "Estou muito feliz aqui",
  "trabalhando com a equipe",
  "da Planta & Raiz! 🌿",
  "",
  "Enquanto minha princesa",
  "não chega para me salvar",
  "com um beijo mágico... 💋",
  "",
  "Eu ajudo a salvar vidas",
  "todos os dias por aqui! 💚",
  "",
  "A Planta & Raiz é a primeira",
  "Mega Clínica Digital do mundo!",
  "Um ecossistema clínico 100%",
  "autônomo e revolucionário. 🏥",
  "",
  "Nossas funcionalidades:",
  "",
  "🩺 Telemedicina Avançada",
  "Consultas online com os",
  "melhores médicos prescritores",
  "de cannabis medicinal.",
  "",
  "📋 Receita Digital",
  "Prescrições eletrônicas",
  "seguras e validadas pela",
  "ANVISA em tempo real.",
  "",
  "🛒 Shopping & Marketplace",
  "O maior marketplace de",
  "produtos à base de cannabis",
  "medicinal do Brasil!",
  "",
  "👥 Comunidade de Pacientes",
  "Fóruns organizados por",
  "condição de saúde para",
  "troca de experiências.",
  "",
  "📚 Biblioteca Científica",
  "A maior enciclopédia de",
  "strains e estudos sobre",
  "cannabis medicinal.",
  "",
  "💳 Carteira Digital",
  "Gerencie seus documentos,",
  "receitas e autorizações",
  "em um só lugar.",
  "",
  "🎯 Programa de Indicações",
  "Indique amigos e ganhe",
  "recompensas incríveis!",
  "",
  "📊 Dashboard Inteligente",
  "Painéis personalizados para",
  "pacientes, médicos, farmácias",
  "e produtores.",
  "",
  "Tenho muito orgulho de",
  "fazer parte de um projeto",
  "tão importante para a",
  "humanidade! 🌍",
  "",
  "A Planta & Raiz democratiza",
  "o acesso a medicamentos",
  "à base de cannabis para",
  "todo o mundo! 🌎",
  "",
  "Somos a plataforma número 1",
  "do mercado! Completa,",
  "segura e inovadora! 🏆",
  "",
  "Nosso DNA é feito de:",
  "💚 Compaixão",
  "🔬 Ciência",
  "🤝 Acessibilidade",
  "🌱 Sustentabilidade",
  "⚡ Inovação",
  "",
  "Cada paciente que ajudamos",
  "é uma vida transformada.",
  "Cada médico conectado é",
  "mais saúde para todos! 🩺",
  "",
  "A cannabis medicinal é",
  "esperança, é ciência,",
  "é qualidade de vida! 🌿",
  "",
  "E eu, Verdinho, estarei",
  "sempre aqui para te guiar",
  "nessa jornada incrível! ✨",
  "",
  "Planta & Raiz — Democratizando",
  "o acesso à saúde! 💚🐸👑",
  "",
  "",
  "— Verdinho, o Príncipe Sapo 👑",
  "   Mascote da Planta & Raiz",
];

// Component that renders text with random star-sparkle on individual letters
const SparkleText = memo(({ text, color, fontSize, fontWeight, isHeading }: {
  text: string;
  color: string;
  fontSize: number;
  fontWeight: number;
  isHeading?: boolean;
}) => {
  const [sparkleIdx, setSparkleIdx] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      const plainChars = text.replace(/[^a-zA-ZÀ-ú0-9]/g, '');
      if (plainChars.length === 0) { setSparkleIdx(-1); return; }
      // Pick a random letter index (only real chars)
      const letterPositions: number[] = [];
      for (let i = 0; i < text.length; i++) {
        if (/[a-zA-ZÀ-ú0-9]/.test(text[i])) letterPositions.push(i);
      }
      if (letterPositions.length > 0) {
        setSparkleIdx(letterPositions[Math.floor(Math.random() * letterPositions.length)]);
      }
    }, 600 + Math.random() * 800);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span style={{
      color,
      fontSize,
      fontWeight,
      lineHeight: "1.6",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      letterSpacing: isHeading ? "1px" : "0.4px",
      textShadow: isHeading
        ? "0 0 8px rgba(255,215,0,0.6), 0 0 20px rgba(255,215,0,0.3)"
        : "0 0 4px rgba(255,215,0,0.3)",
    }}>
      {text.split('').map((char, i) => {
        const isSparkle = i === sparkleIdx;
        return (
          <span
            key={i}
            style={{
              display: "inline",
              position: "relative",
              color: isSparkle ? "#fff" : undefined,
              textShadow: isSparkle
                ? "0 0 6px #fff, 0 0 12px #ffd700, 0 0 20px #ffd700"
                : undefined,
              transition: "all 0.3s ease",
            }}
          >
            {char}
            {isSparkle && (
              <span style={{
                position: "absolute",
                top: "-2px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "4px",
                pointerEvents: "none",
              }}>✦</span>
            )}
          </span>
        );
      })}
    </span>
  );
});
SparkleText.displayName = "SparkleText";

export const FrogStoryScroll = memo(({ show, size }: FrogStoryScrollProps) => {
  const w = 140;
  const h = 120;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute z-[100] pointer-events-none"
          style={{
            top: size + 6,
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
              background: "linear-gradient(180deg, #0a0a14 0%, #000 100%)",
              borderRadius: 5,
              border: "1px solid rgba(255,215,0,0.2)",
              boxShadow: "0 0 15px rgba(255,215,0,0.1), inset 0 0 30px rgba(0,0,0,0.5)",
            }}
          >
            {/* Stars background */}
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() > 0.6 ? 2 : 1,
                  height: Math.random() > 0.6 ? 2 : 1,
                  background: "#fff",
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.1, 0.6, 0.1],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}

            {/* Top fade */}
            <div
              className="absolute top-0 left-0 right-0 z-10"
              style={{
                height: "10%",
                background: "linear-gradient(180deg, #0a0a14 0%, transparent 100%)",
              }}
            />

            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{
                height: "14%",
                background: "linear-gradient(0deg, #000 0%, transparent 100%)",
              }}
            />

            {/* Perspective container */}
            <div
              className="absolute inset-0 flex justify-center overflow-hidden"
              style={{
                perspective: "250px",
                perspectiveOrigin: "50% 100%",
              }}
            >
              <div
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(16deg)",
                  transformOrigin: "50% 100%",
                  width: "90%",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                }}
              >
                <motion.div
                  style={{ width: "100%", textAlign: "center" }}
                  initial={{ y: h }}
                  animate={{ y: -3000 }}
                  transition={{
                    duration: 120,
                    ease: "linear",
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  {/* Top spacer */}
                  <div style={{ height: h * 0.35 }} />

                  <p style={{
                    color: "#4fc3f7",
                    fontSize: 7,
                    letterSpacing: 3,
                    marginBottom: 4,
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    textShadow: "0 0 6px rgba(79,195,247,0.5)",
                  }}>
                    Episódio I
                  </p>
                  <div style={{ marginBottom: 10 }}>
                    <SparkleText
                      text="A HISTÓRIA DO VERDINHO"
                      color="#ffd700"
                      fontSize={9}
                      fontWeight={900}
                      isHeading
                    />
                  </div>

                  {storyLines.map((line, i) => {
                    if (line === "") {
                      return <div key={i} style={{ height: 6 }} />;
                    }
                    const isSection = /^[🩺📋🛒👥📚💳🎯📊]/.test(line);
                    return (
                      <div key={i} style={{ marginBottom: 1.5, padding: "0 3px" }}>
                        <SparkleText
                          text={line}
                          color={isSection ? "#4fc3f7" : "#ffd700"}
                          fontSize={7}
                          fontWeight={isSection ? 700 : 500}
                        />
                      </div>
                    );
                  })}

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
