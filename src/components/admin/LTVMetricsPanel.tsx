import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Users, DollarSign, Repeat } from "lucide-react";

interface LTVMetrics {
  avgLTV: number;
  kFactor: number;
  currentMRR: number;
  projectedMRR: { month: string; mrr: number }[];
  totalAffiliates: number;
  avgReferralsPerUser: number;
}

export function LTVMetricsPanel() {
  const [metrics, setMetrics] = useState<LTVMetrics>({
    avgLTV: 0,
    kFactor: 0,
    currentMRR: 0,
    projectedMRR: [],
    totalAffiliates: 0,
    avgReferralsPerUser: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Fetch paid appointments for LTV
      const { data: appointments } = await supabase
        .from("appointments")
        .select("amount, patient_id, created_at")
        .eq("payment_status", "paid");

      // Fetch referral data for K-Factor
      const { data: referrals } = await supabase
        .from("referral_links")
        .select("user_id, total_referrals");

      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Calculate LTV
      const userSpend: Record<string, number> = {};
      (appointments || []).forEach((a) => {
        userSpend[a.patient_id] = (userSpend[a.patient_id] || 0) + Number(a.amount || 0);
      });
      const spendValues = Object.values(userSpend);
      const avgLTV = spendValues.length > 0
        ? spendValues.reduce((s, v) => s + v, 0) / spendValues.length
        : 0;

      // Calculate K-Factor: (avg referrals per user) × (conversion rate)
      const totalRefs = (referrals || []).reduce((s, r) => s + (r.total_referrals || 0), 0);
      const usersWithRefs = (referrals || []).length || 1;
      const avgReferralsPerUser = totalRefs / usersWithRefs;
      const conversionRate = 0.35; // estimated
      const kFactor = avgReferralsPerUser * conversionRate;

      // Current MRR from recent month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthRevenue = (appointments || [])
        .filter((a) => new Date(a.created_at) >= monthStart)
        .reduce((s, a) => s + Number(a.amount || 0), 0);

      // Project MRR for next 6 months (growth rate from K-Factor)
      const growthRate = Math.max(1.05, 1 + kFactor * 0.1); // min 5% growth
      const projectedMRR = [];
      let mrr = currentMonthRevenue || 1000;
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
        mrr = Math.round(mrr * growthRate);
        projectedMRR.push({
          month: d.toLocaleString("pt-BR", { month: "short", year: "2-digit" }),
          mrr,
        });
      }

      setMetrics({
        avgLTV: Math.round(avgLTV * 100) / 100,
        kFactor: Math.round(kFactor * 100) / 100,
        currentMRR: currentMonthRevenue,
        projectedMRR,
        totalAffiliates: usersWithRefs,
        avgReferralsPerUser: Math.round(avgReferralsPerUser * 10) / 10,
      });
    } catch (err) {
      console.error("LTV metrics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <Card className="border-border bg-card/50 animate-pulse">
        <CardContent className="p-6 h-40" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "LTV Médio", value: fmt(metrics.avgLTV), icon: DollarSign, color: "text-primary bg-primary/10" },
          { label: "K-Factor", value: metrics.kFactor.toFixed(2), icon: Users, color: "text-amber-500 bg-amber-500/10", sub: metrics.kFactor >= 1 ? "Viral! 🚀" : "Crescendo" },
          { label: "MRR Atual", value: fmt(metrics.currentMRR), icon: Repeat, color: "text-green-500 bg-green-500/10" },
          { label: "Afiliados Ativos", value: metrics.totalAffiliates.toString(), icon: TrendingUp, color: "text-secondary bg-secondary/10", sub: `${metrics.avgReferralsPerUser} indicações/user` },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <h3 className="text-lg font-black text-foreground mt-1">{kpi.value}</h3>
                  {kpi.sub && <p className="text-[10px] text-primary font-bold">{kpi.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon size={18} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MRR Projection Chart */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              MRR Projetada — Próximos 6 Meses
            </CardTitle>
            <Badge className="bg-primary/10 text-primary text-[9px]">
              Taxa de crescimento: {((Math.max(1.05, 1 + metrics.kFactor * 0.1) - 1) * 100).toFixed(0)}%/mês
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.projectedMRR}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [fmt(value), "MRR"]}
              />
              <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
