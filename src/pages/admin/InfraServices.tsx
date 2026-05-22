import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Plus, Trash2 } from "lucide-react";

interface InfraService {
  id: string;
  name: string;
  category: string;
  provider: string | null;
  expires_at: string | null;
  cost_brl: number | null;
  renewal_url: string | null;
  notes: string | null;
  is_active: boolean;
  last_alert_at: string | null;
}

const WARN_DAYS = 5;

function statusOf(s: InfraService) {
  if (!s.expires_at) return { color: "muted", label: "Sem data", days: null as number | null };
  const days = Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 86400_000);
  if (days < 0) return { color: "destructive", label: `Vencido há ${-days}d`, days };
  if (days <= WARN_DAYS) return { color: "destructive", label: `Vence em ${days}d`, days };
  return { color: "success", label: `OK (${days}d)`, days };
}

export default function InfraServices() {
  const [services, setServices] = useState<InfraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", category: "api_token", provider: "", expires_at: "", cost_brl: "", renewal_url: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("infra_services").select("*").order("expires_at", { ascending: true, nullsFirst: false });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else setServices((data as InfraService[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markPaid = async (s: InfraService) => {
    const next = new Date(Date.now() + 30 * 86400_000).toISOString();
    const { error } = await supabase.from("infra_services").update({ expires_at: next, last_alert_at: null }).eq("id", s.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Pago ✅", description: `${s.name} renovado por +30 dias` });
    load();
  };

  const toggleActive = async (s: InfraService) => {
    const { error } = await supabase.from("infra_services").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    load();
  };

  const remove = async (s: InfraService) => {
    if (!confirm(`Remover ${s.name}?`)) return;
    const { error } = await supabase.from("infra_services").delete().eq("id", s.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    load();
  };

  const create = async () => {
    if (!form.name || !form.category) return toast({ title: "Nome e categoria obrigatórios", variant: "destructive" });
    const payload: any = { name: form.name, category: form.category, provider: form.provider || null, renewal_url: form.renewal_url || null, notes: form.notes || null };
    if (form.expires_at) payload.expires_at = new Date(form.expires_at).toISOString();
    if (form.cost_brl) payload.cost_brl = Number(form.cost_brl);
    const { error } = await supabase.from("infra_services").insert(payload);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Serviço cadastrado" });
    setShowNew(false);
    setForm({ name: "", category: "api_token", provider: "", expires_at: "", cost_brl: "", renewal_url: "", notes: "" });
    load();
  };

  const expiring = services.filter(s => s.is_active && statusOf(s).color === "destructive");
  const totalCost = services.filter(s => s.is_active).reduce((acc, s) => acc + Number(s.cost_brl ?? 0), 0);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pagamentos & Chaves Externas</h1>
          <p className="text-sm text-muted-foreground">Alertas 5 dias antes do vencimento. Marque como pago para renovar +30 dias.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
          <Button size="sm" onClick={() => setShowNew(v => !v)}><Plus className="h-4 w-4 mr-1" />Novo</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Serviços ativos</div><div className="text-2xl font-bold">{services.filter(s => s.is_active).length}</div></CardContent></Card>
        <Card className={expiring.length > 0 ? "border-destructive" : ""}><CardContent className="p-4"><div className="text-xs text-muted-foreground">Vencendo / vencido</div><div className="text-2xl font-bold text-destructive">{expiring.length}</div></CardContent></Card>
        <Card className="col-span-2 md:col-span-1"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Custo mensal</div><div className="text-2xl font-bold">R$ {totalCost.toFixed(2)}</div></CardContent></Card>
      </div>

      {showNew && (
        <Card>
          <CardHeader><CardTitle className="text-base">Novo serviço</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nome*</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Categoria*</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="api_token, hosting, vps, domain..." /></div>
            <div><Label>Provedor</Label><Input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} /></div>
            <div><Label>Vence em</Label><Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
            <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.cost_brl} onChange={e => setForm({ ...form, cost_brl: e.target.value })} /></div>
            <div><Label>URL renovação</Label><Input value={form.renewal_url} onChange={e => setForm({ ...form, renewal_url: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="md:col-span-2 flex gap-2 justify-end"><Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button><Button onClick={create}>Salvar</Button></div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading && <p className="text-muted-foreground">Carregando...</p>}
        {!loading && services.map(s => {
          const st = statusOf(s);
          const danger = st.color === "destructive";
          return (
            <Card key={s.id} className={danger ? "border-destructive border-2" : "border-green-600/40"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {danger ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {s.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{s.provider ?? s.category}</p>
                  </div>
                  <Badge variant={danger ? "destructive" : "secondary"}>{st.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><div className="text-xs text-muted-foreground">Vence</div><div>{s.expires_at ? new Date(s.expires_at).toLocaleDateString("pt-BR") : "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Custo</div><div>R$ {Number(s.cost_brl ?? 0).toFixed(2)}</div></div>
                </div>
                {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => markPaid(s)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />Marcar como pago
                  </Button>
                  {s.renewal_url && (
                    <Button asChild size="sm" variant="destructive" className="flex-1">
                      <a href={s.renewal_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Pagar agora</a>
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 justify-end pt-1 border-t">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(s)}>{s.is_active ? "Desativar" : "Ativar"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
