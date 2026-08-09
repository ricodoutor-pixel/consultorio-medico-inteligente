import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
        { q: "O que é a Planta & Raiz?", a: "Planta & Raiz é uma plataforma que democratiza o acesso a profissionais habilitados, teleatendimento quando aplicável e um Shopping de bem-estar com preços populares e pagamento via Pix." },
        { q: "A Planta & Raiz vende 'cura' ou promete resultados?", a: "Não. A plataforma é de intermediação e educação. Qualquer conduta clínica depende de avaliação individual por profissional habilitado." },
        { q: "Posso usar sem receita médica?", a: "Sim! Você pode consultar profissionais, usar o Shopping de bem-estar e acessar conteúdos. Prescrição só quando aplicável após avaliação." },
      ],
    },
    {
      category: "Profissionais",
      questions: [
        { q: "Os profissionais são verificados?", a: "Sim! Todos passam por verificação de documentos, registro profissional e qualificações antes de estarem disponíveis." },
        { q: "Posso escolher meu profissional?", a: "Sim! Filtre por categoria (5 disponíveis), preço, avaliação e experiência." },
        { q: "Como funciona o atendimento?", a: "Escolha o profissional, pague via Pix e receba atendimento por chat ou vídeo quando aplicável." },
      ],
    },
    {
      category: "Pagamentos",
      questions: [
        { q: "Como funcionam os pagamentos?", a: "Geramos cobrança Pix (Mercado Pago) ou PayPal (USD). Você recebe QR code, link ou instrução de pagamento. Confirmação automática via webhook." },
        { q: "Posso cancelar assinatura?", a: "Sim! Cancelamento a qualquer momento sem taxas ou burocracia." },
        { q: "O pagamento é seguro?", a: "Sim! Usamos Mercado Pago e PayPal com criptografia e conformidade PCI DSS." },
      ],
    },
    {
      category: "Shopping",
      questions: [
        { q: "O que é o Shopping?", a: "É um Shopping multi-vendor com lojas verificadas, produtos de bem-estar e preços populares. Checkout via Pix." },
        { q: "Como garantir qualidade?", a: "Vendedores com verificação (CNPJ/CPF), produtos com laudos/COA, política de devolução e moderação." },
        { q: "Os produtos são legais?", a: "Sim! Todos seguem legislação vigente. Produtos controlados só com prescrição válida." },
      ],
    },
    {
      category: "Legal & Compliance",
      questions: [
        { q: "A plataforma é defensável legalmente?", a: "Sim. Foco em receita por serviço (consulta, intermediação, assinatura popular), sem promessa de retorno financeiro. Termos, LGPD e auditoria." },
        { q: "O que é o modelo de receita?", a: "Taxa sobre consultas (10-20%), take rate do Shopping (8-15%), assinatura popular com benefícios. Sem linguagem de investimento." },
        { q: "Posso usar relatos reais na landing?", a: "Sim, mas apenas com consentimento explícito e documentado. Nomes e fotos ilustrativos devem ser identificados como tal." },
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              FAQ + <span className="text-gradient-gold">Segurança</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transparência, orientação e boas práticas
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
              <a href="https://wa.me/5511991363154?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20a%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
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
