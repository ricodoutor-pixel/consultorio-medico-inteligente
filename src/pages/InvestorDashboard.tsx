import React, { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, PieChart, Download, FileText, Calendar, ArrowUpRight, Target, Activity, Zap, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const revenueData = [
  { month: 'Set', revenue: 45000, users: 1200 },
  { month: 'Out', revenue: 52000, users: 1500 },
  { month: 'Nov', revenue: 68000, users: 2100 },
  { month: 'Dez', revenue: 85000, users: 2800 },
  { month: 'Jan', revenue: 110000, users: 3500 },
  { month: 'Fev', revenue: 145000, users: 4200 },
  { month: 'Mar', revenue: 185000, users: 5100 },
];

const InvestorDashboard = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary glow-green">
                  <Briefcase size={24} />
                </div>
                <span className="text-sm font-bold text-primary tracking-widest uppercase">Investor Relations • Planta y Raiz</span>
              </div>
              <h1 className="text-4xl font-display font-black text-foreground mb-3">Relatórios de <span className="text-gradient-green">Crescimento</span></h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Monitoramento em tempo real dos KPIs estratégicos, métricas financeiras e tração de mercado para investidores e conselho.
              </p>
            </div>
            <div className="flex gap-3">
              <Button className="bg-primary text-primary-foreground font-black rounded-2xl px-6 h-12">
                <Download size={18} className="mr-2" /> Exportar PDF Mensal
              </Button>
            </div>
          </header>

          {/* Core Investor Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "MRR (Receita Recurrente)", value: "R$ 185.000", change: "+27.5%", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "CAC (Custo Aquisição)", value: "R$ 42,50", change: "-15.2%", icon: Target, color: "text-primary", bg: "bg-primary/10" },
              { label: "LTV (Lifetime Value)", value: "R$ 840,00", change: "+8.4%", icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10" },
              { label: "Churn Rate", value: "2.1%", change: "-0.5%", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
            ].map((stat, i) => (
              <Card key={i} className="border-border bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold border-border ${stat.change.startsWith('+') ? 'text-green-500' : 'text-primary'}`}>
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Growth Chart */}
            <Card className="lg:col-span-2 border-border bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" /> Curva de Tração (MRR vs Usuários)
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">Receita</Badge>
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20">Usuários</Badge>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="month" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--secondary))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Highlights */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Zap size={16} className="text-yellow-500" /> Destaques do Mês
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-xs font-black text-primary uppercase mb-2">Março 2026</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Lançamento do IoMT Hub aumentou o LTV em 8.4%.
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Implementação do Split de Pagamentos reduziu custos operacionais em 12%.
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Novas parcerias no Shopping adicionaram 15 novos lojistas.
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Próximos Milestones</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">App Mobile Nativo</span>
                      <span className="text-primary font-bold">85%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full w-[85%]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">Expansão LatAm</span>
                    <span className="text-primary font-bold">40%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full w-[40%]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historical Reports */}
          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black">Histórico de Relatórios</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Ver Todos</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Relatório Mensal - Fev 2026", date: "01 Mar 2026", size: "2.4 MB" },
                  { title: "Relatório Mensal - Jan 2026", date: "01 Fev 2026", size: "2.1 MB" },
                  { title: "Relatório Anual - 2025", date: "15 Jan 2026", size: "5.8 MB" },
                ].map((report, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border bg-background/50 hover:border-primary/30 transition-all group cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <FileText size={20} />
                      </div>
                      <Download size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{report.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{report.date} • {report.size}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default InvestorDashboard;
