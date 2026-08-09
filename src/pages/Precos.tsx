import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Users, Stethoscope, Loader2, Bitcoin, Crown, Store, Building2, Heart } from "lucide-react";
import { Link } from "react-router-dom";
// motion removido — wrappers com whileInView/transform escondiam seções e quebravam position:fixed do MobileBottomNav (mesmo bug da Biblioteca)
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BTCPaymentModal } from "@/components/BTCPaymentModal";
import { WhatsAppProofModal, useWhatsAppProofModal, type WhatsAppContext } from "@/components/WhatsAppProofModal";
import { PWAInstallSection } from "@/components/PWAInstallSection";
// HealthSubscriptionPlans removido para evitar duplicação de planos.

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const Precos = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [btcModal, setBtcModal] = useState<{ open: boolean; planName: string; planId: string; amount: string }>({ open: false, planName: "", planId: "", amount: "" });
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();

  const plans = [
    {
      id: "paciente-vip",
      name: "Paciente VIP",
      price: "R$ 99",
      priceValue: 9900,
      period: "/mês",
      tag: "PACIENTE",
      icon: Heart,
      description: "Isenção de taxa no shopping e prioridade de triagem com a Brisa IA.",
      features: [
        "Isenção de taxa de 5% no Shopping",
        "Prioridade na triagem Brisa IA",
        "Chat IA 24/7 ilimitado",
        "Biblioteca Científica completa",
        "Prontuário digital criptografado",
        "Recomendações personalizadas",
      ],
      highlighted: false,
    },
    {
      id: "lojista-vip",
      name: "Lojista VIP",
      price: "R$ 99",
      priceValue: 9900,
      period: "/mês",
      tag: "VENDEDOR",
      icon: Store,
      description: "Taxa de venda zero e destaque nas recomendações do Verdinho.",
      features: [
        "Taxa de venda ZERO no Shopping",
        "Destaque nas recomendações IA",
        "Até 10 produtos cadastrados",
        "3 fotos por produto",
        "Dashboard de vendas em tempo real",
        "Suporte prioritário Verdinho",
        "Selo de loja verificada",
      ],
      highlighted: false,
    },
    {
      id: "medico-vip",
      name: "Médico VIP",
      price: "R$ 99",
      priceValue: 9900,
      period: "/mês",
      tag: "MAIS POPULAR",
      icon: Stethoscope,
      description: "Receba 100% do valor da consulta + selo de verificação premium.",
      features: [
        "100% do valor da consulta (taxa zero)",
        "Selo de Médico Verificado",
        "Telemedicina ilimitada",
        "Prontuário digital ilimitado",
        "Receitas digitais com assinatura",
        "Publicação na Biblioteca Científica",
        "Painel de ganhos e indicações",
        "Suporte dedicado 24/7",
      ],
      highlighted: true,
    }
  ];

  const executeDynamicCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Faça login para assinar um plano.", {
          action: { label: "Login", onClick: () => window.location.href = "/login" },
        });
        setLoadingPlan(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { planId },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Erro ao processar pagamento. Tente novamente.");
        return;
      }

      if (data?.init_point) {
        toast.success("Redirecionando para o Mercado Pago...");
        window.location.href = data.init_point;
        return;
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.error("Erro ao gerar link de pagamento");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleDynamicCheckout = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    showModal(
      { type: "assinatura", planName: plan.name, value: plan.priceValue / 100 },
      () => executeDynamicCheckout(planId)
    );
  };

  return (
    <div className="min-h-dvh bg-background pb-6 sm:pb-0">
      <Navbar />

      <section className="pt-20 pb-24 md:pt-32 md:pb-16 hero-glow">
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <div className="mb-8 md:mb-16 text-center">
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-display font-black text-foreground mb-3 md:mb-4 tracking-tight">
              Planos <span className="text-gradient-green">SaaS</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Escolha o plano ideal para seu perfil. Pagamento via Pix (Mercado Pago), PayPal (USD) ou BTC.
            </p>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto items-stretch relative overflow-visible"
            style={{ zIndex: 10, isolation: 'isolate', transform: 'translateZ(0)', paddingBottom: '1rem' }}
          >
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.id} className="relative flex pt-4 sm:pt-0" style={{ zIndex: 10 }}>
                  <Card className={`relative h-full border-border transition-colors ${plan.highlighted ? 'border-primary/60 ring-1 ring-primary/30' : ''} ${plan.id === 'clinica-familia' ? 'border-amber-500/40' : ''} ${plan.id === 'empresa-parceiros' ? 'border-secondary/40' : ''}`}>
                    {plan.tag && (
                      <div className={`absolute ${plan.id === 'clinica-familia' ? 'top-3 right-3' : '-top-3 right-4'} max-w-[calc(100%-1.5rem)] px-3 py-1 rounded-full text-xs font-black whitespace-nowrap ${
                        plan.highlighted ? 'bg-gradient-green border border-green text-primary' :
                        plan.id === 'clinica-familia' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' :
                        plan.id === 'empresa-parceiros' ? 'bg-secondary/20 border border-secondary/30 text-secondary' :
                        'bg-card border border-border text-muted-foreground'
                      }`}>
                        {plan.tag}
                      </div>
                    )}
                    <CardContent className={`p-5 ${plan.id === 'clinica-familia' ? 'pt-12' : ''}`}>
                      <Icon size={28} className={`mb-2 ${
                        plan.highlighted ? 'text-primary' :
                        plan.id === 'clinica-familia' ? 'text-amber-400' :
                        plan.id === 'empresa-parceiros' ? 'text-secondary' :
                        'text-muted-foreground'
                      }`} />
                      <h3 className="text-lg font-display font-black text-foreground mb-1">{plan.name}</h3>
                      <div className="mb-2">
                        <span className={`text-3xl font-display font-black ${
                          plan.highlighted ? 'text-gradient-green' :
                          plan.id === 'clinica-familia' ? 'text-amber-400' :
                          plan.id === 'empresa-parceiros' ? 'text-[#a78bfa]' :
                          'text-foreground'
                        }`}>{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      {plan.id === 'clinica-familia' && (
                        <div className="mb-3 inline-flex max-w-full items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                          ⭐ Recomendado por +320 famílias
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{plan.description}</p>
                      <ul className="space-y-2 mb-5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${
                              plan.highlighted ? 'text-primary' :
                              plan.id === 'clinica-familia' ? 'text-amber-400' :
                              plan.id === 'empresa-parceiros' ? 'text-secondary' :
                              'text-primary/60'
                            }`} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full font-black rounded-2xl text-sm ${
                          plan.id === 'clinica-familia' ? 'bg-amber-500 text-black hover:bg-amber-400' :
                          plan.id === 'empresa-parceiros' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' :
                          plan.highlighted ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                          'bg-gradient-green border border-green text-primary hover:bg-primary/20'
                        }`}
                        onClick={() => handleDynamicCheckout(plan.id)}
                        disabled={loadingPlan === plan.id}
                      >
                        {loadingPlan === plan.id ? (
                          <><Loader2 size={14} className="mr-2 animate-spin" /> Gerando...</>
                        ) : (
                          <>Assinar <ArrowRight size={14} className="ml-1" /></>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full mt-2 font-black rounded-2xl border-amber-500/40 text-amber-500 hover:bg-amber-500/10 text-xs h-8 hidden sm:flex"
                        onClick={() => setBtcModal({ open: true, planName: plan.name, planId: plan.id, amount: plan.price })}
                      >
                        <Bitcoin size={12} className="mr-1" /> Pague Com BTC
                      </Button>
                      <p className="text-xs text-center text-muted-foreground mt-3 sm:hidden">
                        Quer pagar com BTC?
                        <button onClick={() => setBtcModal({ open: true, planName: plan.name, planId: plan.id, amount: plan.price })} className="text-amber-400 underline ml-1">clique aqui</button>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Comparison highlights */}
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {["✓ Pagamento via Pix", "✓ Cancelamento livre", "✓ Conformidade LGPD", "✓ Frete grátis obrigatório", "✓ Comissão por indicação"].map((item, i) => (
              <span key={i} className="text-sm font-bold text-muted-foreground">{item}</span>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://doutorpark.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-display font-black text-lg cursor-pointer border-2 border-transparent min-h-[44px] justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(45 100% 50%), hsl(30 100% 55%), hsl(15 100% 50%))',
                color: '#1a0a00',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 24px hsl(45 100% 50% / 0.35)',
              }}
             
             
            >
              🌿 Invista Em Cannabis Medicinal <ArrowRight size={22} />
            </a>
          </div>
        </div>
      </section>

      {/* Affiliate section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple pointer-events-none opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Users size={48} className="text-secondary mb-4 mx-auto" />
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
              Programa de <span className="text-gradient-purple">Afiliados</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              Ganhe comissão sobre vendas reais — 3 níveis de indicação.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { level: "Nível 1", pct: "25%", desc: "comissão direta" },
                { level: "Nível 2", pct: "15%", desc: "sub-indicação" },
                { level: "Nível 3", pct: "10%", desc: "rede expandida" },
              ].map((l, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{l.level}</p>
                    <p className="text-2xl font-display font-black text-gradient-purple">{l.pct}</p>
                    <p className="text-xs text-muted-foreground">{l.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Taxa de saque: 5% (isento para Plano Clínica Família)</p>
          </div>
        </div>
      </section>

      {/* Health Subscription Plans removidos — consolidados nos 5 planos SaaS acima para evitar duplicação. */}

      {/* CTA */}
      {/* PWA Install CTA */}
      <div id="instalar-app">
        <PWAInstallSection />
      </div>

      <section className="py-20 md:py-28 hero-glow">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mb-6 tracking-tight">
            Ainda tem dúvidas?
          </h2>
          <Button size="lg" className="font-black bg-primary text-primary-foreground rounded-2xl h-14 px-8" asChild>
            <Link to="/falar-com-especialista">
              Falar com Especialista <ArrowRight size={20} className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Bloco de Conformidade Legal / Autorizações */}
      <section className="py-10 border-t border-border/40 bg-card/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-sm font-display font-black text-foreground mb-4 text-center uppercase tracking-wider">
            Autorizações & Conformidade
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-[11px] text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Razão Social:</strong> Planta y Raiz Ltda · <strong>CNAE 6209-1/00</strong> —
              plataforma digital de intermediação entre pacientes e profissionais de saúde. Não somos uma clínica médica.
            </p>
            <p>
              <strong className="text-foreground">Responsável Técnica:</strong> Dr. Edilson Bezerra ·
              <strong> CRM-PR 49354</strong>. Atendimentos realizados conforme <strong>CFM Resolução nº 2.314/2022</strong> (Telemedicina).
            </p>
            <p>
              <strong className="text-foreground">Cannabis Medicinal:</strong> prescrições e importações seguem a
              <strong> RDC ANVISA nº 660/2022 e nº 327/2019</strong>. Produtos exigem receita médica válida.
            </p>
            <p>
              <strong className="text-foreground">LGPD (Lei 13.709/2018):</strong> dados criptografados em repouso (AES-256).
              Veja <Link to="/politica-de-privacidade" className="text-primary underline">Privacidade</Link>,
              {" "}<Link to="/termos-de-uso" className="text-primary underline">Termos</Link> e
              {" "}<Link to="/lgpd" className="text-primary underline">Direitos LGPD</Link>.
            </p>
            <p>
              <strong className="text-foreground">Direito de Arrependimento:</strong> CDC Art. 49 — 7 dias para cancelar
              assinaturas digitais. Veja <Link to="/politica-de-reembolso" className="text-primary underline">Política de Reembolso</Link>.
            </p>
            <p>
              <strong className="text-foreground">Renovação Automática:</strong> as assinaturas mensais renovam-se
              automaticamente via Mercado Pago/Pix. Você pode cancelar a qualquer momento no painel da sua conta.
            </p>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/70 mt-4">
            Pagamentos processados por Mercado Pago Brasil (PCI-DSS Nível 1). Em caso de urgência médica, ligue 192 (SAMU).
          </p>
        </div>
      </section>

      <WhatsAppProofModal open={modalState.open} onOpenChange={setModalOpen} context={modalState.context} onProceed={modalState.onProceed} />
      <div className="pb-[max(env(safe-area-inset-bottom,0px),1rem)] sm:pb-0">
        <Footer />
      </div>
      <BTCPaymentModal
        open={btcModal.open}
        onClose={() => setBtcModal({ ...btcModal, open: false })}
        planName={btcModal.planName}
        planId={btcModal.planId}
        amount={btcModal.amount}
      />
    </div>
  );
};

export default Precos;
