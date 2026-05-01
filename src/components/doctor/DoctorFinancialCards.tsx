import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Gift, Percent, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  doctorId: string;
  currentTier: string;
}

export const DoctorFinancialCards = ({ doctorId, currentTier }: Props) => {
  const [earnings, setEarnings] = useState({ total: 0, monthOrientação Técnications: 0, platformFee: 0, distributionBonus: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) return;
    fetchFinancials();
  }, [doctorId]);

  const fetchFinancials = async () => {
    setLoading(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [escrowRes, metricsRes] = await Promise.all([
      supabase.from("escrow_transactions").select("amount, platform_fee, doctor_payout, status, created_at").eq("doctor_id", doctorId),
      supabase.from("doctor_performance_metrics").select("estimated_share").eq("doctor_id", doctorId).order("year", { ascending: false }).order("month", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const released = escrowRes.data?.filter(e => e.status === "released") || [];
    const monthReleased = released.filter(e => new Date(e.created_at) >= new Date(startOfMonth));

    setEarnings({
      total: released.reduce((s, e) => s + Number(e.doctor_payout || 0), 0),
      monthOrientação Técnications: monthReleased.reduce((s, e) => s + Number(e.doctor_payout || 0), 0),
      platformFee: released.reduce((s, e) => s + Number(e.platform_fee || 0), 0),
      distributionBonus: Number(metricsRes.data?.estimated_share || 0),
    });
    setLoading(false);
  };

  const feeRate = currentTier === "basic" ? 0 : currentTier === "enterprise" ? 2 : currentTier === "premium" ? 3 : 5;

  const cards = [
    { icon: DollarSign, label: "Ganhos Acumulados", value: `R$ ${earnings.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: "Total líquido recebido", color: "text-primary", glow: "shadow-primary/10", tooltip: "Soma de todos os honorários líquidos já recebidos via orientação técnicas e serviços na plataforma." },
    { icon: TrendingUp, label: "Ganhos do Mês", value: `R$ ${earnings.monthOrientação Técnications.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: "Orientação Técnicas no mês atual", color: "text-primary", glow: "shadow-primary/10", tooltip: "Total de honorários recebidos no mês corrente por orientação técnicas finalizadas." },
    { icon: Gift, label: "Bônus de Distribuição", value: `R$ ${earnings.distributionBonus.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, sub: "10% do lucro da plataforma", color: "text-amber-400", glow: "shadow-amber-400/10", tooltip: "Sua participação nos 10% de lucro global da plataforma, calculada pelo seu Score Ponderado e multiplicador do plano." },
    { icon: Percent, label: "Taxa de Intermediação", value: feeRate === 0 ? "ZERO ✨" : `${feeRate}%`, sub: feeRate === 0 ? "100% dos honorários são seus" : `${100 - feeRate}% dos honorários retidos`, color: feeRate === 0 ? "text-primary" : "text-muted-foreground", glow: feeRate === 0 ? "shadow-primary/10" : "", tooltip: feeRate === 0 ? "Com seu plano atual, você retém 100% dos honorários sem nenhuma taxa de intermediação." : `A plataforma retém ${feeRate}% como taxa de intermediação. Faça upgrade para Taxa Zero no plano VIP.` },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`border-border hover:border-primary/20 transition-all ${card.glow ? `shadow-lg ${card.glow}` : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <card.icon size={20} className={card.color} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                      {card.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className={`text-xl font-display font-black mt-2 ${card.color}`}>{card.value}</p>
                <p className="text-xs font-bold text-foreground">{card.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
};
