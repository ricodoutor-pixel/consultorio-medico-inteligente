import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Lock size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Privacidade</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-2">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          </motion.div>
        </div>
      </section>

      <article className="py-10 pb-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-8 text-sm text-muted-foreground leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">1. Introdução</h2>
            <p>A <strong className="text-foreground">Planta y Raiz</strong> está comprometida com a proteção dos dados pessoais de seus usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD). Esta Política descreve como coletamos, utilizamos, armazenamos e protegemos suas informações, com atenção especial aos <strong className="text-foreground">dados sensíveis de saúde</strong>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">2. Dados Coletados</h2>
            <p>Coletamos as seguintes categorias de dados:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Dados de identificação:</strong> nome completo, CPF, data de nascimento, e-mail e telefone.</li>
              <li><strong className="text-foreground">Dados de saúde (sensíveis):</strong> sintomas relatados na triagem, diagnósticos, prescrições, prontuários médicos e histórico de tratamentos canabinoides.</li>
              <li><strong className="text-foreground">Dados de navegação:</strong> endereço IP, tipo de dispositivo, páginas visitadas e cookies essenciais.</li>
              <li><strong className="text-foreground">Dados financeiros:</strong> histórico de transações e plano contratado. <em>Dados de cartão de crédito NÃO são coletados ou armazenados pela Planta y Raiz.</em></li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">3. Tratamento de Dados Sensíveis de Saúde</h2>
            <p>Os dados de saúde são tratados com o mais alto nível de proteção:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Base legal:</strong> consentimento explícito do titular (Art. 11, I, LGPD) e tutela da saúde (Art. 11, II, f).</li>
              <li><strong className="text-foreground">Sigilo do prontuário:</strong> o prontuário médico eletrônico é acessível exclusivamente pelo paciente e pelo profissional de saúde responsável pelo atendimento, conforme Resolução CFM nº 1.638/2002.</li>
              <li><strong className="text-foreground">Criptografia:</strong> dados de saúde são criptografados em repouso (AES-256) e em trânsito (TLS 1.3).</li>
              <li><strong className="text-foreground">Controle de acesso:</strong> acesso por função (RBAC) com logs de auditoria completos para cada visualização ou alteração.</li>
              <li><strong className="text-foreground">Imutabilidade:</strong> registros médicos não podem ser excluídos ou alterados retroativamente. Cada modificação gera um checkpoint auditável.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">4. Processamento de Pagamentos</h2>
            <p>Todos os pagamentos são processados exclusivamente pelo <strong className="text-foreground">Stripe</strong>, gateway certificado PCI-DSS Level 1. A Planta y Raiz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Não armazena</strong> números de cartão de crédito, CVV ou dados bancários em seus servidores;</li>
              <li><strong className="text-foreground">Não processa</strong> transações financeiras diretamente;</li>
              <li>Recebe apenas confirmações de pagamento (status e ID da transação) via webhook seguro e autenticado.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">5. Compartilhamento de Dados</h2>
            <p>Seus dados pessoais poderão ser compartilhados exclusivamente com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Profissionais de saúde cadastrados na plataforma, para fins de atendimento clínico;</li>
              <li>Farmácias e importadoras autorizadas pela ANVISA, para dispensação de prescrições;</li>
              <li>Stripe (processamento de pagamentos);</li>
              <li>Autoridades competentes, quando exigido por lei ou ordem judicial.</li>
            </ul>
            <p><strong className="text-foreground">Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</strong></p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">6. Direitos do Titular (LGPD)</h2>
            <p>Você tem o direito de, a qualquer momento:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Acessar seus dados pessoais mantidos pela plataforma;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Revogar o consentimento para tratamento de dados;</li>
              <li>Solicitar a portabilidade de seus dados;</li>
              <li>Solicitar a exclusão completa de sua conta e dados (sujeito a obrigações legais de retenção).</li>
            </ul>
            <p>Solicitações podem ser feitas via e-mail: <strong className="text-foreground">contato@plantayraiz.com.br</strong>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">7. Retenção de Dados</h2>
            <p>Os dados pessoais são mantidos pelo período necessário para cumprir as finalidades descritas nesta Política. Prontuários médicos são retidos pelo prazo mínimo de <strong className="text-foreground">20 (vinte) anos</strong>, conforme exigência do CFM (Resolução nº 1.821/2007).</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">8. Cookies</h2>
            <p>Utilizamos cookies estritamente essenciais para o funcionamento da plataforma (autenticação e preferências). Cookies analíticos são utilizados apenas com seu consentimento explícito.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">9. Encarregado de Dados (DPO)</h2>
            <p>O encarregado de proteção de dados pode ser contatado pelo e-mail: <strong className="text-foreground">contato@plantayraiz.com.br</strong>.</p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p><strong>Diretor Técnico:</strong> Dr. Edilson Bezerra — CRM 10963 (Bolívia)</p>
            <p>Contato: contato@plantayraiz.com.br</p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default PoliticaDePrivacidade;
