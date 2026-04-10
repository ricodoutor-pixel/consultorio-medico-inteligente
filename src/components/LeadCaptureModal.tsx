import { useState, useCallback } from "react";
import { X, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { nome: string; telefone: string }) => void;
  origem: "chat" | "ebook";
  message?: string;
  tags?: string[];
}

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
};

const MANYCHAT_WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manychat-webhook`;

export const LeadCaptureModal = ({
  isOpen,
  onClose,
  onSuccess,
  origem,
  message,
  tags = [],
}: LeadCaptureModalProps) => {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const defaultMessage =
    origem === "chat"
      ? "Para que o Verdinho possa te responder e enviar materiais exclusivos, informe seu contato."
      : "Enviaremos o E-book diretamente para o seu WhatsApp! Informe seu nome e número abaixo.";

  const handleSubmit = useCallback(async () => {
    setError("");

    if (!nome.trim()) {
      setError("Informe seu nome");
      return;
    }
    if (!isValidPhone(telefone)) {
      setError("Informe um telefone válido com DDD");
      return;
    }

    setIsSubmitting(true);

    try {
      const phoneDigits = telefone.replace(/\D/g, "");
      const allTags = origem === "ebook" ? ["Origem_Ebook", ...tags] : ["Origem_Chat", ...tags];

      // Save to database
      await supabase.from("leads_contatos" as any).insert({
        nome: nome.trim(),
        telefone: phoneDigits,
        origem,
        tags: allTags,
      });

      // Send to ManyChat webhook
      try {
        await fetch(MANYCHAT_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            event: "subscriber.new",
            subscriber: {
              name: nome.trim(),
              phone: phoneDigits,
            },
            data: { origem, tags: allTags },
          }),
        });
      } catch {
        // ManyChat webhook failure should not block the user
      }

      onSuccess({ nome: nome.trim(), telefone: phoneDigits });
    } catch {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }, [nome, telefone, origem, tags, onSuccess]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop - no click to close (Gate Fechado) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {/* Green accent line */}
          <div className="h-1 w-full bg-[#39FF14]" />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 flex items-center justify-center">
                  <span className="text-lg">🐸</span>
                </div>
                <h3 className="font-bold text-foreground text-sm">
                  {origem === "chat" ? "Antes de continuar..." : "Quase lá!"}
                </h3>
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {message || defaultMessage}
            </p>

            {/* Form */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#39FF14]/50 transition-colors"
              />
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#39FF14]/50 transition-colors"
              />

              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-xl font-bold text-sm py-2.5 text-black"
                style={{ backgroundColor: "#39FF14" }}
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send size={14} className="mr-1.5" />
                    {origem === "chat" ? "Liberar Chat" : "Receber E-book"}
                  </>
                )}
              </Button>
            </div>

            {/* LGPD Notice */}
            <div className="mt-3 flex items-start gap-1.5">
              <Shield size={10} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-tight">
                Ao continuar, você concorda em receber comunicações da Planta y Raiz via WhatsApp.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
