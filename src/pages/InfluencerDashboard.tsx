import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Eye, MousePointerClick, DollarSign, Users, Trophy, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const initialInfluencers = [
  { id: 1, name: "Marina Costa", avatar: "MC", impressions: 125000, clicks: 4200, conversions: 380, revenue: 12400, engagement: 3.4, online: true },
  { id: 2, name: "Lucas Fernandes", avatar: "LF", impressions: 98000, clicks: 3800, conversions: 310, revenue: 9800, engagement: 3.9, online: true },
  { id: 3, name: "Isabela Santos", avatar: "IS", impressions: 87000, clicks: 3100, conversions: 270, revenue: 8500, engagement: 3.6, online: false },
  { id: 4, name: "Rafael Oliveira", avatar: "RO", impressions: 76000, clicks: 2900, conversions: 245, revenue: 7200, engagement: 3.8, online: true },
  { id: 5, name: "Juliana Martins", avatar: "JM", impressions: 65000, clicks: 2500, conversions: 210, revenue: 6100, engagement: 3.8, online: false },
  { id: 6, name: "Pedro Alves", avatar: "PA", impressions: 58000, clicks: 2200, conversions: 190, revenue: 5400, engagement: 3.8, online: true },
  { id: 7, name: "Camila Rocha", avatar: "CR", impressions: 52000, clicks: 1900, conversions: 165, revenue: 4800, engagement: 3.7, online: false },
  { id: 8, name: "Bruno Lima", avatar: "BL", impressions: 45000, clicks: 1700, conversions: 140, revenue: 4100, engagement: 3.8, online: true },
  { id: 9, name: "Larissa Nunes", avatar: "LN", impressions: 41000, clicks: 1500, conversions: 125, revenue: 3600, engagement: 3.7, online: false },
  { id: 10, name: "Diego Souza", avatar: "DS", impressions: 38000, clicks: 1400, conversions: 110, revenue: 3200, engagement: 3.7, online: true },
];

const revenueTimeline = [
  { hora: "00h", valor: 120 }, { hora: "04h", valor: 80 }, { hora: "08h", valor: 340 },
  { hora: "12h", valor: 580 }, { hora: "16h", valor: 720 }, { hora: "20h", valor: 450 }, { hora: "23h", valor: 310 },
];

const InfluencerDashboard = () => {
  const [influencers, setInfluencers] = useState(initialInfluencers);
  const [sortBy, setSortBy] = useState<"revenue" | "conversions" | "clicks" | "engagement">("revenue");
  const [period, setPeriod] = useState<"24h" | "7d" | "30d" | "90d">("30d");

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setInfluencers((prev) =>
        prev.map((inf) => ({
          ...inf,
          impressions: inf.impressions + Math.floor(Math.random() * 100),
          clicks: inf.clicks + Math.floor(Math.random() * 10),
          conversions: inf.conversions + (Math.random() > 0.7 ? 1 : 0),
          revenue: inf.revenue + Math.floor(Math.random() * 50),
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...influencers].sort((a, b) => b[sortBy] - a[sortBy]);
  const medals = ["🥇", "🥈", "🥉"];

  const totalRevenue = influencers.reduce((s, i) => s + i.revenue, 0);
  const totalConversions = influencers.reduce((s, i) => s + i.conversions, 0);
  const totalClicks = influencers.reduce((s, i) => s + i.clicks, 0);
  const totalImpressions = influencers.reduce((s, i) => s + i.impressions, 0);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                  Ranking <span className="text-gradient-purple">Influenciadores</span>
                </h1>
                <p className="text-muted-foreground font-medium mt-1">Métricas em tempo real • Atualiza a cada 5s</p>
              </div>
              <div className="flex gap-2">
                {(["24h", "7d", "30d", "90d"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-colors ${
                      period === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: DollarSign, label: "Receita Total", value: `R$ ${(totalRevenue / 1000).toFixed(1)}K` },
                { icon: Users, label: "Conversões", value: totalConversions.toLocaleString() },
                { icon: MousePointerClick, label: "Cliques", value: totalClicks.toLocaleString() },
                { icon: Eye, label: "Impressões", value: `${(totalImpressions / 1000).toFixed(0)}K` },
              ].map((kpi, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4">
                    <kpi.icon size={20} className="text-primary mb-2" />
                    <p className="text-2xl font-display font-black text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground font-bold">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Chart */}
            <Card className="border-border mb-8">
              <CardContent className="p-6">
                <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp size={18} /> Receita em Tempo Real (hoje)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                    <XAxis dataKey="hora" stroke="hsl(240 10% 68%)" fontSize={12} />
                    <YAxis stroke="hsl(240 10% 68%)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip contentStyle={{ background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" }} />
                    <Line type="monotone" dataKey="valor" stroke="hsl(270 60% 60%)" strokeWidth={3} dot={{ fill: "hsl(270 60% 60%)", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sort controls */}
            <div className="flex gap-2 mb-4">
              {([
                { key: "revenue", label: "Receita" },
                { key: "conversions", label: "Conversões" },
                { key: "clicks", label: "Cliques" },
                { key: "engagement", label: "Engajamento" },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-colors ${
                    sortBy === s.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <Card className="border-border">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-black text-muted-foreground text-xs">#</th>
                      <th className="text-left p-4 font-black text-muted-foreground text-xs">Influenciador</th>
                      <th className="text-right p-4 font-black text-muted-foreground text-xs">Impressões</th>
                      <th className="text-right p-4 font-black text-muted-foreground text-xs">Cliques</th>
                      <th className="text-right p-4 font-black text-muted-foreground text-xs">Conversões</th>
                      <th className="text-right p-4 font-black text-muted-foreground text-xs">Receita</th>
                      <th className="text-right p-4 font-black text-muted-foreground text-xs">Engaj.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((inf, i) => (
                      <tr key={inf.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-black text-foreground">
                          {i < 3 ? <span className="text-lg">{medals[i]}</span> : <span className="text-muted-foreground">{i + 1}</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl bg-secondary/20 flex items-center justify-center text-xs font-black text-secondary">{inf.avatar}</div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${inf.online ? "bg-primary" : "bg-muted-foreground"}`} />
                            </div>
                            <span className="font-bold text-foreground">{inf.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-muted-foreground">{inf.impressions.toLocaleString()}</td>
                        <td className="p-4 text-right text-muted-foreground">{inf.clicks.toLocaleString()}</td>
                        <td className="p-4 text-right font-bold text-foreground">{inf.conversions}</td>
                        <td className="p-4 text-right font-display font-black text-gradient-green">R$ {inf.revenue.toLocaleString()}</td>
                        <td className="p-4 text-right text-muted-foreground">{inf.engagement}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InfluencerDashboard;
