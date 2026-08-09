import React, { useEffect, useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, Activity, Stethoscope, TrendingUp, AlertCircle, RefreshCw, ShoppingBag, Brain, Shield, Zap } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LTVMetricsPanel } from "@/components/admin/LTVMetricsPanel";
import { RegistrationStatsPanel } from "@/components/admin/RegistrationStatsPanel";
import { AppDownloadsCounter } from "@/components/admin/AppDownloadsCounter";
import { LiveAppAnalytics } from "@/components/admin/LiveAppAnalytics";
import { ManusCEOKPIPanel } from "@/components/admin/ManusCEOKPIPanel";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    activeUsers: 0,
    totalDoctors: 0,
    onlineDoctors: 0,
    pendingBTC: 0,
    platformFees: 0,
    completedConsultations: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [doctorStatus, setDoctorStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch appointments
      const { data: appointments, count: apptCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact" });

      // Fetch doctors
      const { data: doctors } = await supabase
        .from("doctors")
        .select("id, is_online, is_verified, rating, specialty");

      // Fetch profiles count
      const { count: profileCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch BTC subscriptions pending
      const { data: btcPending } = await supabase
        .from("btc_subscriptions")
        .select("id, amount")
        .eq("status", "pending");

      // Fetch payment webhooks
      const { data: webhooks } = await supabase
        .from("payment_webhooks")
        .select("amount, status")
        .eq("status", "approved");

      // Calculate stats
      const totalRevenue = (appointments || [])
        .filter(a => a.payment_status === "paid")
        .reduce((sum, a) => sum + Number(a.amount || 0), 0);

      const completedConsultations = (appointments || []).filter(a => a.status === "completed").length;
      const platformFees = totalRevenue * 0.07; // 7% platform fee

      const onlineDocs = (doctors || []).filter(d => d.is_online).length;
      const verifiedDocs = (doctors || []).filter(d => d.is_verified).length;
      const inConsultation = (appointments || []).filter(a => a.status === "in_progress").length;

      setStats({
        totalRevenue,
        totalAppointments: apptCount || 0,
        activeUsers: profileCount || 0,
        totalDoctors: (doctors || []).length,
        onlineDoctors: onlineDocs,
        pendingBTC: (btcPending || []).length,
        platformFees,
        completedConsultations,
      });

      setDoctorStatus([
        { name: "Online", value: onlineDocs, color: "#22c55e" },
        { name: "Offline", value: Math.max(0, verifiedDocs - onlineDocs - inConsultation), color: "#ef4444" },
        { name: "Em Orientação Técnica", value: inConsultation, color: "#f59e0b" },
      ]);

      // Recent appointments
      const { data: recent } = await supabase
        .from("appointments")
        .select("id, status, amount, scheduled_at, type, payment_status")
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentAppointments(recent || []);

      // Monthly simulation based on real data
      const now = new Date();
      const monthly = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthAppts = (appointments || []).filter(a => {
          const ad = new Date(a.created_at);
          return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
        });
        monthly.push({
          name: d.toLocaleString("pt-BR", { month: "short" }),
          receita: monthAppts.reduce((s, a) => s + Number(a.amount || 0), 0),
          consultas: monthAppts.length,
        });
      }
      setMonthlyData(monthly);

    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black text-foreground mb-1">Painel Manus CEO</h1>
              <p className="text-sm text-muted-foreground">Monitoramento em tempo real — Planta y Raiz</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading} className="rounded-xl border-border gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
            </Button>
          </div>

          {/* Manus CEO Operational Matrix (5 KPIs) */}
          <ManusCEOKPIPanel />

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Receita Total", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-primary bg-primary/10", trend: "+24%" },
              { label: "Usuários", value: stats.activeUsers.toLocaleString(), icon: Users, color: "text-secondary bg-secondary/10", trend: `+${stats.activeUsers}` },
              { label: "Médicos Online", value: `${stats.onlineDoctors} / ${stats.totalDoctors}`, icon: Stethoscope, color: "text-green-500 bg-green-500/10", trend: "Disponível" },
              { label: "Taxa Plataforma (7%)", value: formatCurrency(stats.platformFees), icon: Activity, color: "text-orange-500 bg-orange-500/10", trend: "Automático" },
            ].map((kpi) => (
              <Card key={kpi.label} className="border-border bg-card/50 backdrop-blur">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">{kpi.label}</p>
                      <h3 className="text-lg md:text-2xl font-black text-foreground mt-1 truncate">{kpi.value}</h3>
                      <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center gap-1">
                        <TrendingUp size={10} /> {kpi.trend}
                      </p>
                    </div>
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                      <kpi.icon size={20} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* App Downloads Counter */}
          <AppDownloadsCounter />

          {/* Live App Analytics (ManyChat Sync) */}
          <LiveAppAnalytics />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Orientações Técnicas Totais", value: stats.totalAppointments, icon: Stethoscope },
              { label: "Concluídas", value: stats.completedConsultations, icon: Shield },
              { label: "BTC Pendentes", value: stats.pendingBTC, icon: Zap },
              { label: "IA Triagens", value: "Ativo", icon: Brain },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-2xl bg-card/50 border border-border">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase truncate">{s.label}</p>
                  <p className="text-sm font-black text-foreground">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Faturamento & Orientações Técnicas (6 meses)</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="consultas" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status Médicos</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px] flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={doctorStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {doctorStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4">
                  {doctorStatus.map((s) => (
                    <div key={s.name} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[10px] font-bold text-muted-foreground">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Appointments */}
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Orientações Técnicas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma consulta registrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-[10px] font-bold text-muted-foreground uppercase">ID</th>
                        <th className="text-left py-2 text-[10px] font-bold text-muted-foreground uppercase">Tipo</th>
                        <th className="text-left py-2 text-[10px] font-bold text-muted-foreground uppercase">Status</th>
                        <th className="text-left py-2 text-[10px] font-bold text-muted-foreground uppercase">Pagamento</th>
                        <th className="text-right py-2 text-[10px] font-bold text-muted-foreground uppercase">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAppointments.map((a) => (
                        <tr key={a.id} className="border-b border-border/50">
                          <td className="py-2 text-xs text-muted-foreground font-mono">{a.id.slice(0, 8)}...</td>
                          <td className="py-2 text-xs text-foreground font-medium capitalize">{a.type}</td>
                          <td className="py-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              a.status === "completed" ? "bg-green-500/10 text-green-500" :
                              a.status === "scheduled" ? "bg-blue-500/10 text-blue-500" :
                              a.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                              "bg-yellow-500/10 text-yellow-500"
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              a.payment_status === "paid" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                            }`}>
                              {a.payment_status}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-foreground font-black text-right">{formatCurrency(Number(a.amount || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LTV & MRR Metrics */}
          <LTVMetricsPanel />

          {/* Registration Stats */}
          <RegistrationStatsPanel />

          {/* System Alerts */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="p-4 flex items-center gap-4">
                <AlertCircle className="text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">Manus CEO: Auditoria ativa</p>
                  <p className="text-xs text-muted-foreground">Motor de validação CRM processando verificações nos conselhos regionais.</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <Brain className="text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">Brisa IA: Triagem ativa</p>
                  <p className="text-xs text-muted-foreground">Enfermeira virtual operando 24/7 com matching Uber-style.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
