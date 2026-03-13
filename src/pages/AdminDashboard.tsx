import React from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, Activity, Stethoscope, TrendingUp, AlertCircle } from 'lucide-react';

const data = [
  { name: 'Jan', receita: 4500, consultas: 120 },
  { name: 'Fev', receita: 5200, consultas: 145 },
  { name: 'Mar', receita: 7800, consultas: 210 },
  { name: 'Abr', receita: 9100, consultas: 250 },
  { name: 'Mai', receita: 12500, consultas: 320 },
  { name: 'Jun', receita: 15800, consultas: 410 },
];

const statusData = [
  { name: 'Online', value: 12, color: '#22c55e' },
  { name: 'Offline', value: 8, color: '#ef4444' },
  { name: 'Em Consulta', value: 5, color: '#f59e0b' },
];

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-display font-black text-foreground mb-2">Painel Administrativo - Manus CEO</h1>
            <p className="text-muted-foreground">Monitoramento em tempo real da Planta y Raiz - Mega Clínica Digital</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Receita Total (Mês)</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">R$ 15.800,00</h3>
                    <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center gap-1">
                      <TrendingUp size={10} /> +24% vs mês anterior
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuários Ativos</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">1.254</h3>
                    <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center gap-1">
                      <TrendingUp size={10} /> +12% esta semana
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Users size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Médicos Online</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">12 / 25</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] text-muted-foreground font-bold">Disponibilidade Alta</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <Stethoscope size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Taxas Retidas (CEO)</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">R$ 1.106,00</h3>
                    <p className="text-[10px] text-muted-foreground font-bold mt-1">7% Médicos | 5% Lojas</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Activity size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Crescimento de Faturamento & Consultas</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="consultas" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Status do Staff Médico</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-4">
                  {statusData.map((s) => (
                    <div key={s.name} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[10px] font-bold text-muted-foreground">{s.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertCircle className="text-orange-500" />
              <div>
                <p className="text-sm font-bold text-foreground">Alerta Manus CEO: 3 médicos com CRM pendente de auditoria.</p>
                <p className="text-xs text-muted-foreground">O motor de Web Scraping está processando a validação nos conselhos regionais.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
