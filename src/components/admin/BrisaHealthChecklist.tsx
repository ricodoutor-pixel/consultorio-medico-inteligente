import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Shield, Webhook, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Item = { name: string; ok: boolean; hint?: string; url?: string; lastSeen?: string | null };
type Health = {
  overall: "green" | "yellow" | "red";
  secrets: Item[];
  webhooks: Item[];
  bots: Item[];
  checkedAt: string;
};

function relTime(iso: string | null | undefined): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function BrisaHealthChecklist() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("brisa-health-check");
      if (error) throw error;
      setHealth(data as Health);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao consultar health");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const dot = (ok: boolean) =>
    ok ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
    );

  const overallColor =
    health?.overall === "green"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : health?.overall === "yellow"
      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
      : "bg-red-500/20 text-red-300 border-red-500/40";

  return (
    <section className="bg-card border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Virada de Chave Meta — Status ao Vivo</h2>
          {health && (
            <span className={`text-xs px-2 py-0.5 rounded border ${overallColor} uppercase font-medium`}>
              {health.overall}
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs flex items-center gap-1.5 px-2 py-1 rounded border border-border hover:bg-muted/40 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {health ? relTime(health.checkedAt) : "Carregar"}
        </button>
      </div>

      {error && <div className="text-sm text-destructive mb-2">{error}</div>}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Secrets */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Secrets ({health.secrets.filter(s => s.ok).length}/{health.secrets.length})
            </div>
            <ul className="space-y-1.5">
              {health.secrets.map((s) => (
                <li key={s.name} className="flex items-start gap-2 text-sm">
                  {dot(s.ok)}
                  <div className="min-w-0">
                    <div className="font-mono text-xs truncate">{s.name}</div>
                    {!s.ok && s.hint && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.hint}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Webhooks */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
              <Webhook className="w-3.5 h-3.5" /> Webhooks ({health.webhooks.filter(w => w.ok).length}/{health.webhooks.length})
            </div>
            <ul className="space-y-1.5">
              {health.webhooks.map((w) => (
                <li key={w.name} className="flex items-start gap-2 text-sm">
                  {dot(w.ok)}
                  <div className="min-w-0">
                    <div className="font-mono text-xs truncate">{w.name}</div>
                    {w.hint && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{w.hint}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Bots */}
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> Bots — tráfego 24h
            </div>
            <ul className="space-y-1.5">
              {health.bots.map((b) => (
                <li key={b.name} className="flex items-start gap-2 text-sm">
                  {dot(b.ok)}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">{b.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      última msg: {relTime(b.lastSeen)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {health?.overall === "red" && (
        <div className="mt-3 text-xs bg-red-500/10 border border-red-500/30 rounded p-2 text-red-200">
          🔴 Configure os secrets faltantes em <strong>Lovable Cloud → Edge Functions → Manage Secrets</strong> e
          cadastre o webhook no <strong>Meta Developer Console</strong>. Detalhes em <code>INSTRUCTIONS_META_SECRETS.md</code>.
        </div>
      )}
    </section>
  );
}
