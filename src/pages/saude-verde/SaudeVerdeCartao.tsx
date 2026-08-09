import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  Loader2,
  TrendingDown,
  CalendarCheck,
  Users,
  ArrowRight,
  Stethoscope,
  FlaskConical,
  Pill,
  Video,
  Smile,
  HeartPulse,
  ShieldCheck,
  Phone,
  MessageCircle,
  ChevronDown,
  Sparkles,
  MapPin,
} from "lucide-react";

const BRAND = "Planta y Raiz LTDA";
const WHATSAPP = "5511991363154";
const WHATSAPP_HUMAN = "(11) 99136-3154";

type Plan = {
  id: string; slug: string; name: string;
  price_brl: number; max_beneficiaries: number; features: string[];
};
type Subscription = {
  id: string; status: string; card_number: string; currency: string;
  expires_at: string | null; total_savings_brl: number; total_appointments: number;
  plan: Plan | null;
};

// ---------- Static catalog (Planta y Raiz LTDA) ----------
const BENEFITS = [
  { icon: Smile, title: "Avaliação odontológica", value: "Gratuita*", note: "Consultas e procedimentos" },
  { icon: Stethoscope, title: "Consultas presenciais", value: "A partir de R$ 54,00*", note: "Especialistas e clínico geral" },
  { icon: Pill, title: "Desconto em medicamentos", value: "Até 60%", note: "Rede de farmácias parceiras" },
  { icon: FlaskConical, title: "Exames laboratoriais e de imagem", value: "A partir de R$ 2,88*", note: "Mais de 3 mil laboratórios" },
  { icon: HeartPulse, title: "Ligue Saúde — orientação por vídeo com enfermagem", value: "24h por dia", note: "Incluso na assinatura" },
  { icon: Video, title: "Consultas online com especialista", value: "A partir de R$ 70,20*", note: "Telemedicina por vídeo" },
  { icon: Stethoscope, title: "Pronto atendimento online (Clínico geral e Pediatra)", value: "A partir de R$ 43,09/consulta*", note: "24/7" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Faça seu cadastro e assine", text: "Escolha uma assinatura a partir de R$ 24,90/mês e tenha acesso a serviços de saúde com pagamento direto no agendamento." },
  { step: "02", title: "Acesse a área do assinante", text: "Use seu Cartão Saúde Verde diretamente em plantayraiz.com.br ou pelo WhatsApp da Enfermeira Brisa." },
  { step: "03", title: "Comece a usar", text: "Agende e pague pela plataforma. Escolha o melhor dia, hora e local para seu atendimento." },
];

const LAB_PARTNERS = [
  "a+ Medicina Diagnóstica", "Anchiera Kora Saúde", "Axial", "Bronstein", "cdb Medicina Diagnóstica",
  "Cedimagem", "Certa Expert Care", "Cytolab", "Delfin Diagnósticos", "Di Imagem", "Diagnoson a+",
  "Encore Kora Saúde", "Exame Medicina Diagnóstica", "Frishmann Aisengart", "Instituto de Neurologia de Goiânia Kora Saúde",
  "Instituto de Radiologia", "Labi", "Lavoisier", "Leme Medicina Diagnóstica", "Medical Kora Saúde",
  "Meridional Kora Saúde", "Oto Kora Saúde", "Padrão Medicina Diagnóstica", "Previna", "Sabin Diagnóstico e Saúde",
  "Serdil", "SP Plus", "Weinmann",
];

const PHARMACY_PARTNERS = [
  "D'avó Farma", "Droga Raia", "Drogal", "Drogão Super", "Drogaria Araujo", "Drogaria Pague Menos",
  "Drogaria Rosário", "Drogaria São Paulo", "Drogaria Venancio", "Drogarias Pacheco", "Drogarias Tamoio",
  "Drogasil", "Drogasmil", "Farma Ponte", "Farma Rosário", "Farmácia Drogaria Catarinense",
  "Farmácia Nacional", "Farmácia Preço Popular", "Farmalife", "Indiana", "Minas Brasil", "Nissei",
  "PanVel", "Pense Farma", "Rede Biomax", "Santo Remédio", "DrogaVen",
];

type PriceRow = { name: string; particular: number; pyr: number };
const PRICES: Record<"especialidades" | "exames" | "odonto", PriceRow[]> = {
  especialidades: [
    { name: "Cardiologia", particular: 250, pyr: 54 },
    { name: "Clínico Geral", particular: 180, pyr: 54 },
    { name: "Dermatologia", particular: 300, pyr: 64.8 },
    { name: "Ginecologia", particular: 220, pyr: 70.86 },
    { name: "Neurologia", particular: 350, pyr: 54 },
    { name: "Nutricionista", particular: 180, pyr: 32.4 },
    { name: "Oftalmologia", particular: 220, pyr: 54 },
    { name: "Psicólogo", particular: 180, pyr: 32.4 },
    { name: "Psiquiatria", particular: 400, pyr: 64.8 },
    { name: "Urologia", particular: 320, pyr: 54 },
    { name: "Consulta online", particular: 230, pyr: 72.2 },
  ],
  exames: [
    { name: "Colesterol", particular: 40, pyr: 7.32 },
    { name: "Glicose", particular: 35, pyr: 6.36 },
    { name: "Hemograma", particular: 60, pyr: 4.68 },
    { name: "Triglicerídeos", particular: 45, pyr: 2.88 },
    { name: "Urina Tipo 1", particular: 35, pyr: 3.24 },
    { name: "Papanicolau", particular: 180, pyr: 40.86 },
    { name: "Eletrocardiograma Repouso", particular: 180, pyr: 39.74 },
    { name: "Ultrassonografia de mamas", particular: 280, pyr: 64.8 },
    { name: "Ultrassonografia de abdômen total", particular: 300, pyr: 86.4 },
  ],
  odonto: [
    { name: "Avaliação Odontológica", particular: 220, pyr: 0 },
    { name: "Limpeza", particular: 380, pyr: 168.48 },
    { name: "Canal", particular: 950, pyr: 464.4 },
    { name: "Restauração", particular: 320, pyr: 63.18 },
    { name: "Clareamento Dental", particular: 1200, pyr: 172.8 },
    { name: "Aplicação de Flúor Infantil", particular: 400, pyr: 140.4 },
    { name: "Aparelho Fixo", particular: 1500, pyr: 270 },
    { name: "Coroa Dentária", particular: 5000, pyr: 475.2 },
    { name: "Consulta Odontológica", particular: 300, pyr: 37.8 },
  ],
};

const FAQ = [
  {
    q: `O que é o Cartão Saúde Verde da ${BRAND}?`,
    a: `É uma assinatura de saúde da ${BRAND} que oferece descontos de até 80% em consultas, exames, vacinas, terapias e medicamentos em uma rede de mais de 3 mil clínicas, laboratórios e farmácias parceiras. Não é plano de saúde — é um clube de benefícios com pagamento direto no agendamento.`,
  },
  {
    q: "Quem pode usar o Cartão Saúde Verde?",
    a: "Qualquer pessoa, sem análise de perfil, sem carência e sem limite de idade. O plano Familiar permite incluir até 4 pessoas (titular + 3 dependentes).",
  },
  {
    q: "Quais os valores das assinaturas?",
    a: "Plano Anual: 12x R$ 29,90 (até 4 pessoas, menos de R$ 0,25 por pessoa ao dia). Plano Mensal: R$ 44,90/mês (até 4 pessoas, sem compromisso de fidelidade).",
  },
  {
    q: `O Cartão Saúde Verde da ${BRAND} tem carência?`,
    a: "Não. A partir da confirmação do pagamento, você já pode usar todos os benefícios — incluindo a avaliação odontológica gratuita e o pronto atendimento online 24h.",
  },
  {
    q: "Como faço para contratar?",
    a: `Escolha um plano nesta página e finalize o pagamento via PIX, cartão de crédito ou WhatsApp da Enfermeira Brisa (${WHATSAPP_HUMAN}). A ativação é imediata.`,
  },
  {
    q: "Como acesso meu cartão?",
    a: `Após assinar, seu Cartão Saúde Verde fica disponível na área logada em plantayraiz.com.br. Você também pode usar pelo WhatsApp da Enfermeira Brisa (${WHATSAPP_HUMAN}) para agendar atendimentos.`,
  },
];

// ---------- Component ----------
export default function SaudeVerdeCartao() {
  const [params] = useSearchParams();
  const presetPlan = params.get("plan");

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [priceTab, setPriceTab] = useState<"especialidades" | "exames" | "odonto">("especialidades");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (!u) {
      const { data: planData } = await supabase.from("saude_verde_plans" as never)
        .select("*").eq("is_active", true).order("sort_order");
      setPlans((planData as unknown as Plan[]) || []);
      setLoading(false);
      return;
    }

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
    return <div className="min-h-dvh flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>;
  }

  const isSubscriber = sub && sub.status === "active";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pt-6 pb-32 sm:py-12">
      <Helmet>
        <title>Cartão Saúde Verde | {BRAND}</title>
        <meta
          name="description"
          content={`Assinatura de saúde da ${BRAND}: até 80% de desconto em consultas, exames, vacinas, terapias e medicamentos. Rede com 3 mil+ clínicas e laboratórios. Sem carência.`}
        />
        <link rel="canonical" href="https://plantayraiz.com.br/saude-verde/cartao" />
      </Helmet>

      <div className="container mx-auto px-4 max-w-6xl">
        <Link to="/saude-verde" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">
          ← Voltar
        </Link>

        {isSubscriber ? (
          // =================== ACTIVE SUBSCRIBER ===================
          <>
            <Card className="p-5 sm:p-8 mb-8 bg-emerald-900 border-primary/30">
              <div>
                <div className="flex items-start justify-between mb-8 sm:mb-10 gap-3">
                  <div className="min-w-0">
                    <div className="text-emerald-300 text-xs sm:text-sm font-medium mb-1">{BRAND}</div>
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
          // =================== LANDING (não assinante) ===================
          <>
            {/* HERO */}
            <section className="rounded-3xl border border-primary/20 bg-emerald-950/40 p-6 sm:p-12 mb-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4 bg-primary/15 text-primary border-primary/30">
                    <Sparkles className="w-3 h-3 mr-1" /> A sua assinatura de saúde
                  </Badge>
                  <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
                    Assine e garanta até <span className="text-primary">80% de desconto</span> em consultas, exames, vacinas e terapias
                  </h1>
                  <ul className="space-y-2 mb-6 text-sm sm:text-base text-muted-foreground">
                    <li className="flex gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /> Consultas com especialistas</li>
                    <li className="flex gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /> Mais de 3 mil clínicas e laboratórios</li>
                    <li className="flex gap-2"><Check className="w-5 h-5 text-primary flex-shrink-0" /> Medicamentos com até 60% de desconto</li>
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                      <a href="#planos">Assinar agora <ArrowRight className="ml-2 w-4 h-4" /></a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="#beneficios">Conheça os benefícios</a>
                    </Button>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Card className="p-6 bg-emerald-900 border-primary/30">
                    <div>
                      <div className="flex items-start justify-between mb-8">
                        <div>
                          <div className="text-emerald-300 text-xs font-medium mb-1">{BRAND}</div>
                          <div className="text-white text-xl font-bold">Cartão Saúde Verde</div>
                        </div>
                        <CreditCard className="w-10 h-10 text-emerald-300" />
                      </div>
                      <div className="text-emerald-200 text-[10px] tracking-widest mb-1">NÚMERO DO CARTÃO</div>
                      <div className="text-white text-xl font-mono tracking-wider mb-6">•••• •••• •••• ••••</div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-emerald-300 text-[10px] tracking-widest">TITULAR</div>
                          <div className="text-white font-semibold text-sm">SEU NOME AQUI</div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-300 text-[10px] tracking-widest">VÁLIDO ATÉ</div>
                          <div className="text-white font-semibold text-sm">12/27</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </section>

            {/* BENEFITS */}
            <section id="beneficios" className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Conheça nossos benefícios</h2>
              <p className="text-muted-foreground mb-8">Tudo o que está incluso no seu Cartão Saúde Verde.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BENEFITS.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <Card key={i} className="p-5">
                      <Icon className="w-7 h-7 text-primary mb-3" />
                      <div className="text-sm font-medium mb-1">{b.title}</div>
                      <div className="text-2xl font-bold text-primary mb-1">{b.value}</div>
                      <div className="text-xs text-muted-foreground">{b.note}</div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* PLANS */}
            <section id="planos" className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Escolha a assinatura ideal para cuidar da sua saúde</h2>
              <p className="text-muted-foreground mb-8">Familiar Individual — proteção para até 4 pessoas.</p>

              {!user && (
                <Card className="p-5 mb-6 border-primary/30 bg-primary/5">
                  <p className="text-sm mb-3">Você precisa estar logado para assinar.</p>
                  <div className="flex gap-2">
                    <Button asChild size="sm"><Link to="/login">Entrar</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link to="/cadastro">Criar conta</Link></Button>
                  </div>
                </Card>
              )}

              {plans.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-5">
                  {plans.map(p => {
                    const popular = p.slug === "verde-familia";
                    const preset = p.slug === presetPlan;
                    const highlight = popular || preset;
                    return (
                      <Card
                        key={p.id}
                        className={`relative p-6 ${highlight ? "border-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]" : ""}`}
                      >
                        {highlight && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                            MAIS ESCOLHIDO
                          </Badge>
                        )}
                        <div className="text-sm text-muted-foreground mb-1">{p.name}</div>
                        <div className="text-3xl font-bold text-primary mb-1">
                          R$ {Number(p.price_brl).toFixed(2).replace(".", ",")}<span className="text-sm text-muted-foreground font-normal">/mês</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> até {p.max_beneficiaries} pessoas
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
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  <Card className="relative p-6 border-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">MAIS ESCOLHIDO</Badge>
                    <div className="text-sm text-muted-foreground mb-1">Familiar Anual</div>
                    <div className="text-xs text-muted-foreground mb-3">Até 4 pessoas · economia e segurança o ano todo</div>
                    <div className="text-3xl font-bold text-primary mb-1">12x R$ 29,90</div>
                    <div className="text-xs text-muted-foreground mb-5">Menos de R$ 0,25 por pessoa ao dia</div>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90"><Link to="/cadastro">Assinar Anual</Link></Button>
                  </Card>
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Familiar Mensal</div>
                    <div className="text-xs text-muted-foreground mb-3">Até 4 pessoas · sem compromisso</div>
                    <div className="text-3xl font-bold text-primary mb-1">R$ 44,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                    <div className="text-xs text-muted-foreground mb-5">Menos de R$ 0,37 por pessoa ao dia</div>
                    <Button asChild variant="outline" className="w-full"><Link to="/cadastro">Assinar Mensal</Link></Button>
                  </Card>
                </div>
              )}
            </section>

            {/* HOW IT WORKS */}
            <section className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Faça parte da {BRAND} e cuide da sua saúde</h2>
              <p className="text-muted-foreground mb-8">É fácil — em 3 passos você já está usando o Cartão Saúde Verde.</p>
              <div className="grid md:grid-cols-3 gap-5">
                {HOW_IT_WORKS.map((s) => (
                  <Card key={s.step} className="p-6">
                    <div className="text-5xl font-bold text-primary/30 mb-2">{s.step}</div>
                    <div className="text-lg font-semibold mb-2">{s.title}</div>
                    <p className="text-sm text-muted-foreground">{s.text}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* PRICE COMPARISON */}
            <section className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Economize com descontos em consultas, exames e procedimentos</h2>
              <p className="text-muted-foreground mb-6">Compare o valor particular com o valor pelo Cartão Saúde Verde da {BRAND}.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(["especialidades", "exames", "odonto"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPriceTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize border ${
                      priceTab === tab
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRICES[priceTab].map((row) => (
                  <Card key={row.name} className="p-4">
                    <div className="font-semibold mb-3">{row.name}</div>
                    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">Particular</span>
                      <span className="line-through text-muted-foreground">R$ {row.particular.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5">
                      <span className="text-primary font-medium">{BRAND}</span>
                      <span className="text-primary font-bold">
                        {row.pyr === 0 ? "Sem custos" : `R$ ${row.pyr.toFixed(2).replace(".", ",")}`}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                *Valores de referência em SP Capital, podendo variar de acordo com o prestador e a região. O preço final será informado no momento do agendamento.
              </p>
            </section>

            {/* NETWORK */}
            <section className="mb-16">
              <Card className="p-6 sm:p-8">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Sua saúde, mais perto</h2>
                    <p className="text-muted-foreground text-sm">Encontre especialidades, clínicas e exames mais perto de você.</p>
                  </div>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 mb-8">
                  <Link to="/saude-verde/rede">Conhecer rede de atendimento <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>

                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">Laboratórios e diagnóstico parceiros</h3>
                  <div className="flex flex-wrap gap-2">
                    {LAB_PARTNERS.map((p) => (
                      <span key={p} className="text-xs px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground">{p}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
                    Descontos de até 60% em medicamentos · farmácias parceiras
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {PHARMACY_PARTNERS.map((p) => (
                      <span key={p} className="text-xs px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground">{p}</span>
                    ))}
                  </div>
                </div>
              </Card>
            </section>

            {/* FAQ */}
            <section className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">Tem alguma dúvida?</h2>
              <div className="space-y-2">
                {FAQ.map((f, i) => (
                  <Card key={i} className="overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-card/50 transition-colors"
                    >
                      <span className="font-semibold pr-4">{f.q}</span>
                      <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-5 text-sm text-muted-foreground border-t border-border/50 pt-4">
                        {f.a}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>

            {/* CONTACT FOOTER */}
            <section className="mb-12">
              <Card className="p-6 sm:p-8 bg-emerald-950/40 border-primary/20">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <ShieldCheck className="w-8 h-8 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-1">Ainda não é assinante?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Fale com a Enfermeira Brisa e assine o Cartão Saúde Verde agora mesmo pelo WhatsApp.
                    </p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Quero assinar o Cartão Saúde Verde da Planta y Raiz")}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 w-4 h-4" /> Falar pelo WhatsApp
                      </a>
                    </Button>
                  </div>
                  <div>
                    <Phone className="w-8 h-8 text-primary mb-3" />
                    <h3 className="text-xl font-bold mb-1">Já é assinante e quer ajuda?</h3>
                    <p className="text-sm text-muted-foreground mb-1">Central de atendimento — Enfermeira Brisa</p>
                    <a href={`https://wa.me/${WHATSAPP}`} className="text-2xl font-bold text-primary block mb-2">{WHATSAPP_HUMAN}</a>
                    <p className="text-xs text-muted-foreground">Disponível 24h por dia, 7 dias por semana.</p>
                  </div>
                </div>
              </Card>
            </section>

            {/* LEGAL */}
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                A {BRAND} <strong>não é um plano de saúde</strong>. É uma plataforma de intermediação (CNAE 6209-1/00) que conecta o usuário à rede credenciada e viabiliza o pagamento dos atendimentos. Os serviços de saúde são de responsabilidade dos prestadores parceiros.
              </p>
              <p>*Valores de referência em SP Capital, podendo variar de acordo com o prestador e a região. Valores sujeitos a alteração sem aviso prévio.</p>
              <p>Copyright © {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
