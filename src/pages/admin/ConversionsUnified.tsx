import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, DollarSign, Target, RefreshCw, Activity, Image as ImageIcon, Bitcoin } from "lucide-react";

interface Snapshot {
  visitors24h: number;
  leads24h: number;
  ot_orders24h: number;
  paid24h: number;
  revenue24h: number;
  capi_sent24h: number;
  capi_failed24h: number;
  image_pool_size: number;
  btc_pending: number;
  btc_confirmed24h: number;
}

export default function ConversionsUnified() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [
      visitors, leads, orders, paid, capi,
      imgPool, btcPending, btcConfirmed,
    ] = await Promise.all([
      supabase.from("site_counters").select("count").eq("id", "total_visitors").maybeSingle(),
      supabase.from("pacientes_leads").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("orientacao_tecnica_orders").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("orientacao_tecnica_orders").select("amount").eq("payment_status", "paid").gte("created_at", since),
      supabase.from("ai_events").select("status").eq("ai_name", "meta_capi").gte("created_at", since),
      supabase.from("brisa_image_pool").select("id", { count: "exact", head: true }),
      supabase.from("btc_payment_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("btc_payment_verifications").select("id", { count: "exact", head: true })
        .eq("status", "confirmed").gte("confirmed_at", since),
    ]);

    const revenue = (paid.data ?? []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const capiSent = (capi.data ?? []).filter((r: any) => r.status === "completed").length;
    const capiFailed = (capi.data ?? []).filter((r: any) => r.status === "error").length;

    setSnap({
      visitors24h: visitors.data?.count ?? 0,
      leads24h: leads.count ?? 0,
      ot_orders24h: orders.count ?? 0,
      paid24h: paid.data?.length ?? 0,
      revenue24h: revenue,
      capi_sent24h: capiSent,
      capi_failed24h: capiFailed,
      image_pool_size: imgPool.count ?? 0,
      btc_pending: btcPending.count ?? 0,
      btc_confirmed24h: btcConfirmed.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);

  const conv = snap && snap.leads24h > 0
    ? ((snap.paid24h / snap.leads24h) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-primary" />
              Conversões Unificadas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Visão consolidada 24h — Meta CAPI · GA4 · lead_score · Imagens · BTC</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {snap && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card icon={<Users className="w-5 h-5" />} label="Leads 24h" value={snap.leads24h} accent="primary" />
              <Card icon={<Target className="w-5 h-5" />} label="Orientações pagas 24h" value={snap.paid24h} sub={`${snap.ot_orders24h} pedidos`} />
              <Card icon={<DollarSign className="w-5 h-5" />} label="Receita 24h" value={`R$ ${snap.revenue24h.toFixed(2)}`} />
              <Card icon={<Activity className="w-5 h-5" />} label="Conversão" value={`${conv}%`} sub="paid / leads" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Meta CAPI · 24h</div>
                <div className="flex items-baseline gap-4">
                  <div>
                    <div className="text-3xl font-bold text-emerald-500">{snap.capi_sent24h}</div>
                    <div className="text-xs text-muted-foreground">enviados</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-500">{snap.capi_failed24h}</div>
                    <div className="text-xs text-muted-foreground">falhas</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm">Taxa sucesso</div>
                    <div className="text-xl font-semibold">
                      {snap.capi_sent24h + snap.capi_failed24h > 0
                        ? ((snap.capi_sent24h / (snap.capi_sent24h + snap.capi_failed24h)) * 100).toFixed(1) + "%"
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Visitantes acumulados</div>
                <div className="text-3xl font-bold">{snap.visitors24h.toLocaleString("pt-BR")}</div>
                <div className="text-xs text-muted-foreground mt-1">baseline 118 · meta 100/dia</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Banco de imagens (auto-post)
                </div>
                <div className="text-3xl font-bold">{snap.image_pool_size}</div>
                <div className="text-xs text-muted-foreground mt-1">refresh semanal · seg 04:00 UTC</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Bitcoin className="w-4 h-4 text-orange-500" /> Bitcoin on-chain
                </div>
                <div className="flex items-baseline gap-6">
                  <div>
                    <div className="text-2xl font-bold text-amber-500">{snap.btc_pending}</div>
                    <div className="text-xs text-muted-foreground">pendentes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-500">{snap.btc_confirmed24h}</div>
                    <div className="text-xs text-muted-foreground">confirmadas 24h</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">verifica a cada 10min via mempool.space</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${accent === "primary" ? "ring-1 ring-primary/30" : ""}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
        {icon}{label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
