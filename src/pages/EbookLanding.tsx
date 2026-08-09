import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Download, BookOpen, Users, Award, CheckCircle, ArrowRight, Leaf, Star, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const EbookLanding = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    profession: "",
  });

  const handleDownload = async () => {
    if (!formData.whatsapp || !formData.name) {
      setShowForm(true);
      toast.info("Preencha nome e WhatsApp para receber o ebook.");
      return;
    }

    const cleanPhone = formData.whatsapp.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("WhatsApp inválido. Use DDD + número.");
      return;
    }

    setIsDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ebook-capture", {
        body: {
          name: formData.name,
          whatsapp: cleanPhone,
          email: formData.email || null,
          profession: formData.profession || null,
          source: "landing",
        },
      });

      if (error) throw error;

      toast.success("📲 Pronto! Você vai receber o PDF agora mesmo no WhatsApp.");
      setSubmitted(true);

      // Download imediato do PDF como bônus
      const pdfUrl = (data as any)?.pdf_url || "https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/fnbZJMGCJUpGmwzl.pdf";
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "Guia-Cannabis-Medicinal-2026.pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Erro ao baixar e-book:", error);
      toast.error(error?.message || "Erro ao processar. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "8 Capítulos Completos",
      desc: "Guia prático desde o básico até prescrições avançadas",
    },
    {
      icon: Award,
      title: "Certificado",
      desc: "Reconhecido por profissionais de saúde",
    },
    {
      icon: Users,
      title: "Para Médicos & Estudantes",
      desc: "Conteúdo validado por especialistas",
    },
    {
      icon: Leaf,
      title: "Baseado em Evidências",
      desc: "Estudos científicos e casos clínicos reais",
    },
  ];

  const chapters = [
    "Introdução ao Cannabis Medicinal",
    "Fisiologia do Sistema Endocanabinóide",
    "Canabinóides Principais (THC, CBD, CBN)",
    "Indicações Clínicas e Evidências",
    "Protocolo de Prescrição ANVISA",
    "Dosagem e Titulação",
    "Efeitos Colaterais e Contraindicações",
    "Casos Clínicos e Resultados",
  ];

  return (
    <div className="min-h-dvh bg-background w-full overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-glow pt-24 pb-16 md:pt-32 md:pb-28 min-h-[90vh] flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col">
              <motion.div variants={fadeUp} className="mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-green border border-green rounded-full px-4 py-2 text-sm font-bold text-primary shadow-lg shadow-green/20">
                  <BookOpen size={16} />
                  E-BOOK GRATUITO
                </div>
              </motion.div>

              <motion.h1 
                variants={fadeUp} 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black leading-[1.1] mb-8 tracking-tight"
              >
                <span className="text-gradient-green">Cannabis Medicinal</span>
                <span className="text-foreground"> para </span>
                <span className="text-gradient-purple">Profissionais</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed font-medium">
                Guia completo e prático sobre prescrição de cannabis medicinal. Desenvolvido por especialistas e validado conforme regulamentações ANVISA e CFM. Ideal para médicos, estudantes de medicina e profissionais de saúde que desejam se aprofundar no tema.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col gap-4 mb-10">
                {[
                  "✅ 8 capítulos com conteúdo atualizado",
                  "✅ Protocolos de prescrição validados",
                  "✅ Casos clínicos reais documentados",
                  "✅ Conformidade ANVISA/CFM",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-base font-black h-16 px-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download size={20} className="mr-2" />
                  {isDownloading ? "Baixando..." : "BAIXAR E-BOOK GRÁTIS"}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-base font-black h-16 px-10 border-border hover:bg-muted rounded-2xl transition-all hover:scale-105"
                  onClick={() => setShowForm(!showForm)}
                >
                  <Users size={20} className="mr-2" />
                  PARA PROFISSIONAIS
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Content - Book Preview */}
            <motion.div
              className="relative flex flex-col justify-center items-center"
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <div className="relative group w-full flex flex-col items-center">
                <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-[80px] opacity-40 group-hover:opacity-70 transition duration-1000 z-0"></div>
                
                {/* Book Card */}
                <div className="relative z-10 w-full max-w-sm">
                  <Card className="border-border shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-green-600 to-green-800 p-12 text-center text-white min-h-96 flex flex-col justify-center items-center rounded-lg">
                        <BookOpen size={80} className="mb-6 opacity-90" />
                        <h3 className="text-3xl font-black mb-2">CANNABIS</h3>
                        <h3 className="text-3xl font-black mb-6">MEDICINAL</h3>
                        <p className="text-sm font-bold opacity-90">Guia Completo para Profissionais</p>
                        <div className="mt-8 pt-6 border-t border-white/30 w-full">
                          <p className="text-xs font-bold opacity-75">8 Capítulos | 698 KB</p>
                          <p className="text-xs font-bold opacity-75">Edição 2026</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats Below Book */}
                <div className="grid grid-cols-3 gap-4 mt-12 w-full">
                  {[
                    { value: "8", label: "Capítulos" },
                    { value: "45K+", label: "Downloads" },
                    { value: "4.9★", label: "Avaliação" },
                  ].map((stat, i) => (
                    <motion.div key={i} variants={fadeUp}>
                      <Card className="border-border text-center bg-background/40">
                        <CardContent className="p-4">
                          <p className="text-2xl font-display font-black text-primary">{stat.value}</p>
                          <span className="text-xs text-muted-foreground font-bold">{stat.label}</span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      {showForm && (
        <section className="py-16 md:py-24 bg-card/20 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
            <motion.div 
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-border">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-black mb-2">Receba o PDF no WhatsApp</h3>
                  <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
                    <MessageCircle size={16} className="text-primary" />
                    A Enfª Brisa envia o ebook direto pra você + bônus em 24h.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Nome Completo *</label>
                      <input
                        type="text"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">WhatsApp * <span className="text-xs text-muted-foreground font-normal">(com DDD)</span></label>
                      <input
                        type="tel"
                        placeholder="11 99999-9999"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Email (opcional)</label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Profissão</label>
                      <select
                        value={formData.profession}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Selecione sua profissão</option>
                        <option value="medico">Médico</option>
                        <option value="estudante">Estudante de Medicina</option>
                        <option value="farmaceutico">Farmacêutico</option>
                        <option value="enfermeiro">Enfermeiro</option>
                        <option value="outro">Outro Profissional de Saúde</option>
                      </select>
                    </div>
                    <Button 
                      className="w-full h-12 font-black text-base bg-primary hover:bg-primary/90 rounded-lg"
                      onClick={handleDownload}
                      disabled={isDownloading || !formData.whatsapp || !formData.name}
                    >
                      <Download size={18} className="mr-2" />
                      {isDownloading ? "Enviando..." : submitted ? "✅ ENVIADO NO WHATSAPP" : "RECEBER NO WHATSAPP"}
                    </Button>
                    {submitted && (
                      <p className="text-xs text-center text-primary font-medium">
                        Confira seu WhatsApp! Em 24h você recebe um cupom exclusivo. 💚
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">O que você vai aprender</h2>
            <p className="text-lg text-muted-foreground">Conteúdo prático e baseado em evidências científicas</p>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border hover:border-primary/30 transition-all hover:shadow-xl bg-background/40 h-full">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <feature.icon size={40} className="text-primary mb-4" />
                    <h3 className="text-lg font-black mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Chapters Section */}
      <section className="py-20 md:py-32 bg-card/20 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6">8 Capítulos Completos</h2>
            <p className="text-lg text-muted-foreground">Estrutura do e-book</p>
          </div>

          <motion.div 
            className="max-w-3xl mx-auto space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {chapters.map((chapter, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border hover:border-primary/30 transition-all bg-background/40">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-black text-primary">{i + 1}</span>
                    </div>
                    <p className="font-medium text-foreground">{chapter}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-display font-black mb-8">
              Pronto para aprender?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Baixe agora o e-book gratuito e comece sua jornada no conhecimento de cannabis medicinal. Acesso imediato após o registro.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-base font-black h-16 px-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download size={20} className="mr-2" />
                {isDownloading ? "Baixando..." : "BAIXAR AGORA"}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EbookLanding;
