import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const Precos = () => {
  const plans = [
    {
      name: "Starter",
      price: "R$ 197",
      period: "/mês",
      description: "Ideal para médicos iniciando na telemedicina",
      features: [
        "Até 50 consultas/mês",
        "1 médico",
        "Agenda inteligente",
        "Prontuário digital",
        "Telemedicina HD",
        "Suporte via email"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "R$ 397",
      period: "/mês",
      description: "Para médicos estabelecidos",
      features: [
        "Consultas ilimitadas",
        "Até 3 médicos",
        "Todas do Starter +",
        "WhatsApp Business integrado",
        "Relatórios avançados",
        "Suporte prioritário",
        "API de integração"
      ],
      highlighted: true
    },
    {
      name: "Clínica",
      price: "R$ 897",
      period: "/mês",
      description: "Para clínicas e grupos médicos",
      features: [
        "Consultas ilimitadas",
        "Médicos ilimitados",
        "Todas do Professional +",
        "Múltiplas especialidades",
        "White label (sua marca)",
        "Gestor dedicado",
        "Treinamento da equipe"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Planos Transparentes e <span className="text-primary">Sem Surpresas</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para sua prática. Todos incluem 30 dias de teste grátis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.highlighted
                    ? "border-2 border-primary shadow-xl scale-105"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2
                          className="text-secondary shrink-0 mt-1"
                          size={20}
                        />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <a
                      href="https://wa.me/5511987131241"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Começar Teste Grátis
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Todos os planos incluem:
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              {[
                "✓ 30 dias de teste grátis",
                "✓ Sem cartão de crédito",
                "✓ Cancelamento a qualquer momento",
                "✓ Conformidade LGPD e CFM"
              ].map((item, i) => (
                <span key={i} className="text-foreground font-medium">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Perguntas Frequentes sobre Preços
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "Posso mudar de plano depois?",
                a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento, sem burocracia."
              },
              {
                q: "O teste grátis é realmente sem compromisso?",
                a: "Sim, totalmente! Você pode cancelar a qualquer momento durante os 30 dias e não será cobrado nada."
              },
              {
                q: "Existe taxa de setup ou implantação?",
                a: "Não! Todos os nossos planos são mensais e não cobram nenhuma taxa adicional de setup."
              },
              {
                q: "Como funciona o pagamento?",
                a: "Aceitamos cartão de crédito, boleto e PIX. O pagamento é mensal e você recebe nota fiscal automaticamente."
              }
            ].map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ainda tem dúvidas? Vamos conversar!
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Nossa equipe está pronta para te ajudar a escolher o melhor plano
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a
              href="https://wa.me/5511987131241"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar com Especialista
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Precos;
