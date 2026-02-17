import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight, ArrowLeft, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { professionals, categories } from "@/data/professionals";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const ProfessionalDetail = ({ id }: { id: string }) => {
  const pro = professionals.find((p) => p.id === id);
  if (!pro) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Profissional não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32">
      <Link to="/profissionais" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Voltar para Profissionais
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile */}
        <div className="lg:col-span-1">
          <Card className="border-border sticky top-24">
            <CardContent className="p-6">
              <img src={pro.imageUrl} alt={`Ilustração - ${pro.name}`} className="w-20 h-20 rounded-2xl object-cover border border-border mb-4" />
              <h1 className="text-xl font-display font-bold text-foreground">{pro.name}</h1>
              <p className="text-sm text-muted-foreground mb-2">{pro.category}</p>
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className="text-primary fill-primary" />
                <span className="text-sm font-bold">{pro.rating}</span>
                <span className="text-xs text-muted-foreground">• {pro.consults} consultas</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{pro.bio}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {pro.tags.map((t) => (
                  <span key={t} className="px-2 py-1 rounded-full text-xs font-bold border border-border bg-card text-muted-foreground">{t}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-1">Experiência: {pro.experience}</p>
              <p className="text-2xl font-display font-bold text-gradient-gold mb-4">{pro.price} <span className="text-sm text-muted-foreground font-normal">/ consulta</span></p>
              <Button className="w-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mb-2" asChild>
                <a href={`https://wa.me/${pro.whatsapp}?text=Olá!%20Quero%20agendar%20com%20${encodeURIComponent(pro.name)}`} target="_blank" rel="noopener noreferrer">
                  <MessageSquare size={16} className="mr-2" /> Agendar via WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agenda */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2"><Clock size={18} /> Agenda Disponível</h2>
              <p className="text-sm text-muted-foreground mb-3">Horários para hoje (exemplo ilustrativo)</p>
              <div className="flex flex-wrap gap-2">
                {pro.slots.map((slot) => (
                  <Button key={slot} variant="outline" size="sm" className="border-border hover:border-primary/50 hover:bg-primary/10 text-sm" asChild>
                    <a href={`https://wa.me/${pro.whatsapp}?text=Olá!%20Quero%20agendar%20às%20${slot}%20com%20${encodeURIComponent(pro.name)}`} target="_blank" rel="noopener noreferrer">
                      {slot}
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">Serviços</h2>
              <div className="space-y-3">
                {pro.services.map((s, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <p className="font-bold text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    <span className="text-sm font-bold text-gradient-gold whitespace-nowrap ml-4">{s.price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">Avaliações</h2>
              <div className="space-y-3">
                {pro.reviews.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm">{r.name}</span>
                      <div className="flex">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={12} className="text-primary fill-primary" />)}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">"{r.text}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            ⚠️ Prescrição e conduta clínica dependem de avaliação individual.
          </p>
        </div>
      </div>
    </div>
  );
};

const Profissionais = () => {
  const { id } = useParams();
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  if (id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <WhatsAppButton />
        <ProfessionalDetail id={id} />
        <Footer />
      </div>
    );
  }

  const filtered = professionals.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[300px] rounded-full bg-primary/8 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="text-center mb-12" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              <span className="text-gradient-gold">Profissionais</span> Verificados
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              5 categorias, 15 profissionais com preços populares e atendimento via WhatsApp
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  activeCategory === cat
                    ? "border-gold bg-gradient-gold text-primary"
                    : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards */}
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} key={activeCategory}>
            {filtered.map((p) => (
              <motion.div key={p.id} variants={fadeUp}>
                <Card className="border-border hover:border-primary/30 transition-all hover:-translate-y-1">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={p.imageUrl} alt={`Ilustração - ${p.name}`} className="w-14 h-14 rounded-xl object-cover border border-border" />
                      <div>
                        <h3 className="font-bold text-foreground">{p.name}</h3>
                        <p className="text-sm text-muted-foreground">{p.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{p.bio}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-border text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-primary fill-primary" />
                        <span className="text-sm font-bold text-foreground">{p.rating}</span>
                        <span className="text-xs text-muted-foreground ml-1">{p.consults} consultas</span>
                      </div>
                      <span className="text-lg font-display font-bold text-gradient-gold">{p.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-gradient-to-r from-primary/20 to-primary/10 border border-gold text-primary hover:from-primary/30 text-sm font-bold" asChild>
                        <a href={`https://wa.me/${p.whatsapp}?text=Olá!%20Quero%20agendar%20com%20${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer">
                          WhatsApp
                        </a>
                      </Button>
                      <Button variant="outline" className="flex-1 text-sm font-bold border-border" asChild>
                        <Link to={`/profissionais/${p.id}`}>Ver Perfil</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            ⚠️ Perfis ilustrativos. Prescrição e conduta dependem de avaliação individual.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">É Profissional de Saúde?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">Cadastre-se e atenda pacientes de todo o Brasil com preços populares</p>
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
