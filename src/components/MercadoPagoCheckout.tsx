import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MercadoPagoCheckoutProps {
  /** SKU do catálogo server-side (ex.: essencial_mensal, orientacao_tecnica) */
  sku?: string;
  /** Carrinho de prescrição — preço resolvido no servidor */
  cartToken?: string;
  /** Consulta agendada — preço resolvido no servidor */
  appointmentId?: string;
  returnUrl?: string;
  label?: string;
}

/**
 * Checkout oficial da plataforma — Mercado Pago (PIX, cartão e boleto).
 * Substitui o antigo checkout Stripe em 100% dos fluxos.
 */
export function MercadoPagoCheckout({
  sku,
  cartToken,
  appointmentId,
  returnUrl,
  label = "Pagar com Mercado Pago",
}: MercadoPagoCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mp-checkout", {
        body: { sku, cartToken, appointmentId, returnUrl },
      });
      if (error || !data?.init_point) {
        throw new Error(data?.error || error?.message || "Falha ao iniciar pagamento");
      }
      window.location.href = data.init_point;
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível abrir o pagamento. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-3 bg-card">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg transition-all hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {loading ? "Abrindo pagamento seguro..." : label}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck size={14} className="text-primary" />
        PIX, cartão e boleto processados pelo Mercado Pago
      </p>
    </div>
  );
}
