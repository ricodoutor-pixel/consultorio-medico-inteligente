import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText, Mail, Server, UserCheck, AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const controls = [
  {
    icon: Lock,
    title: "Autenticação e acesso",
    items: [
      "Login por e-mail/senha e Google OAuth (Lovable Cloud / Supabase Auth).",
      "Proteção contra força bruta (5 tentativas, bloqueio de 2 minutos).",
      "Controle de papéis (RBAC) em tabela dedicada — sem escalonamento de privilégio.",
      "Sessões com refresh token e expiração automática.",
    ],
  },
  {
    icon: Server,
    title: "Plataforma e hospedagem",
    items: [
      "Frontend hospedado em CDN com TLS obrigatório (HTTPS) e HSTS.",
      "Backend e banco de dados gerenciados (Lovable Cloud / Supabase).",
      "Infraestrutura adicional em Oracle Cloud (bot WhatsApp e n8n).",
      "Backups automáticos diários do banco de dados.",
    ],
  },
  {
    icon: Database,
    title: "Coleta e uso de dados",
    items: [
      "Coletamos apenas dados necessários para cadastro, atendimento, pagamento e cumprimento legal.",
      "Dados de saúde são tratados como sensíveis (LGPD) e acessados somente pela equipe clínica autorizada.",
      "Mascaramento de PII (contatos) em logs e dashboards internos.",
      "Row-Level Security (RLS) ativo em todas as tabelas com dados de usuário.",
    ],
  },
  {
    icon: UserCheck,
    title: "Subprocessadores e integrações",
    items: [
      "Pagamentos: Mercado Pago (PCI-DSS Level 1).",
      "Mensageria: WhatsApp via Evolution API / Meta.",
      "IA: Lovable AI Gateway (Google Gemini) para o bot Brisa.",
      "Vídeo: Jitsi (WebRTC) para teleconsulta.",
    ],
  },
  {
    icon: Eye,
    title: "Cookies e analytics",
    items: [
      "Banner de consentimento de cookies (LGPD) com opção de recusar não-essenciais.",
      "Analytics: Meta Pixel / CAPI e Google Analytics — somente após consentimento.",
      "Cookies essenciais (sessão, idioma) podem ser usados sem consentimento explícito.",
    ],
  },
  {
    icon: FileText,
    title: "Retenção e exclusão",
    items: [
      "Dados de cadastro mantidos enquanto a conta estiver ativa.",
      "Dados clínicos retidos conforme prazos da legislação sanitária brasileira.",
      "Solicite exclusão da sua conta em /lgpd-direitos ou por e-mail ao DPO.",
    ],
  },
  {
    icon: Shield,
    title: "Webhooks e integrações financeiras",
    items: [
      "Webhooks de pagamento e WhatsApp protegidos por HMAC-SHA256.",
      "Edge functions com rate-limiting por IP em endpoints públicos.",
      "Validação estrita de telefone e e-mail antes de qualquer disparo.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Resposta a incidentes",
    items: [
      "Monitoramento contínuo de erros (logs e alertas via Discord SRE).",
      "Em caso de incidente envolvendo dados pessoais, notificamos a ANPD e os titulares afetados conforme a LGPD.",
      "Reporte vulnerabilidades a contato@plantayraiz.com.br (assunto: 'Security').",
    ],
  },
];

const Confianca = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Central de Confiança — Planta y Raiz</title>
        <meta
          name="description"
          content="Práticas de segurança, privacidade e conformidade da Planta y Raiz. Esta página é mantida pela equipe Planta y Raiz e descreve controles atualmente ativos na plataforma."
        />
        <link rel="canonical" href="https://www.plantayraiz.com.br/confianca" />
      </Helmet>

      <Navbar />

      <section className="pt-24 pb-10 md:pt-32">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield size={24} className="text-primary" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-primary">
              Central de Confiança
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
            Segurança, privacidade e <span className="text-gradient-green">transparência</span>
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Esta página é mantida pela equipe da <strong>Planta y Raiz Saúde Digital Ltda.</strong> para
            responder dúvidas comuns sobre segurança e privacidade da nossa plataforma. O conteúdo é
            informativo e descreve controles atualmente ativos — não constitui certificação independente.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-muted/40 border border-border text-sm text-muted-foreground max-w-3xl">
            <strong className="text-foreground">Responsabilidade compartilhada:</strong> alguns
            controles são fornecidos pela infraestrutura (Lovable Cloud, Mercado Pago, provedores de
            CDN). Outros são responsabilidade da Planta y Raiz (configuração, políticas, equipe). O
            uso seguro da conta (senha forte, dispositivo confiável) é responsabilidade do usuário.
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-4">
            {controls.map((c, i) => (
              <Card key={i} className="border-border h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <c.icon size={20} className="text-primary" />
                    </div>
                    <h2 className="font-display font-black text-foreground text-base">{c.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {c.items.map((it, j) => (
                      <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={14} className="text-primary shrink-0 mt-1" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 pb-20">
        <div className="container mx-auto px-4">
          <Card className="border-border">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Mail size={20} className="text-primary mt-1" />
                <div>
                  <h2 className="font-display font-black text-foreground text-lg mb-1">
                    Contato — Privacidade, segurança e LGPD
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Encarregado de Dados (DPO) e canal de segurança:{" "}
                    <a href="mailto:contato@plantayraiz.com.br" className="text-primary font-medium">
                      contato@plantayraiz.com.br
                    </a>
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-6 text-sm">
                <Link to="/privacidade" className="p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors">
                  <strong className="block text-foreground">Política de Privacidade</strong>
                  <span className="text-muted-foreground text-xs">Como tratamos dados pessoais</span>
                </Link>
                <Link to="/termos" className="p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors">
                  <strong className="block text-foreground">Termos de Uso</strong>
                  <span className="text-muted-foreground text-xs">Regras da plataforma</span>
                </Link>
                <Link to="/lgpd" className="p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors">
                  <strong className="block text-foreground">Direitos LGPD</strong>
                  <span className="text-muted-foreground text-xs">Acesso, correção, exclusão</span>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-6">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}. Esta página é conteúdo
                editável de propriedade da Planta y Raiz e pode ser atualizada conforme mudanças na
                plataforma ou na legislação aplicável.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Confianca;
