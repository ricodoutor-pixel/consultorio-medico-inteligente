/**
 * Real-Time Influencer Metrics Dashboard
 * Monitor campaign performance and earnings in real-time
 */

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Target,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MetricsData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface InfluencerStats {
  name: string;
  platform: string;
  followers: number;
  engagement: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  ctr: number;
  conversionRate: number;
  roi: number;
}

const mockMetricsData: MetricsData[] = [
  {
    date: "Seg",
    impressions: 12500,
    clicks: 250,
    conversions: 25,
    revenue: 2500,
  },
  {
    date: "Ter",
    impressions: 15300,
    clicks: 306,
    conversions: 31,
    revenue: 3100,
  },
  {
    date: "Qua",
    impressions: 18200,
    clicks: 364,
    conversions: 36,
    revenue: 3600,
  },
  {
    date: "Qui",
    impressions: 16800,
    clicks: 336,
    conversions: 34,
    revenue: 3400,
  },
  {
    date: "Sex",
    impressions: 22100,
    clicks: 442,
    conversions: 44,
    revenue: 4400,
  },
  {
    date: "Sab",
    impressions: 25600,
    clicks: 512,
    conversions: 51,
    revenue: 5100,
  },
  {
    date: "Dom",
    impressions: 28300,
    clicks: 566,
    conversions: 57,
    revenue: 5700,
  },
];

const mockInfluencerStats: InfluencerStats = {
  name: "João Silva",
  platform: "Instagram",
  followers: 250000,
  engagement: 0.05,
  totalImpressions: 138800,
  totalClicks: 2776,
  totalConversions: 278,
  totalRevenue: 27800,
  totalCommission: 8340,
  ctr: 0.02,
  conversionRate: 0.1,
  roi: 4.5,
};

const mockLeaderboard = [
  {
    rank: 1,
    name: "João Silva",
    platform: "Instagram",
    conversions: 450,
    revenue: 45000,
    commission: 13500,
  },
  {
    rank: 2,
    name: "Maria Wellness",
    platform: "TikTok",
    conversions: 380,
    revenue: 38000,
    commission: 11400,
  },
  {
    rank: 3,
    name: "Dr. Cannabis",
    platform: "YouTube",
    conversions: 320,
    revenue: 32000,
    commission: 9600,
  },
  {
    rank: 4,
    name: "Ana Costa",
    platform: "Instagram",
    conversions: 290,
    revenue: 29000,
    commission: 8700,
  },
  {
    rank: 5,
    name: "Pedro Saúde",
    platform: "TikTok",
    conversions: 250,
    revenue: 25000,
    commission: 7500,
  },
];

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function InfluencerMetricsDashboard() {
  const [stats, setStats] = useState<InfluencerStats>(mockInfluencerStats);
  const [metricsData, setMetricsData] = useState<MetricsData[]>(mockMetricsData);
  const [selectedMetric, setSelectedMetric] = useState<"impressions" | "clicks" | "conversions" | "revenue">(
    "conversions"
  );
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsData((prev) => {
        const lastData = prev[prev.length - 1];
        const newData = {
          ...lastData,
          impressions: lastData.impressions + Math.floor(Math.random() * 100),
          clicks: lastData.clicks + Math.floor(Math.random() * 10),
          conversions: lastData.conversions + Math.floor(Math.random() * 2),
          revenue: lastData.revenue + Math.floor(Math.random() * 100),
        };

        return [...prev.slice(1), newData];
      });

      setStats((prev) => ({
        ...prev,
        totalImpressions: prev.totalImpressions + Math.floor(Math.random() * 100),
        totalClicks: prev.totalClicks + Math.floor(Math.random() * 10),
        totalConversions: prev.totalConversions + Math.floor(Math.random() * 2),
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 100),
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const conversionData = [
    { name: "Conversões", value: stats.totalConversions },
    { name: "Não Conversões", value: stats.totalClicks - stats.totalConversions },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Painel de Métricas</h1>
        <p className="text-muted-foreground">
          Acompanhe seu desempenho em tempo real
        </p>
      </div>

      {/* Influencer Info */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{stats.name}</h2>
            <p className="text-muted-foreground">
              {stats.platform} • {stats.followers.toLocaleString()} seguidores
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              R$ {stats.totalCommission.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Comissão Total</p>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Eye className="text-blue-500" size={24} />
            <span className="text-sm font-semibold text-blue-500">+12%</span>
          </div>
          <p className="text-muted-foreground text-sm">Impressões</p>
          <p className="text-2xl font-bold">
            {stats.totalImpressions.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <MousePointerClick className="text-purple-500" size={24} />
            <span className="text-sm font-semibold text-purple-500">+8%</span>
          </div>
          <p className="text-muted-foreground text-sm">Cliques</p>
          <p className="text-2xl font-bold">
            {stats.totalClicks.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="text-green-500" size={24} />
            <span className="text-sm font-semibold text-green-500">+15%</span>
          </div>
          <p className="text-muted-foreground text-sm">Conversões</p>
          <p className="text-2xl font-bold">
            {stats.totalConversions.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-orange-500" size={24} />
            <span className="text-sm font-semibold text-orange-500">+20%</span>
          </div>
          <p className="text-muted-foreground text-sm">Receita</p>
          <p className="text-2xl font-bold">
            R$ {stats.totalRevenue.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Line Chart - Conversions Over Time */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Conversões por Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart - Conversion Rate */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Taxa de Conversão</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold">
              {(stats.conversionRate * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="text-blue-500" size={24} />
            <h3 className="font-bold">CTR</h3>
          </div>
          <p className="text-3xl font-bold mb-2">
            {(stats.ctr * 100).toFixed(2)}%
          </p>
          <p className="text-sm text-muted-foreground">
            Taxa de Clique (Cliques / Impressões)
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-500" size={24} />
            <h3 className="font-bold">ROI</h3>
          </div>
          <p className="text-3xl font-bold mb-2">{stats.roi.toFixed(2)}x</p>
          <p className="text-sm text-muted-foreground">
            Retorno sobre Investimento
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-purple-500" size={24} />
            <h3 className="font-bold">Engajamento</h3>
          </div>
          <p className="text-3xl font-bold mb-2">
            {(stats.engagement * 100).toFixed(2)}%
          </p>
          <p className="text-sm text-muted-foreground">Taxa de Engajamento</p>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-bold mb-4">Top Influencers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Posição</th>
                <th className="text-left py-2 px-4">Nome</th>
                <th className="text-left py-2 px-4">Plataforma</th>
                <th className="text-right py-2 px-4">Conversões</th>
                <th className="text-right py-2 px-4">Receita</th>
                <th className="text-right py-2 px-4">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((influencer) => (
                <tr key={influencer.rank} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-lg">#{influencer.rank}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold">{influencer.name}</td>
                  <td className="py-3 px-4">{influencer.platform}</td>
                  <td className="text-right py-3 px-4">
                    {influencer.conversions}
                  </td>
                  <td className="text-right py-3 px-4">
                    R$ {influencer.revenue.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-green-600">
                    R$ {influencer.commission.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline">Exportar Relatório</Button>
        <Button>Solicitar Pagamento</Button>
      </div>
    </div>
  );
}
