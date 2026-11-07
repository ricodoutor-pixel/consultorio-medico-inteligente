import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";

type Notice = { id: string; service: string | null; status: string; error: string | null; created_at: string; sent_at: string | null; delivered_at: string | null; attempts: number; external_reference: string; provider_message_id: string | null };
type Attempt = { log_id: string; attempt_no: number; status: string; http_status: number | null; created_at: string; error: string | null };

export function PaymentNoticeHistory() {
  const { isAdmin } = useAccount();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [error, setError] = useState(false);
  const load = async () => {
    if (!isAdmin) return;
    await supabase.functions.invoke("payment-notify-history", { body: {} });
    const result = await supabase.from("payment_notify_log").select("id,service,status,error,created_at,sent_at,delivered_at,attempts,external_reference,provider_message_id").order("created_at", { ascending: false }).limit(50);
    setError(!!result.error);
    if (!result.data) return;
    setNotices(result.data);
    if (!result.data.length) return;
    const history = await supabase.from("payment_notify_attempts").select("log_id,attempt_no,status,http_status,created_at,error").in("log_id", result.data.map(n => n.id)).order("created_at", { ascending: false });
    if (history.error) setError(true);
    else setAttempts(history.data || []);
  };
  useEffect(() => { if (!isAdmin) return; void load(); const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [isAdmin]);
  if (!isAdmin) return null;
  return <section className="mb-8 space-y-3" aria-label="Avisos administrativos de WhatsApp">
    <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-foreground">Avisos de WhatsApp</h2><Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw size={14} className="mr-2" />Atualizar</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">Não foi possível carregar todos os avisos. Tente atualizar.</p>}
    {notices.map(n => <article key={n.id} className="border border-border rounded-lg p-4 space-y-2">
      <p className="font-semibold text-foreground">{n.service || "Pagamento confirmado"}</p>
      <p className="text-sm text-muted-foreground">{n.delivered_at ? "Entregue" : n.sent_at ? "Aceito pelo provedor · entrega não confirmada" : n.status === "failed" ? "Falhou" : "Em envio"} · {n.attempts} tentativa(s)</p>
      <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")} · {n.external_reference.endsWith(":inicio") ? "Início" : n.external_reference.endsWith(":fim") ? "Encerramento" : "Pagamento"}</p>
      {n.error && <p className="text-sm text-destructive">{n.error}</p>}
      {n.delivered_at && <p className="text-xs text-muted-foreground">Entregue em {new Date(n.delivered_at).toLocaleString("pt-BR")}</p>}
      <details className="text-xs text-muted-foreground"><summary>Tentativas e identificação</summary><p className="break-all">Pedido: {n.external_reference}</p><p className="break-all">Identificador do provedor: {n.provider_message_id || "Não registrado nesta versão"}</p>{attempts.filter(a => a.log_id === n.id).map(a => <p key={a.attempt_no}>#{a.attempt_no} · {new Date(a.created_at).toLocaleString("pt-BR")} · {a.status === "sent" ? "Aceito" : "Falhou"} · HTTP {a.http_status ?? "—"} {a.error || ""}</p>)}</details>
    </article>)}
    {!notices.length && !error && <p className="text-sm text-muted-foreground">Nenhum aviso registrado.</p>}
  </section>;
}