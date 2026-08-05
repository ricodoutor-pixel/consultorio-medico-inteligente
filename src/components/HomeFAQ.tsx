import { useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "É legal usar Cannabis Medicinal no Brasil?",
    a: "Sim. A Cannabis Medicinal é regulamentada pela ANVISA através das RDCs 327/2019 (produtos nacionais) e 660/2022 (importação por pessoa física). O paciente precisa de prescrição médica e, no caso de importação, de autorização da ANVISA — todo o processo é feito de forma legal e segura pela plataforma Planta y Raiz.",
  },
  {
    q: "Como funciona a Orientação Técnica de R$ 30?",
    a: "Você inicia uma triagem rápida com a Enfª Brisa pelo WhatsApp, paga R$ 30 via Pix seguro (Mercado Pago) e recebe a Orientação Técnica do Dra. Suelen Naves Rodrigues em PDF assinado digitalmente com ICP-Brasil e selo gov.br. Pacientes internacionais pagam US$ 10. Não é consulta nem prescrição — é orientação educativa sobre o sistema endocanabinoide.",
  },
  {
    q: "Como recebo minha receita médica?",
    a: "Após a Orientação Técnica, se houver indicação clínica, você é encaminhado a um médico prescritor parceiro habilitado. A receita é emitida com assinatura digital ICP-Brasil válida em todo Brasil, enviada por WhatsApp e e-mail, e pode ser usada tanto em farmácias nacionais quanto para importação via RDC 660/2022.",
  },
  {
    q: "A Planta y Raiz aceita plano de saúde?",
    a: "No momento atendemos exclusivamente em modalidade particular, com pagamento via Pix (R$ 30) ou cartão. Esse modelo nos permite manter o preço popular acessível e o atendimento ágil 24/7. Você pode solicitar nota fiscal para reembolso junto ao seu plano conforme a cobertura contratada.",
  },
  {
    q: "O que é o sistema endocanabinoide?",
    a: "É um sistema biológico presente em todos os mamíferos, formado por receptores (CB1 e CB2), endocanabinoides (anandamida e 2-AG) e enzimas, que regula sono, dor, humor, apetite, imunidade e homeostase. Os canabinoides da Cannabis (CBD, THC e outros) interagem com esse sistema, modulando funções fisiológicas — base científica de toda a Medicina Endocanabinoide.",
  },
];

export function HomeFAQ() {
  // Injeta Schema.org FAQPage (rich snippets do Google)
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-faq-home", "true");
    script.text = JSON.stringify(schema);
    // remove versão antiga se houver
    document.head.querySelectorAll('script[data-faq-home="true"]').forEach((n) => n.remove());
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <section className="section-padding bg-background" aria-labelledby="home-faq-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-black uppercase tracking-wider text-primary mb-4">
            <HelpCircle size={14} /> Perguntas Frequentes
          </span>
          <h2 id="home-faq-title" className="font-display font-black text-3xl md:text-5xl mb-4">
            Tire suas <span className="text-gradient-green">dúvidas</span>
          </h2>
          <p className="text-muted-foreground font-medium">
            Tudo o que você precisa saber sobre Cannabis Medicinal, legalidade e como acessar tratamento na Planta y Raiz.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card/40 backdrop-blur-sm border border-border rounded-2xl px-5 sm:px-6 data-[state=open]:border-primary/40 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 font-bold text-sm sm:text-base text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

export default HomeFAQ;
