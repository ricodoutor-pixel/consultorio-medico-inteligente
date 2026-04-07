/**
 * 📊 ADMIN SENTIMENT DASHBOARD — Visualização de Sentimentos e Emoções
 * 
 * Componentes:
 * - KPI Cards (total mensagens, score médio, usuários únicos)
 * - Gráfico Pizza de Distribuição de Emoções
 * - Gráfico Linha de Tendências Temporais
 * - Tabela de Usuários Frustrados
 * - Filtros por data e emoção
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, TrendingUp, Users, MessageSquare, BarChart3, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10b981',
  satisfied: '#06b6d4',
  neutral: '#f59e0b',
  confused: '#8b5cf6',
  frustrated: '#f97316',
  angry: '#ef4444',
  sad: '#ec4899'
};

const AdminSentimentDashboard: React.FC = () => {
  const [daysBack, setDaysBack] = useState(30);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState('');

  // Queries
  const overviewQuery = trpc.sentimentDashboard.getOverview.useQuery({ daysBack });
  const emotionDistQuery = trpc.sentimentDashboard.getEmotionDistribution.useQuery({ daysBack });
  const trendQuery = trpc.sentimentDashboard.getTrendData.useQuery({ daysBack });
  const frustratedUsersQuery = trpc.sentimentDashboard.getTopFrustratedUsers.useQuery({ daysBack, limit: 10 });
  const aggregatedStatsQuery = trpc.sentimentDashboard.getAggregatedStats.useQuery({ daysBack });

  // Calcular porcentagens para gráfico pizza
  const emotionDataWithPercentage = (emotionDistQuery.data || []).map((item) => {
    const total = (emotionDistQuery.data || []).reduce((sum, e) => sum + e.value, 0);
    return {
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    };
  });

  // Exportar dados
  const handleExportCSV = () => {
    const data = {
      overview: overviewQuery.data,
      emotionDistribution: emotionDistQuery.data,
      trends: trendQuery.data,
      frustratedUsers: frustratedUsersQuery.data
    };

    const csv = JSON.stringify(data, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `sentiment-report-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Dashboard de Sentimentos</h1>
          <p className="text-slate-400">Análise de emoções e tendências de sentimento dos usuários</p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Período (dias)</label>
            <Select value={String(daysBack)} onValueChange={(v) => setDaysBack(parseInt(v))}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Buscar Usuário</label>
            <Input
              placeholder="Nome ou email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleExportCSV} className="w-full bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Total de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{overviewQuery.data?.totalMessages || 0}</div>
              <p className="text-xs text-slate-500 mt-1">{overviewQuery.data?.period}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Score Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${overviewQuery.data && overviewQuery.data.avgScore > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overviewQuery.data?.avgScore || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">-100 a +100</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuários Únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{overviewQuery.data?.uniqueUsers || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Usuários ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Frustrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {frustratedUsersQuery.data?.filter((u) => u.riskLevel === 'high').length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Alto risco</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distribuição de Emoções */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Distribuição de Emoções</CardTitle>
              <CardDescription>Proporção de cada emoção detectada</CardDescription>
            </CardHeader>
            <CardContent>
              {emotionDataWithPercentage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={emotionDataWithPercentage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {emotionDataWithPercentage.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={EMOTION_COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-slate-400">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Tendência de Score */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Tendência de Score</CardTitle>
              <CardDescription>Evolução do score médio ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {trendQuery.data && trendQuery.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendQuery.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Score Médio"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="positive"
                      stroke="#06b6d4"
                      strokeWidth={1}
                      name="Positivos"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="negative"
                      stroke="#ef4444"
                      strokeWidth={1}
                      name="Negativos"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-slate-400">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Barras - Emoções */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Score Médio por Emoção</CardTitle>
            <CardDescription>Comparação de sentimentos entre emoções</CardDescription>
          </CardHeader>
          <CardContent>
            {emotionDataWithPercentage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={emotionDataWithPercentage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="avgScore" fill="#10b981" name="Score Médio">
                    {emotionDataWithPercentage.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={EMOTION_COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-400">Sem dados</div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Usuários Frustrados */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Usuários com Maior Frustração</CardTitle>
            <CardDescription>Usuários que precisam de atenção especial</CardDescription>
          </CardHeader>
          <CardContent>
            {frustratedUsersQuery.data && frustratedUsersQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Usuário</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Mensagens</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Score Médio</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Frustradas</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frustratedUsersQuery.data.map((user) => (
                      <tr key={user.userId} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{user.userName}</p>
                            <p className="text-xs text-slate-400">{user.userEmail}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{user.messageCount}</td>
                        <td className={`py-3 px-4 font-medium ${user.avgScore > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {user.avgScore}
                        </td>
                        <td className="py-3 px-4 text-orange-500 font-medium">{user.frustratedCount}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.riskLevel === 'high'
                                ? 'bg-red-500/20 text-red-500'
                                : user.riskLevel === 'medium'
                                  ? 'bg-orange-500/20 text-orange-500'
                                  : 'bg-green-500/20 text-green-500'
                            }`}
                          >
                            {user.riskLevel === 'high' ? '🔴 Alto' : user.riskLevel === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">Nenhum usuário com frustração detectada</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSentimentDashboard;
