/**
 * Influencer Performance Ranking Dashboard
 * Real-time metrics and leaderboard for top 20 influencers
 */

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Award,
  Target,
  Calendar,
  Download,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InfluencerMetrics {
  id: string;
  rank: number;
  name: string;
  platform: string;
  followers: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  engagement: number;
  status: "online" | "offline";
  lastUpdate: string;
  avatar?: string;
}

// Mock data for top 20 influencers
const mockInfluencers: InfluencerMetrics[] = [
  {
    id: "inf_001",
    rank: 1,
    name: "Dr. Cannabis Wellness",
    platform: "Instagram",
    followers: 450000,
    impressions: 125000,
    clicks: 3500,
    conversions: 280,
    revenue: 14000,
    ctr: 2.8,
    conversionRate: 8.0,
    engagement: 12.5,
    status: "online",
    lastUpdate: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "inf_002",
    rank: 2,
    name: "Saúde Natural",
    platform: "TikTok",
    followers: 380000,
    impressions: 98000,
    clicks: 2800,
    conversions: 210,
    revenue: 10500,
    ctr: 2.86,
    conversionRate: 7.5,
    engagement: 14.2,
    status: "online",
    lastUpdate: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "inf_003",
    rank: 3,
    name: "Médico Influenciador",
    platform: "YouTube",
    followers: 320000,
    impressions: 87000,
    clicks: 2400,
    conversions: 195,
    revenue: 9750,
    ctr: 2.76,
    conversionRate: 8.1,
    engagement: 11.8,
    status: "offline",
    lastUpdate: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "inf_004",
    rank: 4,
    name: "Wellness Coach",
    platform: "Instagram",
    followers: 290000,
    impressions: 76000,
    clicks: 2100,
    conversions: 168,
    revenue: 8400,
    ctr: 2.76,
    conversionRate: 8.0,
    engagement: 10.9,
    status: "online",
    lastUpdate: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: "inf_005",
    rank: 5,
    name: "Farmacêutico Experiente",
    platform: "LinkedIn",
    followers: 250000,
    impressions: 65000,
    clicks: 1800,
    conversions: 150,
    revenue: 7500,
    ctr: 2.77,
    conversionRate: 8.3,
    engagement: 9.5,
    status: "online",
    lastUpdate: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: "inf_006",
    rank: 6,
    name: "Health Blogger",
    platform: "Instagram",
    followers: 220000,
    impressions: 58000,
    clicks: 1600,
    conversions: 128,
    revenue: 6400,
    ctr: 2.76,
    conversionRate: 8.0,
    engagement: 10.2,
    status: "offline",
    lastUpdate: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: "inf_007",
    rank: 7,
    name: "Terapeuta Natural",
    platform: "TikTok",
    followers: 195000,
    impressions: 52000,
    clicks: 1450,
    conversions: 116,
    revenue: 5800,
    ctr: 2.79,
    conversionRate: 8.0,
    engagement: 13.1,
    status: "online",
    lastUpdate: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: "inf_008",
    rank: 8,
    name: "Médica Influencer",
    platform: "YouTube",
    followers: 180000,
    impressions: 48000,
    clicks: 1320,
    conversions: 106,
    revenue: 5300,
    ctr: 2.75,
    conversionRate: 8.0,
    engagement: 11.5,
    status: "online",
    lastUpdate: new Date(Date.now() - 6 * 60000).toISOString(),
  },
  {
    id: "inf_009",
    rank: 9,
    name: "Especialista em Bem-estar",
    platform: "Instagram",
    followers: 165000,
    impressions: 44000,
    clicks: 1210,
    conversions: 97,
    revenue: 4850,
    ctr: 2.75,
    conversionRate: 8.0,
    engagement: 10.8,
    status: "offline",
    lastUpdate: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "inf_010",
    rank: 10,
    name: "Coach de Saúde",
    platform: "TikTok",
    followers: 150000,
    impressions: 40000,
    clicks: 1100,
    conversions: 88,
    revenue: 4400,
    ctr: 2.75,
    conversionRate: 8.0,
    engagement: 12.8,
    status: "online",
    lastUpdate: new Date(Date.now() - 2 * 60000).toISOString(),
  },
];

// Generate mock data for remaining 10 influencers
const generateMockInfluencers = (): InfluencerMetrics[] => {
  const baseInfluencers = [...mockInfluencers];
  const platforms = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter"];

  for (let i = 11; i <= 20; i++) {
    const baseFactor = 1 - (i - 1) * 0.04;
    baseInfluencers.push({
      id: `inf_${String(i).padStart(3, "0")}`,
      rank: i,
      name: `Influenciador ${i}`,
      platform: platforms[(i - 1) % platforms.length],
      followers: Math.floor(125000 * baseFactor),
      impressions: Math.floor(35000 * baseFactor),
      clicks: Math.floor(950 * baseFactor),
      conversions: Math.floor(76 * baseFactor),
      revenue: Math.floor(3800 * baseFactor),
      ctr: 2.71 + Math.random() * 0.1,
      conversionRate: 7.8 + Math.random() * 0.5,
      engagement: 9.5 + Math.random() * 4,
      status: Math.random() > 0.5 ? "online" : "offline",
      lastUpdate: new Date(
        Date.now() - Math.random() * 30 * 60000
      ).toISOString(),
    });
  }

  return baseInfluencers;
};

export default function InfluencerRankingDashboard() {
  const [influencers, setInfluencers] = useState<InfluencerMetrics[]>([]);
  const [sortBy, setSortBy] = useState<keyof InfluencerMetrics>("revenue");
  const [timeRange, setTimeRange] = useState("24h");

  useEffect(() => {
    setInfluencers(generateMockInfluencers());

    // Simulate real-time updates
    const interval = setInterval(() => {
      setInfluencers((prev) =>
        prev.map((inf) => ({
          ...inf,
          impressions: inf.impressions + Math.floor(Math.random() * 100),
          clicks: inf.clicks + Math.floor(Math.random() * 20),
          conversions: inf.conversions + Math.floor(Math.random() * 3),
          revenue: inf.revenue + Math.floor(Math.random() * 100),
          status: Math.random() > 0.95 ? "offline" : inf.status,
          lastUpdate: new Date().toISOString(),
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const sortedInfluencers = [...influencers].sort((a, b) => {
    const aVal = a[sortBy] as number;
    const bVal = b[sortBy] as number;
    return bVal - aVal;
  });

  const totalMetrics = {
    impressions: influencers.reduce((sum, inf) => sum + inf.impressions, 0),
    clicks: influencers.reduce((sum, inf) => sum + inf.clicks, 0),
    conversions: influencers.reduce((sum, inf) => sum + inf.conversions, 0),
    revenue: influencers.reduce((sum, inf) => sum + inf.revenue, 0),
    avgEngagement:
      influencers.reduce((sum, inf) => sum + inf.engagement, 0) /
      influencers.length,
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-100 text-gray-800";
    if (rank === 3) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Ranking de Influenciadores
          </h1>
          <p className="text-muted-foreground">
            Métricas em tempo real dos 20 principais influenciadores
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-8">
          {["24h", "7d", "30d", "90d"].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range)}
              size="sm"
            >
              <Calendar size={16} className="mr-2" />
              {range}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="ml-auto">
            <Download size={16} className="mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Impressões</p>
                <p className="text-2xl font-bold">
                  {(totalMetrics.impressions / 1000).toFixed(0)}K
                </p>
              </div>
              <Eye className="text-blue-500" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cliques</p>
                <p className="text-2xl font-bold">
                  {(totalMetrics.clicks / 1000).toFixed(1)}K
                </p>
              </div>
              <MousePointerClick className="text-purple-500" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold">
                  {totalMetrics.conversions.toLocaleString()}
                </p>
              </div>
              <ShoppingCart className="text-green-500" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold">
                  R$ {(totalMetrics.revenue / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Engajamento Médio
                </p>
                <p className="text-2xl font-bold">
                  {totalMetrics.avgEngagement.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="text-orange-500" size={32} />
            </div>
          </Card>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          {[
            { key: "revenue", label: "Receita" },
            { key: "conversions", label: "Conversões" },
            { key: "clicks", label: "Cliques" },
            { key: "engagement", label: "Engajamento" },
          ].map((option) => (
            <Button
              key={option.key}
              variant={sortBy === option.key ? "default" : "outline"}
              onClick={() => setSortBy(option.key as keyof InfluencerMetrics)}
              size="sm"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Ranking Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Posição
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Influenciador
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Plataforma
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Seguidores
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Impressões
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    CTR
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Conversões
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Receita
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">
                    Engajamento
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedInfluencers.map((influencer) => (
                  <tr
                    key={influencer.id}
                    className="border-b hover:bg-muted/30 transition"
                  >
                    <td className="px-6 py-4">
                      <Badge className={getMedalColor(influencer.rank)}>
                        {getMedalIcon(influencer.rank)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{influencer.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {influencer.platform}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {(influencer.followers / 1000).toFixed(0)}K
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold">
                      {(influencer.impressions / 1000).toFixed(0)}K
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span className="text-green-600 font-semibold">
                        {influencer.ctr.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold">
                      {influencer.conversions}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold">
                      R$ {(influencer.revenue / 1000).toFixed(1)}K
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span className="text-blue-600 font-semibold">
                        {influencer.engagement.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          influencer.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Dados atualizados em tempo real. Última atualização:{" "}
            {new Date().toLocaleTimeString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
}
