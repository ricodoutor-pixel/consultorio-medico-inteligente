import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const TermosDeUso = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">🌿 Documento Legal ⚖️</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-2">
              🌿 Termos de Uso ⚖️
            </h1>
            <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")} — Versão 2.0</p>
          </motion.div>
        </div>
      </section>

      <article className="py-10 pb-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-8 text-sm text-muted-foreground leading-relaxed">

          {/* 1. Natureza */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 1. Objeto e Natureza da Plataforma (Intermediação Tecnológica)</h2>
            <p>A <strong className="text-foreground">Planta y Raiz Ltda</strong> é uma <strong className="text-foreground">plataforma de intermediação tecnológica</strong> (CNAE 6209-1/00) cujo único objeto é conectar, por meio digital, três partes independentes: (i) <strong className="text-foreground">Pacientes</strong> interessados em acessar orientação técnica em saúde canabinoide; (ii) <strong className="text-foreground">Médicos prescritores</strong> devidamente habilitados e registrados em seus respectivos conselhos profissionais; e (iii) <strong className="text-foreground">Farmácias e importadoras</strong> licenciadas pela ANVISA.</p>
            <p>A Planta y Raiz <strong className="text-foreground">NÃO fabrica, NÃO produz, NÃO manipula, NÃO distribui, NÃO entrega e NÃO vende</strong> qualquer produto farmacêutico, fitoterápico ou insumo. A plataforma <strong className="text-foreground">não detém posse, custódia ou propriedade</strong> de nenhum produto em nenhum momento da cadeia. Qualquer transação financeira relacionada a produtos ocorre <strong className="text-foreground">diretamente entre o paciente e a farmácia/importadora parceira</strong>, ou entre o paciente e o médico (para honorários), podendo ser operacionalizada por gateway de pagamento terceirizado, sem que a Planta y Raiz figure como vendedora, revendedora ou intermediária comercial dos produtos.</p>
            <p>A plataforma <strong className="text-foreground">não pratica medicina, não prescreve medicamentos e não interfere na cadeia de suprimentos farmacêutica</strong>. Todo atendimento é realizado por profissionais independentes com registro ativo em seus conselhos.</p>
          </section>


          {/* 2. Responsabilidade Médica */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 2. Responsabilidade Médica e Conduta Clínica</h2>
            <p>A Planta y Raiz atua exclusivamente como <strong className="text-foreground">meio tecnológico</strong> para viabilizar o encontro entre paciente e profissional de saúde. A <strong className="text-foreground">conduta clínica, o diagnóstico, a prescrição e o acompanhamento terapêutico são de responsabilidade exclusiva do profissional prescritor</strong>.</p>
            <p>O profissional de saúde cadastrado é responsável por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Avaliar clinicamente o paciente antes de qualquer prescrição;</li>
              <li>Emitir prescrições em conformidade com a <strong className="text-foreground">RDC 660/2022</strong> e <strong className="text-foreground">RDC 327/2019</strong> da ANVISA;</li>
              <li>Manter registro profissional ativo e válido (CRM, CRO, CRP ou equivalente);</li>
              <li>Observar o Código de Ética Médica e as resoluções do CFM sobre telemedicina (Resolução nº 2.314/2022).</li>
            </ul>
            <p>A plataforma <strong className="text-foreground">não interfere na autonomia clínica</strong> do profissional e não pode ser responsabilizada por decisões terapêuticas individuais.</p>
          </section>

          {/* 3. Maioridade */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 3. Requisito de Maioridade</h2>
            <p>O uso da plataforma é restrito a pessoas com <strong className="text-foreground">18 (dezoito) anos ou mais</strong>. Ao se cadastrar, o usuário declara e garante ser maior de idade e possuir capacidade civil plena. A plataforma reserva-se o direito de solicitar documentação comprobatória a qualquer momento.</p>
            <p>Menores de 18 anos somente poderão utilizar os serviços mediante acompanhamento e consentimento formal de seu responsável legal.</p>
          </section>

          {/* 4. Triagem IA */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 4. Triagem por Inteligência Artificial (Brisa IA)</h2>
            <p>Ao utilizar a plataforma, o usuário compromete-se a fornecer informações <strong className="text-foreground">verdadeiras, precisas e completas</strong> durante o cadastro e na triagem realizada pela assistente <strong className="text-foreground">Brisa IA</strong>.</p>
            <p>A Brisa IA é uma ferramenta de <strong className="text-foreground">pré-triagem e acolhimento</strong> que auxilia na coleta de sintomas e direcionamento ao profissional adequado. Suas orientações são exclusivamente informativas e <strong className="text-foreground">não substituem avaliação médica</strong>.</p>
            <p>O fornecimento de informações falsas ou incompletas pode comprometer a segurança da conduta clínica e exime a plataforma de qualquer responsabilidade decorrente.</p>
          </section>

          {/* 5. Telemedicina */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 5. Orientações Técnicas Online e Telemedicina</h2>
            <p>Ao agendar uma consulta, o usuário <strong className="text-foreground">consente expressamente</strong> com a realização de atendimento médico por meio de teleconsulta (videoconferência), em conformidade com a <strong className="text-foreground">Resolução CFM nº 2.314/2022</strong>.</p>
            <p>O paciente declara estar ciente de que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A teleconsulta possui limitações inerentes ao formato remoto;</li>
              <li>O profissional poderá solicitar atendimento presencial quando julgar necessário;</li>
              <li>É responsabilidade do paciente garantir conexão de internet estável e ambiente adequado;</li>
              <li>A gravação da consulta é proibida salvo autorização expressa de ambas as partes;</li>
              <li>Os dados da sessão são criptografados ponta a ponta e registrados em log de auditoria imutável.</li>
            </ul>
          </section>

          {/* 6. Prescrições e ANVISA */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 6. Prescrições e Regulamentação ANVISA ⚖️</h2>
            <p>As prescrições de produtos à base de cannabis são emitidas exclusivamente por profissionais habilitados, em conformidade com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">RDC 660/2022 (ANVISA)</strong> — Regulamenta a importação de produtos à base de Cannabis por pessoa física para uso próprio, mediante prescrição;</li>
              <li><strong className="text-foreground">RDC 327/2019 (ANVISA)</strong> — Dispõe sobre a fabricação e comercialização de produtos de Cannabis para fins medicinais;</li>
              <li><strong className="text-foreground">Resolução CFM nº 2.314/2022</strong> — Regulamenta a telemedicina no Brasil.</li>
            </ul>
            <p>A plataforma atua como intermediária, facilitando o acesso a produtos regulamentados por farmácias e importadoras autorizadas. A Planta y Raiz <strong className="text-foreground">não garante a eficácia terapêutica</strong> de qualquer tratamento — os resultados variam de paciente para paciente.</p>
            <p>As receitas digitais são protegidas por <strong className="text-foreground">assinatura digital com hash SHA-256</strong>, armazenadas em bucket privado com acesso restrito ao paciente titular e ao profissional prescritor.</p>
          </section>

          {/* 7. Segurança de Dados */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 7. Segurança e Proteção de Dados</h2>
            <p>A plataforma implementa medidas técnicas avançadas de segurança:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Isolamento de dados sensíveis:</strong> informações financeiras de profissionais (PIX, dados bancários) são armazenadas em tabela segregada com acesso restrito;</li>
              <li><strong className="text-foreground">Controle de acesso por função (RBAC):</strong> cada tipo de usuário acessa somente os dados necessários ao seu papel;</li>
              <li><strong className="text-foreground">Políticas de segurança em nível de linha (RLS):</strong> cada registro no banco de dados é protegido individualmente;</li>
              <li><strong className="text-foreground">Auditoria completa:</strong> todas as ações são registradas com usuário, IP e timestamp em log imutável;</li>
              <li><strong className="text-foreground">Criptografia:</strong> dados em repouso (AES-256) e em trânsito (TLS 1.3).</li>
            </ul>
          </section>

          {/* 8. Pagamentos */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 8. Pagamentos</h2>
            <p>Os pagamentos são processados exclusivamente via <strong className="text-foreground">Mercado Pago</strong>, gateway certificado PCI-DSS Level 1. A Planta y Raiz <strong className="text-foreground">não armazena, processa ou transmite dados de cartão de crédito</strong>.</p>
            <p>Métodos aceitos: cartão de crédito, débito, PIX e boleto (quando disponível).</p>
          </section>

          {/* 9. Propriedade Intelectual */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 9. Propriedade Intelectual</h2>
            <p>Todo o conteúdo da plataforma — incluindo textos, imagens, logotipos, software, marcas e base de dados — é protegido por direitos autorais e de propriedade intelectual. É vedada a reprodução, distribuição ou modificação sem autorização expressa por escrito.</p>
          </section>

          {/* 10. Limitação de Responsabilidade */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 10. Limitação de Responsabilidade (Disclaimer)</h2>
            <p>O usuário reconhece e concorda expressamente que a Planta y Raiz Ltda atua exclusivamente como <strong className="text-foreground">plataforma tecnológica de intermediação</strong> e, portanto, <strong className="text-foreground">não se responsabiliza, sob nenhuma hipótese</strong>, por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Ato médico:</strong> condutas clínicas, diagnósticos, prescrições, orientações terapêuticas ou omissões dos profissionais cadastrados — a responsabilidade técnica e legal é exclusiva do médico prescritor;</li>
              <li><strong className="text-foreground">Produtos:</strong> qualidade, procedência, autenticidade, prazo de validade, entrega, extravio, avaria, eficácia terapêutica, reações adversas ou efeitos colaterais de produtos fornecidos por farmácias e importadoras parceiras — a responsabilidade é integral e exclusiva do estabelecimento farmacêutico licenciado que efetua a venda e a entrega;</li>
              <li><strong className="text-foreground">Logística:</strong> prazos, custos, alfândega, importação, transporte ou qualquer etapa da cadeia de suprimentos, uma vez que a Planta y Raiz não integra tal cadeia;</li>
              <li><strong className="text-foreground">Pagamentos a terceiros:</strong> valores pagos diretamente à farmácia, ao médico ou via gateway externo, os quais não transitam pelo patrimônio da Planta y Raiz;</li>
              <li>Resultados terapêuticos individuais e uso inadequado de produtos fora das orientações médicas;</li>
              <li>Instabilidades de conexão atribuíveis ao dispositivo, rede ou provedor do usuário.</li>
            </ul>
            <p>O usuário declara ciência de que a <strong className="text-foreground">relação de consumo relativa ao produto</strong> se estabelece diretamente com a farmácia/importadora parceira, e a <strong className="text-foreground">relação médico-paciente</strong> se estabelece diretamente com o profissional prescritor, ficando a Planta y Raiz isenta de qualquer responsabilidade solidária ou subsidiária decorrente dessas relações.</p>
          </section>


          {/* 11. Consentimento LGPD */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">🌿 11. Consentimento e LGPD ⚖️</h2>
            <p>Ao utilizar a plataforma, o usuário consente expressamente com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>O tratamento de seus dados pessoais conforme a <strong className="text-foreground">Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong>;</li>
              <li>O processamento de dados sensíveis de saúde nos termos do <strong className="text-foreground">Art. 11 da LGPD</strong>;</li>
              <li>O compartilhamento de dados clínicos com o profissional prescritor para fins de atendimento;</li>
              <li>O registro de consentimento versionado e auditável na plataforma.</li>
            </ul>
            <p>O consentimento pode ser revogado a qualquer momento via solicitação formal, sem prejuízo do tratamento realizado anteriormente.</p>
          </section>

          {/* 12. Disposições Gerais */}
          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">⚖️ 12. Disposições Gerais</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo — SP para dirimir quaisquer controvérsias.</p>
            <p>A Planta y Raiz reserva-se o direito de alterar estes Termos a qualquer momento, mediante notificação prévia aos usuários cadastrados. Alterações substantivas exigirão novo consentimento expresso.</p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p>🌿 <strong>Supervisora Técnica:</strong> Dra. Suelen Naves Rodrigues — CRM-PR 49354</p>
            <p>📧 Contato: contato@plantayraiz.com.br</p>
            <p className="mt-2">Este documento faz parte do sistema de governança da Planta y Raiz, com consentimento versionado (v2.0) e registro em log de auditoria imutável.</p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default TermosDeUso;
