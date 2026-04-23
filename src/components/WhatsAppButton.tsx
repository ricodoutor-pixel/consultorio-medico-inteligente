import { MessageCircle } from "lucide-react";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";

const WHATSAPP_DIRECT_URL = `https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent("Olá Enf. Brisa! Gostaria de informações sobre consultas.")}`;

export const WhatsAppButton = () => {
  const handleClick = () => {
    trackPixelEvent("Contact", { content_name: "whatsapp_floating" }, {
      leadScore: 20,
      funnelStage: "intent",
      category: "conversion",
    });
    window.open(WHATSAPP_DIRECT_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 p-3 md:p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center group glow-green"
      style={{ background: "linear-gradient(135deg, hsl(152 100% 74% / 0.2), hsl(152 100% 74% / 0.1))", border: "1px solid hsl(152 100% 74% / 0.3)" }}
      aria-label="Fale conosco no WhatsApp — Enf. Brisa"
    >
      <MessageCircle size={28} className="text-secondary" />
      <span className="absolute right-full mr-3 px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-bold glass border border-border text-foreground">
        Fale com a Enf. Brisa
      </span>
    </button>
  );
};
