import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  CreditCard, Stethoscope, FlaskConical, Syringe, SmilePlus, Pill, Leaf,
  Bot, ShieldCheck, Check, ArrowRight, Star, Users, MapPin
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";





type Plan = {
  id: string; slug: string; name: string;
  price_brl: number; max_beneficiaries: number;
  features: string[]; sort_order: number;
};

const benefits = [
  { icon: Stethoscope, title: "Consultas presenciais", desc: "a partir de R$ 20" },
  { icon: FlaskConical, title: "Exames laboratoriais", desc: "a partir de R$ 5" },
  { icon: SmilePlus, title: "Odontologia", desc: "avaliação gratuita" },
  { icon: Syringe, title: "Vacinas", desc: "até 70% OFF" },
  { icon: Leaf, title: "Terapias integrativas", desc: "até 60% OFF" },
  { icon: Pill, title: "Medicamentos", desc: "até 50% OFF" },
  { icon: Leaf, title: "Cannabis Medicinal", desc: "incluso no ecossistema" },
  { icon: Bot, title: "Brisa IA 24h", desc: "Orientação Técnica inclusa" },
];

const faqs = [
  { q: "O Cartão Saúde Verde é um plano de saúde?", a: "Não. É um cartão de descontos em uma rede credenciada de clínicas, laboratórios e farmácias. Você paga muito menos pelos serviços que usar, sem mensalidade alta e sem carência." },
  { q: "Quanto tempo leva para começar a usar?", a: "É instantâneo. Após o pagamento, seu cartão digital com QR Code fica disponível em segundos no seu painel." },
  { q: "Tem carência?", a: "Não. Você pode usar imediatamente após a confirmação do pagamento." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa, sem fidelidade. Cancele pelo painel a qualquer momento." },
  { q: "Atende em todo o Brasil?", a: "Sim. A rede está em expansão por todo o território nacional. O plano Premium também atende EUA, Europa e América Latina." },
];

export default function SaudeVerdeLanding() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase
      .from("saude_verde_plans" as never)
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setPlans((data as unknown as Plan[]) || []));
  }, []);

  useEffect(() => {
    document.body.classList.add("saude-verde-page");
    return () => document.body.classList.remove("saude-verde-page");
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Helmet>
        <title>Cartão Saúde Verde — Até 80% OFF em consultas e exames | Planta y Raiz</title>
        <meta name="description" content="Cartão de desconto em saúde com até 80% OFF em consultas, exames, vacinas e terapias. A partir de R$35/mês, sem carência, cancele quando quiser." />
        <link rel="canonical" href="https://plantayraiz.com.br/saude-verde" />
      </Helmet>

      <Navbar />



      {/* HERO — background sólido em mobile (evita glitch GPU Android com radial + bg-clip-text) */}
      <section className="saude-verde-hero relative overflow-hidden py-20 md:py-28 md:bg-gradient-to-br md:from-primary/10 md:via-background md:to-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.15),transparent_60%)] pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Leaf className="w-4 h-4" /> Novo módulo Planta y Raiz
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 md:bg-gradient-to-r md:from-primary md:via-emerald-400 md:to-primary md:bg-clip-text md:text-transparent text-primary">
            Solicite Agora o Seu Cartão Saúde Verde Planta y Raiz Ltda
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Até <span className="text-primary font-bold">80% de desconto</span> em consultas, exames, vacinas, terapias, odontologia e medicamentos.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 h-12">
              <a href="#planos">Assinar agora — a partir de R$ 35/mês <ArrowRight className="ml-2 w-4 h-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/30 text-base px-8 h-12">
              <Link to="/saude-verde/rede">Ver rede credenciada</Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-6 border-t border-border/40">
            <div><div className="text-2xl md:text-3xl font-bold text-primary">3.000+</div><div className="text-xs md:text-sm text-muted-foreground">clínicas e laboratórios</div></div>
            <div><div className="text-2xl md:text-3xl font-bold text-primary">50+</div><div className="text-xs md:text-sm text-muted-foreground">especialidades médicas</div></div>
            <div><div className="text-2xl md:text-3xl font-bold text-primary">80%</div><div className="text-xs md:text-sm text-muted-foreground">de desconto máximo</div></div>
          </div>
        </div>
      </section>

      {/* BENEFITS section removida a pedido do usuário (causava glitch em Android) */}


      {/* HOW IT WORKS */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Como funciona em 3 passos</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "1", t: "Assine o plano", d: "Escolha Individual, Família ou Premium e pague via Pix ou cartão." },
              { n: "2", t: "Receba seu cartão digital", d: "QR Code instantâneo na palma da mão, válido em toda a rede." },
              { n: "3", t: "Agende e economize", d: "Pelo app, WhatsApp com a Brisa IA ou direto no site." },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">{s.n}</div>
                <div className="text-xl font-semibold mb-2">{s.t}</div>
                <div className="text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="planos" className="py-20 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Escolha seu plano</h2>
        <p className="text-center text-muted-foreground mb-12">Sem carência. Sem fidelidade. Cancele quando quiser.</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => {
            const popular = p.slug === "verde-familia";
            return (
              <Card key={p.id} className={`p-7 relative ${popular ? "border-primary shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]" : "border-border/50"}`}>
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    MAIS POPULAR
                  </div>
                )}
                <div className="text-sm text-muted-foreground mb-1">{p.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-primary">R$ {Number(p.price_brl).toFixed(0)}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <div className="text-xs text-muted-foreground mb-5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> até {p.max_beneficiaries} {p.max_beneficiaries === 1 ? "beneficiário" : "beneficiários"}
                </div>
                <ul className="space-y-2.5 mb-7 min-h-[280px]">
                  {(p.features || []).map((f: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className={`w-full ${popular ? "bg-primary hover:bg-primary/90" : ""}`} variant={popular ? "default" : "outline"}>
                  <Link to={`/saude-verde/cartao?plan=${p.slug}`}>Assinar {p.name}</Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* PARTNERS NETWORK CTA */}
      <section className="py-16 bg-card/30 border-y border-border/40">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Rede credenciada em todo o Brasil</h2>
          <p className="text-muted-foreground mb-6">Mais de 3.000 clínicas, laboratórios, farmácias e consultórios odontológicos.</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/saude-verde/rede">Buscar na rede <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Quem usa, economiza</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: "Maria Helena, 52", city: "São Paulo/SP", text: "Fiz hemograma completo por R$5. Antes pagava R$60. O cartão se pagou no primeiro exame.", save: "R$ 340 economizados em 3 meses" },
            { name: "Carlos Mendes, 38", city: "Belo Horizonte/MG", text: "Plano Família para mim, esposa e dois filhos. Ortopedista, pediatra e dentista por menos de R$50/mês.", save: "R$ 890 economizados" },
            { name: "Júlia Aragão, 29", city: "Recife/PE", text: "O Premium inclui a Orientação Técnica de Cannabis. Resolveu minha insônia e meu orçamento.", save: "R$ 1.250 economizados" },
          ].map((t, i) => (
            <Card key={i} className="p-6 border-border/50">
              <div className="flex gap-1 mb-3 text-primary">{[...Array(5)].map((_, k) => <Star key={k} className="w-4 h-4 fill-current" />)}</div>
              <p className="text-sm mb-4 italic">"{t.text}"</p>
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground mb-3">{t.city}</div>
              <div className="text-xs font-medium text-primary border-t border-border/40 pt-3">💚 {t.save}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`f-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* B2B + PARTNERS CTA */}
      <section className="py-16 container mx-auto px-4 grid md:grid-cols-2 gap-6 max-w-5xl">
        <Card className="p-7 border-primary/30 bg-primary/5">
          <ShieldCheck className="w-10 h-10 text-primary mb-3" />
          <h3 className="text-2xl font-bold mb-2">Para empresas</h3>
          <p className="text-muted-foreground mb-5">Ofereça o Cartão Saúde Verde para sua equipe a partir de R$ 29/funcionário/mês.</p>
          <Button asChild variant="outline" className="border-primary/40"><Link to="/saude-verde/empresas">Conhecer planos corporativos</Link></Button>
        </Card>
        <Card className="p-7 border-primary/30 bg-primary/5">
          <Stethoscope className="w-10 h-10 text-primary mb-3" />
          <h3 className="text-2xl font-bold mb-2">Seja parceiro</h3>
          <p className="text-muted-foreground mb-5">É uma clínica ou laboratório? Credencie-se e atenda milhares de assinantes ativos.</p>
          <Button asChild variant="outline" className="border-primary/40"><Link to="/saude-verde/seja-parceiro">Solicitar credenciamento</Link></Button>
        </Card>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/15 via-background to-background">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <CreditCard className="w-14 h-14 text-primary mx-auto mb-5" />
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Comece agora.<br />Sem carência. Cancele quando quiser.</h2>
          <p className="text-muted-foreground mb-8">Pix, cartão de crédito e Bitcoin aceitos.</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-base px-10 h-14">
            <a href="#planos">Assinar Cartão Saúde Verde <ArrowRight className="ml-2 w-5 h-5" /></a>
          </Button>
        </div>
      </section>

      {/* TUDO INCLUSO — versão sóbria, sem efeitos pesados */}
      <section className="py-20 border-t border-border/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Tudo o que está incluso</h2>
            <p className="text-muted-foreground">Um único cartão. Acesso completo ao ecossistema Planta y Raiz.</p>
          </div>
          <ul className="divide-y divide-border/40 border-y border-border/40">
            {benefits.map((b) => (
              <li key={b.title} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium truncate">{b.title}</span>
                </div>
                <span className="text-sm text-muted-foreground text-right flex-shrink-0">{b.desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-xs text-muted-foreground mt-8">
            Disponível em todos os planos conforme cobertura contratada.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}

