import { HealthSubscriptionPlans } from "@/components/subscription/HealthSubscriptionPlans";

/**
 * Planos universais (Paciente · Médico · Lojista) — todos R$ 99/mês.
 * Mantido como wrapper para não duplicar tabelas de preço na plataforma.
 */
export function WellnessSubscriptionCards() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-display font-black text-foreground">
          Planos <span className="text-gradient-green">Planta y Raiz</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Três planos universais — Paciente, Médico e Lojista — todos R$ 99/mês
        </p>
      </div>
      <HealthSubscriptionPlans />
    </div>
  );
}
