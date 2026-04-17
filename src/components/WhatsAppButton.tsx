import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { WhatsAppProofModal, type WhatsAppContext } from "./WhatsAppProofModal";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { supabase } from "@/integrations/supabase/client";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";

/**
 * Detecta o tipo de origem do clique conforme a rota atual,
 * para classificar a conversão no Supabase e no Pixel.
 */
function detectSource(pathname: string): {
  source: "geral" | "pos_quiz" | "ebook" | "verdinho" | "consulta";
  label: string;
} {
  if (/quiz|triagem/i.test(pathname)) return { source: "pos_quiz", label: "click_whatsapp_pos_quiz" };
  if (/ebook|livro|download/i.test(pathname)) return { source: "ebook", label: "click_whatsapp_ebook" };
  if (/edilson|consult|doctor|medico/i.test(pathname)) return { source: "consulta", label: "click_whatsapp_consulta" };
  if (/verdinho|chat/i.test(pathname)) return { source: "verdinho", label: "click_whatsapp_verdinho" };
  return { source: "geral", label: "click_whatsapp_geral" };
}

export const WhatsAppButton = () => {
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  const handleClick = async () => {
    const { source, label } = detectSource(location.pathname);
    const refId = `${source}_${Date.now().toString(36)}`;

    // 1) Pixel + GTM + CAPI bridge
    trackPixelEvent("Lead", {
      content_name: label,
      ref_id: refId,
      page: location.pathname,
    }, {
      leadScore: 25,
      funnelStage: "intent",
      category: "conversion",
    });

    // 2) Log direto em social_interactions para o dashboard de conversão
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("social_interactions").insert({
        platform: "website",
        interaction_type: label,
        post_url: location.pathname,
        subscriber_id: user?.id || null,
        lead_score: 25,
        funnel_stage: "intent",
        campaign_source: source,
        engagement_data: {
          ref_id: refId,
          page: location.pathname,
          referrer: document.referrer,
          timestamp: Date.now(),
        },
        tags: ["whatsapp", "floating_button", source],
      });
    } catch (err) {
      console.warn("[WhatsApp Button] log error:", err);
    }

    // 3) Para origem "geral" abre direto o WhatsApp com ref_id; nas demais usa modal
    if (source === "geral") {
      const msg = encodeURIComponent(
        `Olá Enf. Brisa! Vim do site (${location.pathname}) e gostaria de saber mais sobre a consultoria. [ref:${refId}]`
      );
      window.open(`https://wa.me/${BRISA_WHATSAPP}?text=${msg}`, "_blank");
      return;
    }

    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 p-3 md:p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center group glow-green"
        style={{ background: "linear-gradient(135deg, hsl(152 100% 74% / 0.2), hsl(152 100% 74% / 0.1))", border: "1px solid hsl(152 100% 74% / 0.3)" }}
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle size={28} className="text-secondary" />
        <span className="absolute right-full mr-3 px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-bold glass border border-border text-foreground">
          Fale Conosco
        </span>
      </button>

      <WhatsAppProofModal
        open={showModal}
        onOpenChange={setShowModal}
        context={{ type: "duvida", assunto: `consultoria (origem: ${location.pathname})` } as WhatsAppContext}
        onProceed={() => {}}
      />
    </>
  );
};
