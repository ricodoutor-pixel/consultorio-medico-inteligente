import { useState } from "react";
import { Check, Crown, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { functionErrorMessage } from "@/lib/function-error";
import {
  DOCTOR_PLANS, DOCTOR_PRO_TOOLS, doctorPlan, proToolsForPlan, type DoctorPlan,
} from "../../../supabase/functions/_shared/doctor-plans";

const ACCENT: Record<string, string> = {
  free: "border-border",
  premium: "border-emerald-500/50",
  ouro: "border-yellow-500/60",
  platina: "border-slate-300/70",
  diamante: "border-sky-400/60",
  elite: "border-violet-500/60",
  black: "border-zinc-200/70 bg-zinc-950/40",
};

/** Itens do plano gerados dos mesmos números que o servidor aplica (doctor-plans.ts). */
export function planBenefits(plan: DoctorPlan): string[] {
  const items = [
    plan.queueRank > 0 ? `Prioridade na fila de consultas: nível ${plan.queueRank} de 6` : "Recebe consultas depois dos assinantes",
    `Copiloto Clínico (PubMed): ${plan.limits.copiloto}/dia`,
    plan.limits.juridico > 0 ? `Assistente Jurídico: ${plan.limits.juridico}/dia` : "Assistente Jurídico: não incluído",
    `Escriba de consulta: ${plan.limits.escriba} trechos/dia`,
  ];
  const tools = proToolsForPlan(plan.key);
  if (tools.length) {
    items.push(`Ferramentas exclusivas (${plan.limits.pro}/dia):`);
    for (const t of tools) items.push(`• ${DOCTOR_PRO_TOOLS[t].title}`);
  }
  return items;
}

export function DoctorPlansGrid({ planTier }: { planTier?: string | null }) {
  const current = doctorPlan(planTier);
  const [busy, setBusy] = useState<string | null>(null);

  const subscribe = async (plan: DoctorPlan) => {
    if (!plan.sku) return;
    setBusy(plan.key);
    const { data, error } = await supabase.functions.invoke("mp-checkout", { body: { sku: plan.sku } });
    setBusy(null);
    const url = data?.init_point || data?.url;
    if (error || !url) {
      toast.error(await functionErrorMessage(error, "Não foi possível abrir o pagamento agora. Tente de novo."));
      return;
    }
    window.location.href = url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" /> Planos do médico
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Seu plano: <strong className="text-foreground">{current.name}</strong>. Cada plano inclui tudo do anterior; a cobrança é mensal
          pelo Mercado Pago e pode ser cancelada a qualquer momento.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DOCTOR_PLANS.map((plan) => {
          const isCurrent = plan.key === current.key;
          const lower = plan.queueRank < current.queueRank;
          return (
            <div key={plan.key} className={`rounded-2xl border-2 p-4 flex flex-col ${ACCENT[plan.key]} ${isCurrent ? "ring-2 ring-emerald-500" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-display font-black text-lg text-foreground">{plan.name}</p>
                {isCurrent && <Badge className="bg-emerald-600 text-white">Seu plano</Badge>}
              </div>
              <p className="mt-1 text-2xl font-black text-foreground">
                {plan.priceBrl === 0 ? "Grátis" : `R$ ${plan.priceBrl.toLocaleString("pt-BR")}`}
                {plan.priceBrl > 0 && <span className="text-xs font-bold text-muted-foreground">/mês</span>}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
              <ul className="mt-3 space-y-1 flex-1">
                {planBenefits(plan).map((b) => (
                  <li key={b} className="text-xs text-foreground/90 flex items-start gap-1.5">
                    {b.startsWith("•") ? <span className="w-3.5" /> : <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />}
                    <span>{b.replace(/^• /, "")}</span>
                  </li>
                ))}
              </ul>
              {plan.sku && !isCurrent && !lower && (
                <Button className="mt-4 w-full" onClick={() => void subscribe(plan)} disabled={busy !== null}>
                  {busy === plan.key ? <Loader2 className="h-4 w-4 animate-spin" /> : `Assinar ${plan.name}`}
                </Button>
              )}
              {lower && (
                <p className="mt-4 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Incluído no seu plano atual
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
