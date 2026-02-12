import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FAQ = () => {
  const faqs = [
    {
      category: "Geral",
      questions: [
        { q: "O que é a Planta & Raiz?", a: "Planta & Raiz é uma plataforma completa que democratiza o acesso a terapias e medicamentos à base de cannabis medicinal com telemedicina, marketplace, profissionais verificados e programa de indicação." },
        { q: "Isso substitui consulta médica?", a: "Não. A plataforma organiza acesso e acompanhamento. Prescrição e conduta clínica dependem de avaliação individual por profissional habilitado." },
        { q: "Preciso de receita para usar a plataforma?", a: "Não! Você pode usar a plataforma para triagem, consultas e conteúdos. A prescrição só ocorre após avaliação por profissional, quando aplicável." },
      ],
    },
    {
      category: "Consultas e Profissionais",
      questions: [
        { q: "Como funciona a consulta?", a: "Você faz a triagem, escolhe o profissional (filtros por especialidade, preço e avaliação), paga via Pix e consulta por chat ou vídeo dentro da plataforma." },
        { q: "Os profissionais são verificados?", a: "Sim! Todos os profissionais passam por verificação de documentos, CRM e qualificações antes de estarem disponíveis na plataforma." },
        { q: "Posso escolher meu profissional?", a: "Sim! Você pode filtrar por especialidade, idioma, preço e avaliação para escolher o profissional que melhor se adequa às suas necessidades." },
      ],
    },
    {
      category: "Pagamentos",
      questions: [
        { q: "Como funciona o pagamento via Pix?", a: "Geramos cobrança Pix pela API do Mercado Pago. Você recebe um QR code e/ou código copia-e-cola. A confirmação é automática via webhook." },
        { q: "Quais formas de pagamento são aceitas?", a: "Atualmente trabalhamos exclusivamente com Pix via Mercado Pago, garantindo rapidez e segurança nas transações." },
        { q: "Posso cancelar minha assinatura?", a: "Sim! Você pode cancelar a qualquer momento sem taxas ou burocracia." },
      ],
    },
    {
      category: "Marketplace",
      questions: [
        { q: "O que é o marketplace?", a: "É um espaço multi-vendor com lojas, farmácias, suplementos e produtos de bem-estar verificados. Checkout via Pix com repasse automático." },
        { q: "Os produtos são legais?", a: "Sim! Todos os produtos listados seguem a legislação vigente. Produtos controlados só são disponibilizados com prescrição válida." },
      ],
    },
    {
      category: "Indicação e Afiliados",
      questions: [
        { q: "Como funciona o programa de indicação?", a: "Você recebe um link/código único. Comissões são pagas por venda real (assinaturas, consultas ou marketplace) com antifraude e auditoria." },
        { q: "Quanto posso ganhar indicando?", a: "Até 25% da taxa da plataforma no 1º nível, 10% no 2º nível e 5% no 3º nível. Comissões são sobre a taxa da plataforma, não sobre o total." },
        { q: "Existe algum risco?", a: "Não! Não é investimento nem rendimento garantido. É simplesmente comissão por venda real de serviços/produtos." },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              Perguntas <span className="text-gradient-gold">Frequentes</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Confiança = conversão + recorrência. Tire todas as suas dúvidas.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            {faqs.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 className="text-xl font-display font-bold text-foreground mb-4">{category.category}</h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {category.questions.map((faq, qIndex) => (
                    <AccordionItem
                      key={qIndex}
                      value={`${catIndex}-${qIndex}`}
                      className="bg-card border border-border rounded-xl px-6"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <span className="font-bold text-foreground text-sm">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6">Não encontrou o que procurava?</p>
            <Button size="lg" className="font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
              <a href="https://wa.me/5511987131241?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20a%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
                Falar com Nossa Equipe <ArrowRight size={20} className="ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
