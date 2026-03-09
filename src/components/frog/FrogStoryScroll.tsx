import { memo } from "react";
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

export const FrogStoryScroll = memo(({ show, size }: FrogStoryScrollProps) => {
  const w = 124;
  const h = 104;

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
              border: "1px solid rgba(255,215,0,0.12)",
            }}
          >
            {/* Stars */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() > 0.7 ? 1.5 : 1,
                  height: Math.random() > 0.7 ? 1.5 : 1,
                  background: "#fff",
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.15 + Math.random() * 0.3,
                }}
              />
            ))}

            {/* Top fade - smaller */}
            <div
              className="absolute top-0 left-0 right-0 z-10"
              style={{
                height: "8%",
                background: "linear-gradient(180deg, #0a0a14 0%, transparent 100%)",
              }}
            />

            {/* Bottom fade - smaller */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{
                height: "12%",
                background: "linear-gradient(0deg, #000 0%, transparent 100%)",
              }}
            />

            {/* Perspective container */}
            <div
              className="absolute inset-0 flex justify-center overflow-hidden"
              style={{
                perspective: "220px",
                perspectiveOrigin: "50% 100%",
              }}
            >
              <div
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateX(18deg)",
                  transformOrigin: "50% 100%",
                  width: "92%",
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
                    fontSize: 6,
                    letterSpacing: 2,
                    marginBottom: 3,
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                  }}>
                    Episódio I
                  </p>
                  <p style={{
                    color: "#ffd700",
                    fontSize: 8,
                    fontWeight: 900,
                    letterSpacing: 1,
                    lineHeight: 1.2,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    textShadow: "0 0 6px rgba(255,215,0,0.4)",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                  }}>
                    A HISTÓRIA DO<br />VERDINHO
                  </p>

                  {storyLines.map((line, i) => (
                    <p
                      key={i}
                      style={{
                        color: line.startsWith("🩺") || line.startsWith("📋") || line.startsWith("🛒") || line.startsWith("👥") || line.startsWith("📚") || line.startsWith("💳") || line.startsWith("🎯") || line.startsWith("📊")
                          ? "#4fc3f7"
                          : "#ffd700",
                        fontSize: line === "" ? 0 : 6.5,
                        lineHeight: line === "" ? "5px" : "1.5",
                        fontWeight: line.startsWith("🩺") || line.startsWith("📋") || line.startsWith("🛒") || line.startsWith("👥") || line.startsWith("📚") || line.startsWith("💳") || line.startsWith("🎯") || line.startsWith("📊") ? 700 : 500,
                        marginBottom: line === "" ? 4 : 1,
                        padding: "0 2px",
                        textShadow: "0 0 3px rgba(255,215,0,0.2)",
                        fontFamily: "'Segoe UI', system-ui, sans-serif",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {line || "\u00A0"}
                    </p>
                  ))}

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
