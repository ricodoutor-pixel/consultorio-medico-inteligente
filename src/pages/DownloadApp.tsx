import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Shield, Wifi, Users, Star, Zap, Heart, Globe, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";

// URLs oficiais das lojas (atualizar quando publicado nas stores)
const APP_STORE_URL = "https://apps.apple.com/br/app/planta-y-raiz/id0000000000";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.plantayraiz.app";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const DownloadApp = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const { toast } = useToast();

  const handleInstallPWA = async () => {
    if (isInstalled) {
      toast({ title: "App já instalado ✅", description: "Abra a partir da sua tela inicial." });
      return;
    }
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast({ title: "Instalado! 🌿", description: "Agora abra o app a partir da tela inicial." });
      }
      return;
    }
    toast({
      title: "Instale como App (PWA)",
      description: "No iOS, toque em Compartilhar → Adicionar à Tela de Início. No Android, abra o menu do navegador → Instalar app.",
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp}>
                <Badge className="mb-4 bg-primary/10 text-primary border-green text-xs font-bold">
                  📱 DISPONÍVEL iOS & ANDROID
                </Badge>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-display font-black text-foreground leading-tight mb-6">
                Sua clínica de cannabis medicinal no{" "}
                <span className="text-gradient-green">bolso</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-8 font-medium max-w-lg">
                Orientações Técnicas, receitas, shopping e biblioteca científica — tudo offline-first com biometria, push notifications e a melhor experiência mobile do mercado.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-4">
                <Button asChild size="lg" className="h-14 px-8 bg-foreground text-background font-black rounded-2xl hover:bg-foreground/90 gap-3">
                  <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Baixar na App Store">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.08-3.74 4.25z"/>
                    </svg>
                    App Store
                  </a>
                </Button>
                <Button asChild size="lg" className="h-14 px-8 bg-foreground text-background font-black rounded-2xl hover:bg-foreground/90 gap-3">
                  <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Baixar no Google Play">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                      <path d="M3.18 23.79L14.35 12.62 3.18.45C2.35 1.19 1.82 2.35 1.82 3.79v16.42c0 1.44.53 2.6 1.36 3.34v.24zm15.1-14.4l-3.15 3.23 3.15 3.23 3.53-2.03c.59-.34.94-.9.94-1.2 0-.3-.35-.86-.94-1.2l-3.53-2.03zm-4.38 4.46L4.43 23.31l12.2-7.01-2.73-2.45zM4.43.69l9.47 9.46 2.73-2.45-12.2-7.01z"/>
                    </svg>
                    Google Play
                  </a>
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="mb-8">
                <Button onClick={handleInstallPWA} size="lg" variant="outline" className="h-12 px-6 border-primary/40 text-primary font-bold rounded-xl gap-2">
                  <Download size={18} />
                  {isInstalled ? "App instalado ✓" : canInstall ? "Instalar agora (PWA)" : "Instalar como App (PWA)"}
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: "125K+", label: "Downloads" },
                  { value: "4.9★", label: "Avaliação" },
                  { value: "8.5K", label: "Reviews" },
                  { value: "45K+", label: "Ativos" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-card border border-border">
                    <p className="font-display font-black text-lg text-primary">{s.value}</p>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{s.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="hidden lg:flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-[280px] h-[560px] rounded-[40px] border-4 border-border bg-card p-4 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-green opacity-10" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-green">
                    <span className="text-4xl">🌿</span>
                  </div>
                  <h3 className="font-display font-black text-foreground text-xl">Planta & Raiz</h3>
                  <p className="text-xs text-muted-foreground font-medium">Mega Clínica Digital</p>
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" />)}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl md:text-5xl font-display font-black text-foreground mb-10">
            Funcionalidades <span className="text-gradient-purple">Premium</span>
          </motion.h2>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Zap, title: "Orientações Técnicas 24/7", desc: "Chat e vídeo com especialistas a qualquer hora", accent: "green" },
              { icon: Shield, title: "100% Seguro", desc: "Biometria, 2FA e criptografia end-to-end", accent: "purple" },
              { icon: Wifi, title: "Offline-First", desc: "Funciona mesmo sem internet, sincroniza depois", accent: "green" },
              { icon: Users, title: "Comunidade", desc: "Conecte-se com pacientes e especialistas", accent: "purple" },
              { icon: Download, title: "Receitas Digitais", desc: "Baixe prescrições ANVISA-compliant", accent: "green" },
              { icon: Globe, title: "Multi-idioma", desc: "Disponível em PT, EN, ES e mais", accent: "purple" },
              { icon: Heart, title: "Push Notifications", desc: "Lembretes de consulta e promoções", accent: "green" },
              { icon: Smartphone, title: "PWA Instalável", desc: "Instale direto do navegador sem loja", accent: "purple" },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-all hover:-translate-y-1">
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-xl ${f.accent === "green" ? "bg-gradient-green border-green" : "bg-gradient-purple border-purple"} border flex items-center justify-center mb-3`}>
                      <f.icon size={20} className={f.accent === "green" ? "text-primary" : "text-secondary"} />
                    </div>
                    <h3 className="font-display font-bold text-foreground text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 hero-glow">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
              Comece agora — é <span className="text-gradient-green">grátis</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Baixe o app ou acesse pelo navegador. Cadastro rápido e sua primeira consulta com desconto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-8 bg-primary text-primary-foreground font-black rounded-2xl" asChild>
                <Link to="/cadastro">Cadastre-se Grátis <ArrowRight size={18} className="ml-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 border-primary/30 text-primary font-black rounded-2xl" asChild>
                <Link to="/telemedicina">Iniciar Orientação Técnica IA</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DownloadApp;
