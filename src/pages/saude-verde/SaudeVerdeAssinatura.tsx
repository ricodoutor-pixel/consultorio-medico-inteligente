import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, Repeat, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

type Sub = {
  id: string; status: string; card_number: string; currency: string;
  expires_at: string | null; created_at: string;
  total_savings_brl: number; total_appointments: number;
  renewal_count: number | null; auto_renew: boolean | null; last_payment_id: string | null;
  plan: { name: string; price_brl: number; slug: string } | null;
};
type Renewal = {
  processed_at: string;
  event_type: string;
  payment_id: string;
  amount: number | null;
  status: string;
};

export default function SaudeVerdeAssinatura() {
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<Sub | null>(null);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [{ data: subData }, { data: histData }] = await Promise.all([
      supabase.from("saude_verde_subscriptions" as never)
        .select("*, plan:saude_verde_plans(name, price_brl, slug)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.rpc("get_my_sv_renewal_history" as never),
    ]);
    setSub((subData as unknown as Sub) || null);
    setRenewals(((histData as unknown as Renewal[]) || []));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>;
  }

  if (!userId) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-4">
        <Card className="p-6 max-w-md text-center">
          <p className="mb-4">Faça login para ver sua assinatura.</p>
          <Button asChild><Link to="/login">Entrar</Link></Button>
        </Card>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-4">
        <Card className="p-8 max-w-md text-center">
          <CreditCard className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">Você ainda não tem o Cartão Saúde Verde</h1>
          <p className="text-sm text-muted-foreground mb-5">Assine um plano e comece a economizar.</p>
          <Button asChild><Link to="/saude-verde/cartao">Ver planos <ArrowRight className="ml-2 w-4 h-4" /></Link></Button>
        </Card>
      </div>
    );
  }

  const isActive = sub.status === "active";
  const expiresIn = sub.expires_at ? Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000) : null;
  const expiringSoon = expiresIn !== null && expiresIn <= 7 && expiresIn > 0;
  const qrPayload = `PYR-SV:${sub.card_number}:${sub.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`;

  return (
    <div className="min-h-dvh bg-background text-foreground py-10">
      <Helmet><title>Minha Assinatura Saúde Verde | Planta y Raiz</title></Helmet>
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/saude-verde/cartao" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">← Voltar ao cartão</Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-6">Minha Assinatura</h1>

        {/* CARD + QR */}
        <div className="grid md:grid-cols-[1fr_240px] gap-6 mb-8">
          <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 border-primary/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.3),transparent_60%)]" />
            <div className="relative">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-emerald-300 text-xs font-medium mb-1">Planta y Raiz</div>
                  <div className="text-white text-xl font-bold">Cartão Saúde Verde</div>
                </div>
                <CreditCard className="w-8 h-8 text-emerald-300" />
              </div>
              <div className="text-emerald-200 text-[10px] tracking-widest mb-1">NÚMERO</div>
              <div className="text-white text-xl font-mono tracking-wider mb-5">{sub.card_number}</div>
              <div className="flex justify-between items-end text-xs">
                <div>
                  <div className="text-emerald-300 tracking-widest">PLANO</div>
                  <div className="text-white font-semibold">{sub.plan?.name || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-300 tracking-widest">VÁLIDO ATÉ</div>
                  <div className="text-white font-semibold">
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("pt-BR") : "—"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center">
            <img src={qrUrl} alt="QR Cartão Saúde Verde" className="w-44 h-44 rounded bg-white p-2" />
            <div className="text-[10px] text-muted-foreground mt-2 text-center">Apresente este QR no parceiro</div>
          </Card>
        </div>

        {/* STATUS */}
        <div className="grid sm:grid-cols-4 gap-3 mb-8">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Badge className={isActive ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground"}>
              {isActive ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Ativa</> : sub.status}
            </Badge>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Renovação automática</div>
            <div className="font-semibold flex items-center gap-1">
              <Repeat className="w-4 h-4 text-primary" /> {sub.auto_renew ? "Ativada" : "Desativada"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Renovações</div>
            <div className="text-2xl font-bold">{sub.renewal_count || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Vence em</div>
            <div className={`text-2xl font-bold ${expiringSoon ? "text-amber-500" : ""}`}>
              {expiresIn !== null ? `${expiresIn}d` : "—"}
            </div>
          </Card>
        </div>

        {expiringSoon && (
          <Card className="p-4 mb-6 border-amber-500/40 bg-amber-500/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              Sua assinatura vence em {expiresIn} dia(s). Renove agora para não perder os benefícios.
              <div className="mt-2">
                <Button asChild size="sm"><Link to="/saude-verde/cartao">Renovar</Link></Button>
              </div>
            </div>
          </Card>
        )}

        {/* RENEWAL HISTORY */}
        <Card className="p-5 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Histórico de pagamentos / renovações</h2>
          {renewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2">Data</th>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Payment ID</th>
                    <th className="text-right py-2">Valor</th>
                    <th className="text-right py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {renewals.map((r, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2 text-xs">{new Date(r.processed_at).toLocaleString("pt-BR")}</td>
                      <td className="py-2 text-xs"><Badge variant="outline" className="text-xs">{r.event_type || "payment"}</Badge></td>
                      <td className="py-2 text-xs font-mono">{r.payment_id || "—"}</td>
                      <td className="py-2 text-xs text-right">{r.amount ? `R$ ${Number(r.amount).toFixed(2)}` : "—"}</td>
                      <td className="py-2 text-xs text-right"><Badge variant="outline" className="text-xs">{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/saude-verde/agendar">Agendar serviço <ArrowRight className="ml-2 w-4 h-4" /></Link></Button>
          <Button asChild variant="outline"><Link to="/saude-verde/rede">Buscar parceiros</Link></Button>
        </div>
      </div>
    </div>
  );
}
