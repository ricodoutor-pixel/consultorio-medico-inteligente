import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Scale, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const regulations = [
  {
    icon: Shield,
    title: "ANVISA RDC 327/2019",
    status: "Conforme",
    description: "Regulamentação da telemedicina e prescrição de cannabis medicinal no Brasil.",
    details: "A plataforma opera em conformidade com a RDC 327/2019 da ANVISA, que regulamenta a fabricação, importação, comercialização, prescrição, dispensação, monitoramento e fiscalização de produtos de Cannabis para fins medicinais e de pesquisa. Todos os profissionais cadastrados possuem registro ativo nos respectivos conselhos profissionais (CRM, CRF, CRP). As prescrições são geradas digitalmente com assinatura eletrônica válida conforme Medida Provisória nº 2.200-2/2001.",
  },
  {
    icon: Lock,
    title: "LGPD — Lei Geral de Proteção de Dados",
    status: "Conforme",
    description: "Proteção integral dos dados pessoais e sensíveis dos usuários.",
    details: "A Planta & Raiz implementa todas as medidas exigidas pela Lei 13.709/2018 (LGPD). Dados pessoais são coletados com consentimento explícito do titular, armazenados com criptografia AES-256, e processados apenas para as finalidades declaradas. O encarregado de dados (DPO) pode ser contatado pelo e-mail contato@plantayraiz.com.br. Dados de saúde são tratados como dados sensíveis com proteções adicionais, incluindo acesso restrito por função (RBAC) e logs de auditoria completos.",
  },
  {
    icon: Scale,
    title: "PCI-DSS — Segurança de Pagamentos",
    status: "Conforme",
    description: "Padrão internacional de segurança para transações financeiras.",
    details: "Os pagamentos são processados integralmente pelo Mercado Pago, certificado PCI-DSS Level 1. A Planta & Raiz não armazena, processa ou transmite dados de cartão de crédito. As transações PIX utilizam a infraestrutura segura do Banco Central do Brasil via API do Mercado Pago, com confirmação automática por webhook autenticado. Todas as comunicações utilizam TLS 1.3.",
  },
  {
    icon: Eye,
    title: "WCAG 2.1 — Acessibilidade",
    status: "Conforme",
    description: "Diretrizes de acessibilidade para conteúdo web — nível AA completo.",
    details: "A plataforma atende todas as diretrizes WCAG 2.1 nível AA: skip navigation ('Pular para conteúdo'), landmarks semânticos (nav, main, footer), aria-labels em todos os elementos interativos, focus-visible com anel de 2px, suporte a prefers-reduced-motion (desativa animações), prefers-contrast (alto contraste), alvos de toque mínimos de 44×44px, textos alternativos em imagens, hierarquia semântica de cabeçalhos H1–H6, formulários acessíveis com labels, e testes regulares com NVDA/VoiceOver.",
  },
];

const termos = [
  {
    title: "1. Natureza da Plataforma",
    content: "A Planta & Raiz é uma plataforma de intermediação que conecta pacientes a profissionais de saúde habilitados e a estabelecimentos autorizados pela ANVISA para comercialização de produtos à base de cannabis. A plataforma não pratica medicina, não prescreve medicamentos e não se responsabiliza por condutas clínicas individuais dos profissionais cadastrados.",
  },
  {
    title: "2. Cadastro e Verificação",
    content: "Profissionais de saúde são verificados quanto ao registro ativo nos conselhos profissionais (CRM, CRF, CRP, CREFITO). Farmácias e produtores devem apresentar autorização ANVISA vigente. A plataforma reserva-se o direito de suspender ou cancelar cadastros que não atendam aos requisitos de verificação.",
  },
  {
    title: "3. Pagamentos e Comissões",
    content: "Todos os pagamentos são processados via PIX através do Mercado Pago. A plataforma opera com um modelo de comissões multinível (50% Nível 1, 5% Nível 2, 2% Nível 3) e uma taxa de administração de 5% sobre vendas de não-assinantes. Saques estão sujeitos a uma taxa de 5%, exceto para o plano Clínica Família. Os repasses são processados automaticamente conforme as regras do plano contratado.",
  },
  {
    title: "4. Proteção de Dados",
    content: "Os dados pessoais e de saúde dos usuários são protegidos conforme a LGPD (Lei 13.709/2018). O tratamento de dados sensíveis de saúde é realizado com consentimento explícito do titular e segue padrões de segurança compatíveis com a natureza dos dados tratados.",
  },
  {
    title: "5. Limitação de Responsabilidade",
    content: "A plataforma não se responsabiliza por: (a) condutas clínicas dos profissionais cadastrados; (b) qualidade dos produtos comercializados por terceiros; (c) resultados terapêuticos individuais; (d) uso inadequado de produtos adquiridos. O conteúdo educativo disponibilizado não substitui orientação médica profissional.",
  },
  {
    title: "6. Propriedade Intelectual",
    content: "Todo o conteúdo da plataforma, incluindo textos, imagens, logotipos, software e base de dados, é protegido por direitos autorais e de propriedade intelectual. É vedada a reprodução, distribuição ou modificação sem autorização expressa.",
  },
];

const Legal = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold border border-gold flex items-center justify-center">
                <Scale size={24} className="text-[hsl(45,76%,52%)]" />
              </div>
              <span className="text-sm font-bold text-[hsl(45,76%,52%)]">CONFORMIDADE & LEGAL</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Segurança Jurídica <span className="text-gradient-green">Total</span>
            </h1>
            <p className="text-muted-foreground max-w-3xl font-medium">
              A Planta & Raiz opera em total conformidade com a legislação brasileira, garantindo segurança jurídica, proteção de dados e transparência em todas as operações.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Regulations */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-black text-foreground mb-8">Regulações Implementadas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {regulations.map((reg, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card className="border-border h-full hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <reg.icon size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-black text-foreground text-sm">{reg.title}</h3>
                        <span className="text-xs text-primary font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> {reg.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{reg.description}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{reg.details}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-black text-foreground mb-8 flex items-center gap-2">
            <FileText size={20} className="text-secondary" /> Termos de Serviço
          </h2>
          <div className="max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {termos.map((t, i) => (
                <AccordionItem key={i} value={`t-${i}`} className="bg-card border border-border rounded-2xl px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-black text-foreground text-sm">{t.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                    {t.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-12 pb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-black text-foreground mb-8 flex items-center gap-2">
            <Lock size={20} className="text-primary" /> Medidas de Segurança
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            {[
              "Criptografia TLS 1.3 (HTTPS obrigatório)",
              "Autenticação 2FA (SMS + app)",
              "JWT com refresh tokens",
              "Rate limiting (100 req/min por IP)",
              "CORS configurado por domínio",
              "Backup automático diário",
              "Logs de auditoria completos",
              "Monitoramento 24/7",
              "Testes de penetração mensais",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border">
                <CheckCircle2 size={14} className="text-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Legal;
