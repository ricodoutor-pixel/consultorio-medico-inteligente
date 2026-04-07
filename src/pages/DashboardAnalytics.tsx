import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart, TrendingUp, Download } from 'lucide-react';

export default function DashboardAnalytics() {
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState({
    consultations: 12,
    spent: 1800,
    subscriptions: 2,
    healthScore: 78,
  });

  // Simulando dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        healthScore: Math.min(100, prev.healthScore + Math.random() * 2),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Dashboard Analytics</h1>
              <p className="text-gray-400">Acompanhe seu progresso em tempo real</p>
            </div>
            <Button className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Relatório
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* PERÍODO */}
        <div className="mb-8 flex gap-4">
          {['week', 'month', 'quarter', 'year'].map(p => (
            <Button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                period === p
                  ? 'bg-[#00FF00] text-[#0A0E27]'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {p === 'week' && 'Esta Semana'}
              {p === 'month' && 'Este Mês'}
              {p === 'quarter' && 'Este Trimestre'}
              {p === 'year' && 'Este Ano'}
            </Button>
          ))}
        </div>

        {/* STATS CARDS */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#00FF00]/10 to-[#9D4EDD]/5 border border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Consultas</p>
                <p className="text-3xl font-bold text-[#00FF00]">{stats.consultations}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
            <p className="text-xs text-green-500 mt-4 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +25% vs mês anterior
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-[#9D4EDD]/10 to-[#00FF00]/5 border border-[#9D4EDD]/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Gastos</p>
                <p className="text-3xl font-bold text-[#9D4EDD]">R$ {stats.spent.toFixed(0)}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <p className="text-xs text-purple-500 mt-4 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +15% vs mês anterior
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-[#00FF00]/10 to-[#9D4EDD]/5 border border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Assinaturas</p>
                <p className="text-3xl font-bold text-[#00FF00]">{stats.subscriptions}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
            <p className="text-xs text-green-500 mt-4">Premium + Básico</p>
          </Card>

          <Card className="bg-gradient-to-br from-[#9D4EDD]/10 to-[#00FF00]/5 border border-[#9D4EDD]/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Health Score</p>
                <p className="text-3xl font-bold text-[#9D4EDD]">{Math.round(stats.healthScore)}%</p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4">
              <div
                className="bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] h-2 rounded-full transition-all"
                style={{ width: `${stats.healthScore}%` }}
              ></div>
            </div>
          </Card>
        </div>

        {/* GRÁFICOS */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Consultas */}
          <Card className="bg-white/5 border border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-[#00FF00]" />
                Consultas por Mês
              </h3>
            </div>
            <div className="h-64 flex items-end justify-around gap-2">
              {[2, 4, 3, 5, 6, 4, 7].map((value, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-[#00FF00] to-[#9D4EDD] rounded-t transition-all hover:opacity-80"
                    style={{ height: `${(value / 7) * 100}%` }}
                  ></div>
                  <span className="text-xs text-gray-500">
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'][i]}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Gráfico de Gastos */}
          <Card className="bg-white/5 border border-[#9D4EDD]/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#9D4EDD]" />
                Distribuição de Gastos
              </h3>
            </div>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#00FF00"
                    strokeWidth="15"
                    strokeDasharray="75 100"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#9D4EDD"
                    strokeWidth="15"
                    strokeDasharray="20 100"
                    strokeDashoffset="-75"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#FF6B6B"
                    strokeWidth="15"
                    strokeDasharray="5 100"
                    strokeDashoffset="-95"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">R$ 1.800</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00FF00]"></div>
                <span className="text-sm text-gray-400">Consultas (67%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#9D4EDD]"></div>
                <span className="text-sm text-gray-400">Medicamentos (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF6B6B]"></div>
                <span className="text-sm text-gray-400">Produtos (8%)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* TABELA DE ATIVIDADES */}
        <Card className="bg-white/5 border border-[#00FF00]/20 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-[#00FF00]" />
            Atividades Recentes
          </h3>
          <div className="space-y-4">
            {[
              { date: '23 Feb', action: 'Consulta realizada', value: 'Dr. Carlos Silva', color: 'bg-[#00FF00]/20' },
              { date: '22 Feb', action: 'Medicação adicionada', value: 'Óleo CBD 500mg', color: 'bg-[#9D4EDD]/20' },
              { date: '21 Feb', action: 'Assinatura Premium', value: 'R$ 79.90', color: 'bg-[#FF6B6B]/20' },
              { date: '20 Feb', action: 'Prescrição recebida', value: 'Dr. Maria Santos', color: 'bg-[#00FF00]/20' },
            ].map((item, i) => (
              <div key={i} className={`p-4 rounded-lg ${item.color} border border-white/10 flex items-center justify-between`}>
                <div>
                  <p className="text-white font-semibold">{item.action}</p>
                  <p className="text-sm text-gray-400">{item.value}</p>
                </div>
                <span className="text-xs text-gray-500">{item.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
