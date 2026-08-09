import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar,
} from "recharts";
import { toast } from "sonner";
import { Loader2, Play, Sparkles, TrendingUp, Eye, MousePointerClick, Bot } from "lucide-react";

interface Run {
  id: string; started_at: string; finished_at: string | null; status: string;
  pages_analyzed: number; pages_optimized: number; posts_generated: number;
  errors_count: number; summary_md: string | null; triggered_by: string;
}
interface Log {
  id: string; phase: string; url: string | null; action: string;
  status: string; created_at: string; error_message: string | null;
  after_state: any; kpi_delta: any;
}
interface Kpi { snapshot_date: string; url: string; clicks: number; impressions: number; ctr: number; position: number; }
interface SocialPost { id: string; platform: string; topic: string | null; status: string; created_at: string; }

interface KpiTarget {
  baseline_visitors: number; daily_new_visitors_target: number;
  signup_conversion_target: number; orientacao_conversion_target: number; lead_nurture_target: number;
}
interface DailySnap {
  snapshot_date: string; visitors_total: number; visitors_new: number;
  signups: number; orientacao_starts: number; leads: number;
  target_new_visitors: number; delta_vs_target: number; on_track: boolean;
}

export default function GrowthDashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<KpiTarget | null>(null);
  const [snaps, setSnaps] = useState<DailySnap[]>([]);

  const load = async () => {
    const [r, l, k, p, t, s] = await Promise.all([
      supabase.from("manus_growth_runs").select("*").order("started_at", { ascending: false }).limit(14),
      supabase.from("manus_growth_logs").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("manus_growth_kpis").select("*").order("snapshot_date", { ascending: false }).limit(500),
      supabase.from("manus_social_queue").select("id,platform,topic,status,created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("marketing_kpi_targets").select("*").eq("scope", "global").maybeSingle(),
      supabase.from("marketing_daily_snapshot").select("*").order("snapshot_date", { ascending: false }).limit(30),
    ]);
    setRuns((r.data as Run[]) || []);
    setLogs((l.data as Log[]) || []);
    setKpis((k.data as Kpi[]) || []);
    setPosts((p.data as SocialPost[]) || []);
    setTarget((t.data as KpiTarget) || null);
    setSnaps((s.data as DailySnap[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("manus-growth-agent", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      toast.success(`Run concluído: ${data?.analyzed ?? 0} análises, ${data?.optimized ?? 0} otimizações`);
      await load();
    } catch (e: any) {
      toast.error(`Erro: ${e.message || e}`);
    } finally { setRunning(false); }
  };

  // Agregação para gráfico de série temporal (clicks/impressions por dia)
  const seriesByDate = Object.values(
    kpis.reduce((acc: Record<string, any>, k) => {
      acc[k.snapshot_date] ??= { date: k.snapshot_date, clicks: 0, impressions: 0, avgPosition: 0, count: 0 };
      acc[k.snapshot_date].clicks += k.clicks;
      acc[k.snapshot_date].impressions += k.impressions;
      acc[k.snapshot_date].avgPosition += Number(k.position);
      acc[k.snapshot_date].count += 1;
      return acc;
    }, {}),
  ).map((d: any) => ({ ...d, avgPosition: +(d.avgPosition / d.count).toFixed(2) })).sort((a, b) => a.date.localeCompare(b.date));

  // Top 5 páginas por impressões
  const topPages = Object.values(
    kpis.reduce((acc: Record<string, any>, k) => {
      acc[k.url] ??= { url: k.url, impressions: 0, clicks: 0 };
      acc[k.url].impressions += k.impressions;
      acc[k.url].clicks += k.clicks;
      return acc;
    }, {}),
  ).sort((a: any, b: any) => b.impressions - a.impressions).slice(0, 5);

  const lastRun = runs[0];
  const totalOptimized = runs.reduce((s, r) => s + (r.pages_optimized || 0), 0);
  const totalPosts = runs.reduce((s, r) => s + (r.posts_generated || 0), 0);

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8">
      <Helmet><title>Manus Growth CEO — Painel</title></Helmet>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="text-primary" /> Manus Growth CEO
            </h1>
            <p className="text-muted-foreground">Agente autônomo de tráfego orgânico — 24/7</p>
          </div>
          <Button onClick={runNow} disabled={running} size="lg">
            {running ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2" />}
            Executar agora
          </Button>
        </div>

        {/* Meta diária de Visitantes Published */}
        {target && (() => {
          const today = snaps[0];
          const pct = today ? Math.min(100, Math.round((today.visitors_new / target.daily_new_visitors_target) * 100)) : 0;
          const onTrack = today?.on_track ?? false;
          const signupRate = today && today.visitors_total > 0 ? (today.signups / today.visitors_total) * 100 : 0;
          const otRate = today && today.visitors_total > 0 ? (today.orientacao_starts / today.visitors_total) * 100 : 0;
          return (
            <Card className="border-2" style={{ borderColor: onTrack ? "hsl(var(--primary))" : "hsl(0 84% 60%)" }}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span>📈 Meta diária Published — base para todo marketing orgânico</span>
                  <Badge variant={onTrack ? "default" : "destructive"}>{onTrack ? "🟢 no caminho" : "🔴 abaixo da meta"}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Visitantes hoje · Baseline {target.baseline_visitors}</div>
                    <div className="text-4xl font-bold">{today?.visitors_new ?? 0}<span className="text-lg text-muted-foreground"> / {target.daily_new_visitors_target}/dia</span></div>
                  </div>
                  <div className="text-right text-xs space-y-0.5">
                    <div>Cadastros: <strong>{signupRate.toFixed(1)}%</strong> <span className="text-muted-foreground">(meta {(target.signup_conversion_target * 100).toFixed(0)}%)</span></div>
                    <div>Orientação técnica: <strong>{otRate.toFixed(1)}%</strong> <span className="text-muted-foreground">(meta {(target.orientacao_conversion_target * 100).toFixed(0)}%)</span></div>
                    <div>Leads p/ nutrição: <strong>{today?.leads ?? 0}</strong> <span className="text-muted-foreground">(meta {(target.lead_nurture_target * 100).toFixed(0)}%)</span></div>
                  </div>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${pct}%`, background: onTrack ? "hsl(var(--primary))" : "hsl(25 95% 53%)" }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Δ vs meta: <strong className={onTrack ? "text-primary" : "text-destructive"}>{(today?.delta_vs_target ?? 0) >= 0 ? "+" : ""}{today?.delta_vs_target ?? 0}</strong> · Total sessões dia: {today?.visitors_total ?? 0} · O agente amplifica SEO + posts virais até bater +{target.daily_new_visitors_target}/dia.
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1"><Sparkles size={14}/> Última execução</div>
            <div className="text-2xl font-bold">{lastRun ? new Date(lastRun.started_at).toLocaleString("pt-BR") : "—"}</div>
            <Badge variant={lastRun?.status === "success" ? "default" : lastRun?.status === "running" ? "secondary" : "destructive"} className="mt-1">{lastRun?.status ?? "—"}</Badge>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp size={14}/> Otimizações (14d)</div>
            <div className="text-3xl font-bold text-primary">{totalOptimized}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1"><MousePointerClick size={14}/> Posts gerados</div>
            <div className="text-3xl font-bold">{totalPosts}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1"><Eye size={14}/> URLs monitoradas</div>
            <div className="text-3xl font-bold">{new Set(kpis.map(k => k.url)).size}</div>
          </CardContent></Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Tráfego Orgânico (cliques × impressões)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <LineChart data={seriesByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} name="Cliques" />
                  <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Impressões" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top 5 páginas (impressões)</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer>
                <BarChart data={topPages} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="url" stroke="hsl(var(--muted-foreground))" fontSize={10} width={180}
                    tickFormatter={(v) => { try { return new URL(v).pathname.slice(0, 25); } catch { return v.slice(0, 25); } }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <Card>
          <CardHeader><CardTitle>Log de ações do agente (últimas 50)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr><th className="py-2">Hora</th><th>Fase</th><th>Ação</th><th>URL</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-border/50">
                      <td className="py-2 text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                      <td><Badge variant="outline">{l.phase}</Badge></td>
                      <td className="text-xs">{l.action}</td>
                      <td className="text-xs truncate max-w-[200px]">{l.url ?? "—"}</td>
                      <td><Badge variant={l.status === "ok" ? "default" : l.status === "blocked" ? "secondary" : "destructive"}>{l.status}</Badge></td>
                    </tr>
                  ))}
                  {!logs.length && !loading && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Sem logs ainda. Clique em "Executar agora".</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Social Queue */}
        <Card>
          <CardHeader><CardTitle>Fila de Posts Sociais</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {posts.map((p) => (
                <div key={p.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <Badge>{p.platform}</Badge>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{p.topic}</div>
                </div>
              ))}
              {!posts.length && <div className="text-muted-foreground col-span-full py-4">Nenhum post na fila.</div>}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          ⏰ Execução automática diária às 06h BRT · 🔒 Guardrails: CRM-PR 49354 + RDC 660 obrigatórios · 📦 Código versionado no GitHub
        </p>
      </div>
    </div>
  );
}
