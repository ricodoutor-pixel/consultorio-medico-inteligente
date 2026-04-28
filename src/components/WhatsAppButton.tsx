import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Stethoscope, User, Store, BookOpen, HelpCircle } from "lucide-react";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";
import { supabase } from "@/integrations/supabase/client";

// ManyChat keyword triggers — devem estar configurados como
// "Keyword Rule" no painel do ManyChat (Automation → Keywords)
// para disparar o fluxo correto de cada perfil automaticamente.
const SITE_BASE = "https://plantayraiz.com.br";

const VISITOR_OPTIONS = [
  {
    id: "paciente",
    keyword: "#PACIENTE",
    label: "Sou Paciente",
    icon: User,
    description: "Agendar consulta ou tirar dúvidas",
    greeting: `#PACIENTE\n\nOlá, Enfª Brisa! 🌿 Sou paciente e quero conhecer os planos de atendimento da Planta y Raiz. Pode me orientar? 😊`,
    landing: `${SITE_BASE}/planos`,
    color: "hsl(152 100% 74%)",
  },
  {
    id: "medico",
    keyword: "#MEDICO",
    label: "Sou Médico",
    icon: Stethoscope,
    description: "Quero prescrever na plataforma",
    greeting: `#MEDICO\n\nOlá, Enfª Brisa! 🌿 Sou médico e quero começar a prescrever pela Planta y Raiz. Pode me passar as informações? 🩺✨`,
    landing: `${SITE_BASE}/profissionais`,
    color: "hsl(217 91% 60%)",
  },
  {
    id: "lojista",
    keyword: "#LOJISTA",
    label: "Sou Lojista / Parceiro",
    icon: Store,
    description: "Vender no nosso marketplace",
    greeting: `#LOJISTA\n\nOlá, Enfª Brisa! 🌿 Sou lojista/parceiro e tenho interesse em levar meus produtos para o marketplace da Planta y Raiz. Como fazemos a parceria? 🤝🚀`,
    landing: `${SITE_BASE}/parceiros`,
    color: "hsl(45 93% 58%)",
  },
  {
    id: "ebook",
    keyword: "#EBOOK",
    label: "Biblioteca / E-book",
    icon: BookOpen,
    description: "Material educativo gratuito",
    greeting: `#EBOOK\n\nOlá, Enfª Brisa! 🌿 Quero acessar a biblioteca e receber o e-book gratuito sobre cannabis medicinal. Pode me enviar? 📚💚`,
    landing: `${SITE_BASE}/biblioteca`,
    color: "hsl(280 67% 60%)",
  },
  {
    id: "suporte",
    keyword: "#SUPORTE",
    label: "Suporte Geral",
    icon: HelpCircle,
    description: "Falar direto com o atendimento",
    greeting: `#SUPORTE\n\nOlá, Enfª Brisa! 🌿 Preciso de suporte com a plataforma Planta y Raiz. Pode me ajudar? 🙏`,
    landing: null,
    color: "hsl(0 84% 65%)",
  },
] as const;

export const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Badge "Oi! Posso ajudar?" — aparece após 4s, some quando o menu abre
  useEffect(() => {
    if (sessionStorage.getItem("pyr_brisa_hint_shown")) return;
    const t = setTimeout(() => setShowHint(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowHint(false);
      sessionStorage.setItem("pyr_brisa_hint_shown", "1");
    }
  }, [isOpen]);

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

  const handleOptionClick = async (option: (typeof VISITOR_OPTIONS)[number]) => {
    trackPixelEvent("Contact", {
      content_name: `brisa_${option.id}`,
    }, {
      leadScore: 30,
      funnelStage: "intent",
      category: "conversion",
    });

    // Persiste lead com a categoria escolhida (LGPD-friendly: só salva se houver dados)
    try {
      const nome = localStorage.getItem("pr_lead_name") || "Visitante";
      const telefone = localStorage.getItem("pr_lead_phone") || "";
      if (telefone) {
        await supabase.from("leads_contatos").insert({
          nome,
          telefone,
          origem: "brisa_whatsapp_fab",
          categoria: option.id,
          tags: [option.keyword.replace("#", "").toLowerCase()],
        });
      }
    } catch (e) {
      console.warn("[Brisa] lead persist skipped:", e);
    }

    // Mensagem com keyword na primeira linha — ManyChat usa isso como gatilho
    const fullMessage = option.greeting;
    const whatsappUrl = `https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent(fullMessage)}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Abre WhatsApp (bot ManyChat assume pela keyword)
    if (isMobile) {
      window.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    // Em paralelo, redireciona a aba atual para a landing da categoria (quando houver)
    if (option.landing && !isMobile) {
      setTimeout(() => {
        window.location.href = option.landing!;
      }, 600);
    } else if (option.landing && isMobile) {
      // No mobile, salva a landing para abrir quando o usuário voltar ao site
      sessionStorage.setItem("pyr_brisa_next_landing", option.landing);
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
            <p className="text-sm font-bold text-foreground">🌿 Olá! Sou a Enfª Brisa</p>
            <p className="text-xs text-muted-foreground mt-0.5">Para te ajudar melhor, escolha uma das opções abaixo:</p>
          </div>

          {/* Options */}
          <div className="p-2 flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
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

      {/* Badge "Oi! Posso ajudar?" */}
      {showHint && !isOpen && (
        <div
          className="absolute right-16 bottom-2 md:bottom-3 whitespace-nowrap px-3 py-1.5 rounded-full shadow-lg border border-border animate-in fade-in slide-in-from-right-2 duration-300 cursor-pointer"
          style={{
            background: "hsl(var(--card))",
          }}
          onClick={() => setIsOpen(true)}
        >
          <span className="text-xs font-medium text-foreground">Oi! Posso ajudar? 🌿</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(false);
              sessionStorage.setItem("pyr_brisa_hint_shown", "1");
            }}
            className="ml-2 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            ×
          </button>
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
        aria-label="Fale conosco — Enfª Brisa"
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
