import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { BRISA_WHATSAPP } from "@/lib/whatsapp-brisa";

export type WhatsAppContext =
  | { type: "compra"; productName: string; value: number }
  | { type: "assinatura"; planName: string; value: number }
  | { type: "consulta"; doctorName?: string; specialty?: string }
  | { type: "agendamento"; doctorName?: string; specialty?: string }
  | { type: "duvida"; assunto?: string }
  | { type: "geral" };

function buildWhatsAppMessage(ctx: WhatsAppContext, userName: string): string {
  const name = userName || "Paciente";
  switch (ctx.type) {
    case "compra":
      return `Olá Enf. Brisa, eu ${name} acabo de efetuar a compra do produto "${ctx.productName}" no valor de R$ ${ctx.value.toFixed(2)} e estou enviando o comprovante do depósito para agilizar a minha solicitação! Obrigado(a).`;
    case "assinatura":
      return `Olá Enf. Brisa, eu ${name} acabo de efetuar a assinatura do plano "${ctx.planName}" no valor de R$ ${ctx.value.toFixed(2)} e estou enviando o comprovante do depósito para agilizar a minha solicitação! Obrigado(a).`;
    case "consulta":
      return `Olá Enf. Brisa, eu ${name} acabo de efetuar o pagamento da consulta${ctx.doctorName ? ` com Dr(a). ${ctx.doctorName}` : ""}${ctx.specialty ? ` (${ctx.specialty})` : ""} e estou enviando o comprovante do depósito para agilizar a minha solicitação! Obrigado(a).`;
    case "agendamento":
      return `Olá Enf. Brisa, eu ${name} gostaria de iniciar minha Orientação Técnica${ctx.doctorName ? ` com Dr(a). ${ctx.doctorName}` : ""}${ctx.specialty ? ` na especialidade ${ctx.specialty}` : ""}. Obrigado(a).`;
    case "duvida":
      return `Olá Enf. Brisa, eu ${name} gostaria de saber mais sobre ${ctx.assunto || "os serviços da Planta & Raiz"}. Obrigado(a).`;
    case "geral":
    default:
      return `Olá Enf. Brisa, eu ${name} gostaria de mais informações sobre a Planta & Raiz. Obrigado(a).`;
  }
}

function generateWhatsAppURL(ctx: WhatsAppContext, userName: string): string {
  const msg = encodeURIComponent(buildWhatsAppMessage(ctx, userName));
  return `https://wa.me/${BRISA_WHATSAPP}?text=${msg}`;
}

interface WhatsAppProofModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: WhatsAppContext;
  userName?: string;
  onProceed: () => void;
}

export function WhatsAppProofModal({ open, onOpenChange, context, userName, onProceed }: WhatsAppProofModalProps) {
  const [understood, setUnderstood] = useState(false);

  const whatsappUrl = generateWhatsAppURL(context, userName || "");

  const isPurchaseFlow = context.type === "compra" || context.type === "assinatura" || context.type === "consulta";

  const handleProceed = () => {
    onProceed();
    onOpenChange(false);
    setUnderstood(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setUnderstood(false); }}>
      <DialogContent className="max-w-md border-primary/30 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <MessageCircle className="text-secondary" size={22} />
            {isPurchaseFlow ? "Aviso Importante!" : "Fale com a Enf. Brisa"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed pt-2">
            {isPurchaseFlow ? (
              <>
                Logo após finalizar o pagamento,{" "}
                <span className="text-primary font-bold">envie seu comprovante via WhatsApp</span>{" "}
                clicando no botão abaixo. Assim agilizaremos sua solicitação!
              </>
            ) : (
              <>
                Você será direcionado(a) ao WhatsApp da{" "}
                <span className="text-primary font-bold">Enfermeira Brisa</span>{" "}
                com uma mensagem personalizada para sua demanda.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {isPurchaseFlow && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  1. Clique em <strong className="text-foreground">"Prosseguir com Pagamento"</strong> para finalizar via Mercado Pago.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  2. Após o pagamento, <strong className="text-foreground">envie o comprovante pelo WhatsApp</strong> usando o botão verde.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  3. A Enf. Brisa confirmará e agilizará sua solicitação em minutos!
                </p>
              </div>
            </div>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #25d366, #128c7e)",
              color: "white",
            }}
          >
            <MessageCircle size={18} />
            {isPurchaseFlow ? "Enviar Comprovante via WhatsApp" : "Abrir WhatsApp da Enf. Brisa"}
          </a>

          {isPurchaseFlow && (
            <Button
              className="w-full font-bold gap-2"
              onClick={handleProceed}
            >
              Prosseguir com Pagamento <ArrowRight size={16} />
            </Button>
          )}

          {!isPurchaseFlow && (
            <Button variant="ghost" className="w-full text-muted-foreground text-xs" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Planta y Raiz Ltda — Todos os pagamentos são registrados automaticamente para fins de auditoria.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Hook to simplify usage across pages
export function useWhatsAppProofModal() {
  const [modalState, setModalState] = useState<{ open: boolean; context: WhatsAppContext; onProceed: () => void }>({
    open: false,
    context: { type: "geral" },
    onProceed: () => {},
  });

  const showModal = (context: WhatsAppContext, onProceed: () => void) => {
    setModalState({ open: true, context, onProceed });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  return { modalState, showModal, closeModal, setModalOpen: (open: boolean) => setModalState((prev) => ({ ...prev, open })) };
}

export { generateWhatsAppURL, buildWhatsAppMessage };
