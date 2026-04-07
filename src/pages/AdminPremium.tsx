import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BrandHeader } from '@/components/plantaeraiz/BrandHeader';
import { SupportChat } from '@/components/plantaeraiz/SupportChat';
import { SpotlightShell } from '@/components/plantaeraiz/SpotlightShell';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, DollarSign, Activity, Search, Filter, Download, Eye, Trash2, Edit, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function AdminPremium() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Apenas administradores podem acessar este painel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data
  const metrics = {
    totalUsers: 2847,
    activeInvestments: 1256,
    totalInvested: 15234500,
    totalEarnings: 2145300,
    totalCommissions: 856200,
    pendingWithdrawals: 342100,
  };

  const platformStats = [
    { month: 'Jan', users: 450, investments: 125000, earnings: 18750 },
    { month: 'Fev', users: 620, investments: 185000, earnings: 27750 },
    { month: 'Mar', users: 890, investments: 267000, earnings: 40050 },
    { month: 'Abr', users: 1250, investments: 375000, earnings: 56250 },
    { month: 'Mai', users: 1680, investments: 504000, earnings: 75600 },
    { month: 'Jun', users: 2100, investments: 630000, earnings: 94500 },
    { month: 'Jul', users: 2450, insights: 735000, earnings: 110250 },
    { month: 'Ago', users: 2847, investments: 915000, earnings: 137250 },
  ];

  const investmentDistribution = [
    { name: 'Bronze', value: 2500000, percentage: 16 },
    { name: 'Prata', value: 4200000, percentage: 28 },
    { name: 'Ouro', value: 5800000, percentage: 38 },
    { name: 'Diamante', value: 2734500, percentage: 18 },
  ];

  const recentUsers = [
    { id: 1, name: 'João Silva', email: 'joao@email.com', joinDate: '2026-02-08', status: 'active', invested: 5000 },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', joinDate: '2026-02-07', status: 'active', invested: 10000 },
    { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', joinDate: '2026-02-06', status: 'pending', invested: 0 },
    { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', joinDate: '2026-02-05', status: 'active', invested: 3000 },
    { id: 5, name: 'Carlos Ferreira', email: 'carlos@email.com', joinDate: '2026-02-04', status: 'suspended', invested: 2000 },
  ];

  const topAffiliates = [
    { id: 1, name: 'Carlos Silva', referrals: 156, commissions: 45800, status: 'active' },
    { id: 2, name: 'Maria Santos', referrals: 128, commissions: 38500, status: 'active' },
    { id: 3, name: 'João Oliveira', referrals: 95, commissions: 28700, status: 'active' },
    { id: 4, name: 'Ana Costa', referrals: 87, commissions: 26200, status: 'active' },
    { id: 5, name: 'Pedro Ferreira', referrals: 72, commissions: 21600, status: 'inactive' },
  ];

  const withdrawalRequests = [
    { id: 1, user: 'João Silva', amount: 2000, status: 'pending', date: '2026-02-08' },
    { id: 2, user: 'Maria Santos', amount: 5000, status: 'approved', date: '2026-02-07' },
    { id: 3, user: 'Pedro Costa', amount: 1500, status: 'completed', date: '2026-02-06' },
    { id: 4, user: 'Ana Oliveira', amount: 3000, status: 'pending', date: '2026-02-05' },
    { id: 5, user: 'Carlos Ferreira', amount: 1000, status: 'rejected', date: '2026-02-04' },
  ];

  const activityLog = [
    { id: 1, action: 'Novo usuário registrado', user: 'João Silva', timestamp: '2026-02-08 14:32', type: 'user' },
    { id: 2, action: 'Depósito processado', user: 'Maria Santos', timestamp: '2026-02-08 13:15', type: 'deposit' },
    { id: 3, action: 'Saque aprovado', user: 'Pedro Costa', timestamp: '2026-02-08 12:45', type: 'withdrawal' },
    { id: 4, action: 'Comissão creditada', user: 'Ana Oliveira', timestamp: '2026-02-08 11:20', type: 'commission' },
    { id: 5, action: 'Usuário suspenso', user: 'Carlos Ferreira', timestamp: '2026-02-08 10:05', type: 'alert' },
  ];

  return (
    <SpotlightShell>
      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation */}
        <nav className="border-b border-border/50 sticky top-0 z-40 backdrop-blur-md bg-background/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <BrandHeader />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-lg">
                Dashboard
              </Button>
              <Button onClick={() => navigate('/dashboard')} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
                Sair
              </Button>
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Painel Administrativo</h1>
              <p className="text-muted-foreground">Gerencie usuários, investimentos, afiliados e transações</p>
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </Button>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-card/50 border-border/50 rounded-xl">
              <CardContent className="p-4 space-y-2">
                <Users className="h-5 w-5 text-accent" />
                <p className="text-xs text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-500">+12% este mês</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-xl">
              <CardContent className="p-4 space-y-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <p className="text-xs text-muted-foreground">Investimentos Ativos</p>
                <p className="text-2xl font-bold">{metrics.activeInvestments.toLocaleString()}</p>
                <p className="text-xs text-green-500">+8% este mês</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-xl">
              <CardContent className="p-4 space-y-2">
                <DollarSign className="h-5 w-5 text-accent" />
                <p className="text-xs text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold">R$ {(metrics.totalInvested / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-green-500">+15% este mês</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-xl">
              <CardContent className="p-4 space-y-2">
                <Activity className="h-5 w-5 text-accent" />
                <p className="text-xs text-muted-foreground">Ganhos Totais</p>
                <p className="text-2xl font-bold">R$ {(metrics.totalEarnings / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-green-500">+10% este mês</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-xl">
              <CardContent className="p-4 space-y-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <p className="text-xs text-muted-foreground">Comissões</p>
                <p className="text-2xl font-bold">R$ {(metrics.totalCommissions / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-500">+18% este mês</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-xl">
              <CardContent className="p-4 space-y-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <p className="text-xs text-muted-foreground">Saques Pendentes</p>
                <p className="text-2xl font-bold">R$ {(metrics.pendingWithdrawals / 1000).toFixed(0)}K</p>
                <p className="text-xs text-yellow-500">5 solicitações</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Charts */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Crescimento da Plataforma</CardTitle>
                <CardDescription>Últimos 8 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={platformStats}>
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
                    <YAxis stroke="rgba(255,255,255,0.3)" />
                    <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(217,119,6,0.5)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="rgb(217, 119, 6)" strokeWidth={2} name="Usuários" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Distribuição de Investimentos</CardTitle>
                <CardDescription>Por plano</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={investmentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#d97706"
                      dataKey="value"
                    >
                      {investmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['rgb(217, 119, 6)', 'rgb(168, 85, 247)', 'rgb(34, 197, 94)', 'rgb(59, 130, 246)'][index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${(Number(value) / 1000000).toFixed(1)}M`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Users Management */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>Últimos usuários registrados</CardDescription>
                </div>
                <Button variant="outline" className="rounded-lg">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-sm font-semibold">R$ {user.invested.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{user.joinDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {user.status}
                      </span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Affiliates Management */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Top Afiliados</CardTitle>
              <CardDescription>Melhores afiliados da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Nome</th>
                      <th className="text-right py-3 px-4 font-semibold">Indicações</th>
                      <th className="text-right py-3 px-4 font-semibold">Comissões</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-center py-3 px-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAffiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="border-b border-border/30 hover:bg-background/50 transition-colors">
                        <td className="py-3 px-4">{affiliate.name}</td>
                        <td className="py-3 px-4 text-right font-semibold">{affiliate.referrals}</td>
                        <td className="py-3 px-4 text-right text-accent font-bold">R$ {(affiliate.commissions / 100).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            affiliate.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {affiliate.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Withdrawal Requests */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Solicitações de Saque</CardTitle>
              <CardDescription>Saques pendentes de aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawalRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">{request.user}</p>
                      <p className="text-xs text-muted-foreground">{request.date}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-accent">R$ {request.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        request.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                        request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status}
                      </span>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" className="h-8 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Activity Log */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Log de Atividades</CardTitle>
              <CardDescription>Últimas ações na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityLog.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      log.type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                      log.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                      log.type === 'withdrawal' ? 'bg-orange-500/20 text-orange-400' :
                      log.type === 'commission' ? 'bg-accent/20 text-accent' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user} • {log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Support Chat */}
        <SupportChat />
      </div>
    </SpotlightShell>
  );
}
