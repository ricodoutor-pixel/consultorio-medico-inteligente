import React, { useState, useRef, useCallback } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface MascotVerdinhoProps {
  onChatOpen?: () => void;
  className?: string;
  /** When rendered inside a container (e.g. mobile menu), use inline mode */
  inline?: boolean;
}

const STAR_WARS_STORY = [
  "Há muito tempo, numa floresta tropical distante…",
  "Uma semente verde despertou no solo.",
  "Ela cresceu forte, cheia de sabedoria e cura.",
  "Seu nome era VERDINHO.",
  "Com o poder da cannabis medicinal,",
  "ele dedicou sua vida a ajudar pacientes",
  "a encontrar equilíbrio, alívio e esperança.",
  "Hoje, Verdinho é o guardião da Planta y Raiz.",
  "Ele guia cada paciente no caminho da saúde.",
  "Sua missão: democratizar o acesso à vida!",
  "🌿 Que a Força Verde esteja com você. 🌿",
];

export default function MascotVerdinho({ onChatOpen, className = "", inline = false }: MascotVerdinhoProps) {
  const [showStory, setShowStory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Olá! 👋 Sou o Verdinho, seu assistente de IA da Planta y Raiz. Pergunte sobre cannabis medicinal, tratamentos ou navegação do site!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const touchCountRef = useRef(0);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleInteraction = useCallback(() => {
    touchCountRef.current += 1;

    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);

    touchTimerRef.current = setTimeout(() => {
      const count = touchCountRef.current;
      touchCountRef.current = 0;

      if (count === 1) {
        // Single tap/click → Star Wars story
        setShowStory(true);
      } else if (count >= 2) {
        // Double tap/click → Chat
        setShowChat(true);
        onChatOpen?.();
      }
    }, 350);
  }, [onChatOpen]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);

    // Simulated AI response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: `Obrigado pela pergunta sobre "${userMsg}". A Planta y Raiz oferece consultas especializadas a partir de R$30. Para informações clínicas detalhadas, recomendo agendar com nossos especialistas. ⚠️ Este é um assistente informativo — não substitui orientação médica profissional.`,
        },
      ]);
    }, 800);
  };

  const scale = isHovered ? 3 : 1;
  const wrapperClasses = inline
    ? `relative cursor-pointer transition-all duration-500 ease-out ${className}`
    : `fixed bottom-6 right-6 z-40 cursor-pointer transition-all duration-500 ease-out ${className}`;

  return (
    <>
      {/* Mascote */}
      <div
        className={wrapperClasses}
        style={{
          transformOrigin: inline ? "center center" : "bottom right",
          transform: `scale(${scale})`,
          zIndex: isHovered ? 9999 : inline ? "auto" : 40,
          bottom: !inline ? `max(1.5rem, env(safe-area-inset-bottom))` : undefined,
          right: !inline ? `max(1.5rem, env(safe-area-inset-right))` : undefined,
        }}
        onClick={handleInteraction}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 1500)}
      >
        <div className="relative w-16 h-16 md:w-20 md:h-20">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="35" r="20" fill="#10b981" />
            <circle cx="42" cy="30" r="3" fill="#ffffff" />
            <circle cx="58" cy="30" r="3" fill="#ffffff" />
            <circle cx="42" cy="30" r="1.5" fill="#000000" className="animate-pulse" />
            <circle cx="58" cy="30" r="1.5" fill="#000000" className="animate-pulse" />
            <path d="M 42 38 Q 50 42 58 38" stroke="#ffffff" strokeWidth="2" fill="none" />
            <ellipse cx="50" cy="60" rx="18" ry="22" fill="#10b981" />
            <rect x="25" y="50" width="12" height="8" rx="4" fill="#10b981" />
            <rect x="63" y="50" width="12" height="8" rx="4" fill="#10b981" />
            <rect x="40" y="78" width="8" height="15" rx="4" fill="#10b981" />
            <rect x="52" y="78" width="8" height="15" rx="4" fill="#10b981" />
            <path d="M 50 15 Q 55 8 60 12 Q 55 5 50 10" fill="#059669" />
          </svg>
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping" style={{ animationDuration: "2s" }} />
        </div>

        {/* Tooltip on hover */}
        {isHovered && !inline && (
          <div className="absolute bottom-full right-0 mb-2 bg-card text-foreground text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg border border-border pointer-events-none animate-fade-in">
            <div>1 toque → História Star Wars 🌟</div>
            <div>2 toques → Chat IA 💬</div>
          </div>
        )}
      </div>

      {/* Star Wars Story Scroll */}
      {showStory && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setShowStory(false)}
        >
          <button
            onClick={() => setShowStory(false)}
            className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 z-10"
          >
            <X size={28} />
          </button>
          <div className="star-wars-scroll w-full max-w-2xl px-8 text-center overflow-hidden" style={{ perspective: "400px", height: "80vh" }}>
            <div
              className="text-yellow-400 font-bold text-lg md:text-2xl leading-relaxed space-y-6"
              style={{
                animation: "starWarsScroll 20s linear forwards",
                transformOrigin: "50% 100%",
              }}
            >
              {STAR_WARS_STORY.map((line, i) => (
                <p key={i} className="opacity-90">{line}</p>
              ))}
            </div>
          </div>

          <style>{`
            @keyframes starWarsScroll {
              0% { transform: rotateX(20deg) translateY(100%); opacity: 1; }
              90% { opacity: 1; }
              100% { transform: rotateX(25deg) translateY(-200%); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Chat IA Modal */}
      {showChat && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:justify-end p-0 md:p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-card rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-96 md:max-w-md flex flex-col border border-border" style={{ maxHeight: "85dvh" }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-4 flex items-center justify-between rounded-t-2xl md:rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-black text-lg">V</span>
                </div>
                <div>
                  <div className="font-bold text-base">Verdinho IA</div>
                  <div className="text-xs opacity-80">Assistente Cannabis Medicinal</div>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[200px]" style={{ maxHeight: "60dvh" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-1">
              <p className="text-[10px] text-muted-foreground text-center">
                ⚠️ Informativo apenas. Não substitui consulta médica. CFM 2314 + LGPD
              </p>
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2 flex-shrink-0" style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))` }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Pergunte sobre cannabis medicinal..."
                className="flex-1 border border-border bg-background rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSendMessage}
                className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 hover:bg-primary/90 transition flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
