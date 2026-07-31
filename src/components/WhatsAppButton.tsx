import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Stethoscope, User, Store, BookOpen, HelpCircle, MessageCircle } from "lucide-react";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";
import { supabase } from "@/integrations/supabase/client";
import brisaAvatar from "@/assets/brisa-whatsapp-icon.jpg";

// ManyChat keyword triggers — Ative em Automation → Keywords no painel ManyChat

const VISITOR_OPTIONS = [
  {
    id: "paciente",
    keyword: "#PACIENTE",
    label: "Paciente",
    icon: User,
    description: "Iniciar Orientação Técnica ou tirar dúvidas",
    greeting: "#PACIENTE\n\nOlá, Enfª Brisa! 🌿 Sou paciente e gostaria de iniciar meu atendimento na Planta y Raiz. Pode me ajudar?",
    landing: null,
    color: "hsl(152 100% 74%)",
  },
  {
    id: "medico",
    keyword: "#MEDICO",
    label: "Médico",
    icon: Stethoscope,
    description: "Prescrever na plataforma",
    greeting: "#MEDICO\n\nOlá, Enfª Brisa! 🌿 Sou médico e quero conhecer as vantagens de prescrever pela Planta y Raiz. Como funciona?",
    landing: null,
    color: "hsl(217 91% 60%)",
  },
  {
    id: "lojista",
    keyword: "#LOJISTA",
    label: "Lojista / Parceiro",
    icon: Store,
    description: "Vender no nosso marketplace",
    greeting: "#LOJISTA\n\nOlá, Enfª Brisa! 🌿 Sou lojista e quero levar meus produtos para o ecossistema Planta y Raiz. Como me cadastro?",
    landing: null,
    color: "hsl(45 93% 58%)",
  },
  {
    id: "ebook",
    keyword: "#EBOOK",
    label: "Biblioteca / E-book",
    icon: BookOpen,
    description: "Acessar material educativo gratuito",
    greeting: "#EBOOK\n\nOlá, Enfª Brisa! 🌿 Gostaria de receber o e-book gratuito e acessar a biblioteca científica. Pode me enviar?",
    landing: null,
    color: "hsl(280 67% 60%)",
  },
  {
    id: "suporte",
    keyword: "#SUPORTE",
    label: "Suporte Geral",
    icon: HelpCircle,
    description: "Falar direto com o atendimento",
    greeting: "#SUPORTE\n\nOlá, Enfª Brisa! 🌿 Preciso de ajuda com a plataforma. Pode me dar um suporte?",
    landing: null,
    color: "hsl(0 84% 65%)",
  },
] as const;

export const WhatsAppButton = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDenseCatalogRoute = location.pathname.startsWith("/biblioteca");
  const isPlansRoute = location.pathname === "/planos" || location.pathname === "/precos";
  const isSaudeVerdeRoute = location.pathname.startsWith("/saude-verde") || location.pathname === "/cartao-saude";
  const isTelemedWhatsappRoute = location.pathname === "/telemed-whatsapp";
  const isConsultorioRoute = location.pathname === "/consultorio";
  const buttonSize = isDenseCatalogRoute ? 56 : 64;

  useEffect(() => {
    if (isPlansRoute) {
      setShowHint(false);
      return;
    }
    if (isDenseCatalogRoute || sessionStorage.getItem("pyr_brisa_hint_shown")) return;
    // Badge "Oi! Posso ajudar?" após 3s como solicitado pelo usuário
    const t = setTimeout(() => setShowHint(true), 3000);
    return () => clearTimeout(t);
  }, [isDenseCatalogRoute, isPlansRoute]);

  useEffect(() => {
    if (!isDenseCatalogRoute && !isPlansRoute) return;
    setShowHint(false);
    setIsOpen(false);
  }, [isDenseCatalogRoute, isPlansRoute]);

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

  if (isPlansRoute || isTelemedWhatsappRoute || isConsultorioRoute) return null;

  const handleOptionClick = async (option: (typeof VISITOR_OPTIONS)[number]) => {
    trackPixelEvent("Contact", { content_name: `brisa_${option.id}` });

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

    // Personaliza a saudação com nome do usuário se disponível (CRM/lead context)
    const leadName = (typeof window !== "undefined" && localStorage.getItem("pr_lead_name")) || "";
    const personalizedGreeting = leadName
      ? option.greeting.replace("Olá, Enfª Brisa!", `Olá, Enfª Brisa! Sou ${leadName} e`)
      : option.greeting;

    const whatsappUrl = `https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent(personalizedGreeting)}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    // NOTA: redirecionamento para landing pages internas removido — alguns destinos
    // (ex: /profissionais, /afiliados) podem ter guards de auth que enviavam o
    // usuário para /admin-login. Mantemos apenas a abertura do WhatsApp.

    setIsOpen(false);
  };

  return (
    <div
      ref={menuRef}
      className="fixed right-3 md:right-6 z-40"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
    >

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 sm:w-80 rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ background: "hsl(var(--card))" }}>
          <div className="px-4 py-3 border-b border-border"
            style={{ background: "linear-gradient(135deg, hsl(152 100% 74% / 0.15), hsl(152 100% 74% / 0.05))" }}>
            <p className="text-sm font-bold text-foreground">🌿 Olá! Sou a Enfª Brisa</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Como posso ajudar na sua jornada com a cannabis medicinal hoje?
            </p>
          </div>

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

          <div className="px-4 py-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Atendimento Humanizado & Inteligente 24h
            </p>
          </div>
        </div>
      )}

      {showHint && !isOpen && !isDenseCatalogRoute && !isPlansRoute && (
        <div
          className="absolute right-16 bottom-2 md:bottom-3 whitespace-nowrap px-3 py-1.5 rounded-full shadow-lg border border-border animate-in fade-in slide-in-from-right-2 duration-300 cursor-pointer"
          style={{ background: "hsl(var(--card))" }}
          onClick={() => setIsOpen(true)}
        >
          <span className="text-xs font-medium text-foreground">Oi! Posso ajudar? 🌿</span>
        </div>
      )}

      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-1.5 rounded-full transition-transform duration-300 hover:scale-110 flex items-center justify-center shadow-2xl glow-green overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(152 100% 74% / 0.25), hsl(152 100% 74% / 0.10))",
          border: "2px solid hsl(152 100% 74% / 0.5)",
          width: buttonSize,
          height: buttonSize,
        }}
        aria-label="Fale conosco — Enfª Brisa"
      >

        {isOpen ? (
          <X size={28} className="text-secondary" />
        ) : (
          <img
            src={brisaAvatar}
            alt="Enfermeira Brisa"
            className="w-full h-full rounded-full object-cover"
            style={{ objectPosition: "center center", transform: "scale(1.05)" }}
            loading="eager"
            decoding="async"
          />
        )}
        {!isOpen && (
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center border-2 border-background shadow-md">
            <MessageCircle size={12} className="text-white" fill="white" />
          </span>
        )}
      </button>
    </div>
  );
};

export default WhatsAppButton;
