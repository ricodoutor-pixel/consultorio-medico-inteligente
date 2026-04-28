import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Stethoscope, User, Store, BookOpen } from "lucide-react";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";
import { supabase } from "@/integrations/supabase/client";

// ManyChat keyword triggers — devem estar configurados como
// "Keyword Rule" no painel do ManyChat (Automation → Keywords)
// para disparar o fluxo correto de cada perfil automaticamente.
const VISITOR_OPTIONS = [
  {
    id: "paciente",
    keyword: "#PACIENTE",
    label: "Sou Paciente",
    icon: User,
    description: "Agendar consulta ou tirar dúvidas",
    greeting: `#PACIENTE\n\nOlá, Enf. Brisa! 🌿 Tudo bem? Sou paciente e adoraria agendar uma consulta com vocês. Pode me orientar sobre como funciona? 😊`,
    color: "hsl(152 100% 74%)",
  },
  {
    id: "medico",
    keyword: "#MEDICO",
    label: "Sou Médico",
    icon: Stethoscope,
    description: "Quero prescrever na plataforma",
    greeting: `#MEDICO\n\nOlá, Enf. Brisa! 🌿 Que prazer falar com você. Sou médico e estou interessado em começar a prescrever pela plataforma Planta y Raiz. Pode me passar as informações? 🩺✨`,
    color: "hsl(217 91% 60%)",
  },
  {
    id: "lojista",
    keyword: "#LOJISTA",
    label: "Sou Lojista",
    icon: Store,
    description: "Vender no nosso marketplace",
    greeting: `#LOJISTA\n\nOlá, Enf. Brisa! 🌿 Como vai? Sou lojista e tenho interesse em levar meus produtos para o marketplace da Planta y Raiz. Como fazemos essa parceria? 🤝🚀`,
    color: "hsl(45 93% 58%)",
  },
  {
    id: "ebook",
    keyword: "#EBOOK",
    label: "Baixar E-book",
    icon: BookOpen,
    description: "Material educativo gratuito",
    greeting: `#EBOOK\n\nOlá, Enf. Brisa! 🌿 Fiquei sabendo do e-book gratuito sobre cannabis medicinal e adoraria receber o meu! Pode me enviar o link? 📚💚`,
    color: "hsl(280 67% 60%)",
  },
] as const;

export const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

    // Build WhatsApp message with greeting + link to the relevant page
    const pageLink = `${SITE_BASE}${option.path}`;
    const fullMessage = `${option.greeting}\n\n📎 ${pageLink}`;
    
    // Detect if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile: Direct WhatsApp link for seamless experience
      // This avoids exposing the ManyChat flow player page on small screens
      const whatsappUrl = `https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent(fullMessage)}`;
      window.location.href = whatsappUrl;
    } else {
      // On desktop: ManyChat Flow "Enf Brisa Bot Lovable" (Official Automation)
      // Using flowPlayerEmbed for a cleaner integration if possible, or keeping flowPlayerPage
      const manyChatFlowUrl = `https://app.manychat.com/flowPlayerPage?share_hash=4773110_52afc617acd735b548c9a794700447116667f7d5&mc_locale=pt_BR&user_type=${option.id}`;
      window.open(manyChatFlowUrl, "_blank", "noopener,noreferrer");
    }
    
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
            <p className="text-xs text-muted-foreground mt-0.5">Escolha seu perfil e fale comigo no WhatsApp:</p>
          </div>

          {/* Options */}
          <div className="p-2 flex flex-col gap-1">
            {VISITOR_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:bg-accent/50 active:scale-[0.98] w-full"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${option.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${option.color} 25%, transparent)` }}>
                    <Icon size={18} style={{ color: option.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{option.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                  </div>
                  <MessageCircle size={16} className="text-secondary shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Atendimento 24h • Respostas em minutos
            </p>
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
