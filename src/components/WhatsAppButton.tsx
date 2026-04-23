import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Stethoscope, User, Store, BookOpen } from "lucide-react";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";
import { useNavigate } from "react-router-dom";

const VISITOR_OPTIONS = [
  {
    id: "paciente",
    label: "Sou Paciente",
    icon: User,
    description: "Agendar consulta ou tirar dúvidas",
    route: "/quiz-triagem",
    whatsappMsg: "Olá Enf. Brisa! Sou paciente e gostaria de agendar uma consulta.",
    color: "hsl(152 100% 74%)",
  },
  {
    id: "medico",
    label: "Sou Médico",
    icon: Stethoscope,
    description: "Quero prescrever na plataforma",
    route: "/profissionais",
    whatsappMsg: "Olá Enf. Brisa! Sou médico e gostaria de saber como prescrever pela plataforma.",
    color: "hsl(217 91% 60%)",
  },
  {
    id: "lojista",
    label: "Sou Lojista",
    icon: Store,
    description: "Vender no nosso marketplace",
    route: "/shopping",
    whatsappMsg: "Olá Enf. Brisa! Sou lojista e gostaria de vender no marketplace.",
    color: "hsl(45 93% 58%)",
  },
  {
    id: "ebook",
    label: "Baixar E-book",
    icon: BookOpen,
    description: "Material educativo gratuito",
    route: "/como-funciona",
    whatsappMsg: "Olá Enf. Brisa! Gostaria de receber o e-book gratuito sobre cannabis medicinal.",
    color: "hsl(280 67% 60%)",
  },
] as const;

export const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen]);

  const handleOptionClick = (option: (typeof VISITOR_OPTIONS)[number]) => {
    trackPixelEvent("Contact", {
      content_name: `brisa_${option.id}`,
    }, {
      leadScore: 30,
      funnelStage: "intent",
      category: "conversion",
    });

    // Navigate to the corresponding page on the site
    navigate(option.route);
    setIsOpen(false);
  };

  const handleWhatsApp = (option: (typeof VISITOR_OPTIONS)[number]) => {
    const url = `https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent(option.whatsappMsg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40">
      {/* Menu popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 sm:w-80 rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ background: "hsl(var(--card))" }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border"
            style={{ background: "linear-gradient(135deg, hsl(152 100% 74% / 0.15), hsl(152 100% 74% / 0.05))" }}>
            <p className="text-sm font-bold text-foreground">🌿 Olá! Eu sou a Enf. Brisa</p>
            <p className="text-xs text-muted-foreground mt-0.5">Como posso te ajudar? Escolha seu perfil:</p>
          </div>

          {/* Options */}
          <div className="p-2 flex flex-col gap-1">
            {VISITOR_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleOptionClick(option)}
                    className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:bg-accent/50 active:scale-[0.98]"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${option.color} / 0.15)`.replace(")", ""), border: `1px solid ${option.color}40` }}>
                      <Icon size={18} style={{ color: option.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{option.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleWhatsApp(option)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all hover:bg-accent/50"
                    aria-label={`WhatsApp - ${option.label}`}
                    title="Falar pelo WhatsApp"
                  >
                    <MessageCircle size={16} className="text-secondary" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="p-3 md:p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center glow-green"
        style={{
          background: "linear-gradient(135deg, hsl(152 100% 74% / 0.2), hsl(152 100% 74% / 0.1))",
          border: "1px solid hsl(152 100% 74% / 0.3)",
        }}
        aria-label="Fale conosco — Enf. Brisa"
      >
        {isOpen ? (
          <X size={28} className="text-secondary" />
        ) : (
          <MessageCircle size={28} className="text-secondary" />
        )}
      </button>
    </div>
  );
};
