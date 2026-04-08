import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight, ArrowLeft, Clock, MessageSquare, Phone, Zap, Video, FileText, ShieldCheck } from "lucide-react";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";
import { motion } from "framer-motion";
import { professionals, categories } from "@/data/professionals";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const BRISA_WHATSAPP = "5511991363154";

const SERVICE_TIERS = [
  { name: "Mentoria", price: "R$ 30", value: 30, icon: Zap, desc: "Orientação rápida de 15 min", highlight: false },
  { name: "Consulta Chat", price: "R$ 50", value: 50, icon: MessageSquare, desc: "Consulta por chat completa", highlight: false },
  { name: "Consulta Vídeo", price: "R$ 80", value: 80, icon: Video, desc: "Teleconsulta por vídeo 30 min", highlight: false },
  { name: "Consulta + Receita", price: "R$ 100", value: 100, icon: FileText, desc: "Consulta com prescrição canábica", highlight: true },
  { name: "Combo ANVISA Chat", price: "R$ 120", value: 120, icon: ShieldCheck, desc: "Consulta + laudo + receita ANVISA", highlight: false },
  { name: "Combo Full Vídeo", price: "R$ 150", value: 150, icon: Star, desc: "Vídeo + receita + laudo completo", highlight: false },
];

const WhatsAppContactButton = ({ name, className = "" }: { name: string; className?: string }) => {
  const message = encodeURIComponent(`Olá Enfermeira Brisa, meu nome é ___, eu gostaria de agendar uma consulta online com ${name}`);
  return (
    <a
      href={`https://wa.me/${BRISA_WHATSAPP}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <Button variant="outline" className="w-full text-sm font-black border-primary text-primary hover:bg-primary/10 rounded-xl gap-2">
        <Phone size={14} /> Agendar via WhatsApp
      </Button>
    </a>
  );
};

const ServicePricingGrid = ({ doctorName }: { doctorName: string }) => {
  const handleSelectService = (service: typeof SERVICE_TIERS[0]) => {
    const message = encodeURIComponent(
      `Olá Brisa, confirmei o pagamento do ${service.name} de ${service.price}. Meu nome é ___ e quero seguir com ${doctorName}.`
    );
    window.open(`https://wa.me/${BRISA_WHATSAPP}?text=${message}`, "_blank");
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {SERVICE_TIERS.map((tier) => {
        const Icon = tier.icon;
        return (
          <Card
            key={tier.name}
            className={`border-border hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-1 ${
              tier.highlight ? "ring-2 ring-primary border-primary relative" : ""
            }`}
            onClick={() => handleSelectService(tier)}
          >
            {tier.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full">
                Mais Popular
              </span>
            )}
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-primary" />
              </div>
              <h4 className="font-black text-foreground text-sm mb-1">{tier.name}</h4>
              <p className="text-xs text-muted-foreground mb-3">{tier.desc}</p>
              <p className="text-2xl font-display font-black text-gradient-green mb-3">{tier.price}</p>
              <Button size="sm" className="w-full font-black bg-primary text-primary-foreground rounded-xl text-xs">
                Contratar Agora
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const ProfessionalDetail = ({ id }: { id: string }) => {
  const pro = professionals.find((p) => p.id === id);
  if (!pro) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Profissional não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32">
      <Link to="/profissionais" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Voltar para Profissionais
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="border-border sticky top-24">
            <CardContent className="p-6">
              <div className="relative">
                <img src={pro.imageUrl} alt={`Ilustração - ${pro.name}`} className="w-20 h-20 rounded-2xl object-cover border border-border mb-4" />
                <OnlineStatusIndicator online={pro.online} size="lg" className="absolute -bottom-1 -right-1" />
              </div>
              <h1 className="text-xl font-display font-black text-foreground">{pro.name}</h1>
              <p className="text-sm text-muted-foreground mb-2">{pro.category}</p>
              {pro.crm && <p className="text-xs text-muted-foreground mb-1">CRM: {pro.crm}</p>}
              {pro.hospital && <p className="text-xs text-muted-foreground mb-1">{pro.hospital}</p>}
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className="text-primary fill-primary" />
                <span className="text-sm font-black">{pro.rating}</span>
                <span className="text-xs text-muted-foreground">• {pro.consults} consultas</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{pro.bio}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {pro.tags.map((t) => (
                  <span key={t} className="px-2 py-1 rounded-full text-xs font-bold border border-border bg-card text-muted-foreground">{t}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-1">Experiência: {pro.experience}</p>
              <p className="text-2xl font-display font-black text-gradient-green mb-4">a partir de R$ 30 <span className="text-sm text-muted-foreground font-normal">/ serviço</span></p>
              <div className="space-y-2">
                <WhatsAppContactButton name={pro.name} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Pricing Grid */}
          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-display font-black text-foreground mb-4 flex items-center gap-2">💳 Serviços & Valores</h2>
              <ServicePricingGrid doctorName={pro.name} />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-display font-black text-foreground mb-4 flex items-center gap-2"><Clock size={18} /> Agenda Disponível</h2>
              <p className="text-sm text-muted-foreground mb-3">Horários para hoje (exemplo ilustrativo)</p>
              <div className="flex flex-wrap gap-2">
                {pro.slots.map((slot) => (
                  <Button key={slot} variant="outline" size="sm" className="border-border hover:border-primary/50 hover:bg-primary/10 text-sm rounded-xl" asChild>
                    <Link to={`/falar-com-especialista?pro=${pro.id}`}>{slot}</Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-display font-black text-foreground mb-4">Avaliações</h2>
              <div className="space-y-3">
                {pro.reviews.map((r, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-black text-sm">{r.name}</span>
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

      <section className="pt-24 pb-16 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="mb-12" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-black text-foreground mb-4 tracking-tight">
              <span className="text-gradient-green">Profissionais</span> Verificados
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium">
              {professionals.length} especialistas em 6 categorias sob supervisão técnica do Dr. Edilson Bezerra. Escolha, agende e pague via Pix ou PayPal.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => {
              const count = professionals.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2.5 rounded-full text-sm font-black border transition-colors ${
                    activeCategory === cat
                      ? "border-green bg-gradient-green text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Cards */}
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} key={activeCategory}>
            {filtered.map((p) => (
              <motion.div key={p.id} variants={fadeUp}>
                <Link to={`/profissionais/${p.id}`}>
                  <Card className="border-border hover:border-primary/30 transition-all hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-5">
                       <div className="flex items-center gap-4 mb-4">
                         <img src={p.imageUrl} alt={`Ilustração - ${p.name}`} className="w-14 h-14 rounded-2xl object-cover border border-border" loading="lazy" />
                         <div>
                           <div className="flex items-center gap-1.5">
                             <h3 className="font-black text-foreground">{p.name}</h3>
                             {p.flags && p.flags.map((flag, i) => (
                               <span key={i} className="text-sm">{flag}</span>
                             ))}
                           </div>
                           <div className="flex items-center gap-2">
                             <p className="text-sm text-muted-foreground">{p.category}</p>
                             <OnlineStatusIndicator online={p.online} size="sm" showLabel />
                           </div>
                         </div>
                       </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{p.bio}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-border text-muted-foreground">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-primary fill-primary" />
                          <span className="text-sm font-black text-foreground">{p.rating}</span>
                          <span className="text-xs text-muted-foreground ml-1">{p.consults} consultas</span>
                        </div>
                        <span className="text-lg font-display font-black text-gradient-green">{p.price}</span>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-3">Toque para ver perfil e serviços →</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            ⚠️ Perfis ilustrativos. Prescrição e conduta dependem de avaliação individual.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple pointer-events-none opacity-20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mb-6 tracking-tight">É Profissional de Saúde?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto font-medium">Cadastre-se e atenda pacientes de todo o Brasil com preços populares</p>
          <Button size="lg" className="font-black bg-secondary text-secondary-foreground rounded-2xl h-14 px-8" asChild>
            <Link to="/cadastro-profissional">
              Cadastrar como Profissional <ArrowRight size={20} className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profissionais;
