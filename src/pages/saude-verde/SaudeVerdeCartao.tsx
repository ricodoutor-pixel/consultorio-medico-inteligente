import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Check, Loader2, TrendingDown, CalendarCheck, Users, ArrowRight } from "lucide-react";

type Plan = {
  id: string; slug: string; name: string;
  price_brl: number; max_beneficiaries: number; features: string[];
};
type Subscription = {
  id: string; status: string; card_number: string; currency: string;
  expires_at: string | null; total_savings_brl: number; total_appointments: number;
  plan: Plan | null;
};

export default function SaudeVerdeCartao() {
  const [params] = useSearchParams();
  const presetPlan = params.get("plan");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (!u) { setLoading(false); return; }

    const [{ data: subData }, { data: planData }] = await Promise.all([
      supabase.from("saude_verde_subscriptions" as never)
        .select("*, plan:saude_verde_plans(*)").eq("user_id", u.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("saude_verde_plans" as never)
        .select("*").eq("is_active", true).order("sort_order"),
    ]);
    setSub((subData as unknown as Subscription) || null);
    setPlans((planData as unknown as Plan[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const subscribe = async (planSlug: string) => {
    setSubscribing(planSlug);
    try {
      const { data, error } = await supabase.functions.invoke("saude-verde-subscribe", {
        body: { planSlug, currency: "BRL" },
      });
      if (error) throw error;
      if (data?.init_point) {
        toast.success("Redirecionando para o pagamento...");
        window.location.href = data.init_point;
      } else {
        toast.error(data?.error || "Falha ao iniciar assinatura");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-6 pb-32 sm:py-12">
      <Helmet>
        <title>Meu Cartão Saúde Verde | Planta y Raiz</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/saude-verde" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">
          ← Voltar
        </Link>

        {sub && sub.status === "active" ? (
          <>
            {/* ACTIVE CARD */}
            <Card className="relative overflow-hidden p-5 sm:p-8 mb-8 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 border-primary/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.3),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-start justify-between mb-8 sm:mb-10 gap-3">
                  <div className="min-w-0">
                    <div className="text-emerald-300 text-xs sm:text-sm font-medium mb-1">Planta y Raiz</div>
                    <div className="text-white text-lg sm:text-2xl font-bold truncate">Cartão Saúde Verde</div>
                  </div>
                  <CreditCard className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 flex-shrink-0" />
                </div>
                <div className="text-emerald-200 text-[10px] sm:text-xs tracking-widest mb-1">NÚMERO DO CARTÃO</div>
                <div className="text-white text-lg sm:text-2xl font-mono tracking-wide sm:tracking-wider mb-6 break-all">{sub.card_number}</div>
                <div className="flex justify-between items-end gap-3">
                  <div className="min-w-0">
                    <div className="text-emerald-300 text-[10px] tracking-widest">PLANO</div>
                    <div className="text-white font-semibold text-sm sm:text-base truncate">{sub.plan?.name || "—"}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-emerald-300 text-[10px] tracking-widest">VÁLIDO ATÉ</div>
                    <div className="text-white font-semibold text-sm sm:text-base">
                      {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" }) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* STATS */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="p-5">
                <TrendingDown className="w-6 h-6 text-primary mb-2" />
                <div className="text-2xl font-bold">R$ {Number(sub.total_savings_brl || 0).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Total economizado</div>
              </Card>
              <Card className="p-5">
                <CalendarCheck className="w-6 h-6 text-primary mb-2" />
                <div className="text-2xl font-bold">{sub.total_appointments || 0}</div>
                <div className="text-xs text-muted-foreground">Agendamentos realizados</div>
              </Card>
              <Card className="p-5">
                <Badge className="mb-2 bg-primary/20 text-primary border-primary/30">Ativa</Badge>
                <div className="text-sm text-muted-foreground">Sem carência. Renovação automática.</div>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/saude-verde/agendar">Agendar novo serviço <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/saude-verde/rede">Buscar na rede</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* NOT SUBSCRIBED — show plans */}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Ative seu Cartão Saúde Verde</h1>
            <p className="text-muted-foreground mb-8">Escolha um plano e comece a economizar em segundos.</p>

            {!user && (
              <Card className="p-5 mb-6 border-primary/30 bg-primary/5">
                <p className="text-sm mb-3">Você precisa estar logado para assinar.</p>
                <div className="flex gap-2">
                  <Button asChild size="sm"><Link to="/login">Entrar</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to="/cadastro">Criar conta</Link></Button>
                </div>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-5">
              {plans.map(p => {
                const popular = p.slug === "verde-familia";
                const preset = p.slug === presetPlan;
                return (
                  <Card key={p.id} className={`p-6 ${popular || preset ? "border-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]" : ""}`}>
                    <div className="text-sm text-muted-foreground mb-1">{p.name}</div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      R$ {Number(p.price_brl).toFixed(0)}<span className="text-sm text-muted-foreground font-normal">/mês</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> até {p.max_beneficiaries}
                    </div>
                    <ul className="space-y-2 mb-5 text-sm min-h-[220px]">
                      {(p.features || []).map((f, i) => (
                        <li key={i} className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span>{f}</span></li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={!user || subscribing === p.slug}
                      onClick={() => subscribe(p.slug)}
                    >
                      {subscribing === p.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
