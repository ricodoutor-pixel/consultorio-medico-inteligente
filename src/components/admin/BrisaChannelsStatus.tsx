import { useEffect, useState } from "react";
import { Activity, Phone, Instagram, Facebook, CheckCircle2, XCircle, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = { ok: boolean; status: number; latency_ms: number; detail?: string };
type Snapshot = {
  ok: boolean;
  checked_at: string;
  channels: { whatsapp: Status; facebook: Status; instagram: Status };
  breaker: Record<string, { failures: number; open: boolean; cooldown_remaining_ms: number }>;
};

const CHANNEL_META = {
  whatsapp: { label: "WhatsApp (Evolution)", Icon: Phone, color: "text-green-400" },
  instagram: { label: "Instagram Graph API", Icon: Instagram, color: "text-pink-400" },
  facebook: { label: "Facebook Graph API", Icon: Facebook, color: "text-blue-400" },
} as const;

export default function BrisaChannelsStatus() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("brisa-channels-status");
      if (error) throw error;
      setSnap(data as Snapshot);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao consultar status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Status dos Canais</h3>
          {snap && (
            <span className="text-xs text-muted-foreground">
              · checado {new Date(snap.checked_at).toLocaleTimeString("pt-BR")}
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded bg-muted hover:bg-muted/70 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {error && <div className="text-sm text-destructive mb-2">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["whatsapp", "instagram", "facebook"] as const).map((k) => {
          const st = snap?.channels[k];
          const m = CHANNEL_META[k];
          const ok = st?.ok ?? false;
          return (
            <div
              key={k}
              className={`rounded-md border p-3 ${
                ok
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-red-500/40 bg-red-500/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <m.Icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-sm font-medium">{m.label}</span>
                </div>
                {ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                <div>HTTP: <span className="text-foreground">{st?.status ?? "—"}</span></div>
                <div>Latência: <span className="text-foreground">{st?.latency_ms ?? 0}ms</span></div>
                {!ok && st?.detail && (
                  <div className="text-red-300 truncate" title={st.detail}>⚠ {st.detail}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Circuit breaker da IA */}
      {snap?.breaker && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">Circuit Breaker IA</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(snap.breaker).map(([prov, b]) => (
              <div
                key={prov}
                className={`rounded border p-2 ${
                  b.open ? "border-red-500/40 bg-red-500/10" : "border-border bg-muted/30"
                }`}
              >
                <div className="font-medium capitalize">{prov}</div>
                <div className="text-muted-foreground">
                  Falhas: <span className="text-foreground">{b.failures}</span> ·{" "}
                  {b.open ? (
                    <span className="text-red-300">
                      ABERTO ({Math.ceil(b.cooldown_remaining_ms / 1000)}s)
                    </span>
                  ) : (
                    <span className="text-emerald-300">OK</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
