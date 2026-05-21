import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Webhook, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type LogRow = {
  id: string;
  channel: string;
  direction: string;
  content: string | null;
  intent: string | null;
  created_at: string;
  external_id: string | null;
};

const META_CHANNELS = ["ig_comment", "fb_comment", "instagram_dm", "messenger"];

export default function BrisaMetaDebugPanel() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [idemCount, setIdemCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [msgsRes, idemRes] = await Promise.all([
        supabase
          .from("brisa_unified_conversations" as any)
          .select("id,channel,direction,content,intent,created_at,external_id")
          .in("channel", META_CHANNELS)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("webhook_idempotency" as any)
          .select("id", { count: "exact", head: true })
          .eq("provider", "meta_comment"),
      ]);
      setRows((msgsRes.data as any) ?? []);
      setIdemCount(idemRes.count ?? 0);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const inbound = rows.filter((r) => r.direction === "inbound");
  const outbound = rows.filter((r) => r.direction === "outbound");
  const authErrors = rows.filter(
    (r) => r.intent?.includes("error") || r.content?.toLowerCase().includes("unauthorized"),
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Debug Meta Graph API · Payloads ao vivo</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Atualizado {lastRefresh.toLocaleTimeString("pt-BR")}</span>
          <button
            onClick={load}
            className="flex items-center gap-1 px-2 py-1 rounded border border-border hover:bg-muted"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Inbound (24h)" value={inbound.length} ok={inbound.length > 0} />
        <Stat label="Outbound replies" value={outbound.length} ok />
        <Stat label="Comments dedup" value={idemCount} ok={idemCount >= 0} neutral />
        <Stat label="Erros auth" value={authErrors.length} ok={authErrors.length === 0} invert />
      </div>

      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
        Últimos 25 eventos
      </div>
      <div className="space-y-1 max-h-80 overflow-y-auto pr-2 font-mono text-xs">
        {rows.length === 0 && (
          <div className="text-muted-foreground p-4 text-center border border-dashed border-border rounded">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Nenhum payload Meta recebido ainda. Assim que você salvar a Callback URL e fizer um
            comentário/DM de teste, ele aparece aqui em até 20s.
          </div>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-muted/40 border-l-2"
            style={{
              borderLeftColor:
                r.direction === "inbound"
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground))",
            }}
          >
            <span className="text-muted-foreground shrink-0 w-16">
              {new Date(r.created_at).toLocaleTimeString("pt-BR")}
            </span>
            <span
              className={`shrink-0 w-20 ${
                r.direction === "inbound" ? "text-emerald-400" : "text-sky-400"
              }`}
            >
              {r.direction}
            </span>
            <span className="shrink-0 w-24 text-pink-300">{r.channel}</span>
            <span className="shrink-0 w-32 text-amber-300 truncate">{r.intent ?? "—"}</span>
            <span className="text-foreground/80 truncate">{r.content ?? "(sem conteúdo)"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  ok,
  invert,
  neutral,
}: {
  label: string;
  value: number;
  ok: boolean;
  invert?: boolean;
  neutral?: boolean;
}) {
  const good = neutral ? true : invert ? !ok : ok;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {!neutral &&
          (good ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          ))}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
