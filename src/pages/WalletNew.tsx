import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandHeader } from '@/components/plantaeraiz/BrandHeader';
import { SupportChat } from '@/components/plantaeraiz/SupportChat';
import { SpotlightShell } from '@/components/plantaeraiz/SpotlightShell';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, AreaChart, Area } from 'recharts';
import { Wallet, TrendingUp, Users, Gift, ArrowUpRight, ArrowDownLeft, Zap, Globe } from 'lucide-react';

export default function WalletNew() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Mock data
  const walletData = {
    totalBalance: 45230.50,
    availableBalance: 15230.50,
    investedAmount: 30000,
    totalEarnings: 12500,
    teamEarnings: 3200,
    monthlyGains: 2150,
  };

  const earningsHistory = [
    { date: '01/02', personal: 45, team: 12, total: 57 },
    { date: '02/02', personal: 52, team: 15, total: 67 },
    { date: '03/02', personal: 48, team: 18, total: 66 },
    { date: '04/02', personal: 65, team: 22, total: 87 },
    { date: '05/02', personal: 72, team: 28, total: 100 },
    { date: '06/02', personal: 85, team: 35, total: 120 },
    { date: '07/02', personal: 95, team: 42, total: 137 },
    { date: '08/02', personal: 110, team: 50, total: 160 },
  ];

  const marketProjection = [
    { year: '2026', value: 26.9, growth: 22 },
    { year: '2027', value: 32.5, growth: 20 },
    { year: '2028', value: 39.2, growth: 20 },
    { year: '2029', value: 47.1, growth: 20 },
    { year: '2030', value: 56.8, growth: 20 },
  ];

  const legalizedCountries = [
    { name: 'Canadá', code: 'CA', status: 'legalizado' },
    { name: 'Uruguai', code: 'UY', status: 'legalizado' },
    { name: 'Portugal', code: 'PT', status: 'legalizado' },
    { name: 'Holanda', code: 'NL', status: 'legalizado' },
    { name: 'Alemanha', code: 'DE', status: 'legalizado' },
    { name: 'Itália', code: 'IT', status: 'legalizado' },
    { name: 'Espanha', code: 'ES', status: 'legalizado' },
    { name: 'Israel', code: 'IL', status: 'legalizado' },
    { name: 'Tailândia', code: 'TH', status: 'legalizado' },
    { name: 'Austrália', code: 'AU', status: 'legalizado' },
  ];

  const transactions = [
    { id: 1, type: 'deposit', description: 'Depósito via PIX', amount: 5000, date: '2026-02-08', status: 'completed' },
    { id: 2, type: 'earnings', description: 'Rendimento diário', amount: 150, date: '2026-02-08', status: 'completed' },
    { id: 3, type: 'commission', description: 'Comissão de indicação', amount: 500, date: '2026-02-07', status: 'completed' },
    { id: 4, type: 'withdrawal', description: 'Saque solicitado', amount: 2000, date: '2026-02-07', status: 'pending' },
    { id: 5, type: 'earnings', description: 'Rendimento diário', amount: 150, date: '2026-02-07', status: 'completed' },
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
              <Button onClick={() => navigate('/deposit')} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
                Depositar
              </Button>
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Minha Carteira</h1>
            <p className="text-muted-foreground">Acompanhe seus ganhos, investimentos e rendimentos</p>
          </div>
        </section>

        {/* Main Stats */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/50 rounded-2xl">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saldo Total</span>
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <p className="text-3xl font-bold">R$ {walletData.totalBalance.toFixed(2)}</p>
                <p className="text-xs text-green-500">+{walletData.monthlyGains} este mês</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Disponível</span>
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold">R$ {walletData.availableBalance.toFixed(2)}</p>
                <Button size="sm" onClick={() => navigate('/withdraw')} className="w-full mt-2 bg-accent/20 text-accent hover:bg-accent/30 rounded-lg">
                  Sacar
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Investido</span>
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <p className="text-3xl font-bold">R$ {walletData.investedAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Em 3 planos ativos</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Earnings Overview */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Ganhos Pessoais</CardTitle>
                <CardDescription>Rendimentos do seu investimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Acumulado</p>
                    <p className="text-3xl font-bold text-accent">R$ {walletData.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Hoje</p>
                      <p className="text-lg font-bold">R$ 110,00</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Esta Semana</p>
                      <p className="text-lg font-bold">R$ 750,00</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Ganhos de Equipe
                </CardTitle>
                <CardDescription>Comissões de indicações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total de Comissões</p>
                    <p className="text-3xl font-bold text-accent">R$ {walletData.teamEarnings.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Indicados</p>
                      <p className="text-lg font-bold">45</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground">Este Mês</p>
                      <p className="text-lg font-bold">R$ 850,00</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Earnings Chart */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Crescimento de Ganhos</CardTitle>
              <CardDescription>Ganhos pessoais vs comissões de equipe (últimos 8 dias)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={earningsHistory}>
                  <defs>
                    <linearGradient id="colorPersonal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(217, 119, 6)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(217, 119, 6)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(34, 197, 94)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(34, 197, 94)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(217,119,6,0.5)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="personal" stackId="1" stroke="rgb(217, 119, 6)" fillOpacity={1} fill="url(#colorPersonal)" name="Ganhos Pessoais" />
                  <Area type="monotone" dataKey="team" stackId="1" stroke="rgb(34, 197, 94)" fillOpacity={1} fill="url(#colorTeam)" name="Ganhos de Equipe" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Market Projection */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Projeção do Mercado Cannabis</CardTitle>
              <CardDescription>Crescimento previsto até 2030 (Bilhões USD)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marketProjection}>
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(217,119,6,0.5)' }} formatter={(value) => `$${value}B`} />
                  <Bar dataKey="value" fill="rgb(217, 119, 6)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* World Map - Legalized Countries */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                Países com Cannabis Legalizada
              </CardTitle>
              <CardDescription>Mercados em crescimento ao redor do mundo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Visual Map */}
                <div className="bg-background/50 rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">Mapa interativo com países legalizados em verde</p>
                  <div className="text-6xl">🌍</div>
                  <p className="text-sm text-muted-foreground mt-4">Mapa será integrado com biblioteca de mapas</p>
                </div>

                {/* Countries Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {legalizedCountries.map((country) => (
                    <div key={country.code} className="bg-background/50 border border-accent/30 rounded-lg p-4 text-center hover:border-accent/50 transition-colors">
                      <p className="text-2xl mb-2">🟢</p>
                      <p className="font-semibold text-sm">{country.name}</p>
                      <p className="text-xs text-muted-foreground">{country.code}</p>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Países Legalizados</p>
                    <p className="text-2xl font-bold text-accent">10+</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Novos Usuários/Mês</p>
                    <p className="text-2xl font-bold text-green-500">+5.2M</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Crescimento Anual</p>
                    <p className="text-2xl font-bold text-accent">+22%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Transactions */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Últimas movimentações da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                        tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                        tx.type === 'earnings' ? 'bg-accent/20 text-accent' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft className="h-4 w-4" /> :
                         tx.type === 'withdrawal' ? <ArrowUpRight className="h-4 w-4" /> :
                         tx.type === 'earnings' ? <Zap className="h-4 w-4" /> :
                         <Gift className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        tx.type === 'deposit' || tx.type === 'earnings' || tx.type === 'commission' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'earnings' || tx.type === 'commission' ? '+' : '-'}R$ {tx.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.status}</p>
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
