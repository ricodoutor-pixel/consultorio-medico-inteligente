import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { WhatsAppProofModal, type WhatsAppContext } from "./WhatsAppProofModal";

export const WhatsAppButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 p-3 md:p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center group glow-green"
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
        context={{ type: "duvida" } as WhatsAppContext}
        onProceed={() => {}}
      />
    </>
  );
};
