import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, Repeat, AlertTriangle, Eye } from "lucide-react";

type WebhookEvent = {
  id: string;
  gateway: string;
  event_id: string;
  event_type: string | null;
  external_reference: string | null;
  payload: any;
  processed_at: string;
};

export default function AdminMpWebhooks() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WebhookEvent | null>(null);
  const [replaying, setReplaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("webhook_events" as never)
      .select("*")
      .eq("gateway", "mercadopago")
      .order("processed_at", { ascending: false })
      .limit(200);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setEvents(((data as unknown as WebhookEvent[]) || []));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = events.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.event_id.toLowerCase().includes(s) ||
      (e.external_reference || "").toLowerCase().includes(s) ||
      (e.event_type || "").toLowerCase().includes(s) ||
      JSON.stringify(e.payload || {}).toLowerCase().includes(s)
    );
  });

  // Group by external_reference to flag duplicates
  const refCounts: Record<string, number> = {};
  events.forEach(e => {
    if (e.external_reference) refCounts[e.external_reference] = (refCounts[e.external_reference] || 0) + 1;
  });

  const replay = async (ev: WebhookEvent) => {
    if (!confirm(`Reprocessar pagamento ${ev.external_reference}? Vai apagar o registro de idempotência e re-executar a lógica.`)) return;
    setReplaying(ev.id);
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-webhook", {
        body: ev.payload,
        headers: { "x-admin-replay": "1" },
      });
      if (error) throw error;
      toast.success(`Reprocessado: ${JSON.stringify(data).slice(0, 120)}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no replay");
    } finally {
      setReplaying(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground py-8">
      <Helmet><title>Webhooks Mercado Pago | Admin</title></Helmet>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Webhooks — Mercado Pago</h1>
            <p className="text-sm text-muted-foreground">Logs, tentativas e reprocessamento de pagamentos.</p>
          </div>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Recarregar
          </Button>
        </div>

        <Card className="p-4 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por payment_id, event_id, tipo, payload..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span>Total: <b className="text-foreground">{events.length}</b></span>
            <span>Filtrados: <b className="text-foreground">{filtered.length}</b></span>
            <span>Duplicados: <b className="text-amber-500">{Object.values(refCounts).filter(n => n > 1).length}</b></span>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase">
                  <tr>
                    <th className="text-left p-3">Quando</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Payment ID</th>
                    <th className="text-left p-3">Event ID</th>
                    <th className="text-left p-3">Flags</th>
                    <th className="text-right p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ev => {
                    const dup = ev.external_reference ? (refCounts[ev.external_reference] || 0) > 1 : false;
                    return (
                      <tr key={ev.id} className="border-t border-border/50 hover:bg-muted/20">
                        <td className="p-3 text-xs whitespace-nowrap">{new Date(ev.processed_at).toLocaleString("pt-BR")}</td>
                        <td className="p-3"><Badge variant="outline" className="text-xs">{ev.event_type || "—"}</Badge></td>
                        <td className="p-3 font-mono text-xs">{ev.external_reference || "—"}</td>
                        <td className="p-3 font-mono text-xs max-w-[180px] truncate" title={ev.event_id}>{ev.event_id}</td>
                        <td className="p-3">
                          {dup && (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/40 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Duplicado
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setSelected(ev)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => replay(ev)}
                              disabled={replaying === ev.id}
                            >
                              {replaying === ev.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <><Repeat className="w-3.5 h-3.5 mr-1" /> Reprocessar</>}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum evento</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payload do webhook — {selected?.external_reference}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><div className="text-muted-foreground">Event ID</div><div className="font-mono break-all">{selected.event_id}</div></div>
                  <div><div className="text-muted-foreground">Tipo</div><div>{selected.event_type || "—"}</div></div>
                  <div><div className="text-muted-foreground">Processado</div><div>{new Date(selected.processed_at).toLocaleString("pt-BR")}</div></div>
                  <div><div className="text-muted-foreground">Gateway</div><div>{selected.gateway}</div></div>
                </div>
                <pre className="bg-muted/40 p-3 rounded text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
                <Button onClick={() => replay(selected)} disabled={replaying === selected.id} className="w-full">
                  {replaying === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Repeat className="w-4 h-4 mr-2" /> Reprocessar pagamento</>}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
