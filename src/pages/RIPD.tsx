import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, FileText, Eye, Database, Server, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const sections = [
  {
    title: "1. Identificação do Controlador",
    icon: FileText,
    content: [
      "Razão Social: Planta y Raiz — Tecnologia em Saúde Digital Ltda.",
      "CNAE Principal: 6209-1/00 (Suporte técnico, manutenção e outros serviços em tecnologia da informação) — atuação como plataforma de intermediação digital em telessaúde.",
      "Encarregado de Dados (DPO) — interino: Dra. Suelen Naves Rodrigues, CRM-PR 49354 · Supervisora Técnica Médica.",
      "Canal oficial do DPO: dpo@plantayraiz.com.br · WhatsApp +55 11 99136-3154 (Enfª Brisa redireciona ao DPO).",
      "Substituição do DPO interino por DPO terceirizado especializado em LGPD está prevista para o próximo ciclo de governança; este RIPD será atualizado na nomeação.",
      "Supervisora Técnica Médica Responsável: Dra. Suelen Naves Rodrigues — CRM-PR 49354.",
    ],

  },
  {
    title: "2. Descrição do Tratamento de Dados",
    icon: Database,
    content: [
      "Finalidade: Prestação de serviços de telemedicina em cannabis medicinal, incluindo agendamento de consultas, orientação técnica onlines (vídeo/chat), emissão de prescrições digitais, e gestão de prontuários eletrônicos.",
      "Base Legal: Consentimento explícito do titular (Art. 11, II, 'a', LGPD) e tutela da saúde (Art. 7º, VIII e Art. 11, II, 'f').",
      "Dados Coletados: Nome completo, CPF, data de nascimento, e-mail, telefone, dados clínicos (queixas, diagnósticos, medicações, CID-10), dados biométricos de wearables (quando autorizados), endereço IP e logs de acesso.",
      "Tempo de Retenção: Prontuários eletrônicos: 20 anos (Resolução CFM nº 1.821/2007). Dados de pagamento: 5 anos (legislação fiscal). Logs de auditoria: 5 anos.",
    ],
  },
  {
    title: "3. Necessidade e Proporcionalidade",
    icon: Eye,
    content: [
      "Os dados pessoais são coletados estritamente para a finalidade de atendimento médico e são proporcionais às necessidades clínicas.",
      "Dados sensíveis de saúde são tratados sob consentimento explícito (TCLE digital) assinado antes de cada orientação técnica online.",
      "Dados de wearables (frequência cardíaca, sono, etc.) são opcionais e coletados apenas com autorização expressa.",
      "Não há compartilhamento de dados com terceiros para fins de marketing ou publicidade.",
    ],
  },
  {
    title: "4. Medidas de Segurança Técnicas",
    icon: Lock,
    content: [
      "Criptografia em trânsito: TLS 1.3 em todas as comunicações.",
      "Criptografia em repouso: AES-256 para dados sensíveis de saúde no banco de dados.",
      "Autenticação: Login com e-mail/senha + suporte a MFA/2FA para médicos.",
      "Controle de Acesso: RBAC (Role-Based Access Control) com tabela de roles separada — admin, moderator, user.",
      "Row-Level Security (RLS): Políticas granulares que restringem acesso a dados por usuário/role.",
      "Auditoria: Tabela audit_log com registro de todas as operações sobre dados sensíveis (quem, quando, o quê).",
      "Orientação Técnica Online: Vídeo via WebRTC (Jitsi) sem gravação por padrão (Art. 7º, CFM 2.314/2022). Chat criptografado E2E.",
      "Assinatura Digital: Prescrições assinadas com certificado ICP-Brasil (Lei 14.063/2020).",
      "Headers de Segurança: HSTS, CSP, X-Frame-Options, X-XSS-Protection, X-Content-Type-Options.",
      "Backups: Automáticos a cada 6 horas com criptografia.",
    ],
  },
  {
    title: "5. Riscos Identificados e Mitigações",
    icon: AlertTriangle,
    risks: [
      { risk: "Acesso não autorizado a prontuários", mitigation: "RLS + RBAC + auditoria + criptografia AES-256", severity: "Alto" },
      { risk: "Interceptação de orientação técnica online", mitigation: "WebRTC com SRTP + TLS 1.3 + sem gravação padrão", severity: "Alto" },
      { risk: "Vazamento de dados sensíveis", mitigation: "Criptografia em repouso/trânsito + backup criptografado", severity: "Crítico" },
      { risk: "Uso indevido de IA para diagnóstico", mitigation: "IA como apoio apenas — revisão médica obrigatória (CFM 2454/2026)", severity: "Médio" },
      { risk: "Manipulação de prescrições", mitigation: "Assinatura digital ICP-Brasil + validação ITI + RLS", severity: "Alto" },
      { risk: "Perda de dados de prontuário", mitigation: "Backup automático 6h + retenção 20 anos + redundância", severity: "Alto" },
    ],
  },
  {
    title: "6. Direitos dos Titulares",
    icon: Shield,
    content: [
      "Acesso: O paciente pode visualizar todos seus dados pessoais e clínicos via Dashboard do Paciente.",
      "Retificação: Atualização de dados cadastrais via perfil.",
      "Eliminação: Solicitação via e-mail ao DPO (respeitando retenções legais obrigatórias).",
      "Portabilidade: Exportação de prontuário em formato texto/PDF.",
      "Revogação de Consentimento: A qualquer momento, via solicitação ao DPO.",
      "Oposição: Direito de recusa ao tratamento por telemedicina (Art. 7º, TCLE).",
      "Canal de Atendimento: dpo@plantayraiz.com.br | Resposta em até 15 dias úteis.",
    ],
  },
  {
    title: "7. Compartilhamento de Dados",
    icon: Server,
    content: [
      "Farmácias Autorizadas: Dados de prescrição compartilhados apenas com farmácias selecionadas pelo paciente, para fins de dispensação.",
      "Processadores de Pagamento: Mercado Pago (dados limitados ao necessário para transação financeira).",
      "Infraestrutura: Supabase (PostgreSQL) com servidores em conformidade com soberania de dados.",
      "Nenhum dado é vendido ou compartilhado com terceiros para fins comerciais.",
    ],
  },
];

const RIPD = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-purple border border-purple flex items-center justify-center">
                <Shield size={24} className="text-secondary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">
                  RIPD — <span className="text-gradient-purple">Relatório de Impacto</span>
                </h1>
                <p className="text-xs text-muted-foreground font-semibold">
                  Relatório de Impacto à Proteção de Dados Pessoais • LGPD Art. 38
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 my-6">
              <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary">LGPD Lei 13.709/2018</Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">CFM 2.314/2022</Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">RDC ANVISA 660/2022</Badge>
              <Badge variant="outline" className="text-[10px]">RIPD v1.0 — Publicado em {new Date().toLocaleDateString("pt-BR")}</Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">DPO Interina: Dr. Edilson Bezerra</Badge>

            </div>

            <div className="space-y-6">
              {sections.map((section, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <section.icon size={18} className="text-primary" /> {section.title}
                    </h2>
                    {section.content && (
                      <ul className="space-y-3">
                        {section.content.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.risks && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 text-xs font-bold text-muted-foreground">Risco</th>
                              <th className="text-left py-2 text-xs font-bold text-muted-foreground">Mitigação</th>
                              <th className="text-left py-2 text-xs font-bold text-muted-foreground">Severidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.risks.map((r, j) => (
                              <tr key={j} className="border-b border-border/50">
                                <td className="py-2 text-foreground text-xs">{r.risk}</td>
                                <td className="py-2 text-muted-foreground text-xs">{r.mitigation}</td>
                                <td className="py-2">
                                  <Badge className={`text-[10px] ${
                                    r.severity === "Crítico" ? "bg-destructive/10 text-destructive" :
                                    r.severity === "Alto" ? "bg-[hsl(45,76%,52%)]/10 text-[hsl(45,76%,52%)]" :
                                    "bg-primary/10 text-primary"
                                  }`}>{r.severity}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border mt-6">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">
                  Este RIPD foi elaborado em conformidade com o Art. 38 da LGPD (Lei 13.709/2018) e será revisado semestralmente ou sempre que houver alteração significativa no tratamento de dados pessoais. A Autoridade Nacional de Proteção de Dados (ANPD) pode solicitar este relatório a qualquer momento.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default RIPD;
