import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Lock size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">🌿 Privacidade ⚖️</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-2">
              🌿 Política de Privacidade ⚖️
            </h1>
            <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")} — Versão 2.0</p>
          </motion.div>
        </div>
      </section>

      <article className="py-10 pb-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-8 text-sm text-muted-foreground leading-relaxed">

          {/* 1. Introdução */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 1. Introdução e Compromisso</h2>
            <p>A <strong className="text-foreground">Planta y Raiz</strong> está comprometida com a proteção dos dados pessoais de seus usuários, em conformidade com a <strong className="text-foreground">Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)</strong>.</p>
            <p>Esta Política descreve como coletamos, utilizamos, armazenamos e protegemos suas informações, com atenção especial aos <strong className="text-foreground">dados sensíveis de saúde</strong>, dentro de uma infraestrutura projetada com <strong className="text-foreground">segurança em camadas</strong>.</p>
          </section>

          {/* 2. Dados Coletados */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 2. Dados Coletados</h2>
            <p>Coletamos as seguintes categorias de dados:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Dados de identificação:</strong> nome completo, CPF, data de nascimento, e-mail e telefone.</li>
              <li><strong className="text-foreground">Dados de saúde (sensíveis — Art. 5º, II, LGPD):</strong> sintomas relatados na triagem, diagnósticos, prescrições, prontuários médicos e histórico de tratamentos canabinoides.</li>
              <li><strong className="text-foreground">Dados de navegação:</strong> endereço IP, tipo de dispositivo, páginas visitadas e cookies essenciais.</li>
              <li><strong className="text-foreground">Dados financeiros:</strong> histórico de transações e plano contratado. <em>Dados de cartão de crédito NÃO são coletados ou armazenados pela Planta y Raiz.</em></li>
            </ul>
          </section>

          {/* 3. Tratamento de Dados Sensíveis */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 3. Tratamento de Dados Sensíveis de Saúde ⚖️</h2>
            <p>Os dados de saúde recebem o <strong className="text-foreground">mais alto nível de proteção técnica e jurídica</strong>:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Base legal:</strong> consentimento explícito do titular (Art. 11, I, LGPD) e tutela da saúde (Art. 11, II, f).</li>
              <li><strong className="text-foreground">Sigilo do prontuário:</strong> o prontuário médico eletrônico é acessível exclusivamente pelo paciente e pelo profissional de saúde responsável, conforme Resolução CFM nº 1.638/2002.</li>
              <li><strong className="text-foreground">Criptografia em repouso e trânsito:</strong> AES-256 para dados armazenados e TLS 1.3 para transmissão.</li>
              <li><strong className="text-foreground">Controle de acesso por função (RBAC):</strong> cada tipo de usuário acessa somente os dados pertinentes ao seu papel, validado por políticas de segurança em nível de linha (RLS).</li>
              <li><strong className="text-foreground">Imutabilidade:</strong> registros médicos não podem ser excluídos ou alterados retroativamente — cada modificação gera um checkpoint auditável no log.</li>
            </ul>
          </section>

          {/* 4. Isolamento de Dados Financeiros */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 4. Isolamento de Dados Financeiros de Profissionais</h2>
            <p>As informações financeiras dos profissionais de saúde — como <strong className="text-foreground">chaves PIX, dados bancários e documentos fiscais</strong> — são armazenadas em <strong className="text-foreground">tabela segregada</strong> (<em>doctors_financial</em>) com acesso restrito exclusivamente ao próprio profissional e à administração da plataforma.</p>
            <p>Esses dados <strong className="text-foreground">não transitam nem são expostos</strong> em consultas públicas, JOINs de front-end ou qualquer endpoint acessível por outros usuários.</p>
          </section>

          {/* 5. Prescrições e Armazenamento */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 5. Prescrições Digitais e Armazenamento Seguro</h2>
            <p>As receitas médicas digitais são protegidas por <strong className="text-foreground">assinatura digital com hash SHA-256</strong> e armazenadas em bucket privado com políticas de acesso restritivo:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Leitura:</strong> permitida apenas ao paciente titular, ao médico prescritor ou ao administrador;</li>
              <li><strong className="text-foreground">Upload:</strong> permitido apenas ao médico prescritor no diretório do paciente;</li>
              <li><strong className="text-foreground">URLs temporárias:</strong> links de acesso às receitas expiram automaticamente, impedindo compartilhamento não autorizado.</li>
            </ul>
            <p>Este modelo segue as exigências da <strong className="text-foreground">RDC 660/2022</strong> e <strong className="text-foreground">RDC 327/2019</strong> da ANVISA para prescrições de produtos à base de cannabis.</p>
          </section>

          {/* 6. Pagamentos */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 6. Processamento de Pagamentos</h2>
            <p>Os pagamentos são processados através de gateways certificados como <strong className="text-foreground">Mercado Pago</strong> (Brasil) e <strong className="text-foreground">Mercado Pago</strong> (Internacional), ambos certificados PCI-DSS Level 1. A Planta y Raiz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Não armazena</strong> números de cartão de crédito, CVV ou dados bancários de pacientes;</li>
              <li><strong className="text-foreground">Não processa</strong> transações financeiras diretamente;</li>
              <li>Recebe apenas confirmações de pagamento (status e ID da transação) via webhook seguro e autenticado.</li>
            </ul>
          </section>

          {/* 7. Compartilhamento */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 7. Compartilhamento de Dados</h2>
            <p>Seus dados pessoais poderão ser compartilhados exclusivamente com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Profissionais de saúde cadastrados na plataforma, para fins de orientação técnica;</li>
              <li>Farmácias e importadoras autorizadas pela ANVISA, para dispensação de prescrições;</li>
              <li>Mercado Pago e Mercado Pago (processamento de pagamentos);</li>
              <li>Autoridades competentes, quando exigido por lei ou ordem judicial.</li>
            </ul>
            <p><strong className="text-foreground">🌿 Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</strong></p>
          </section>

          {/* 8. Direitos do Titular */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 8. Direitos do Titular (LGPD — Art. 18) ⚖️</h2>
            <p>Você tem o direito de, a qualquer momento:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>✅ Acessar seus dados pessoais mantidos pela plataforma;</li>
              <li>✅ Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>✅ Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>✅ Revogar o consentimento para tratamento de dados;</li>
              <li>✅ Solicitar a portabilidade de seus dados;</li>
              <li>✅ Solicitar a exclusão completa de sua conta e dados (sujeito a obrigações legais de retenção de prontuário — mínimo 20 anos, CFM nº 1.821/2007).</li>
            </ul>
            <p>Solicitações podem ser feitas via e-mail: <strong className="text-foreground">contato@plantayraiz.com.br</strong> ou diretamente pela plataforma através da funcionalidade de "Solicitar Exclusão de Dados".</p>
          </section>

          {/* 9. Auditoria e Logs */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 9. Auditoria e Rastreabilidade</h2>
            <p>Todas as ações na plataforma são registradas em <strong className="text-foreground">log de auditoria imutável</strong>, incluindo:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Quem acessou qual dado e quando (usuário, IP, timestamp);</li>
              <li>Todas as alterações em prontuários e prescrições;</li>
              <li>Registros de consentimento com versão e user-agent;</li>
              <li>Tentativas de acesso não autorizado.</li>
            </ul>
            <p>Estes logs são protegidos contra exclusão e são acessíveis exclusivamente pela administração técnica da plataforma para fins de compliance.</p>
          </section>

          {/* 10. Retenção */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 10. Retenção de Dados</h2>
            <p>Os dados pessoais são mantidos pelo período necessário para cumprir as finalidades descritas nesta Política:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Prontuários médicos:</strong> retidos por no mínimo <strong className="text-foreground">20 (vinte) anos</strong> (Resolução CFM nº 1.821/2007);</li>
              <li><strong className="text-foreground">Dados de transações:</strong> retidos pelo prazo fiscal de 5 anos;</li>
              <li><strong className="text-foreground">Dados de navegação e cookies:</strong> retidos por até 12 meses.</li>
            </ul>
          </section>

          {/* 11. Cookies */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 11. Cookies</h2>
            <p>Utilizamos cookies estritamente essenciais para o funcionamento da plataforma (autenticação e preferências de sessão). Cookies analíticos são utilizados apenas com seu <strong className="text-foreground">consentimento explícito</strong>, registrado no sistema de consentimento versionado da plataforma.</p>
          </section>

          {/* 12. DPO */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 12. Encarregado de Dados (DPO)</h2>
            <p>O encarregado de proteção de dados pode ser contatado pelo e-mail: <strong className="text-foreground">contato@plantayraiz.com.br</strong>.</p>
            <p>Reclamações sobre o tratamento de dados também podem ser encaminhadas à <strong className="text-foreground">Autoridade Nacional de Proteção de Dados (ANPD)</strong>.</p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p>🌿 <strong>Supervisora Técnica:</strong> Dra. Suelen Naves Rodrigues — CRM-PR 49354</p>
            <p>📧 Contato: contato@plantayraiz.com.br</p>
            <p className="mt-2">Este documento faz parte do sistema de governança da Planta y Raiz, com consentimento versionado (v2.0) e registro em log de auditoria imutável conforme a LGPD.</p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default PoliticaDePrivacidade;
