import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Zap } from "lucide-react";

interface CronRow {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  hours_since_last_run: number | null;
  is_overdue: boolean;
}

interface BreakerRow {
  job_name: string;
  state: "closed" | "open" | "half_open";
  consecutive_failures: number;
  consecutive_successes: number;
  last_failure_at: string | null;
  last_success_at: string | null;
  opened_at: string | null;
  threshold: number;
  cooldown_minutes: number;
  notes: string | null;
}

export default function CronHealth() {
  const [crons, setCrons] = useState<CronRow[]>([]);
  const [breakers, setBreakers] = useState<Record<string, BreakerRow>>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: cr }, { data: br }] = await Promise.all([
      supabase.rpc("get_cron_health", { _window_hours: 26 }),
      supabase.from("cron_circuit_breaker").select("*"),
    ]);
    setCrons((cr as CronRow[]) ?? []);
    const map: Record<string, BreakerRow> = {};
    (br as BreakerRow[] ?? []).forEach((b) => (map[b.job_name] = b));
    setBreakers(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const triggerHealthCheck = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("cron-master-healthcheck");
      if (error) throw error;
      setLastRun(JSON.stringify(data, null, 2));
      await load();
    } catch (e) {
      setLastRun(`Erro: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const resetBreaker = async (jobName: string) => {
    await supabase
      .from("cron_circuit_breaker")
      .update({ state: "closed", consecutive_failures: 0, opened_at: null, notes: null })
      .eq("job_name", jobName);
    await load();
  };

  const total = crons.length;
  const healthy = crons.filter((c) => !c.is_overdue && (c.last_status === "succeeded" || c.last_status === null || c.last_status === "running")).length;
  const overdue = crons.filter((c) => c.is_overdue).length;
  const failed = crons.filter((c) => c.last_status && !["succeeded", "running"].includes(c.last_status)).length;
  const openBreakers = Object.values(breakers).filter((b) => b.state === "open").length;

  return (
    <div className="min-h-dvh bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="text-primary" />
              Cron Health Center
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Auto-Healing + Circuit Breaker · atualiza a cada 30s
            </p>
          </div>
          <button
            onClick={triggerHealthCheck}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw className={running ? "animate-spin" : ""} size={18} />
            {running ? "Executando..." : "Forçar Health-Check"}
          </button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Activity />} label="Total" value={total} color="text-foreground" />
          <StatCard icon={<CheckCircle2 />} label="Saudáveis" value={healthy} color="text-green-500" />
          <StatCard icon={<AlertTriangle />} label="Atrasados" value={overdue} color="text-yellow-500" />
          <StatCard icon={<Zap />} label="Falhados" value={failed} color="text-red-500" />
          <StatCard icon={<ShieldAlert />} label="Breakers Abertos" value={openBreakers} color="text-orange-500" />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left p-3">Job</th>
                <th className="text-left p-3">Schedule</th>
                <th className="text-left p-3">Última execução</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Breaker</th>
                <th className="text-left p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!loading && crons.map((c) => {
                const b = breakers[c.jobname];
                return (
                  <tr key={c.jobname} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{c.jobname}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{c.schedule}</td>
                    <td className="p-3 text-xs">
                      {c.last_run_at ? new Date(c.last_run_at).toLocaleString("pt-BR") : "—"}
                      {c.hours_since_last_run !== null && (
                        <div className="text-muted-foreground">{c.hours_since_last_run}h atrás</div>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.last_status} overdue={c.is_overdue} />
                    </td>
                    <td className="p-3">
                      {b ? <BreakerBadge b={b} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      {b && b.state !== "closed" && (
                        <button
                          onClick={() => resetBreaker(c.jobname)}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20"
                        >
                          Reset breaker
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lastRun && (
          <details className="mt-6 bg-card border border-border rounded-lg p-4">
            <summary className="cursor-pointer font-semibold">Última execução manual</summary>
            <pre className="mt-3 text-xs overflow-auto max-h-96 bg-muted p-3 rounded">{lastRun}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className={`flex items-center gap-2 ${color}`}>{icon}<span className="text-xs">{label}</span></div>
      <div className={`text-3xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status, overdue }: { status: string | null; overdue: boolean }) {
  if (overdue) return <span className="px-2 py-1 text-xs rounded bg-yellow-500/10 text-yellow-500">atrasado</span>;
  if (!status) return <span className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground">nunca</span>;
  if (status === "succeeded") return <span className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-500">ok</span>;
  if (status === "running") return <span className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-500">executando</span>;
  return <span className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-500">{status}</span>;
}

function BreakerBadge({ b }: { b: BreakerRow }) {
  const colors = {
    closed: "bg-green-500/10 text-green-500",
    half_open: "bg-yellow-500/10 text-yellow-500",
    open: "bg-red-500/10 text-red-500",
  };
  return (
    <div className="flex flex-col gap-1">
      <span className={`px-2 py-1 text-xs rounded inline-block w-fit ${colors[b.state]}`}>{b.state}</span>
      {b.consecutive_failures > 0 && (
        <span className="text-xs text-muted-foreground">{b.consecutive_failures}/{b.threshold} falhas</span>
      )}
    </div>
  );
}
