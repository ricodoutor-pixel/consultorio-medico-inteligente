import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQ = () => {
  const faqs = [
    {
      category: "Geral",
      questions: [
        {
          q: "O que é o Doutor Park?",
          a: "O Doutor Park é uma plataforma completa de telemedicina e gestão de consultório online. Oferecemos todas as ferramentas que um médico precisa para atender pacientes remotamente com segurança, organizar sua agenda e gerenciar prontuários digitais."
        },
        {
          q: "A plataforma é aprovada pelo CFM?",
          a: "Sim! O Doutor Park está 100% em conformidade com a resolução CFM 2.314/2022 que regulamenta a telemedicina no Brasil. Todos os atendimentos são registrados conforme as normas do Conselho Federal de Medicina."
        },
        {
          q: "Preciso de conhecimento técnico para usar?",
          a: "Não! Nossa plataforma foi desenvolvida pensando na simplicidade. A interface é intuitiva e oferecemos treinamento completo para você e sua equipe começarem a usar rapidamente."
        }
      ]
    },
    {
      category: "Funcionalidades",
      questions: [
        {
          q: "Como funcionam as consultas por vídeo?",
          a: "As consultas acontecem através de videochamada em HD diretamente na plataforma. Não é necessário instalar nenhum programa adicional. Você e seu paciente acessam o link da consulta e iniciam o atendimento com um clique."
        },
        {
          q: "Posso gravar as consultas?",
          a: "Sim! A plataforma permite gravação automática das consultas com consentimento do paciente, armazenando tudo de forma segura e criptografada conforme a LGPD."
        },
        {
          q: "Como funciona o sistema de agendamento?",
          a: "Nosso sistema inteligente permite que você configure sua disponibilidade e seus pacientes podem agendar consultas online 24/7. A plataforma envia confirmações automáticas por WhatsApp e lembretes para reduzir faltas."
        },
        {
          q: "O prontuário é integrado?",
          a: "Sim! O prontuário eletrônico está totalmente integrado ao sistema. Durante a consulta você pode acessar e atualizar o histórico do paciente, anexar exames e emitir receitas digitais."
        }
      ]
    },
    {
      category: "Segurança e Privacidade",
      questions: [
        {
          q: "Os dados dos pacientes estão seguros?",
          a: "Absolutamente! Utilizamos criptografia de ponta a ponta, servidores seguros no Brasil e estamos 100% em conformidade com a LGPD. Fazemos backup automático diário de todos os dados."
        },
        {
          q: "Quem tem acesso aos dados?",
          a: "Apenas você e os profissionais autorizados da sua clínica têm acesso aos dados dos pacientes. Nós da Doutor Park nunca acessamos informações médicas dos pacientes."
        },
        {
          q: "Como funciona a assinatura digital?",
          a: "Oferecemos integração com certificados digitais ICP-Brasil para assinatura de receitas, atestados e outros documentos médicos com validade legal em todo território nacional."
        }
      ]
    },
    {
      category: "Preços e Pagamento",
      questions: [
        {
          q: "Como funciona o teste grátis?",
          a: "Você tem 30 dias para testar todas as funcionalidades da plataforma sem pagar nada e sem precisar cadastrar cartão de crédito. Se gostar, escolhe um plano e continua usando."
        },
        {
          q: "Posso cancelar a qualquer momento?",
          a: "Sim! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento sem taxas ou burocracia. Seus dados ficam disponíveis para exportação."
        },
        {
          q: "Quais formas de pagamento aceitam?",
          a: "Aceitamos cartão de crédito, boleto bancário e PIX. O pagamento é mensal e você recebe nota fiscal automaticamente."
        }
      ]
    },
    {
      category: "Suporte",
      questions: [
        {
          q: "Como funciona o suporte?",
          a: "Oferecemos suporte via WhatsApp, email e chat dentro da plataforma. No plano Professional e Clínica você tem suporte prioritário com tempo de resposta reduzido."
        },
        {
          q: "Vocês oferecem treinamento?",
          a: "Sim! Todos os planos incluem material de treinamento em vídeo. No plano Clínica oferecemos treinamento ao vivo para toda sua equipe."
        },
        {
          q: "E se eu tiver um problema técnico durante uma consulta?",
          a: "Nosso suporte técnico está disponível durante todo o horário comercial para resolver qualquer problema rapidamente. Além disso, a plataforma tem redundância para garantir máxima disponibilidade."
        }
      ]
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
              Perguntas <span className="text-primary">Frequentes</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Encontre respostas para as dúvidas mais comuns sobre o Doutor Park
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {faqs.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((faq, qIndex) => (
                    <AccordionItem
                      key={qIndex}
                      value={`${catIndex}-${qIndex}`}
                      className="bg-card border border-border rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <span className="font-semibold text-foreground">
                          {faq.q}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg text-muted-foreground mb-6">
              Não encontrou o que procurava?
            </p>
            <Button size="lg" asChild>
              <a
                href="https://wa.me/5511987131241"
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com Nossa Equipe
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
