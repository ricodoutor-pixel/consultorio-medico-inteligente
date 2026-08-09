import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, Download, CheckCircle, Stethoscope, Scale, FlaskConical, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const EBOOK_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/fnbZJMGCJUpGmwzl.pdf";

const bulletPoints = [
  { icon: FlaskConical, text: "Farmacologia dos Canabinoides e Sistema Endocanabinoide." },
  { icon: Stethoscope, text: "Dosimetria e Titulação para Patologias Complexas." },
  { icon: Scale, text: "Aspectos Legais e Normativas da ANVISA 2026." },
  { icon: Users, text: "Casos Clínicos Reais e Manejo de Efeitos Colaterais." },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const EbookMedicinaCanabinoide = () => (
  <div className="min-h-dvh bg-background">
    <SEO
      title="E-book Grátis Medicina Canabinoide para Médicos - Planta y Raiz"
      description="Curso completo gratuito de Medicina Canabinoide. Domine as evidências científicas, prescrição e manejo clínico da Cannabis Medicinal."
      keywords="e-book cannabis medicinal, curso medicina canabinoide, farmacologia canabinoides, ANVISA cannabis, prescrição cannabis"
      url="https://plantayraiz.com.br/ebook-medicina-canabinoide"
    />
    <Navbar />

    {/* Hero */}
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3 py-1">
              📘 100% GRATUITO
            </Badge>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Atualização de Elite:{" "}
              <span className="text-primary">Curso Completo de Medicina Canabinoide</span>{" "}
              para Médicos e Estudantes
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Domine as evidências científicas, prescrição e manejo clínico da Cannabis Medicinal com nosso guia definitivo gratuito.
            </p>

            {/* Bullet points */}
            <div className="space-y-4 mb-10">
              {bulletPoints.map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon size={16} className="text-primary" />
                  </div>
                  <p className="text-sm md:text-base text-foreground font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.a
              href={EBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-2xl text-base md:text-lg font-black text-background transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, hsl(43, 74%, 49%), hsl(36, 100%, 50%))",
                boxShadow: "0 0 30px hsl(43, 74%, 49%, 0.4)",
                animation: "pulse-soft 2.5s ease-in-out infinite",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Download size={22} />
              BAIXAR E-BOOK GRATUITO (PDF)
            </motion.a>

            <p className="text-xs text-muted-foreground mt-3">
              📄 Download imediato • Sem cadastro obrigatório • PDF de alta qualidade
            </p>
          </motion.div>

          {/* Right: 3D Mockup */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative" style={{ perspective: "1000px" }}>
              {/* Book mockup */}
              <div
                className="relative w-64 md:w-80 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl"
                style={{
                  transform: "rotateY(-8deg) rotateX(3deg)",
                  boxShadow: "20px 20px 60px hsl(var(--primary) / 0.15), -5px -5px 20px hsl(var(--primary) / 0.05)",
                }}
              >
                {/* Book cover */}
                <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 via-card to-secondary/20 p-6 flex flex-col items-center justify-center text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/50" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <BookOpen size={32} className="text-primary" />
                    </div>
                    <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-[10px]">PLANTA Y RAIZ</Badge>
                    <h3 className="text-lg md:text-xl font-display font-black text-foreground leading-tight mb-2">
                      Medicina Canabinoide
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">Curso Completo 2026</p>
                    <div className="w-12 h-0.5 mx-auto bg-primary/40 rounded-full mb-3" />
                    <p className="text-[10px] text-muted-foreground">Dr. Edilson Bezerra</p>
                    <p className="text-[10px] text-primary font-bold mt-1">Edição Atualizada</p>
                  </div>
                </div>
                {/* Book spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-primary/30 to-transparent" />
              </div>

              {/* Floating badges */}
              <motion.div
                className="absolute -top-4 -right-4 px-3 py-1.5 rounded-xl bg-card border border-primary/30 shadow-lg"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <span className="text-xs font-bold text-primary">📚 350+ Páginas</span>
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-xl bg-card border border-border shadow-lg"
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 3.5 }}
              >
                <span className="text-xs font-bold text-foreground">🔬 Baseado em Evidências</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Social proof */}
    <section className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "5.000+", label: "Downloads", icon: "📥" },
            { value: "4.9★", label: "Avaliação", icon: "⭐" },
            { value: "350+", label: "Páginas", icon: "📄" },
            { value: "100%", label: "Gratuito", icon: "🎁" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-card border border-border">
              <span className="text-2xl block mb-1">{s.icon}</span>
              <p className="text-xl md:text-2xl font-display font-black text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA bottom */}
    <section className="py-16 border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-display font-black text-foreground mb-4">
          Pronto para dominar a <span className="text-primary">Medicina Canabinoide</span>?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Baixe agora e tenha acesso ao conteúdo mais completo e atualizado sobre Cannabis Medicinal no Brasil.
        </p>
        <a
          href={EBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-black text-background transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, hsl(43, 74%, 49%), hsl(36, 100%, 50%))" }}
        >
          <Download size={20} />
          BAIXAR E-BOOK GRATUITO
        </a>
        <div className="mt-8">
          <Link to="/biblioteca" className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline">
            Explorar a Biblioteca Científica <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>

    <Footer />

    <style>{`
      @keyframes pulse-soft {
        0%, 100% { box-shadow: 0 0 20px hsl(43, 74%, 49%, 0.3); }
        50% { box-shadow: 0 0 40px hsl(43, 74%, 49%, 0.6); }
      }
    `}</style>
  </div>
);

export default EbookMedicinaCanabinoide;
