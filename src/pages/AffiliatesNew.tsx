import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { 
  Copy, Share2, TrendingUp, Users, Gift, Trophy, BarChart3, 
  Link2, ArrowRight, Zap, Crown, Medal
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function AffiliatesNew() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: summaryData } = trpc.investments.getSummary.useQuery();
  const summary = summaryData?.data;

  // Mock data for demonstration
  const affiliateData = {
    referralCode: 'PLANT' + (user?.id || '1234').toString().padStart(6, '0'),
    referralLink: `https://plantaeraiz.com/ref/PLANT${(user?.id || '1234').toString().padStart(6, '0')}`,
    totalReferrals: 45,
    level1Referrals: 12,
    level2Referrals: 18,
    level3Referrals: 15,
    totalCommissions: 12500,
    pendingCommissions: 2300,
    level1Commission: 8500,
    level2Commission: 2800,
    level3Commission: 1200,
  };

  const referralGrowth = [
    { month: 'Jan', referrals: 2, commissions: 150 },
    { month: 'Fev', referrals: 5, commissions: 420 },
    { month: 'Mar', referrals: 8, commissions: 780 },
    { month: 'Abr', referrals: 12, commissions: 1200 },
    { month: 'Mai', referrals: 18, commissions: 1950 },
    { month: 'Jun', referrals: 25, commissions: 2800 },
    { month: 'Jul', referrals: 32, commissions: 3600 },
    { month: 'Ago', referrals: 45, commissions: 4850 },
  ];

  const commissionBreakdown = [
    { name: 'Nível 1 (20%)', value: 8500, percentage: 68 },
    { name: 'Nível 2 (10%)', value: 2800, percentage: 22 },
    { name: 'Nível 3 (5%)', value: 1200, percentage: 10 },
  ];

  const topAffiliates = [
    { rank: 1, name: 'Carlos Silva', referrals: 156, commissions: 45800, level: 'Diamante' },
    { rank: 2, name: 'Maria Santos', referrals: 128, commissions: 38500, level: 'Ouro' },
    { rank: 3, name: 'João Oliveira', referrals: 95, commissions: 28700, level: 'Prata' },
    { rank: 4, name: 'Ana Costa', referrals: 87, commissions: 26200, level: 'Prata' },
    { rank: 5, name: 'Pedro Ferreira', referrals: 72, commissions: 21600, level: 'Bronze' },
    { rank: 6, name: 'Lucia Martins', referrals: 65, commissions: 19500, level: 'Bronze' },
    { rank: 7, name: 'Roberto Lima', referrals: 58, commissions: 17400, level: 'Bronze' },
    { rank: 8, name: 'Fernanda Gomes', referrals: 52, commissions: 15600, level: 'Bronze' },
    { rank: 9, name: 'Marcos Alves', referrals: 48, commissions: 14400, level: 'Bronze' },
    { rank: 10, name: 'Juliana Rocha', referrals: 45, commissions: 13500, level: 'Bronze' },
  ];

  const myReferrals = [
    { id: 1, name: 'João Silva', level: 1, depositAmount: 5000, commission: 1000, date: '2026-02-01' },
    { id: 2, name: 'Maria Santos', level: 1, depositAmount: 3000, commission: 600, date: '2026-02-02' },
    { id: 3, name: 'Pedro Costa', level: 2, depositAmount: 2000, commission: 200, date: '2026-02-03' },
    { id: 4, name: 'Ana Oliveira', level: 1, depositAmount: 4500, commission: 900, date: '2026-02-04' },
    { id: 5, name: 'Carlos Ferreira', level: 3, depositAmount: 1500, commission: 75, date: '2026-02-05' },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateData.referralLink);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Planta & Raiz - Investimentos em Cannabis Medicinal',
          text: 'Ganhe até 40% de comissão indicando amigos! Junte-se a mim na Planta & Raiz.',
          url: affiliateData.referralLink,
        });
      } catch (error) {
        toast.error('Erro ao compartilhar');
      }
    } else {
      copyToClipboard();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado</CardDescription>
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Sistema de Afiliados</h1>
          <p className="text-muted-foreground">Ganhe até 40% de comissão indicando amigos</p>
        </div>

        {/* Referral Link Section */}
        <Card className="bg-gradient-to-r from-accent/10 to-transparent border-accent/50 rounded-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Seu Link de Convite Único</h2>
              <p className="text-muted-foreground">Compartilhe este link com amigos e ganhe comissões</p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={affiliateData.referralLink}
                  readOnly
                  className="bg-background border-border/50 rounded-lg font-mono text-sm"
                />
                <Button
                  onClick={copyToClipboard}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={shareReferral}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg font-semibold"
                  onClick={() => navigate('/auth')}
                >
                  Código: {affiliateData.referralCode}
                </Button>
              </div>
            </div>

            {/* Commission Structure */}
            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-accent" />
                  <span className="font-semibold">Nível 1</span>
                </div>
                <p className="text-sm text-muted-foreground">Indicados diretos</p>
                <p className="text-2xl font-bold text-accent">20%</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-accent" />
                  <span className="font-semibold">Nível 2</span>
                </div>
                <p className="text-sm text-muted-foreground">Indicados dos seus indicados</p>
                <p className="text-2xl font-bold text-accent">10%</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-accent" />
                  <span className="font-semibold">Nível 3</span>
                </div>
                <p className="text-sm text-muted-foreground">Terceiro nível de indicações</p>
                <p className="text-2xl font-bold text-accent">5%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total de Indicados</span>
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-bold">{affiliateData.totalReferrals}</p>
              <p className="text-xs text-green-500">+12% este mês</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Comissões Totais</span>
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-bold">R$ {(affiliateData.totalCommissions / 100).toFixed(2)}</p>
              <p className="text-xs text-green-500">+8% este mês</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pendentes</span>
                <Gift className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-bold">R$ {(affiliateData.pendingCommissions / 100).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Será creditado em breve</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ranking</span>
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <p className="text-3xl font-bold">#87</p>
              <p className="text-xs text-muted-foreground">Entre os melhores afiliados</p>
            </CardContent>
          </Card>
        </div>

        {/* Growth Chart */}
        <Card className="bg-card/50 border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle>Crescimento de Indicações e Comissões</CardTitle>
            <CardDescription>Últimos 8 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={referralGrowth}>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
                <YAxis stroke="rgba(255,255,255,0.3)" yAxisId="left" />
                <YAxis stroke="rgba(255,255,255,0.3)" yAxisId="right" orientation="right" />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(217,119,6,0.5)' }} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="referrals" 
                  stroke="rgb(217, 119, 6)" 
                  strokeWidth={2}
                  name="Indicações"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="commissions" 
                  stroke="rgb(34, 197, 94)" 
                  strokeWidth={2}
                  name="Comissões (R$)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission Breakdown and Referral Levels */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Breakdown Chart */}
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Distribuição de Comissões</CardTitle>
              <CardDescription>Por nível de indicação</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={commissionBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#d97706"
                    dataKey="value"
                  >
                    {commissionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['rgb(217, 119, 6)', 'rgb(168, 85, 247)', 'rgb(34, 197, 94)'][index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `R$ ${(Number(value) / 100).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Referral Levels */}
          <Card className="bg-card/50 border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle>Seus Indicados por Nível</CardTitle>
              <CardDescription>Estrutura de rede</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Nível 1 (Diretos)</span>
                    <span className="text-accent font-bold">{affiliateData.level1Referrals}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-accent rounded-full h-2" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Comissão: R$ {(affiliateData.level1Commission / 100).toFixed(2)}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Nível 2</span>
                    <span className="text-accent font-bold">{affiliateData.level2Referrals}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-accent/70 rounded-full h-2" 
                      style={{ width: `${Math.min((affiliateData.level2Referrals / affiliateData.level1Referrals) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Comissão: R$ {(affiliateData.level2Commission / 100).toFixed(2)}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Nível 3</span>
                    <span className="text-accent font-bold">{affiliateData.level3Referrals}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-accent/40 rounded-full h-2" 
                      style={{ width: `${Math.min((affiliateData.level3Referrals / affiliateData.level1Referrals) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Comissão: R$ {(affiliateData.level3Commission / 100).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Referrals Table */}
        <Card className="bg-card/50 border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle>Meus Indicados Recentes</CardTitle>
            <CardDescription>Últimas indicações e comissões geradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold">Nível</th>
                    <th className="text-right py-3 px-4 font-semibold">Depósito</th>
                    <th className="text-right py-3 px-4 font-semibold">Comissão</th>
                    <th className="text-left py-3 px-4 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {myReferrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-border/30 hover:bg-background/50 transition-colors">
                      <td className="py-3 px-4">{referral.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          referral.level === 1 ? 'bg-accent/20 text-accent' :
                          referral.level === 2 ? 'bg-purple-500/20 text-purple-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          Nível {referral.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">R$ {(referral.depositAmount / 100).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-accent">R$ {(referral.commission / 100).toFixed(2)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{referral.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Affiliates Ranking */}
        <Card className="bg-card/50 border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Ranking de Melhores Afiliados
            </CardTitle>
            <CardDescription>Top 10 afiliados da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAffiliates.map((affiliate) => (
                <div key={affiliate.rank} className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                      affiliate.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      affiliate.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      affiliate.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-accent/20 text-accent'
                    }`}>
                      {affiliate.rank}
                    </div>
                    <div>
                      <p className="font-semibold">{affiliate.name}</p>
                      <p className="text-xs text-muted-foreground">{affiliate.referrals} indicações</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-accent">R$ {(affiliate.commissions / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{affiliate.level}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-gradient-to-r from-accent/10 to-transparent border-accent/50 rounded-2xl">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">Como Funciona o Sistema de Afiliados</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent font-bold">1</div>
                <h3 className="font-semibold">Compartilhe Seu Link</h3>
                <p className="text-sm text-muted-foreground">Copie seu link único e compartilhe com amigos e familiares</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent font-bold">2</div>
                <h3 className="font-semibold">Seus Amigos Investem</h3>
                <p className="text-sm text-muted-foreground">Quando seus indicados fazem depósitos, você ganha comissão</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent font-bold">3</div>
                <h3 className="font-semibold">Ganhe Passivamente</h3>
                <p className="text-sm text-muted-foreground">Receba comissões de até 3 níveis de indicações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
