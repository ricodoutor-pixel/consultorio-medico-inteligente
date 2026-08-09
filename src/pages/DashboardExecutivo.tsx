import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, Stethoscope, FileText, TrendingUp, AlertTriangle, Activity, Globe, ShoppingBag, BarChart3, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const tooltipStyle = { background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" };

const COLORS = ["hsl(152 80% 45%)", "hsl(270 60% 60%)", "hsl(45 76% 52%)", "hsl(350 80% 55%)"];

const revenueData = [
  { month: "Jan", receita: 45000, consultas: 320 }, { month: "Fev", receita: 62000, consultas: 440 },
  { month: "Mar", receita: 78000, consultas: 580 }, { month: "Abr", receita: 95000, consultas: 710 },
  { month: "Mai", receita: 115000, consultas: 850 }, { month: "Jun", receita: 142000, consultas: 1020 },
];

const channelData = [
  { name: "Google", value: 35 }, { name: "Instagram", value: 28 },
  { name: "Indicação", value: 22 }, { name: "Outros", value: 15 },
];

const conversionData = [
  { step: "Visita", value: 10000 }, { step: "Cadastro", value: 3500 },
  { step: "Triagem", value: 2100 }, { step: "Orientação Técnica", value: 1200 },
  { step: "Recorrente", value: 480 },
];

const DashboardExecutivo = () => {
  const [counts, setCounts] = useState({ patients: 0, doctors: 0, appointments: 0, prescriptions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    const [profiles, doctors, appointments, prescriptions] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("doctors").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase.from("prescriptions").select("id", { count: "exact", head: true }),
    ]);
    setCounts({
      patients: profiles.count || 0,
      doctors: doctors.count || 0,
      appointments: appointments.count || 0,
      prescriptions: prescriptions.count || 0,
    });
    setLoading(false);
  };

  const kpis = [
    { icon: Users, label: "Pacientes", value: counts.patients.toLocaleString(), change: "+24%", color: "text-primary" },
    { icon: Stethoscope, label: "Médicos", value: String(counts.doctors), change: "+12%", color: "text-secondary" },
    { icon: FileText, label: "Orientações Técnicas", value: counts.appointments.toLocaleString(), change: "+38%", color: "text-[hsl(var(--gold))]" },
    { icon: DollarSign, label: "Receita (mês)", value: "R$ 142K", change: "+23%", color: "text-primary" },
  ];

  const performanceKPIs = [
    { label: "Orientação R$ 30", value: "842", target: "Brasil", ok: true },
    { label: "Orientação US$ 10", value: "128", target: "Intl", ok: true },
    { label: "Brisa-CEO", value: "Ativa", target: "Orquestradora", ok: true },
    { label: "NPS", value: "72", target: "> 70", ok: true },
    { label: "Conversão", value: "12%", target: "> 15%", ok: false },
    { label: "Uptime", value: "99.99%", target: "99.99%", ok: true },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                  Dashboard <span className="text-gradient-green">Executivo</span>
                </h1>
                <p className="text-muted-foreground mt-1">Visão 360° da plataforma Planta & Raiz</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-green text-xs">🟢 Sistema Operacional</Badge>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <kpi.icon size={20} className={kpi.color} />
                      <span className="text-xs font-bold text-primary">{kpi.change}</span>
                    </div>
                    <p className="text-2xl font-display font-black text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground font-bold">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {performanceKPIs.map((kpi, i) => (
                <Card key={i} className={`border-border ${kpi.ok ? "" : "border-destructive/30"}`}>
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-display font-black text-foreground">{kpi.value}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">{kpi.label}</p>
                    <Badge className={`text-[8px] mt-1 ${kpi.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {kpi.ok ? "✅" : "⚠️"} {kpi.target}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp size={18} /> Receita Mensal
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                      <XAxis dataKey="month" stroke="hsl(240 10% 68%)" fontSize={12} />
                      <YAxis stroke="hsl(240 10% 68%)" fontSize={12} tickFormatter={(v) => `R$${v / 1000}k`} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="receita" stroke="hsl(152 80% 45%)" strokeWidth={3} dot={{ r: 5, fill: "hsl(152 80% 45%)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Globe size={18} /> Origem do Tráfego
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                        {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Funnel + Alerts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Target size={18} /> Funil de Conversão
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={conversionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 14%)" />
                      <XAxis type="number" stroke="hsl(240 10% 68%)" fontSize={12} />
                      <YAxis type="category" dataKey="step" stroke="hsl(240 10% 68%)" fontSize={11} width={80} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="hsl(152 80% 45%)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-[hsl(var(--gold))]" /> Alertas do Sistema
                  </h3>
                  <div className="space-y-3">
                    {[
                      { msg: "Taxa de conversão abaixo da meta (12% vs 15%)", type: "warning" },
                      { msg: "Brisa-CEO: 450 protocolos ANVISA gerados hoje", type: "success" },
                      { msg: "Evolution API: Custo zero de mensagens ativo ✅", type: "success" },
                      { msg: "RAG Científico: 40k artigos indexados via pgvector", type: "success" },
                      { msg: "Conformidade CRM-PR 49354: 100% Blindado", type: "success" },
                    ].map((alert, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-xs font-bold ${alert.type === "warning" ? "border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/5 text-[hsl(var(--gold))]" : alert.type === "success" ? "border-primary/30 bg-primary/5 text-primary" : "border-secondary/30 bg-secondary/5 text-secondary"}`}>
                        {alert.msg}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DashboardExecutivo;
