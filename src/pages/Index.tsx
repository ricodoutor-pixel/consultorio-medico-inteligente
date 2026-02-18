import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Leaf, Stethoscope, ShoppingBag, Users, Star, ChevronRight, Shield, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { testimonials } from "@/data/testimonials";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const marketData = [
  { year: "2020", valor: 2.8 },
  { year: "2021", valor: 4.9 },
  { year: "2022", valor: 7.1 },
  { year: "2023", valor: 12.8 },
  { year: "2024", valor: 18.3 },
  { year: "2025", valor: 28.6 },
  { year: "2026", valor: 38.1 },
  { year: "2027", valor: 52.0 },
  { year: "2028", valor: 67.4 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[600px] h-[400px] rounded-full bg-secondary/10 blur-[120px]" />
          <div className="absolute top-[25%] right-[10%] w-[500px] h-[350px] rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="max-w-4xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-gradient-gold border border-gold rounded-full px-4 py-2 text-sm font-bold text-primary mb-6">
              <Leaf size={16} />
              PLATAFORMA POPULAR • SAÚDE • SHOPPING
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
              Democratizando o acesso a{" "}
              <span className="text-gradient-gold">medicamentos à base de cannabis</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Conectamos pacientes a profissionais habilitados (teleatendimento quando aplicável) e ao Shopping de bem-estar com preços populares.
              Você escolhe o especialista, faz uma pré-entrevista, paga via Pix e segue para atendimento.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
                <a href="/profissionais">
                  Ver Profissionais <ArrowRight size={20} className="ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg border-border hover:bg-muted" asChild>
                <a href="/shopping">
                  <ShoppingBag size={18} className="mr-2" /> Abrir Shopping
                </a>
              </Button>
              <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30" asChild>
                <a href="/planos">
                  Começar agora <ArrowRight size={20} className="ml-2" />
                </a>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
              {["Preços populares", "Pix Mercado Pago", "Teleatendimento", "Shopping multi-vendor", "Foco baixa renda"].map((pill) => (
                <span key={pill} className="px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground border border-border bg-card/50">
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.p variants={fadeUp} className="mt-6 text-xs text-muted-foreground max-w-lg mx-auto">
              ⚠️ Conteúdo educativo. Prescrição e conduta clínica dependem de avaliação individual por profissional habilitado.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
            <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Como Funciona</h2>
            <p className="text-muted-foreground text-lg">Fluxo simples e rápido — sem burocracia</p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { step: "1", icon: Users, title: "Escolha o Especialista", desc: "Filtre por especialidade, preço e avaliação. Profissionais verificados." },
              { step: "2", icon: Zap, title: "Pré-entrevista (2 min)", desc: "Preencha um formulário rápido com seu objetivo e resumo do caso." },
              { step: "3", icon: Zap, title: "Pague via Pix", desc: "Pagamento rápido via Pix Mercado Pago. QR code + copia e cola." },
              { step: "4", icon: Stethoscope, title: "Atendimento", desc: "O profissional recebe o resumo e atende por chat ou vídeo." },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-colors group">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-green border border-green flex items-center justify-center mb-4 font-display font-bold text-secondary">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Relatos</h2>
            <p className="text-muted-foreground">Modelos ilustrativos — use depoimentos reais com consentimento</p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={t.imageUrl} alt={`Ilustração - ${t.name}`} className="w-10 h-10 rounded-xl object-cover border border-border" />
                      <div>
                        <p className="font-bold text-sm text-foreground">"{t.name}"</p>
                        <p className="text-xs text-muted-foreground">{t.age} • {t.topic}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">"{t.quote}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            * Nomes e fotos ilustrativos (banco de imagens). Use depoimentos reais apenas com consentimento documentado.
          </p>
        </div>
      </section>

      {/* Market Chart */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <TrendingUp size={40} className="text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Mercado Global em Crescimento</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Projeções públicas indicam forte expansão do setor legal de cannabis medicinal</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Card className="border-border max-w-4xl mx-auto">
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={marketData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 10% 16%)" />
                    <XAxis dataKey="year" stroke="hsl(240 10% 72%)" fontSize={12} />
                    <YAxis stroke="hsl(240 10% 72%)" fontSize={12} tickFormatter={(v) => `$${v}B`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(240 15% 8%)", border: "1px solid hsl(240 10% 16%)", borderRadius: "12px", color: "hsl(240 10% 93%)" }}
                      formatter={(value: number) => [`US$ ${value}B`, "Valor de mercado"]}
                    />
                    <Bar dataKey="valor" fill="hsl(45 76% 52%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  * Gráfico ilustrativo com base em projeções públicas (Grand View Research, Fortune Business Insights). Valores variam por metodologia.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Ecossistema Completo</h2>
            <p className="text-muted-foreground text-lg">Teleatendimento + Shopping + Profissionais + Assinatura</p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Stethoscope, title: "Teleatendimento", desc: "Chat + vídeo quando aplicável. Prontuário, anexos e recibos em conformidade.", color: "primary" },
              { icon: ShoppingBag, title: "Shopping Multi-vendor", desc: "Lojas, farmácias, suplementos e bem-estar. Checkout via Pix com preços populares.", color: "secondary" },
              { icon: Users, title: "Profissionais Verificados", desc: "Currículo, documentos, especialidades, avaliações e ranking público.", color: "primary" },
              { icon: Shield, title: "Segurança & LGPD", desc: "Dados protegidos, consentimentos e criptografia.", color: "secondary" },
              { icon: Star, title: "Assinatura Popular", desc: "Planos acessíveis com descontos, suporte prioritário e benefícios.", color: "primary" },
              { icon: Zap, title: "Pix Mercado Pago", desc: "Pagamento rápido com QR code e confirmação automática via webhook.", color: "secondary" },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-all hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${f.color === 'primary' ? 'bg-gradient-gold border-gold' : 'bg-gradient-green border-green'} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <f.icon size={24} className={f.color === 'primary' ? 'text-primary' : 'text-secondary'} />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Dúvidas Frequentes</h2>
          </motion.div>
          <motion.div className="max-w-3xl mx-auto space-y-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { q: "A Planta & Raiz vende 'cura' ou faz promessa de resultado?", a: "Não. A plataforma é de intermediação e educação. Qualquer conduta clínica depende de avaliação individual por profissional habilitado." },
              { q: "Como funciona o pagamento via Pix?", a: "Geramos cobrança Pix pela API do Mercado Pago. Você recebe QR code e/ou copia e cola. A confirmação é automática." },
              { q: "Os profissionais são verificados?", a: "Sim. Todos passam por verificação de documentos, registro profissional e qualificações." },
              { q: "Posso usar a plataforma sem prescrição?", a: "Sim! Você pode consultar profissionais, usar o Shopping de bem-estar e acessar conteúdos educativos. Prescrição só quando aplicável." },
            ].map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground text-sm mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <div className="text-center mt-8">
            <Button variant="link" className="text-primary font-bold" asChild>
              <a href="/faq">Ver todas as perguntas <ChevronRight size={16} /></a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
              Comece Sua Jornada <span className="text-gradient-green">Agora</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Acesse profissionais habilitados e o Shopping com preços populares
            </p>
            <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30" asChild>
              <a href="/planos">
                Começar Agora <ArrowRight size={20} className="ml-2" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
