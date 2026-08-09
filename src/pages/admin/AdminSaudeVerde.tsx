import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Users, Building2, CheckCircle2, XCircle, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

type Partner = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  state: string | null;
  is_active: boolean;
  is_verified: boolean;
  discount_pct: number | null;
  rating: number | null;
};

type PartnerRequest = {
  id: string;
  company_name: string;
  category: string | null;
  city: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: string | null;
  created_at: string;
};

export default function AdminSaudeVerde() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [stats, setStats] = useState({ subs: 0, active: 0, appts: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [p, r, subs, plans, appts] = await Promise.all([
      supabase.from("saude_verde_partners").select("id,name,category,city,state,is_active,is_verified,discount_pct,rating").order("created_at", { ascending: false }),
      supabase.from("saude_verde_partner_requests").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("saude_verde_subscriptions").select("id,status,plan_id"),
      supabase.from("saude_verde_plans").select("id,price_brl"),
      supabase.from("saude_verde_appointments").select("id", { count: "exact", head: true }),
    ]);

    setPartners((p.data as Partner[]) || []);
    setRequests((r.data as PartnerRequest[]) || []);

    const planMap = new Map((plans.data || []).map((pl: any) => [pl.id, Number(pl.price_brl) || 0]));
    const allSubs = subs.data || [];
    const activeSubs = allSubs.filter((s: any) => s.status === "active");
    const mrr = activeSubs.reduce((acc: number, s: any) => acc + (planMap.get(s.plan_id) || 0), 0);

    setStats({
      subs: allSubs.length,
      active: activeSubs.length,
      appts: appts.count || 0,
      mrr,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePartner = async (id: string, field: "is_active" | "is_verified", value: boolean) => {
    const patch: any = { [field]: value };
    const { error } = await supabase.from("saude_verde_partners").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const updateRequest = async (id: string, status: string) => {
    const { error } = await supabase.from("saude_verde_partner_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Solicitação ${status}`);
    load();
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Leaf className="text-primary-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black">Admin · Saúde Verde</h1>
            <p className="text-sm text-muted-foreground">Gestão de rede, assinaturas e parceiros</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2"><Users className="text-primary" size={18} /><span className="text-xs text-muted-foreground uppercase font-bold">Assinantes</span></div>
            <p className="text-3xl font-black">{stats.subs}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.active} ativos</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2"><TrendingUp className="text-secondary" size={18} /><span className="text-xs text-muted-foreground uppercase font-bold">MRR</span></div>
            <p className="text-3xl font-black">R$ {stats.mrr.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Recorrência mensal</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2"><Building2 className="text-primary" size={18} /><span className="text-xs text-muted-foreground uppercase font-bold">Parceiros</span></div>
            <p className="text-3xl font-black">{partners.filter(p => p.is_active).length}</p>
            <p className="text-xs text-muted-foreground mt-1">{partners.length} total</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2"><Calendar className="text-secondary" size={18} /><span className="text-xs text-muted-foreground uppercase font-bold">Agendamentos</span></div>
            <p className="text-3xl font-black">{stats.appts}</p>
          </Card>
        </div>

        {/* Solicitações pendentes */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Solicitações de Credenciamento ({requests.filter(r => r.status === "pending" || !r.status).length} pendentes)</h2>
          {loading ? <p className="text-muted-foreground">Carregando...</p> : requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma solicitação ainda.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{r.company_name}</p>
                      <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                        {r.status || "pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.category} · {r.city} · {r.contact_phone} · {r.contact_email}</p>
                  </div>
                  {(r.status === "pending" || !r.status) && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateRequest(r.id, "approved")} className="gap-1">
                        <CheckCircle2 size={14} /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateRequest(r.id, "rejected")} className="gap-1 text-destructive">
                        <XCircle size={14} /> Recusar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Parceiros */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Rede de Parceiros ({partners.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2 px-2">Nome</th>
                  <th className="text-left py-2 px-2">Categoria</th>
                  <th className="text-left py-2 px-2">Cidade</th>
                  <th className="text-left py-2 px-2">Desconto</th>
                  <th className="text-left py-2 px-2">Rating</th>
                  <th className="text-center py-2 px-2">Ativo</th>
                  <th className="text-center py-2 px-2">Verificado</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{p.name}</td>
                    <td className="py-2 px-2"><Badge variant="outline">{p.category}</Badge></td>
                    <td className="py-2 px-2 text-muted-foreground">{p.city}/{p.state}</td>
                    <td className="py-2 px-2 text-primary font-bold">{p.discount_pct || 0}%</td>
                    <td className="py-2 px-2">{p.rating ? `★ ${Number(p.rating).toFixed(1)}` : "—"}</td>
                    <td className="py-2 px-2 text-center">
                      <Button size="sm" variant="ghost" onClick={() => togglePartner(p.id, "is_active", !p.is_active)}>
                        {p.is_active ? <CheckCircle2 className="text-primary" size={16} /> : <XCircle className="text-muted-foreground" size={16} />}
                      </Button>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button size="sm" variant="ghost" onClick={() => togglePartner(p.id, "is_verified", !p.is_verified)}>
                        {p.is_verified ? <CheckCircle2 className="text-secondary" size={16} /> : <XCircle className="text-muted-foreground" size={16} />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
