import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Bitcoin, Send, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WALLET_ADDRESS = "156MVB1STnyWzmsJHeh8iTi4mMMfzmndXn";
const WHATSAPP_NUMBER = "5511991363154";

interface BTCPaymentModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  planId: string;
  amount: string;
}

export const BTCPaymentModal = ({ open, onClose, planName, planId, amount }: BTCPaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"info" | "confirm">("info");
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    toast.success("Endereço BTC copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("btc_subscriptions" as any).insert({
        email,
        plan_id: planId,
        plan_name: planName,
        amount: parseFloat(amount.replace(/[^\d.,]/g, "").replace(",", ".")),
        status: "pending",
      } as any);

      if (error) throw error;

      setStep("confirm");

      const msg = encodeURIComponent(
        `🪙 Pagamento BTC - Planta & Raiz\n\n` +
        `📋 Produto/Plano: ${planName}\n` +
        `💰 Valor: ${amount}\n` +
        `📧 E-mail: ${email}\n` +
        `🔗 Carteira: ${WALLET_ADDRESS}\n\n` +
        `Olá Enf. Brisa, eu ${email} acabei de efetuar o pagamento em BTC de "${planName}" e estou enviando o comprovante do depósito para agilizar minha solicitação. Obrigado!`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    } catch (err) {
      console.error("BTC submission error:", err);
      toast.error("Erro ao registrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("info");
    setEmail("");
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-border bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-black text-foreground text-base sm:text-lg">
            <Bitcoin size={22} className="text-amber-500" />
            Pagar com Bitcoin
          </DialogTitle>
        </DialogHeader>

        {step === "info" ? (
          <div className="space-y-4">
            {/* Plan info */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Produto / Plano</p>
                  <p className="font-display font-black text-foreground text-sm sm:text-base">{planName}</p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-sm sm:text-base font-black">
                  {amount}
                </Badge>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-foreground">Escaneie o QR Code para pagar</p>
              <div className="bg-white rounded-xl p-3 border border-border">
                <img
                  src="/images/btc-qrcode.jpeg"
                  alt="QR Code Bitcoin"
                  className="w-40 h-40 sm:w-48 sm:h-48 object-contain mx-auto"
                />
              </div>
              <p className="text-[10px] text-amber-500 font-bold">Rede: Bitcoin (BTC)</p>
            </div>

            {/* Wallet address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Endereço da Carteira BTC (Copiar & Colar)</label>
              <div className="flex gap-2">
                <code className="flex-1 p-2.5 rounded-xl bg-muted/50 border border-border text-[10px] sm:text-xs text-foreground break-all font-mono leading-relaxed">
                  {WALLET_ADDRESS}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className={`shrink-0 rounded-xl ${copied ? "border-primary text-primary" : "border-border"}`}
                  onClick={handleCopy}
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">E-mail cadastrado na plataforma</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border">
              <h4 className="text-xs font-black text-foreground flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" /> Instruções
              </h4>
              <ol className="space-y-1.5 text-[10px] sm:text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
                <li>Escaneie o QR Code ou copie o endereço acima</li>
                <li>Deposite o <strong>valor exato</strong> em BTC ({amount})</li>
                <li>Tire um <strong>print/screenshot do comprovante</strong></li>
                <li>Clique em "Enviar Comprovante" — WhatsApp abrirá</li>
                <li>Envie o comprovante para <strong>Enf. Brisa</strong></li>
                <li>Acesso liberado em <strong>até 12h</strong> após confirmação</li>
              </ol>
            </div>

            {/* Time notice */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <Clock size={12} />
              <span>Liberação em até <strong className="text-foreground">12 horas</strong> após envio do comprovante</span>
            </div>

            {/* Submit */}
            <Button
              className="w-full rounded-2xl font-black bg-amber-500 text-black hover:bg-amber-400 h-11 text-sm"
              onClick={handleSubmit}
              disabled={submitting || !email}
            >
              {submitting ? "Registrando..." : <><Send size={14} className="mr-2" /> Enviar Comprovante via WhatsApp</>}
            </Button>

            <p className="text-[9px] text-muted-foreground text-center">
              ⚠️ Não envie NFTs. Rede Bitcoin (BTC) apenas. Depósitos de contratos inteligentes não são suportados.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-center py-3">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="font-display font-black text-foreground text-lg mb-1">Solicitação Registrada!</h3>
              <p className="text-xs text-muted-foreground">
                Envie o comprovante pelo WhatsApp que foi aberto.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border text-left space-y-1.5">
              <p className="text-xs text-muted-foreground">📋 <strong>Produto:</strong> {planName}</p>
              <p className="text-xs text-muted-foreground">💰 <strong>Valor:</strong> {amount}</p>
              <p className="text-xs text-muted-foreground">📧 <strong>E-mail:</strong> {email}</p>
              <p className="text-xs text-muted-foreground">⏰ <strong>Prazo:</strong> Até 12h para liberação</p>
            </div>
            <p className="text-[10px] text-amber-500 font-bold flex items-center justify-center gap-1">
              <AlertTriangle size={10} /> Valor exato: {amount}
            </p>
            <Button variant="outline" className="rounded-2xl" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
