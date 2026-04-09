import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight, ArrowLeft, Clock, MessageSquare, Phone, Zap, Video, FileText, ShieldCheck, Loader2 } from "lucide-react";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";
import { motion } from "framer-motion";
import { professionals, categories } from "@/data/professionals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSelectService = async (service: typeof SERVICE_TIERS[0]) => {
    setLoadingTier(service.name);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Faça login para contratar um serviço.", {
          action: { label: "Login", onClick: () => window.location.href = "/login" },
        });
        setLoadingTier(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          doctorName,
          patientEmail: session.user.email || "",
          description: `${service.name} com ${doctorName} - R$ ${service.value},00`,
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        toast.success("Redirecionando para o Mercado Pago...");
        window.open(data.init_point, "_blank");
        // After payment, redirect to WhatsApp Brisa
        setTimeout(() => {
          const message = encodeURIComponent(
            `Olá Enfermeira Brisa, acabei de pagar o serviço ${service.name} (${service.price}) e quero seguir com ${doctorName}.`
          );
          window.open(`https://wa.me/${BRISA_WHATSAPP}?text=${message}`, "_blank");
        }, 2000);
      } else {
        toast.error(data?.error || "Erro ao gerar link de pagamento");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {SERVICE_TIERS.map((tier) => {
        const Icon = tier.icon;
        const isLoading = loadingTier === tier.name;
        return (
          <Card
            key={tier.name}
            className={`border-border hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-1 ${
              tier.highlight ? "ring-2 ring-primary border-primary relative" : ""
            }`}
            onClick={() => !isLoading && handleSelectService(tier)}
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
              <Button size="sm" className="w-full font-black bg-primary text-primary-foreground rounded-xl text-xs" disabled={isLoading}>
                {isLoading ? <><Loader2 size={14} className="mr-1 animate-spin" /> Gerando...</> : "Contratar Agora"}
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

      <section className="pt-20 pb-12 md:pt-32 md:pb-16 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="mb-6 md:mb-12" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-2xl sm:text-3xl md:text-6xl font-display font-black text-foreground mb-2 md:mb-4 tracking-tight">
              <span className="text-gradient-green">Profissionais</span> Verificados
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl font-medium">
              {professionals.length} especialistas em 6 categorias — supervisionado por IA de última geração 24×7.
            </p>
          </motion.div>

          {/* Tabs - scroll horizontal no mobile */}
          <div className="flex gap-1.5 md:gap-2 mb-6 md:mb-10 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide">
            {categories.map((cat) => {
              const count = professionals.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 md:px-4 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-black border transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                    activeCategory === cat
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Cards - grid responsivo */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} key={activeCategory}>
            {filtered.map((p) => (
              <motion.div key={p.id} variants={fadeUp}>
                <Link to={`/profissionais/${p.id}`}>
                  <Card className="group border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header com gradiente */}
                      <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 p-4 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={p.imageUrl}
                              alt={`${p.name}`}
                              className="w-16 h-16 md:w-18 md:h-18 rounded-2xl object-cover border-2 border-background shadow-md group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              width={64}
                              height={64}
                            />
                            
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-black text-foreground text-sm md:text-base truncate">{p.name}</h3>
                              {p.flags && p.flags.map((flag, i) => (
                                <span key={i} className="text-sm flex-shrink-0">{flag}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs text-primary font-bold">{p.category}</p>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${p.online ? 'text-green-500' : 'text-muted-foreground'}`}>
                                <span className={`w-2 h-2 rounded-full ${p.online ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                {p.online ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Star size={12} className="text-primary fill-primary" />
                              <span className="text-xs font-black text-foreground">{p.rating}</span>
                              <span className="text-[10px] text-muted-foreground">• {p.consults} consultas</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-4 py-3">
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">{p.bio}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {p.tags.slice(0, 3).map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary/20 bg-primary/5 text-primary">{t}</span>
                          ))}
                        </div>

                        {/* Footer do card */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-lg font-display font-black text-gradient-green">{p.price}</span>
                          <span className="text-[10px] text-primary font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                            Ver perfil <ArrowRight size={12} />
                          </span>
                        </div>

                        {/* Botão Agendar Consulta via WhatsApp */}
                        <a
                          href={`https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent(`Olá Enfermeira Brisa, meu nome é ___, eu gostaria de agendar uma consulta online com ${p.name}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 block"
                        >
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-black rounded-xl gap-2 text-sm h-10">
                            <Phone size={14} /> Agendar Consulta
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-xs text-muted-foreground text-center mt-6 md:mt-8">
            ⚠️ Perfis ilustrativos. Prescrição e conduta dependem de avaliação individual.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-purple pointer-events-none opacity-20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl md:text-5xl font-display font-black text-foreground mb-4 md:mb-6 tracking-tight">É Profissional de Saúde?</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto font-medium">Cadastre-se e atenda pacientes de todo o Brasil com preços populares</p>
          <Button size="lg" className="font-black bg-secondary text-secondary-foreground rounded-2xl h-12 md:h-14 px-6 md:px-8 text-sm md:text-base" asChild>
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
