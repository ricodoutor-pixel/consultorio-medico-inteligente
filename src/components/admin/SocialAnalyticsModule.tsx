import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, MousePointerClick, Target } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function SocialAnalyticsModule() {
  const { data: report, isLoading } = useQuery({
    queryKey: ["social-analytics-report"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("social-analytics", {
        body: { action: "full_report", period: "week", platform: "all" },
      });
      if (error) throw error;
      return data?.report;
    },
    refetchInterval: 30000,
  });

  const { data: dailyReport } = useQuery({
    queryKey: ["social-analytics-daily"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("social-analytics", {
        body: { action: "full_report", period: "day", platform: "all" },
      });
      if (error) throw error;
      return data?.report;
    },
    refetchInterval: 30000,
  });

  const internalData = report?.internal_analytics || {};
  const dailyInternal = dailyReport?.internal_analytics || {};

  // Build chart data from breakdown
  const byTypeData = Object.entries(internalData.by_type || {}).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value: Number(value),
  }));

  const byPlatformData = Object.entries(internalData.by_platform || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number(value),
  }));

  const byFunnelData = Object.entries(internalData.by_funnel || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number(value),
  }));

  // Comparison data for IG vs FB
  const platformComparison = [
    { name: "Facebook", interactions: (internalData.by_platform?.facebook || 0), color: "#3b82f6" },
    { name: "Instagram", interactions: (internalData.by_platform?.instagram || 0), color: "#8b5cf6" },
    { name: "Website", interactions: (internalData.by_platform?.website || 0), color: "#06b6d4" },
  ];

  const kpis = [
    { label: "Alcance Total", value: internalData.total_interactions || 0, icon: TrendingUp, change: dailyInternal.total_interactions || 0, changeLabel: "hoje" },
    { label: "Usuários Únicos", value: internalData.unique_users || 0, icon: Users, change: dailyInternal.unique_users || 0, changeLabel: "hoje" },
    { label: "Lead Score Total", value: internalData.total_lead_score || 0, icon: Target, change: dailyInternal.total_lead_score || 0, changeLabel: "hoje" },
    { label: "Conversões", value: internalData.conversions || 0, icon: MousePointerClick, change: dailyInternal.conversions || 0, changeLabel: "hoje" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
            <CardContent className="p-4 h-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">{kpi.value.toLocaleString("pt-BR")}</p>
                </div>
                <kpi.icon className="w-5 h-5 text-blue-400/60" />
              </div>
              <p className="text-[10px] text-emerald-400 mt-2">+{kpi.change} {kpi.changeLabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="comparison" className="space-y-3">
        <TabsList className="bg-slate-800/50 border-slate-700/50">
          <TabsTrigger value="comparison" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">IG vs FB</TabsTrigger>
          <TabsTrigger value="funnel" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">Funil</TabsTrigger>
          <TabsTrigger value="types" className="text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">Tipos</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-slate-300">Engajamento por Plataforma (7 dias)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={platformComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="interactions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-slate-300">Distribuição por Funil</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byFunnelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {byFunnelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-slate-300">Interações por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
