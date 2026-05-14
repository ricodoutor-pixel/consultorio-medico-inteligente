import { useEffect, useState } from "react";

type ServiceStatus = {
  name: string;
  status: "operational" | "degraded" | "outage";
  latency_ms?: number;
  messages_last_hour?: number;
  active_jobs?: number;
  overdue?: number;
  open_critical?: number;
  since?: string;
};

type StatusPayload = {
  ok: boolean;
  overall: "operational" | "degraded" | "outage";
  services: ServiceStatus[];
  generated_at: string;
};

const statusLabel = {
  operational: "Operacional",
  degraded: "Degradado",
  outage: "Indisponível",
} as const;

const statusDot = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-red-500",
} as const;

export default function Status() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/status-public`;
        const r = await fetch(url, {
          headers: { "Content-Type": "application/json" },
        });
        const json = await r.json();
        if (active) {
          setData(json);
          setError(null);
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Falha ao carregar status");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const i = setInterval(load, 30_000);
    return () => { active = false; clearInterval(i); };
  }, []);

  return (
    <main className="min-h-[100dvh] bg-background text-foreground px-4 py-10">
      <article className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Status da Plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Saúde em tempo real do ecossistema Planta y Raiz. Atualiza a cada 30s.
          </p>
        </header>

        {loading && (
          <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            Carregando status…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
            {error}
          </div>
        )}

        {data && (
          <>
            <section className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
              <span className={`inline-block h-3 w-3 rounded-full ${statusDot[data.overall]}`} />
              <div>
                <p className="text-lg font-medium">{statusLabel[data.overall]}</p>
                <p className="text-xs text-muted-foreground">
                  Snapshot: {new Date(data.generated_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card divide-y divide-border">
              {data.services.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusDot[s.status]}`} />
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.latency_ms !== undefined && <>Latência: {s.latency_ms}ms · </>}
                        {s.messages_last_hour !== undefined && <>{s.messages_last_hour} mensagens/última hora · </>}
                        {s.active_jobs !== undefined && <>{s.active_jobs} crons ativos · </>}
                        {s.overdue !== undefined && s.overdue > 0 && <>{s.overdue} atrasados · </>}
                        {s.open_critical !== undefined && s.open_critical > 0 && <>{s.open_critical} erros críticos · </>}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {statusLabel[s.status]}
                  </span>
                </div>
              ))}
            </section>

            <p className="text-xs text-muted-foreground">
              Incidentes históricos e SLA são auditados pelo Manus CEO. Para suporte em tempo real:
              wa.me/5511991363154
            </p>
          </>
        )}
      </article>
    </main>
  );
}
