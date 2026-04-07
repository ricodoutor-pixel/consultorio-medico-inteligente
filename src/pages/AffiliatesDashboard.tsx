import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Copy, Share2, DollarSign, Users, Gift, BarChart3 } from 'lucide-react';

export default function AffiliatesDashboard() {
  const [referralCode] = useState('PLANTARAIZ2024');
  const [copied, setCopied] = useState(false);

  const affiliateStats = {
    totalReferrals: 47,
    activeReferrals: 32,
    totalEarnings: 4750.00,
    pendingEarnings: 890.50,
    conversionRate: 68.1,
    averageCommission: 101.06,
  };

  const referrals = [
    {
      id: 1,
      name: 'João Silva',
      email: 'joao@email.com',
      date: '2026-02-20',
      status: 'ativo',
      earnings: 150.00,
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@email.com',
      date: '2026-02-19',
      status: 'ativo',
      earnings: 200.00,
    },
    {
      id: 3,
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      date: '2026-02-18',
      status: 'pendente',
      earnings: 0.00,
    },
  ];

  const commissionTiers = [
    { level: 'Bronze', referrals: 0, commission: '5%', color: 'from-amber-600 to-amber-700' },
    { level: 'Prata', referrals: 10, commission: '7%', color: 'from-slate-400 to-slate-500' },
    { level: 'Ouro', referrals: 25, commission: '10%', color: 'from-yellow-400 to-yellow-500' },
    { level: 'Platina', referrals: 50, commission: '15%', color: 'from-purple-400 to-purple-500' },
  ];

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white">Dashboard de Afiliados</h1>
          <p className="text-gray-400">Ganhe comissões indicando profissionais e produtos</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* REFERRAL CODE */}
        <Card className="bg-gradient-to-r from-[#00FF00]/10 to-[#9D4EDD]/10 border border-[#00FF00]/30 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Seu Código de Referência</h2>
              <p className="text-gray-400">Compartilhe com amigos e ganhe comissões</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 border border-[#00FF00]/30 rounded-lg px-6 py-3">
                <code className="text-[#00FF00] font-mono text-lg">{referralCode}</code>
              </div>
              <Button
                onClick={copyReferralCode}
                className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold"
              >
                <Copy className="w-5 h-5 mr-2" />
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button className="bg-[#9D4EDD] text-white hover:bg-[#8a3dcc] font-bold">
                <Share2 className="w-5 h-5 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </Card>

        {/* STATS GRID */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/5 border border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-2">Ganhos Totais</p>
                <h3 className="text-3xl font-bold text-[#00FF00]">
                  R$ {affiliateStats.totalEarnings.toFixed(2)}
                </h3>
              </div>
              <DollarSign className="w-10 h-10 text-[#00FF00] opacity-20" />
            </div>
          </Card>

          <Card className="bg-white/5 border border-[#9D4EDD]/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-2">Referências Ativas</p>
                <h3 className="text-3xl font-bold text-[#9D4EDD]">{affiliateStats.activeReferrals}</h3>
              </div>
              <Users className="w-10 h-10 text-[#9D4EDD] opacity-20" />
            </div>
          </Card>

          <Card className="bg-white/5 border border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 mb-2">Taxa de Conversão</p>
                <h3 className="text-3xl font-bold text-blue-400">{affiliateStats.conversionRate}%</h3>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-400 opacity-20" />
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* COMMISSION TIERS */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-white mb-6">Níveis de Comissão</h2>
            <div className="space-y-4">
              {commissionTiers.map((tier, idx) => (
                <Card
                  key={idx}
                  className={`bg-gradient-to-r ${tier.color} p-4 border border-white/10`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold">{tier.level}</h3>
                      <p className="text-white/70 text-sm">{tier.referrals}+ referências</p>
                    </div>
                    <div className="text-white font-bold text-xl">{tier.commission}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* REFERRALS LIST */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Suas Referências</h2>
            <div className="space-y-4">
              {referrals.map(referral => (
                <Card key={referral.id} className="bg-white/5 border border-[#00FF00]/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{referral.name}</h3>
                      <p className="text-gray-400 text-sm">{referral.email}</p>
                      <p className="text-gray-500 text-xs mt-1">Desde {referral.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            referral.status === 'ativo'
                              ? 'bg-[#00FF00]/20 text-[#00FF00]'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {referral.status === 'ativo' ? '✓ Ativo' : '⏳ Pendente'}
                        </span>
                      </div>
                      <p className="text-[#00FF00] font-bold">R$ {referral.earnings.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* EARNINGS CHART */}
        <Card className="bg-white/5 border border-[#00FF00]/20 p-8 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Ganhos por Mês</h2>
          <div className="h-64 flex items-end justify-around gap-4">
            {[800, 1200, 950, 1500, 1100, 1400].map((value, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-gradient-to-t from-[#00FF00] to-[#9D4EDD] rounded-t-lg"
                  style={{ height: `${(value / 1500) * 100}%` }}
                />
                <p className="text-gray-400 text-sm mt-2">Mês {idx + 1}</p>
                <p className="text-[#00FF00] font-bold">R$ {value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* PENDING EARNINGS */}
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-8 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Gift className="w-10 h-10 text-yellow-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Ganhos Pendentes</h3>
                <p className="text-gray-400">Será creditado em 7 dias úteis</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold text-3xl">R$ {affiliateStats.pendingEarnings.toFixed(2)}</p>
              <Button className="bg-yellow-500 text-black hover:bg-yellow-600 font-bold mt-4">
                Solicitar Saque
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
