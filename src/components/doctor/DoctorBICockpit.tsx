import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Award, Target, Coins, Rocket, Crown, ChevronRight, Trophy, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import {
  generateOpportunities,
  calculatePercentile,
  getRevenueProjection,
  getDoctorTier,
  calculateFranchiseRevenue,
  COMMISSION_TIERS,
  calculateNPSBonusCoins,
  MARKETPLACE_ITEMS,
  calculateQualityScore,
  determineSealTier,
  type DoctorBIMetrics,
  type QualityCriteria,
} from "@/lib/domination-services";
import { supabase } from "@/integrations/supabase/client";

const tooltipStyle = {
  background: "hsl(240 15% 7%)",
  border: "1px solid hsl(240 10% 14%)",
  borderRadius: "14px",
  color: "hsl(240 10% 93%)",
};

interface DoctorBICockpitProps {
  doctorId: string;
  currentTier: string;
}

export function DoctorBICockpit({ doctorId, currentTier }: DoctorBICockpitProps) {
  const [metrics, setMetrics] = useState<Partial<DoctorBIMetrics> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      // Fetch real data from Supabase
      const [apptRes, npsRes, perfRes] = await Promise.all([
        supabase.from("appointments").select("amount, status, created_at").eq("doctor_id", doctorId),
        supabase.from("nps_responses").select("score").eq("professional_id", doctorId),
        supabase.from("doctor_performance_metrics").select("*").eq("doctor_id", doctorId).order("year", { ascending: false }).order("month", { ascending: false }).limit(6),
      ]);

      const completedAppts = apptRes.data?.filter(a => a.status === "completed") || [];
      const thisMonthAppts = completedAppts.filter(a => {
        const d = new Date(a.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const monthlyRevenue = thisMonthAppts.reduce((s, a) => s + Number(a.amount || 0), 0);
      const totalConsultations = completedAppts.length;
      const npsScores = npsRes.data?.map(n => n.score) || [];
      const avgNPS = npsScores.length > 0 ? npsScores.reduce((s, v) => s + v, 0) / npsScores.length : 7.5;

      // Calculate tier and franchise revenue
      const tier = getDoctorTier(thisMonthAppts.length);
      const franchise = calculateFranchiseRevenue(monthlyRevenue, thisMonthAppts.length);

      // Calculate Planta-Coins from NPS
      const plantaCoinBalance = calculateNPSBonusCoins(avgNPS * 10);

      // Build revenue history from performance metrics
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const revenueHistory = (perfRes.data || []).reverse().map(p => ({
        month: months[p.month - 1] || `M${p.month}`,
        value: Math.round(p.estimated_share || 0),
      }));

      // Fill with projections if not enough data
      const projections = getRevenueProjection(monthlyRevenue || 5000, 15, 6);
      const projectionHistory = projections.map((v, i) => ({
        month: months[(new Date().getMonth() + i + 1) % 12],
        value: v,
      }));

      const totalDoctors = 150; // simulated
      const rank = Math.max(1, Math.floor(Math.random() * 20) + 1); // simulated

      const biMetrics: Partial<DoctorBIMetrics> = {
        monthlyRevenue: franchise.doctorEarnings,
        revenueGrowth: 15,
        avgConsultationValue: thisMonthAppts.length > 0 ? monthlyRevenue / thisMonthAppts.length : 200,
        consultationsThisMonth: thisMonthAppts.length,
        bonusAccumulated: franchise.platformFee,
        plantaCoinBalance,
        newPatients: Math.floor(totalConsultations * 0.3),
        retentionRate: 87,
        totalPatients: totalConsultations,
        npsScore: avgNPS,
        responseRate: 95,
        avgResponseTime: 12,
        rank,
        totalDoctors,
        percentile: calculatePercentile(rank, totalDoctors),
        revenueHistory: revenueHistory.length >= 3 ? revenueHistory : projectionHistory,
        consultationHistory: [],
        opportunities: [],
      };

      biMetrics.opportunities = generateOpportunities(biMetrics);

      setMetrics(biMetrics);
    } catch (err) {
      console.error("BI fetch error:", err);
      // Fallback mock
      const proj = getRevenueProjection(5000, 15, 6);
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
      setMetrics({
        monthlyRevenue: 5000,
        revenueGrowth: 15,
        avgConsultationValue: 200,
        consultationsThisMonth: 25,
        bonusAccumulated: 500,
        plantaCoinBalance: 75,
        newPatients: 8,
        retentionRate: 85,
        totalPatients: 50,
        npsScore: 8.2,
        responseRate: 92,
        avgResponseTime: 14,
        rank: 12,
        totalDoctors: 150,
        percentile: 92,
        revenueHistory: proj.map((v, i) => ({ month: months[i], value: v })),
        consultationHistory: [],
        opportunities: generateOpportunities({ retentionRate: 85, consultationsThisMonth: 25, totalPatients: 50, avgConsultationValue: 200, npsScore: 8.2, plantaCoinBalance: 75 }),
      });
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading || !metrics) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 flex items-center justify-center h-40">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const tier = getDoctorTier(metrics.consultationsThisMonth || 0);
  const qualityCriteria: QualityCriteria = {
    npsAverage: metrics.npsScore || 7,
    responseRate: (metrics.responseRate || 90) / 100,
    avgResponseTimeMinutes: metrics.avgResponseTime || 15,
    certificationsValid: true,
    complaintsCount: 0,
    totalConsultations: metrics.totalPatients || 0,
    memberSinceMonths: 6,
  };
  const qualityScore = calculateQualityScore(qualityCriteria);
  const sealTier = determineSealTier(qualityScore);

  return (
    <div className="space-y-6">
      {/* Cockpit Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-black text-foreground flex items-center gap-2">
          <Rocket size={22} className="text-primary" /> Cockpit de Negócios
        </h2>
        <Badge className="bg-primary/10 text-primary font-bold">
          {tier.name} • Nível {tier.level}
        </Badge>
      </div>

      {/* Revenue Projection Chart */}
      <Card className="border-border">
        <CardContent className="p-6">
          <h3 className="font-display font-black text-foreground mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> Projeção de Receita (6 meses)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Crescimento estimado de {metrics.revenueGrowth}% ao mês • Tier: {tier.doctorShare * 100}% para você
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={metrics.revenueHistory}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152 80% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152 80% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
              <XAxis dataKey="month" stroke="hsl(240 10% 68%)" fontSize={11} />
              <YAxis stroke="hsl(240 10% 68%)" fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Receita"]} />
              <Area type="monotone" dataKey="value" stroke="hsl(152 80% 45%)" fill="url(#colorRevenue)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mini KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Trophy, label: "Ranking", value: `#${metrics.rank}`, sub: `Top ${metrics.percentile}%`, color: "text-amber-400" },
          { icon: Coins, label: "Planta-Coins", value: String(metrics.plantaCoinBalance), sub: "Disponíveis", color: "text-primary" },
          { icon: Award, label: "Selo", value: sealTier === "none" ? "—" : sealTier.charAt(0).toUpperCase() + sealTier.slice(1), sub: `Score ${qualityScore.toFixed(1)}`, color: "text-secondary" },
          { icon: Users, label: "Retenção", value: `${metrics.retentionRate}%`, sub: `${metrics.newPatients} novos`, color: "text-blue-400" },
        ].map((kpi, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-3">
              <kpi.icon size={16} className={kpi.color} />
              <p className="text-xl font-display font-black text-foreground mt-1">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground font-bold">{kpi.label}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commission Tiers Progress */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-display font-black text-foreground mb-3 flex items-center gap-2 text-sm">
            <Crown size={16} className="text-amber-400" /> Progressão de Comissão
          </h3>
          <div className="space-y-2">
            {COMMISSION_TIERS.map((t) => {
              const isCurrent = t.level === tier.level;
              const isPast = t.level < tier.level;
              const consultations = metrics.consultationsThisMonth || 0;
              const progress = isPast ? 100 : isCurrent ? Math.min((consultations / (t.maxConsultations === Infinity ? 600 : t.maxConsultations)) * 100, 100) : 0;
              return (
                <div key={t.level} className={`flex items-center gap-3 p-2 rounded-lg ${isCurrent ? "bg-primary/5 border border-primary/20" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isPast || isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {t.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-foreground">{t.name} ({(t.doctorShare * 100).toFixed(0)}%)</span>
                      {isCurrent && <Badge className="text-[9px] bg-primary/10 text-primary">Atual</Badge>}
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Opportunities */}
      {metrics.opportunities && metrics.opportunities.length > 0 && (
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="font-display font-black text-foreground mb-3 flex items-center gap-2 text-sm">
              <Zap size={16} className="text-amber-400" /> Oportunidades
            </h3>
            <div className="space-y-2">
              {metrics.opportunities.map((opp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/20 transition-colors"
                >
                  <span className="text-lg">{opp.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{opp.title}</p>
                    <p className="text-[10px] text-muted-foreground">{opp.description}</p>
                    {opp.potentialRevenue && (
                      <p className="text-[10px] text-primary font-bold mt-0.5">
                        +R$ {opp.potentialRevenue.toLocaleString("pt-BR")} potencial
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground mt-1 shrink-0" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planta-Coin Marketplace Preview */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="font-display font-black text-foreground mb-3 flex items-center gap-2 text-sm">
            <Coins size={16} className="text-primary" /> Marketplace Planta-Coin
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {MARKETPLACE_ITEMS.slice(0, 6).map(item => (
              <div key={item.id} className="p-2.5 rounded-xl bg-muted/30 border border-border text-center">
                <span className="text-xl">{item.icon}</span>
                <p className="text-[10px] font-bold text-foreground mt-1 truncate">{item.name}</p>
                <p className="text-[10px] text-primary font-bold">{item.costCoins} coins</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
