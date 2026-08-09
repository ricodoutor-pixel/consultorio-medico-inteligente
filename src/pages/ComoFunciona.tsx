import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Zap, Stethoscope, ShoppingBag, Shield, FileText, CheckCircle2, ArrowRight, MessageSquare, UserPlus, Download, Loader2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EBOOK_BUCKET = "ebooks";
const EBOOK_FILE = "planta-y-raiz-cannabis-medicinal.pdf";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const ComoFunciona = () => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadEbook = async () => {
    setDownloading(true);
    try {
      // Verify the file exists in storage
      const { data: list, error: listError } = await supabase.storage
        .from(EBOOK_BUCKET)
        .list("", { search: EBOOK_FILE, limit: 1 });

      if (listError || !list || list.length === 0) {
        toast({
          title: "E-book em preparação 📚",
          description: "Nosso e-book ainda está sendo finalizado. Deixe seu WhatsApp na Enf. Brisa para receber em primeira mão!",
        });
        setDownloading(false);
        return;
      }

      // Get public URL and trigger download
      const { data: urlData } = supabase.storage
        .from(EBOOK_BUCKET)
        .getPublicUrl(EBOOK_FILE);

      const link = document.createElement("a");
      link.href = urlData.publicUrl;
      link.download = "planta-y-raiz-cannabis-medicinal.pdf";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Download iniciado! 🌿", description: "Aproveite a leitura do e-book gratuito." });
    } catch (e) {
      toast({
        title: "Erro no download",
        description: "Tente novamente em instantes ou fale com a Enf. Brisa.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const steps = [
    {
      icon: Users,
      title: "1. Escolha o Profissional",
      desc: "Filtre por especialidade, preço e avaliação. São 5 categorias com profissionais verificados e preços populares.",
      items: ["Médicos Prescritores", "Farmácia Clínica", "Terapia Ocupacional", "Acupuntura", "Saúde Ocupacional"],
    },
    {
      icon: MessageSquare,
      title: "2. Pré-entrevista (2 minutos)",
      desc: "Preencha um formulário rápido com seu objetivo, preferência de atendimento e resumo do caso. O profissional recebe tudo antes da consulta.",
      items: ["Objetivo (sono, dor, ansiedade, etc.)", "Preferência: chat ou vídeo", "Resumo do caso", "WhatsApp para contato"],
    },
    {
      icon: Zap,
      title: "3. Pague via Pix (Mercado Pago)",
      desc: "Pagamento rápido e seguro com Mercado Pago. QR code + copia e cola com confirmação automática por webhook.",
      items: ["QR code instantâneo", "Copia e cola Pix", "Confirmação automática", "Recibo digital no app"],
    },
    {
      icon: Stethoscope,
      title: "4. Atendimento liberado",
      desc: "O profissional recebe o resumo e inicia atendimento por chat ou vídeo. Receita e documentos ficam no seu histórico.",
      items: ["Chat ou vídeo (quando aplicável)", "Prescrição quando necessário", "Histórico de documentos", "Acompanhamento contínuo"],
    },
  ];

  const extras = [
    { icon: ShoppingBag, title: "Shopping Popular", desc: "Após o atendimento, encontre produtos de bem-estar no Shopping com preços acessíveis." },
    { icon: Shield, title: "Segurança & LGPD", desc: "Seus dados são protegidos. Criptografia, consentimentos e conformidade total." },
    { icon: FileText, title: "Tudo Documentado", desc: "Receitas, recibos, histórico — tudo acessível pelo celular a qualquer momento." },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[10%] w-[500px] h-[300px] rounded-full bg-secondary/8 blur-3xl" />
          <div className="absolute top-[30%] right-[10%] w-[400px] h-[250px] rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              Como <span className="text-gradient-gold">Funciona</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              4 passos simples — escolha, pré-entrevista, pague via Pix, atendimento
            </p>
          </motion.div>

          <motion.div className="space-y-8 max-w-4xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className={`w-14 h-14 rounded-2xl ${i % 2 === 0 ? 'bg-gradient-gold border-gold' : 'bg-gradient-green border-green'} border flex items-center justify-center shrink-0`}>
                        <step.icon size={28} className={i % 2 === 0 ? 'text-primary' : 'text-secondary'} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-display font-bold text-foreground mb-3">{step.title}</h2>
                        <p className="text-muted-foreground mb-4 leading-relaxed">{step.desc}</p>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {step.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* E-book Download Section */}
          <motion.div
            className="max-w-3xl mx-auto mt-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Card className="border-secondary/40 bg-gradient-to-br from-secondary/10 via-card to-primary/10">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green mb-4">
                  <BookOpen size={32} className="text-secondary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                  📚 E-book Gratuito: Cannabis Medicinal
                </h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Guia completo escrito pela equipe Planta & Raiz: indicações terapêuticas, dosagens, ANVISA e como começar seu tratamento.
                </p>
                <Button
                  size="lg"
                  onClick={handleDownloadEbook}
                  disabled={downloading}
                  className="text-lg font-bold bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground"
                >
                  {downloading ? (
                    <><Loader2 size={20} className="mr-2 animate-spin" /> Preparando...</>
                  ) : (
                    <><Download size={20} className="mr-2" /> Baixar E-book Gratuito (PDF)</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTAs */}
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center mt-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
              <Link to="/falar-com-especialista">
                <MessageSquare size={20} className="mr-2" /> Falar com especialista agora
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg border-border hover:bg-muted font-bold" asChild>
              <Link to="/cadastro-profissional">
                <UserPlus size={20} className="mr-2" /> Cadastro como profissional
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Extras */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div className="grid md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {extras.map((e, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-gold border border-gold flex items-center justify-center mb-4">
                      <e.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">{e.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{e.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">Pronto Para Começar?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Acesse profissionais habilitados com preços populares e pagamento via Pix
          </p>
          <Button size="lg" className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
            <Link to="/profissionais">
              Ver Profissionais <ArrowRight size={20} className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComoFunciona;
