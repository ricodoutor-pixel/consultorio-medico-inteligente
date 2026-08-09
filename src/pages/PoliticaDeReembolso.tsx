import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const PoliticaDeReembolso = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <RefreshCcw size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Financeiro</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-2">
              Política de Reembolso
            </h1>
            <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          </motion.div>
        </div>
      </section>

      <article className="py-10 pb-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-8 text-sm text-muted-foreground leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">1. Orientações Técnicas — Cancelamento com Antecedência</h2>
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-primary font-black text-lg">100%</span>
                <p><strong className="text-foreground">Reembolso integral</strong> para consultas canceladas com mais de <strong className="text-foreground">24 horas</strong> de antecedência. O valor é devolvido ao método de pagamento original em até 7 dias úteis.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">2. Orientações Técnicas — Cancelamento Tardio (2h a 24h)</h2>
            <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-4 space-y-2">
              <p>Para cancelamentos realizados entre <strong className="text-foreground">2 horas e 24 horas</strong> antes do horário agendado, o valor pago será convertido em <strong className="text-foreground">crédito na forma de Planta-Coins</strong>.</p>
              <p>Os Planta-Coins poderão ser utilizados para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Agendamento de novas consultas;</li>
                <li>Compras no Marketplace da plataforma;</li>
                <li>Descontos em planos de assinatura.</li>
              </ul>
              <p className="text-xs text-muted-foreground/60">Os Planta-Coins não possuem validade e não são resgatáveis em dinheiro.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">3. Orientações Técnicas — No-Show (Ausência sem Aviso)</h2>
            <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-4">
              <p><strong className="text-foreground">Não há reembolso</strong> para pacientes que não compareçam à consulta sem aviso prévio (no-show). O profissional de saúde reservou seu horário exclusivamente para o atendimento.</p>
              <p className="mt-2">Em caso de problemas técnicos comprovados (queda de servidor, falha na plataforma), o paciente poderá solicitar reagendamento sem custo adicional.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">4. Assinaturas — Direito de Arrependimento</h2>
            <p>Em conformidade com o <strong className="text-foreground">Código de Defesa do Consumidor (Art. 49)</strong>, o assinante tem direito ao arrependimento no prazo de <strong className="text-foreground">7 (sete) dias corridos</strong> após a contratação, com reembolso integral do valor pago.</p>
            <p>Para exercer este direito:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Envie um e-mail para <strong className="text-foreground">contato@plantayraiz.com.br</strong> com o assunto "Cancelamento de Assinatura";</li>
              <li>Ou entre em contato via WhatsApp: <strong className="text-foreground">+55 11 99136-3154</strong>;</li>
              <li>O reembolso será processado em até 7 dias úteis ao método de pagamento original.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">5. Assinaturas — Cancelamento Após 7 Dias</h2>
            <p>Após o período de arrependimento, o cancelamento de assinaturas pode ser realizado a qualquer momento. O acesso permanece ativo até o final do período já pago. <strong className="text-foreground">Não há reembolso proporcional</strong> para o período restante.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">6. Marketplace — Produtos</h2>
            <p>Produtos adquiridos no Marketplace seguem as regras de devolução do fornecedor. Para produtos de cannabis medicinal, aplica-se o prazo de 7 dias para arrependimento (CDC Art. 49), desde que o produto esteja lacrado e em sua embalagem original.</p>
            <p>Produtos manipulados sob prescrição não são passíveis de devolução por questões sanitárias.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-display font-black text-foreground">7. Como Solicitar Reembolso</h2>
            <p>Para solicitar reembolso, entre em contato por um dos canais:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">E-mail:</strong> contato@plantayraiz.com.br</li>
              <li><strong className="text-foreground">WhatsApp:</strong> +55 11 99136-3154</li>
            </ul>
            <p>Informe: nome completo, e-mail cadastrado, descrição do motivo e comprovante de pagamento (se aplicável). O prazo de análise é de até 5 dias úteis.</p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p><strong>Supervisora Técnica:</strong> Dra. Suelen Naves Rodrigues — CRM-PR 49354</p>
            <p>Contato: contato@plantayraiz.com.br</p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default PoliticaDeReembolso;
