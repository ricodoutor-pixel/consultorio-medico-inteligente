import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Zap } from "lucide-react";

interface Run {
  id: string; ran_at: string; overall_status: "green" | "yellow" | "red";
  issues: any[]; corrections: any[]; escalations: any[];
  is_simulation: boolean; triggered_by: string; duration_ms: number;
}

interface CronJob {
  jobname: string; schedule: string; active: boolean;
  last_run_at: string | null; last_status: string | null;
  hours_since_last_run: number | null;
  expected_window_hours: number; is_overdue: boolean;
}

const statusBg: Record<string, string> = {
  red: "bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_30px_-5px] shadow-red-500/40",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40 shadow-[0_0_30px_-5px] shadow-yellow-500/40",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_30px_-5px] shadow-emerald-500/40",
};

const statusLabel: Record<string, string> = {
  green: "OPERACIONAL",
  yellow: "ATENÇÃO",
  red: "CRÍTICO",
};

// Rough next-run estimator from cron expression (5 fields) — best effort
function nextCron(schedule: string): Date | null {
  try {
    const parts = schedule.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const [min, hour] = parts;
    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0, 0);

    // every-N-minutes pattern: */N
    const everyN = /^\*\/(\d+)$/.exec(min);
    if (everyN && hour === "*") {
      const n = Number(everyN[1]);
      const add = n - (now.getMinutes() % n);
      next.setMinutes(now.getMinutes() + add);
      return next;
    }
    // daily HH:MM
    if (/^\d+$/.test(min) && /^\d+$/.test(hour)) {
      next.setHours(Number(hour), Number(min), 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next;
    }
    return null;
  } catch { return null; }
}

const formatRelative = (d: Date) => {
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  if (m < 60) return diff < 0 ? `há ${m}m` : `em ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return diff < 0 ? `há ${h}h` : `em ${h}h`;
  const days = Math.round(h / 24);
  return diff < 0 ? `há ${days}d` : `em ${days}d`;
};

export default function SentinelLiveDashboard() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const load = async () => {
    setRefreshing(true);
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase.from("manus_sentinel_runs").select("*").order("ran_at", { ascending: false }).limit(10),
      supabase.rpc("get_cron_health"),
    ]);
    setRuns((r as any) || []);
    setCrons((c as any) || []);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => { clearInterval(i); clearInterval(t); };
  }, []);

  const lastRun = runs.find((r) => !r.is_simulation) || runs[0];
  const currentStatus = lastRun?.overall_status || "green";

  const allIssues = useMemo(() => {
    const map = new Map<string, { code: string; detail: string; count: number; last: string }>();
    runs.forEach((r) => (r.issues || []).forEach((i: any) => {
      const cur = map.get(i.code);
      if (cur) { cur.count++; if (r.ran_at > cur.last) cur.last = r.ran_at; }
      else map.set(i.code, { code: i.code, detail: i.detail || "", count: 1, last: r.ran_at });
    }));
    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last));
  }, [runs]);

  const upcomingCrons = useMemo(() => {
    return crons
      .filter((c) => c.active)
      .map((c) => ({ ...c, next: nextCron(c.schedule) }))
      .sort((a, b) => {
        if (!a.next) return 1;
        if (!b.next) return -1;
        return a.next.getTime() - b.next.getTime();
      })
      .slice(0, 8);
  }, [crons, tick]);

  return (
    <div className="space-y-4">
      {/* STATUS HERO */}
      <Card className={`border-2 transition-all ${statusBg[currentStatus]}`}>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${statusBg[currentStatus]}`}>
              <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${currentStatus === "green" ? "bg-emerald-500" : currentStatus === "yellow" ? "bg-yellow-500" : "bg-red-500"}`} />
              {currentStatus === "green" ? <CheckCircle2 className="w-8 h-8 relative" />
                : currentStatus === "yellow" ? <AlertTriangle className="w-8 h-8 relative" />
                : <Zap className="w-8 h-8 relative" />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider opacity-70">Status do Sentinela</div>
              <div className="text-3xl font-bold">{statusLabel[currentStatus]}</div>
              <div className="text-xs opacity-70 mt-1">
                Última verificação: {lastRun ? formatRelative(new Date(lastRun.ran_at)) : "—"}
                {lastRun && ` · ${lastRun.duration_ms}ms · ${(lastRun.issues || []).length} issues`}
              </div>
            </div>
          </div>
          <button onClick={load} disabled={refreshing}
            className="px-3 py-2 rounded-md border border-current/30 text-xs flex items-center gap-2 hover:bg-current/10 disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RECENT ISSUES */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" /> Issues recentes (10 últimas execuções)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allIssues.length === 0 && (
              <div className="text-sm text-muted-foreground flex items-center gap-2 py-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Nenhuma issue detectada. Tudo limpo.
              </div>
            )}
            {allIssues.map((i) => (
              <div key={i.code} className="flex items-start justify-between gap-2 p-2 rounded border border-border/50 hover:bg-muted/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{i.code}</Badge>
                    <span className="text-[10px] text-muted-foreground">×{i.count}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">{i.detail}</div>
                </div>
                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatRelative(new Date(i.last))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* UPCOMING CRONS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4" /> Próximos cron jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingCrons.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">Nenhum cron job ativo.</div>
            )}
            {upcomingCrons.map((c) => (
              <div key={c.jobname} className="flex items-center justify-between gap-2 p-2 rounded border border-border/50 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-3 h-3 ${c.is_overdue ? "text-red-400" : "text-emerald-400"}`} />
                    <span className="text-xs font-medium truncate">{c.jobname}</span>
                    {c.is_overdue && <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/30">atrasado</Badge>}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.schedule}</div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="text-[11px] font-medium">
                    {c.next ? formatRelative(c.next) : "—"}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {c.last_run_at ? `últ. ${formatRelative(new Date(c.last_run_at))}` : "nunca executado"}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
