import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: summaryData } = trpc.investments.getSummary.useQuery();
  const { data: investmentsData } = trpc.investments.getActiveInvestments.useQuery();
  const { data: affiliateData } = trpc.affiliates.getStats.useQuery();
  const { data: transactionsData } = trpc.transactions.getHistory.useQuery({ limit: 10 });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado para acessar o dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = summaryData?.data;
  const investments = investmentsData?.data || [];
  const affiliate = affiliateData?.data;
  const transactions = transactionsData?.data?.transactions || [];

  const chartData = [
    { date: '01/02', earnings: 15.50, invested: 1000 },
    { date: '02/02', earnings: 31.00, invested: 1000 },
    { date: '03/02', earnings: 46.50, invested: 1000 },
    { date: '04/02', earnings: 62.00, invested: 1000 },
    { date: '05/02', earnings: 77.50, invested: 1000 },
    { date: '06/02', earnings: 93.00, invested: 1000 },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Bem-vindo, {user.name || 'Usuário'}</h1>
          <p className="text-muted-foreground">Acompanhe seus investimentos e ganhos em tempo real</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponível</CardTitle>
              <Wallet className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {summary ? (summary.availableBalance / 100).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Pronto para investir</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Investido</CardTitle>
              <DollarSign className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {summary ? (summary.investedAmount / 100).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{investments.length} investimentos ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ganhos Acumulados</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                R$ {summary ? (summary.totalEarnings / 100).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Rendimentos diários</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 rounded-2xl overflow-hidden hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Indicações</CardTitle>
              <Users className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{affiliate?.totalReferrals || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Usuários indicados</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="bg-card border border-border/50 rounded-lg p-1">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="investments">Investimentos</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Gráfico de Rendimentos</CardTitle>
                <CardDescription>Seus ganhos nos últimos 6 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="rgb(217, 119, 6)" 
                      name="Rendimentos (R$)"
                      strokeWidth={2}
                      dot={{ fill: 'rgb(217, 119, 6)', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investments" className="space-y-4">
            <Card className="bg-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Seus Investimentos</CardTitle>
                <CardDescription>Investimentos ativos e seus detalhes</CardDescription>
              </CardHeader>
              <CardContent>
                {investments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Você ainda não tem investimentos</p>
                    <Button onClick={() => navigate('/invest')} className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Comece a Investir
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {investments.map((inv) => (
                      <div key={inv.id} className="border border-border/50 rounded-xl p-4 hover:border-accent/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">Plano {inv.planId}</p>
                            <p className="text-sm text-muted-foreground">
                              Investido em {new Date(inv.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">R$ {(inv.amount / 100).toFixed(2)}</p>
                            <p className="text-sm text-green-500 flex items-center justify-end gap-1">
                              <ArrowUpRight className="h-4 w-4" />
                              +R$ {(inv.accumulatedReturns / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card className="bg-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>Seus últimos movimentos financeiros</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0 hover:bg-background/50 px-2 rounded transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tx.type === 'withdrawal' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                            {tx.type === 'withdrawal' ? (
                              <ArrowDownLeft className={`h-4 w-4 ${tx.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}`} />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{tx.type}</p>
                            <p className="text-sm text-muted-foreground">{tx.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
                            {tx.type === 'withdrawal' ? '-' : '+'}R$ {(tx.amount / 100).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button size="lg" onClick={() => navigate('/deposit')} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold h-10">
            Fazer Depósito
          </Button>
          <Button size="lg" onClick={() => navigate('/invest')} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold h-10">
            Investir
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/withdraw')} className="w-full rounded-lg font-semibold h-10 border-border/50 hover:bg-background">
            Solicitar Saque
          </Button>
        </div>
      </div>
    </div>
  );
}
