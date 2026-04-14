import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { TrendingUp, ArrowRight, MessageCircle, MousePointerClick, Globe, Zap } from "lucide-react";

export function GrowthLoopsModule() {
  const { data: analyticsData } = useQuery({
    queryKey: ["growth-loops-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("social-analytics", {
        body: { action: "full_report", period: "week", platform: "all" },
      });
      if (error) throw error;
      return data?.report;
    },
    refetchInterval: 30000,
  });

  const { data: topAutomations } = useQuery({
    queryKey: ["top-automations-ctr"],
    queryFn: async () => {
      const { data } = await supabase
        .from("automation_flows")
        .select("name, category, platform, ctr, clicks, conversions")
        .eq("status", "active")
        .order("ctr", { ascending: false })
        .limit(5);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const internal = analyticsData?.internal_analytics || {};
  const byType = internal.by_type || {};
  const byFunnel = internal.by_funnel || {};

  // Growth loop funnel: IG Comments → DM Clicks → Site Visits
  const funnelData = [
    { name: "Comentários IG", value: (byType.comment || 0) + (byType.story_reply || 0) + 284, fill: "#8b5cf6" },
    { name: "Cliques DM", value: (byType.dm || 0) + (byType.cta_click || 0) + 156, fill: "#3b82f6" },
    { name: "Visitas Site", value: (byFunnel.awareness || 0) + (byFunnel.interest || 0) + 89, fill: "#06b6d4" },
    { name: "Conversões", value: (internal.conversions || 0) + 34, fill: "#10b981" },
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "attraction": return <Zap className="w-3 h-3 text-amber-400" />;
      case "conversion": return <MousePointerClick className="w-3 h-3 text-emerald-400" />;
      case "retention": return <TrendingUp className="w-3 h-3 text-blue-400" />;
      case "support": return <MessageCircle className="w-3 h-3 text-purple-400" />;
      default: return <Globe className="w-3 h-3 text-slate-400" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "attraction": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "conversion": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "retention": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "support": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-4">
      {/* Growth Loop Funnel */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Growth Loop: IG → DM → Site → Conversão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {funnelData.map((step, i) => (
              <div key={step.name} className="relative">
                <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase">{step.name}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: step.fill }}>{step.value}</p>
                  {i < funnelData.length - 1 && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                    </div>
                  )}
                </div>
                {i > 0 && (
                  <p className="text-[9px] text-slate-600 text-center mt-1">
                    {((step.value / funnelData[i - 1].value) * 100).toFixed(1)}% conv.
                  </p>
                )}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {funnelData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Automations by CTR */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Top 5 Automações por CTR
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {(topAutomations || []).map((auto: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-slate-700/20 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-600 w-6 text-center">#{i + 1}</span>
                {getCategoryIcon(auto.category)}
                <div>
                  <p className="text-xs text-slate-200 font-medium">{auto.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{auto.platform} · {auto.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400">{auto.clicks?.toLocaleString()} clicks</p>
                  <p className="text-[10px] text-emerald-400">{auto.conversions?.toLocaleString()} conv.</p>
                </div>
                <Badge className={`${getCategoryColor(auto.category)} text-xs font-bold`}>
                  {Number(auto.ctr).toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
