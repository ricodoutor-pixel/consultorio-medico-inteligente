import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TripleCheckout, CheckoutOptionKey } from "@/components/checkout/TripleCheckout";
import { useQueueOrchestrator } from "@/hooks/useQueueOrchestrator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Stethoscope } from "lucide-react";

/**
 * /planos-tratamento — Apresenta o Triple Checkout:
 *  A) Assinatura R$79/mês  → cria treatment_subscription + redireciona para pagamento
 *  B) Consulta R$49 agendada → /agendamento
 *  C) Atendimento Imediato R$80 → usa useQueueOrchestrator → /pay?type=immediate
 */
export default function PlanosTratamento() {
  const navigate = useNavigate();
  const { doctor, loading: queueLoading } = useQueueOrchestrator(15000);

  const handleSelect = async (opt: CheckoutOptionKey) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.info("Faça login para continuar");
      sessionStorage.setItem("post_login_redirect", "/planos-tratamento");
      navigate("/login");
      return;
    }

    if (opt === "A") {
      const nextCharge = new Date();
      nextCharge.setMonth(nextCharge.getMonth() + 1);
      const { error } = await supabase.from("treatment_subscriptions" as any).insert({
        patient_id: session.user.id,
        plan_code: "tratamento_mensal_79",
        monthly_amount: 79,
        status: "pending",
        next_charge_at: nextCharge.toISOString(),
      });
      if (error) { toast.error(error.message); return; }
      navigate("/pay?type=subscription&amount=79");
      return;
    }

    if (opt === "B") {
      navigate("/agendamento?type=scheduled&amount=49");
      return;
    }

    // C — Atendimento Imediato
    if (!doctor) {
      toast.warning("Nenhum médico disponível agora. Tentando novamente em segundos…");
      return;
    }
    navigate(`/pay?type=immediate&amount=80&doctor=${doctor.doctor_id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="font-display font-black text-3xl md:text-5xl mb-3">
            Escolha seu <span className="text-gradient-green">Plano de Tratamento</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Três caminhos para começar agora. Pagamento seguro via Pix Mercado Pago.
          </p>
        </div>

        {/* Status da fila para Opção C */}
        <div className="max-w-md mx-auto mb-6 p-3 rounded-xl border border-border bg-card/50 flex items-center justify-center gap-2 text-xs">
          {queueLoading ? (
            <><Loader2 size={14} className="animate-spin text-muted-foreground" /><span className="text-muted-foreground">Verificando médicos online…</span></>
          ) : doctor ? (
            <><Stethoscope size={14} className="text-primary" /><span className="text-primary font-bold">Médico disponível agora · {doctor.specialty}</span></>
          ) : (
            <><Stethoscope size={14} className="text-muted-foreground" /><span className="text-muted-foreground">Nenhum médico online no momento — agende para hoje</span></>
          )}
        </div>

        <TripleCheckout onSelect={handleSelect} defaultSelected="A" />
      </main>
      <Footer />
    </div>
  );
}
