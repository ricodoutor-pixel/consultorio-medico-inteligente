import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";
// Termos de Uso - Planta y Raiz

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const TermosDeUso = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Documento Legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-2">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          </motion.div>
        </div>
      </section>

      <article className="py-10 pb-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-8 text-sm text-muted-foreground leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">1. Natureza da Plataforma</h2>
            <p>A <strong className="text-foreground">Planta y Raiz</strong> é uma plataforma digital de telemedicina e marketplace de saúde canabinoide que conecta pacientes a profissionais de saúde devidamente habilitados e a estabelecimentos autorizados pela ANVISA para comercialização de produtos à base de cannabis medicinal.</p>
            <p>A plataforma não pratica medicina, não prescreve medicamentos e não se responsabiliza por condutas clínicas individuais dos profissionais cadastrados. Todas as consultas são realizadas por profissionais independentes com registro ativo nos respectivos conselhos profissionais.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">2. Requisito de Maioridade</h2>
            <p>O uso da plataforma é restrito a pessoas com <strong className="text-foreground">18 (dezoito) anos ou mais</strong>. Ao se cadastrar, o usuário declara e garante ser maior de idade e possuir capacidade civil plena para os atos da vida civil. A plataforma reserva-se o direito de solicitar documentação comprobatória a qualquer momento.</p>
            <p>Menores de 18 anos somente poderão utilizar os serviços mediante acompanhamento e consentimento formal de seu responsável legal.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">3. Cadastro, Triagem e Veracidade das Informações</h2>
            <p>Ao utilizar a plataforma, o usuário compromete-se a fornecer informações <strong className="text-foreground">verdadeiras, precisas e completas</strong> durante o cadastro e na triagem realizada pela assistente de inteligência artificial <strong className="text-foreground">Brisa IA</strong>.</p>
            <p>A Brisa IA é uma ferramenta de pré-triagem que auxilia na coleta de sintomas e direcionamento ao profissional adequado. Suas orientações são exclusivamente informativas e <strong className="text-foreground">não substituem avaliação médica</strong>. O fornecimento de informações falsas ou incompletas pode comprometer a segurança da conduta clínica e exime a plataforma de qualquer responsabilidade.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">4. Consultas Online e Telemedicina</h2>
            <p>Ao agendar uma consulta, o usuário <strong className="text-foreground">consente</strong> expressamente com a realização de atendimento médico por meio de teleconsulta (videoconferência), em conformidade com a Resolução CFM nº 2.314/2022 e demais normas aplicáveis.</p>
            <p>O paciente declara estar ciente de que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A teleconsulta possui limitações inerentes ao formato remoto;</li>
              <li>O profissional poderá solicitar atendimento presencial quando julgar necessário;</li>
              <li>É responsabilidade do paciente garantir conexão de internet estável e ambiente adequado para a consulta;</li>
              <li>A gravação da consulta é proibida salvo autorização expressa de ambas as partes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">5. Prescrições e Cannabis Medicinal</h2>
            <p>As prescrições de produtos à base de cannabis são emitidas exclusivamente por profissionais habilitados, em conformidade com a RDC 660/2022 (ANVISA). A plataforma atua como intermediária, facilitando o acesso a produtos regulamentados por farmácias e importadoras autorizadas.</p>
            <p>A Planta y Raiz não garante a eficácia terapêutica de qualquer tratamento. Os resultados variam de paciente para paciente.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">6. Pagamentos</h2>
            <p>Os pagamentos são processados exclusivamente via <strong className="text-foreground">Stripe</strong>, gateway certificado PCI-DSS Level 1. A Planta y Raiz <strong className="text-foreground">não armazena, processa ou transmite dados de cartão de crédito</strong>. Métodos aceitos: cartão de crédito, débito, PIX e boleto (quando disponível).</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">7. Propriedade Intelectual</h2>
            <p>Todo o conteúdo da plataforma — incluindo textos, imagens, logotipos, software, marcas e base de dados — é protegido por direitos autorais e de propriedade intelectual. É vedada a reprodução, distribuição ou modificação sem autorização expressa por escrito.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">8. Limitação de Responsabilidade</h2>
            <p>A plataforma não se responsabiliza por: (a) condutas clínicas dos profissionais; (b) qualidade dos produtos comercializados por terceiros; (c) resultados terapêuticos individuais; (d) uso inadequado de produtos adquiridos; (e) instabilidades de conexão do usuário.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">9. Disposições Gerais</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo — SP para dirimir quaisquer controvérsias oriundas destes Termos.</p>
            <p>A Planta y Raiz reserva-se o direito de alterar estes Termos a qualquer momento, mediante notificação prévia aos usuários cadastrados.</p>
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

export default TermosDeUso;
