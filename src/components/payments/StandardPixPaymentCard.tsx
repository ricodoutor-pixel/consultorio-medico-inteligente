import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  formatPaymentName,
  normalizeReceiverName,
  OFFICIAL_RECEIVER_NAME,
} from "../../../supabase/functions/_shared/payment-catalog";
import { formatBRL } from "@/lib/pricing";
import type { ConsultationPix } from "@/lib/telemedicine-checkout";

export interface StandardPixPaymentCardProps {
  serviceTitle: string;
  serviceSubtitle?: string;
  doctorName?: string | null;
  amount: number;
  pix: ConsultationPix | null;
  busyPix: boolean;
  busyCard?: boolean;
  error?: string | null;
  onGeneratePix: () => void;
  onConfirmCardLeaveSite?: () => void;
  onResetPix?: () => void;
}

/**
 * Componente padronizado de pagamento na tela (mesmo código e experiência da Orientação Técnica).
 * - Pix como opção principal na tela (QR Code + Copia e Cola + aguardo automático, sem sair do site).
 * - Cartão de crédito como opção secundária, com aviso explícito antes de sair do site.
 * - Nome do serviço vindo da tabela única (payment_services) e Recebedor: Planta y Raiz Ltda.
 */
export function StandardPixPaymentCard({
  serviceTitle,
  serviceSubtitle,
  doctorName,
  amount,
  pix,
  busyPix,
  busyCard = false,
  error,
  onGeneratePix,
  onConfirmCardLeaveSite,
  onResetPix,
}: StandardPixPaymentCardProps) {
  const [copiedPix, setCopiedPix] = useState(false);
  const [showCardLeaveWarning, setShowCardLeaveWarning] = useState(false);

  const normalizedDesc = formatPaymentName(pix?.description || serviceTitle);
  const baseServiceLabel = normalizedDesc.replace(/\s*—\s*Planta y Raiz$/i, "").trim();
  const fullPaymentLabel = doctorName
    ? `${baseServiceLabel} com ${doctorName} — Planta y Raiz`
    : normalizedDesc;
  const displayAmount = Number(pix?.amount ?? amount);
  const formattedAmount = displayAmount.toFixed(2).replace(".", ",");
  const receiverName = normalizeReceiverName(pix?.receiver_name || OFFICIAL_RECEIVER_NAME);

  const copyPixCode = async () => {
    if (!pix?.qr_code) return;
    try {
      await navigator.clipboard.writeText(pix.qr_code);
      setCopiedPix(true);
      toast.success("Código Pix copiado! Cole no aplicativo do seu banco.");
      setTimeout(() => setCopiedPix(false), 4000);
    } catch {
      toast.error("Selecione o código Pix e copie manualmente.");
    }
  };

  return (
    <div className="space-y-4">
      {!pix ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="text-primary" size={20} />
              <h2 className="font-display font-black text-foreground text-lg">
                Pagamento seguro na plataforma
              </h2>
            </div>

            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs uppercase font-black text-muted-foreground tracking-wider">
                  {baseServiceLabel}
                </p>
                <p className="text-sm text-muted-foreground">
                  {serviceSubtitle || (doctorName ? `Atendimento com ${doctorName}` : "Planta y Raiz")}
                </p>
              </div>
              <p className="text-3xl font-display font-black text-gradient-green">
                {formatBRL(amount)}
              </p>
            </div>

            <p className="text-xs text-muted-foreground mb-5">
              Pagamento: <strong className="text-foreground">{fullPaymentLabel}</strong> · R$ {formattedAmount} · Recebedor:{" "}
              <strong className="text-foreground">{receiverName}</strong>
            </p>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left space-y-2"
              >
                <div className="flex items-start gap-2 text-destructive text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyPix || busyCard}
                  onClick={onGeneratePix}
                  className="rounded-xl text-xs font-bold border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  Tentar de novo
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="button"
                onClick={onGeneratePix}
                disabled={busyPix || busyCard}
                className="w-full h-14 rounded-2xl font-black text-base shadow-lg hover:shadow-xl transition-all bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
              >
                {busyPix ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Gerando Pix na tela...
                  </>
                ) : (
                  <>
                    <QrCode size={20} /> Pagar {formatBRL(amount)} com Pix (na tela — sem sair do site)
                  </>
                )}
              </Button>

              {onConfirmCardLeaveSite && !showCardLeaveWarning && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCardLeaveWarning(true)}
                  disabled={busyPix || busyCard}
                  className="w-full h-11 rounded-2xl font-semibold text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  Prefere Cartão de Crédito? Pagar via Mercado Pago <ChevronRight size={14} className="ml-1" />
                </Button>
              )}

              {onConfirmCardLeaveSite && showCardLeaveWarning && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left space-y-3">
                  <p className="text-xs font-bold text-foreground">
                    Aviso antes de sair do site (Cartão de Crédito)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Para pagar com <strong>Cartão de Crédito</strong>, você será direcionado ao ambiente do Mercado Pago e voltará automaticamente após a aprovação. Se preferir não sair do site, escolha o <strong>Pix na tela</strong>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={onConfirmCardLeaveSite}
                      disabled={busyCard || busyPix}
                      className="rounded-xl text-xs font-bold flex-1"
                    >
                      {busyCard ? (
                        <>
                          <Loader2 className="animate-spin mr-1.5" size={14} /> Abrindo Mercado Pago...
                        </>
                      ) : (
                        <>
                          Continuar com Cartão (sair do site) <ExternalLink size={13} className="ml-1.5" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCardLeaveWarning(false)}
                      disabled={busyCard}
                      className="rounded-xl text-xs font-bold"
                    >
                      Ficar aqui e pagar com Pix
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1 justify-center">
              <ShieldCheck size={12} className="text-primary" /> Pix na tela ou cartão. A triagem de 5 perguntas abre sozinha após a confirmação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/30 shadow-lg">
          <CardContent className="p-6 md:p-8 text-center space-y-5">
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-display font-black text-lg">
              <QrCode size={24} />
              <h2>Pagamento Pix — R$ {formattedAmount}</h2>
            </div>

            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Pagamento: <strong>{fullPaymentLabel}</strong> · R$ {formattedAmount} · Recebedor:{" "}
              <strong>{receiverName}</strong>
            </p>

            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Abra o aplicativo do seu banco, escolha <strong>Pix &gt; Ler QR Code</strong> ou use a opção{" "}
              <strong>Pix Copia e Cola</strong>. Não é necessário sair desta página: a triagem abre automaticamente após a confirmação!
            </p>

            {/* Imagem QR Code */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md">
                <img
                  src={`data:image/png;base64,${pix.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="w-48 h-48 md:w-56 md:h-56 object-contain"
                />
              </div>
            </div>

            {/* Código Pix Copia e Cola */}
            <div className="space-y-2 max-w-md mx-auto text-left">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Código Pix Copia e Cola
              </label>
              <div className="p-2.5 bg-muted/40 rounded-xl border border-border text-[11px] font-mono break-all line-clamp-2 select-all text-muted-foreground">
                {pix.qr_code}
              </div>

              <Button
                type="button"
                onClick={copyPixCode}
                className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow"
              >
                {copiedPix ? (
                  <>
                    <Check size={18} className="text-white" /> Código Pix Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy size={18} /> Copiar Código Pix (Copia e Cola)
                  </>
                )}
              </Button>
            </div>

            {/* Status de aguardo em tempo real */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
              <Loader2 className="animate-spin text-emerald-600 shrink-0" size={16} />
              <span>Aguardando confirmação do banco… Mantenha esta tela aberta.</span>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive space-y-2"
              >
                <p className="font-bold">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGeneratePix}
                  disabled={busyPix}
                  className="rounded-xl text-xs font-bold"
                >
                  Tentar de novo
                </Button>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              {onConfirmCardLeaveSite && !showCardLeaveWarning && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCardLeaveWarning(true)}
                  disabled={busyCard}
                >
                  Prefere pagar com Cartão de Crédito? Clique aqui
                </Button>
              )}
              {onResetPix && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-xl"
                  onClick={onResetPix}
                >
                  Voltar ao pagamento
                </Button>
              )}
            </div>

            {onConfirmCardLeaveSite && showCardLeaveWarning && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left space-y-3 max-w-md mx-auto">
                <p className="text-xs font-bold text-foreground">
                  Aviso antes de sair do site (Cartão de Crédito)
                </p>
                <p className="text-xs text-muted-foreground">
                  No pagamento por cartão você será direcionado ao Mercado Pago fora do site e voltará após a confirmação.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={onConfirmCardLeaveSite}
                    disabled={busyCard}
                    className="rounded-xl text-xs font-bold flex-1"
                  >
                    {busyCard ? "Abrindo..." : "Continuar com Cartão (sair do site)"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCardLeaveWarning(false)}
                    className="rounded-xl text-xs font-bold"
                  >
                    Continuar no Pix
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
