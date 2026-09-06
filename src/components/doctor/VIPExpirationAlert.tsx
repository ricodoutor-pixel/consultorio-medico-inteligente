import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  doctorId: string;
}

/**
 * Mostra alerta vermelho quando faltam <= 5 dias para expirar o VIP trial (ou assinatura ativa).
 * Novos médicos prescritores ganham 30 dias VIP grátis (plan_tier=premium) via trigger no cadastro.
 */
export function VIPExpirationAlert({ doctorId }: Props) {
  const [sub, setSub] = useState<{ expires_at: string; plan_tier: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("medical_subscriptions")
        .select("expires_at, plan_tier")
        .eq("doctor_id", doctorId)
        .eq("status", "active")
        .order("expires_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.expires_at) setSub(data as any);
    })();
    return () => { cancelled = true; };
  }, [doctorId]);

  if (!sub?.expires_at) return null;

  const daysLeft = Math.ceil(
    (new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft > 5 || daysLeft < 0) return null;

  const handleRenew = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("mp-checkout", {
        body: { sku: "plano_medico" },
      });
      if (error) throw error;
      if (data?.init_point) window.location.href = data.init_point;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="border-red-500/40 bg-red-500/10 mb-6 animate-pulse-slow">
      <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} className="text-red-400" />
          </div>
          <div>
            <p className="font-display font-black text-red-100 flex items-center gap-2">
              <Crown size={16} className="text-amber-300" />
              Seu plano VIP está vencendo em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
            </p>
            <p className="text-xs text-red-200/80 mt-1">
              Renove agora por apenas <span className="font-bold">R$ 99 via PIX</span> e mantenha seus privilégios: prioridade no rodízio, selo VIP, split premium e ferramentas Pro.
            </p>
          </div>
        </div>
        <Button
          onClick={handleRenew}
          className="bg-red-500 hover:bg-red-600 text-white font-black rounded-xl w-full md:w-auto shrink-0"
        >
          Renovar por R$ 99 (PIX)
        </Button>
      </CardContent>
    </Card>
  );
}
