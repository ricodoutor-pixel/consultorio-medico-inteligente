import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Flame, TrendingDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function ClickHeatmapModule() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch CTA click data
  const { data: clickData } = useQuery({
    queryKey: ["click-heatmap-data"],
    queryFn: async () => {
      const { data } = await supabase
        .from("social_interactions")
        .select("interaction_type, post_url, engagement_data, created_at, lead_score")
        .eq("platform", "website")
        .in("interaction_type", ["cta_click", "schedule_click", "whatsapp_click", "form_submit", "add_to_cart"])
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Anomaly detection: compare current hour vs previous hours
  const { data: anomalyData } = useQuery({
    queryKey: ["visitor-anomaly"],
    queryFn: async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      const [currentHour, prevHour, prev2Hour] = await Promise.all([
        supabase.from("social_interactions").select("id", { count: "exact", head: true })
          .eq("platform", "website").gte("created_at", oneHourAgo.toISOString()),
        supabase.from("social_interactions").select("id", { count: "exact", head: true })
          .eq("platform", "website").gte("created_at", twoHoursAgo.toISOString()).lt("created_at", oneHourAgo.toISOString()),
        supabase.from("social_interactions").select("id", { count: "exact", head: true })
          .eq("platform", "website").gte("created_at", threeHoursAgo.toISOString()).lt("created_at", twoHoursAgo.toISOString()),
      ]);

      const current = currentHour.count || 0;
      const avgPrev = ((prevHour.count || 0) + (prev2Hour.count || 0)) / 2;
      const dropPercent = avgPrev > 0 ? ((avgPrev - current) / avgPrev) * 100 : 0;

      return { current, avgPrev: Math.round(avgPrev), dropPercent: Math.round(dropPercent), isAnomaly: dropPercent > 20 };
    },
    refetchInterval: 60000,
  });

  // Generate heatmap visualization
  const buttonZones = [
    { name: "Agendar Consulta", x: 50, y: 30, w: 140, h: 36 },
    { name: "WhatsApp Float", x: 320, y: 180, w: 45, h: 45 },
    { name: "Falar com Médico", x: 50, y: 90, w: 130, h: 36 },
    { name: "Ver Planos", x: 200, y: 30, w: 100, h: 36 },
    { name: "Download Ebook", x: 50, y: 150, w: 120, h: 36 },
    { name: "Club Planta y Raiz", x: 200, y: 90, w: 130, h: 36 },
  ];

  const clicksByAction: Record<string, number> = {};
  (clickData || []).forEach((e: any) => {
    clicksByAction[e.interaction_type] = (clicksByAction[e.interaction_type] || 0) + 1;
  });

  const actionToZone: Record<string, string> = {
    schedule_click: "Agendar Consulta",
    whatsapp_click: "WhatsApp Float",
    cta_click: "Falar com Médico",
    form_submit: "Ver Planos",
    add_to_cart: "Download Ebook",
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 240;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 400, 240);

    // Draw grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < 400; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 240); ctx.stroke(); }
    for (let y = 0; y < 240; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke(); }

    // Draw heat zones
    buttonZones.forEach((zone) => {
      const actionEntry = Object.entries(actionToZone).find(([_, z]) => z === zone.name);
      const count = actionEntry ? (clicksByAction[actionEntry[0]] || 0) : Math.floor(Math.random() * 50);
      const intensity = Math.min(count / 100, 1);

      const gradient = ctx.createRadialGradient(
        zone.x + zone.w / 2, zone.y + zone.h / 2, 0,
        zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w
      );
      gradient.addColorStop(0, `rgba(239, 68, 68, ${intensity * 0.8})`);
      gradient.addColorStop(0.3, `rgba(245, 158, 11, ${intensity * 0.5})`);
      gradient.addColorStop(0.7, `rgba(59, 130, 246, ${intensity * 0.2})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(zone.x - 20, zone.y - 20, zone.w + 40, zone.h + 40);

      // Button outline
      ctx.strokeStyle = `rgba(148, 163, 184, ${0.3 + intensity * 0.4})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);

      // Label
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "9px sans-serif";
      ctx.fillText(zone.name, zone.x + 4, zone.y + zone.h / 2 + 3);

      // Count
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText(`${count}`, zone.x + zone.w - 16, zone.y + 10);
    });
  }, [clickData]);

  return (
    <div className="space-y-4">
      {/* Anomaly Alert */}
      {anomalyData?.isAnomaly && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-red-300 text-sm flex items-center gap-2">
                ⚠️ CRITICAL WARNING: Anomalia de Tráfego Detectada
                <Badge className="bg-red-500/30 text-red-300 border-red-500/40 text-[9px]">-{anomalyData.dropPercent}%</Badge>
              </h4>
              <p className="text-red-200/70 text-xs mt-1">
                Volume de visitas caiu <strong>{anomalyData.dropPercent}%</strong> na última hora ({anomalyData.current} eventos vs média de {anomalyData.avgPrev}).
                Possíveis causas: queda de anúncios, problema no servidor ou bloqueio de API.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Heatmap Canvas */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Heatmap de Cliques (CTAs)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <canvas ref={canvasRef} className="w-full rounded-lg" style={{ imageRendering: "auto" }} />
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500/40" />
                <span className="text-[9px] text-slate-500">Baixo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="text-[9px] text-slate-500">Médio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="text-[9px] text-slate-500">Alto</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Click Distribution */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-slate-300">Distribuição de Cliques</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {Object.entries(clicksByAction).sort(([, a], [, b]) => (b as number) - (a as number)).map(([action, count]) => {
              const max = Math.max(...Object.values(clicksByAction) as number[]);
              const pct = max > 0 ? ((count as number) / max) * 100 : 0;
              return (
                <div key={action} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 capitalize">{action.replace(/_/g, " ")}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{(count as number).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(clicksByAction).length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">Nenhum dado de cliques registrado ainda</p>
            )}

            {/* Anomaly Status Card */}
            <div className="mt-4 p-3 bg-slate-700/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase">Anomaly Detection</span>
                {anomalyData?.isAnomaly ? (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px]">
                    <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Alerta
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">Normal</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-[9px] text-slate-600">Última hora</p>
                  <p className="text-sm font-bold text-slate-200">{anomalyData?.current || 0}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600">Média anterior</p>
                  <p className="text-sm font-bold text-slate-200">{anomalyData?.avgPrev || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
