import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GuardianEvent {
  id: string;
  kind: string;
  severity: "info" | "warning" | "critical";
  appointment_id: string | null;
  message: string;
  auto_fixed: boolean;
  created_at: string;
  resolved_at: string | null;
}

const SEVERITY_STYLE: Record<GuardianEvent["severity"], string> = {
  critical: "bg-red-600 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-sky-600 text-white",
};

/**
 * Auditoria contínua das consultas: alertas do guardião (cron a cada 5 min). Só administradores leem e resolvem.
 */
export function ConsultationGuardianPanel() {
  const [events, setEvents] = useState<GuardianEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova ainda fora dos tipos gerados
    let q = (supabase as any)
      .from("consultation_guardian_events")
      .select("id, kind, severity, appointment_id, message, auto_fixed, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!showResolved) q = q.is("resolved_at", null);
    const { data, error } = await q;
    if (error) toast.error("Não foi possível carregar o guardião das consultas.");
    setEvents((data as GuardianEvent[]) ?? []);
    setLoading(false);
  }, [showResolved]);

  useEffect(() => {
    void load();
  }, [load]);

  const runNow = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("consultation-guardian", { body: {} });
    setRunning(false);
    if (error) {
      toast.error("O guardião não respondeu. Confira se a função foi implantada.");
      return;
    }
    toast.success(`Verificação concluída: ${data?.new_alerts ?? 0} alerta(s) novo(s).`);
    void load();
  };

  const resolve = async (id: string) => {
    const { data: auth } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova ainda fora dos tipos gerados
    const { error } = await (supabase as any)
      .from("consultation_guardian_events")
      .update({ resolved_at: new Date().toISOString(), resolved_by: auth.user?.id ?? null })
      .eq("id", id);
    if (error) toast.error("Não foi possível marcar como resolvido.");
    else void load();
  };

  return (
    <Card className="border-emerald-500/30">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Guardião das consultas (auditoria 24h)
          </CardTitle>
          <CardDescription>
            Verifica a cada 5 minutos o servidor de vídeo, consultas presas, pacientes pagos sem atendimento e repasses
            não liberados. Correções automáticas aparecem com o selo "corrigido".
          </CardDescription>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setShowResolved((v) => !v)}>
            {showResolved ? "Só abertos" : "Ver resolvidos"}
          </Button>
          <Button size="sm" onClick={() => void runNow()} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">Verificar agora</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && (
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </p>
        )}
        {!loading && events.length === 0 && (
          <p className="text-sm text-emerald-700 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Nenhum problema aberto nas consultas.
          </p>
        )}
        {events.map((e) => (
          <div key={e.id} className="rounded-lg border border-border p-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={SEVERITY_STYLE[e.severity] ?? ""}>{e.severity}</Badge>
                {e.auto_fixed && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                    <Wrench className="h-3 w-3 mr-1" /> corrigido
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                {e.appointment_id && (
                  <span className="text-xs font-mono text-muted-foreground">consulta {e.appointment_id.slice(0, 8)}</span>
                )}
              </div>
              <p className="text-sm text-foreground">{e.message}</p>
            </div>
            {!e.resolved_at && (
              <Button size="sm" variant="outline" onClick={() => void resolve(e.id)}>
                Resolvido
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
