import { MessageCircle } from "lucide-react";

export const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/5511987131241?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20Planta%20%26%20Raiz"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center group glow-green"
      style={{ background: "linear-gradient(135deg, hsl(152 100% 74% / 0.2), hsl(152 100% 74% / 0.1))", border: "1px solid hsl(152 100% 74% / 0.3)" }}
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle size={28} className="text-secondary" />
      <span className="absolute right-full mr-3 px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-bold glass border border-border text-foreground">
        Fale Conosco
      </span>
    </a>
  );
};
