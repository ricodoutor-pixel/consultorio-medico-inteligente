import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { AlertTriangle, TrendingUp, Coins, Users, ShieldCheck, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";
import {
  calculateAbandonmentRisk, classifyRisk,
} from "@/lib/domination-services";

const tooltipStyle = { background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" };

// Simulated patient cohort for retention funnel
const mockPatients = [
  { id: "1", days: 5, nps: 9, subAge: 12, consults: 20 },
  { id: "2", days: 45, nps: 4, subAge: 2, consults: 3 },
  { id: "3", days: 60, nps: 3, subAge: 1, consults: 1 },
  { id: "4", days: 10, nps: 8, subAge: 6, consults: 8 },
  { id: "5", days: 90, nps: 2, subAge: 3, consults: 2 },
  { id: "6", days: 30, nps: 6, subAge: 4, consults: 5 },
  { id: "7", days: 3, nps: 10, subAge: 18, consults: 30 },
  { id: "8", days: 70, nps: 5, subAge: 2, consults: 2 },
];

const RISK_COLORS: Record<string, string> = {
  low: "hsl(152 80% 45%)",
  medium: "hsl(45 76% 52%)",
  high: "hsl(25 95% 55%)",
  critical: "hsl(0 72% 51%)",
};

// Conversion sources mock
const conversionData = [
  { source: "ManyChat", leads: 320, converted: 112, rate: 35 },
  { source: "SEO Orgânico", leads: 580, converted: 145, rate: 25 },
  { source: "Indicação", leads: 190, converted: 95, rate: 50 },
  { source: "Instagram", leads: 410, converted: 82, rate: 20 },
];

// Planta-Coin treasury mock
const treasury = {
  totalEmitted: 125000,
  totalRedeemed: 18500,
  totalCashedOut: 6200,
  activeBalance: 100300,
};

export const DominationMonitor = () => {
  const [riskDistribution, setRiskDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [criticalPercent, setCriticalPercent] = useState(0);

  useEffect(() => {
    const risks = mockPatients.map(p => {
      const score = calculateAbandonmentRisk({
        daysSinceLastPurchase: p.days,
        daysSinceLastOrientação Técnication: p.days,
        npsScore: p.nps,
        subscriptionAgeMonths: p.subAge,
        totalOrientação Técnications: p.consults,
      });
      return classifyRisk(score);
    });

    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    risks.forEach(r => counts[r]++);

    const total = risks.length;
    setCriticalPercent(Math.round(((counts.critical + counts.high) / total) * 100));

    setRiskDistribution([
      { name: "Baixo", value: counts.low, color: RISK_COLORS.low },
      { name: "Médio", value: counts.medium, color: RISK_COLORS.medium },
      { name: "Alto", value: counts.high, color: RISK_COLORS.high },
      { name: "Crítico", value: counts.critical, color: RISK_COLORS.critical },
    ]);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Target size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-black text-foreground">Monitor de Dominação</h2>
          <p className="text-xs text-muted-foreground">Business Intelligence em tempo real</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* 1. Funnel Health */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <AlertTriangle size={14} className={criticalPercent > 30 ? "text-destructive" : "text-primary"} />
                Saúde do Funil
              </h3>
              <Badge className={`text-[10px] ${criticalPercent > 30 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                {criticalPercent}% em risco
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-1 mt-2">
              {riskDistribution.map((r, i) => (
                <div key={i} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: r.color }} />
                  <p className="text-[9px] text-muted-foreground">{r.name}</p>
                  <p className="text-xs font-black text-foreground">{r.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2. Conversion by Source */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-primary" /> Taxa de Conversão
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={conversionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                <XAxis type="number" stroke="hsl(240 10% 68%)" fontSize={10} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="source" type="category" stroke="hsl(240 10% 68%)" fontSize={10} width={70} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="rate" fill="hsl(152 80% 45%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Total Leads: {conversionData.reduce((s, c) => s + c.leads, 0)}</span>
              <span>Convertidos: {conversionData.reduce((s, c) => s + c.converted, 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Planta-Coin Treasury */}
        <Card className="border-border">
          <CardContent className="p-5">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2 mb-3">
              <Coins size={14} className="text-[hsl(45,76%,52%)]" /> Tesouraria Planta-Coin
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Emitidos (Passivo)</span>
                  <span className="font-black text-foreground">{treasury.totalEmitted.toLocaleString("pt-BR")} 🪙</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Resgatados (Ativo)</span>
                  <span className="font-black text-primary">{treasury.totalRedeemed.toLocaleString("pt-BR")} 🪙</span>
                </div>
                <Progress value={(treasury.totalRedeemed / treasury.totalEmitted) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Cash-out (R$)</span>
                  <span className="font-black text-secondary">R$ {treasury.totalCashedOut.toLocaleString("pt-BR")}</span>
                </div>
                <Progress value={(treasury.totalCashedOut / treasury.totalEmitted) * 100} className="h-2" />
              </div>
              <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-bold">Saldo Circulante</span>
                  <span className="font-black text-foreground">{treasury.activeBalance.toLocaleString("pt-BR")} 🪙</span>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Velocidade: {Math.round((treasury.totalRedeemed / treasury.totalEmitted) * 100)}% utilização
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Pacientes Ativos", value: "847", change: "+12%", color: "text-primary" },
          { icon: Zap, label: "Match Instantâneo", value: "< 2s", change: "Avg", color: "text-[hsl(45,76%,52%)]" },
          { icon: ShieldCheck, label: "Selos de Qualidade", value: "14", change: "Ouro+", color: "text-secondary" },
          { icon: TrendingUp, label: "LTV Médio", value: "R$ 1.240", change: "+8%", color: "text-primary" },
        ].map((kpi, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-3">
              <kpi.icon size={16} className={kpi.color} />
              <p className="text-lg font-display font-black text-foreground mt-1">{kpi.value}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                <Badge className="text-[9px] bg-primary/10 text-primary">{kpi.change}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
