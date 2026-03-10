import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, ExternalLink, Bitcoin, Send, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WALLET_ADDRESS = "0xad1f4cd9a5aab504e0486438bb49e3ab968af3d1";
const WHATSAPP_NUMBER = "5511999999999";

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
    toast.success("Endereço copiado!");
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

      // Open WhatsApp with pre-filled message
      const msg = encodeURIComponent(
        `🪙 Pagamento BTC - Planta & Raiz\n\n` +
        `📋 Plano: ${planName}\n` +
        `💰 Valor: ${amount}\n` +
        `📧 E-mail: ${email}\n\n` +
        `Segue em anexo o comprovante de depósito BTC.\n` +
        `Endereço da carteira: ${WALLET_ADDRESS}`
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
      <DialogContent className="max-w-md border-border bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-black text-foreground">
            <Bitcoin size={24} className="text-amber-500" />
            Pagar com Bitcoin
          </DialogTitle>
        </DialogHeader>

        {step === "info" ? (
          <div className="space-y-5">
            {/* Plan info */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plano selecionado</p>
                  <p className="font-display font-black text-foreground text-lg">{planName}</p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-lg font-black">
                  {amount}
                </Badge>
              </div>
            </div>

            {/* Pioneer badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-xl">🏆</span>
              <p className="text-xs text-primary font-bold">
                Primeira plataforma de telemedicina a aceitar Bitcoin!
              </p>
            </div>

            {/* Wallet address */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Endereço da Carteira BTC</label>
              <div className="flex gap-2">
                <code className="flex-1 p-3 rounded-xl bg-muted/50 border border-border text-xs text-foreground break-all font-mono">
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">E-mail cadastrado na plataforma</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" /> Instruções de Validação
              </h4>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                <li>Copie o endereço da carteira acima</li>
                <li>Realize o depósito no <strong>valor exato</strong> do plano escolhido ({amount})</li>
                <li>Tire um <strong>print/screenshot do comprovante</strong></li>
                <li>Clique em "Enviar Comprovante" — o WhatsApp abrirá automaticamente</li>
                <li>Envie o comprovante + e-mail cadastrado pelo WhatsApp</li>
                <li>Seu acesso será liberado em <strong>até 12 horas</strong> após confirmação</li>
              </ol>
            </div>

            {/* Time notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} />
              <span>Liberação em até <strong className="text-foreground">12 horas</strong> após envio do comprovante</span>
            </div>

            {/* Submit */}
            <Button
              className="w-full rounded-2xl font-black bg-amber-500 text-black hover:bg-amber-400 h-12"
              onClick={handleSubmit}
              disabled={submitting || !email}
            >
              {submitting ? (
                "Registrando..."
              ) : (
                <>
                  <Send size={16} className="mr-2" /> Enviar Comprovante via WhatsApp
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <div>
              <h3 className="font-display font-black text-foreground text-xl mb-2">Solicitação Registrada!</h3>
              <p className="text-sm text-muted-foreground">
                Envie o comprovante de depósito pelo WhatsApp que foi aberto.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border text-left space-y-2">
              <p className="text-xs text-muted-foreground">📋 <strong>Plano:</strong> {planName}</p>
              <p className="text-xs text-muted-foreground">💰 <strong>Valor:</strong> {amount}</p>
              <p className="text-xs text-muted-foreground">📧 <strong>E-mail:</strong> {email}</p>
              <p className="text-xs text-muted-foreground">⏰ <strong>Prazo:</strong> Até 12 horas para liberação</p>
            </div>
            <p className="text-xs text-amber-500 font-bold flex items-center justify-center gap-1">
              <AlertTriangle size={12} /> O valor do depósito deve ser exatamente {amount}
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
