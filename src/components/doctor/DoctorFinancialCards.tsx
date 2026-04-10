import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Gift, PiggyBank, Percent } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  doctorId: string;
  currentTier: string;
}

export const DoctorFinancialCards = ({ doctorId, currentTier }: Props) => {
  const [earnings, setEarnings] = useState({ total: 0, monthConsultations: 0, platformFee: 0, distributionBonus: 0 });
  const [poolData, setPoolData] = useState({ totalPool: 0, distributed: 0 });

  useEffect(() => {
    if (!doctorId) return;
    fetchFinancials();
  }, [doctorId]);

  const fetchFinancials = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch escrow transactions for this doctor
    const { data: escrows } = await supabase
      .from("escrow_transactions")
      .select("amount, platform_fee, doctor_payout, status, created_at")
      .eq("doctor_id", doctorId);

    const released = escrows?.filter(e => e.status === "released") || [];
    const monthReleased = released.filter(e => new Date(e.created_at) >= new Date(startOfMonth));

    const totalEarnings = released.reduce((s, e) => s + Number(e.doctor_payout || 0), 0);
    const monthEarnings = monthReleased.reduce((s, e) => s + Number(e.doctor_payout || 0), 0);
    const totalFees = released.reduce((s, e) => s + Number(e.platform_fee || 0), 0);

    // Fetch performance metrics for distribution bonus
    const { data: metrics } = await supabase
      .from("doctor_performance_metrics")
      .select("estimated_share, weighted_score")
      .eq("doctor_id", doctorId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch pool data
    const { data: pool } = await supabase
      .from("revenue_distribution_pool")
      .select("total_pool, distributed_amount")
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();

    setEarnings({
      total: totalEarnings,
      monthConsultations: monthEarnings,
      platformFee: totalFees,
      distributionBonus: Number(metrics?.estimated_share || 0),
    });

    setPoolData({
      totalPool: Number(pool?.total_pool || 0),
      distributed: Number(pool?.distributed_amount || 0),
    });
  };

  const feeRate = currentTier === "basic" ? 0 : currentTier === "enterprise" ? 0 : currentTier === "premium" ? 3 : 5;

  const cards = [
    {
      icon: DollarSign,
      label: "Ganhos Acumulados",
      value: `R$ ${earnings.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      sub: "Total líquido recebido",
      color: "text-primary",
      glow: "shadow-primary/10",
    },
    {
      icon: TrendingUp,
      label: "Ganhos do Mês",
      value: `R$ ${earnings.monthConsultations.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      sub: "Consultas no mês atual",
      color: "text-primary",
      glow: "shadow-primary/10",
    },
    {
      icon: Gift,
      label: "Bônus de Distribuição",
      value: `R$ ${earnings.distributionBonus.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      sub: "10% do lucro da plataforma",
      color: "text-amber-400",
      glow: "shadow-amber-400/10",
    },
    {
      icon: Percent,
      label: "Taxa de Intermediação",
      value: feeRate === 0 ? "ZERO ✨" : `${feeRate}%`,
      sub: feeRate === 0 ? "100% dos honorários são seus" : `${100 - feeRate}% dos honorários retidos`,
      color: feeRate === 0 ? "text-primary" : "text-muted-foreground",
      glow: feeRate === 0 ? "shadow-primary/10" : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className={`border-border hover:border-primary/20 transition-all ${card.glow ? `shadow-lg ${card.glow}` : ""}`}>
            <CardContent className="p-4">
              <card.icon size={20} className={card.color} />
              <p className={`text-xl font-display font-black mt-2 ${card.color}`}>{card.value}</p>
              <p className="text-xs font-bold text-foreground">{card.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
