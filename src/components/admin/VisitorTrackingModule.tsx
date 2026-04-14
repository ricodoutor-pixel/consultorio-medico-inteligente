import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Globe, MousePointerClick, LogOut, Eye } from "lucide-react";

export function VisitorTrackingModule() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["visitor-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("visitor-tracking", {
        body: { request_action: "analytics", period: "day" },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["visitor-recent-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_interactions")
        .select("*")
        .eq("platform", "website")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    refetchInterval: 15000,
  });

  const summary = analytics?.summary || {};
  const breakdown = analytics?.breakdown || {};

  const getActionIcon = (action: string) => {
    switch (action) {
      case "exit_intent": return <LogOut className="w-3 h-3 text-red-400" />;
      case "page_view": return <Eye className="w-3 h-3 text-blue-400" />;
      case "cta_click": case "schedule_click": case "whatsapp_click": return <MousePointerClick className="w-3 h-3 text-emerald-400" />;
      default: return <Globe className="w-3 h-3 text-slate-400" />;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 25) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">{score}</Badge>;
    if (score >= 10) return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">{score}</Badge>;
    return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-[10px]">{score}</Badge>;
  };

  const exitIntents = breakdown.by_action?.exit_intent || 0;

  return (
    <div className="space-y-4">
      {/* Exit Intent Alert */}
      {exitIntents > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <p className="text-xs font-medium text-red-300">{exitIntents} Exit Intent(s) detectados hoje</p>
            <p className="text-[10px] text-red-200/60">Visitantes com intenção de saída — automação de recuperação ativada via ManyChat</p>
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <p className="text-[10px] text-slate-500 uppercase">Total Eventos</p>
            <p className="text-xl font-bold text-slate-100">{summary.total_events || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <p className="text-[10px] text-slate-500 uppercase">Visitantes Únicos</p>
            <p className="text-xl font-bold text-slate-100">{summary.unique_visitors || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <p className="text-[10px] text-slate-500 uppercase">Lead Score</p>
            <p className="text-xl font-bold text-slate-100">{summary.total_lead_score || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <p className="text-[10px] text-slate-500 uppercase">Conversões</p>
            <p className="text-xl font-bold text-emerald-400">{summary.conversion_events || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* UTM Source Breakdown */}
      {Object.keys(breakdown.by_source || {}).length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs text-slate-400">Fontes de Tráfego (UTM)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex flex-wrap gap-2">
              {Object.entries(breakdown.by_source || {}).map(([source, count]) => (
                <div key={source} className="bg-slate-700/30 rounded-md px-2 py-1 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{source}</span>
                  <Badge variant="outline" className="text-[10px] h-4 border-slate-600">{String(count)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-slate-400">Eventos Recentes (Tempo Real)</CardTitle>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-[10px] text-slate-500 h-7">Ação</TableHead>
                  <TableHead className="text-[10px] text-slate-500 h-7">Página</TableHead>
                  <TableHead className="text-[10px] text-slate-500 h-7">Fonte</TableHead>
                  <TableHead className="text-[10px] text-slate-500 h-7">Score</TableHead>
                  <TableHead className="text-[10px] text-slate-500 h-7">Funil</TableHead>
                  <TableHead className="text-[10px] text-slate-500 h-7">Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentEvents || []).map((event: any) => (
                  <TableRow key={event.id} className="border-slate-700/30 hover:bg-slate-700/20">
                    <TableCell className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        {getActionIcon(event.interaction_type)}
                        <span className="text-[11px] text-slate-300">{event.interaction_type?.replace(/_/g, " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-400 py-1.5 max-w-[120px] truncate">{event.post_url || "-"}</TableCell>
                    <TableCell className="text-[11px] text-slate-400 py-1.5">{event.campaign_source || "direct"}</TableCell>
                    <TableCell className="py-1.5">{getScoreBadge(event.lead_score || 0)}</TableCell>
                    <TableCell className="py-1.5">
                      <Badge variant="outline" className="text-[10px] h-4 border-slate-600 capitalize">{event.funnel_stage || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500 py-1.5">
                      {event.created_at ? new Date(event.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentEvents || recentEvents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 text-xs py-6">Nenhum evento registrado ainda</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
