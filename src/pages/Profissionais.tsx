import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Star, Video, Wallet, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const profiles = [
  { name: "Dr. Carlos M.", specialty: "Neurologia", rating: 4.9, consults: 230, avatar: "CM" },
  { name: "Dra. Ana B.", specialty: "Psiquiatria", rating: 4.8, consults: 185, avatar: "AB" },
  { name: "Dr. Pedro S.", specialty: "Clínica da Dor", rating: 4.9, consults: 312, avatar: "PS" },
  { name: "Dra. Lucia F.", specialty: "Neurologia", rating: 4.7, consults: 148, avatar: "LF" },
  { name: "Dr. Marcos T.", specialty: "Medicina Integrativa", rating: 4.8, consults: 195, avatar: "MT" },
  { name: "Dra. Renata V.", specialty: "Psiquiatria", rating: 4.9, consults: 267, avatar: "RV" },
];

const Profissionais = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[300px] rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              <span className="text-gradient-gold">Profissionais</span> Verificados
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Médicos e terapeutas com currículo verificado, documentos e avaliações reais
            </p>
          </motion.div>

          {/* Features */}
          <motion.div className="grid md:grid-cols-3 gap-6 mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Shield, title: "Perfis Verificados", desc: "Currículo, CRM, documentos e especialidades validadas pela plataforma." },
              { icon: Video, title: "Consulta por Chat/Vídeo", desc: "Atendimento dentro da plataforma com histórico, anexos e recibos." },
              { icon: Wallet, title: "Carteira do Profissional", desc: "Saldo, extrato e solicitação de saque Pix — transparência total." },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-gold border border-gold flex items-center justify-center mb-4">
                      <f.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Profile cards */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Profissionais Disponíveis</h2>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {profiles.map((p, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border hover:border-primary/30 transition-all hover:-translate-y-1">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/40 to-primary/30 border border-border flex items-center justify-center font-bold text-foreground">
                        {p.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{p.name}</h3>
                        <p className="text-sm text-muted-foreground">{p.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-primary fill-primary" />
                        <span className="text-sm font-bold text-foreground">{p.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{p.consults} consultas</span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-primary/20 to-primary/10 border border-gold text-primary hover:from-primary/30 text-sm font-bold" asChild>
                      <a href={`https://wa.me/5511987131241?text=Olá!%20Quero%20agendar%20com%20${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer">
                        Agendar Consulta
                      </a>
                    </Button>
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
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
            É Profissional de Saúde?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Cadastre-se na plataforma, configure sua agenda e comece a atender pacientes de todo o Brasil
          </p>
          <Button size="lg" className="font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30" asChild>
            <a href="https://wa.me/5511987131241?text=Olá!%20Sou%20profissional%20e%20quero%20me%20cadastrar%20na%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
              Cadastrar como Profissional <ArrowRight size={20} className="ml-2" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profissionais;
