import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { strains, strainCategories, type CannabisStrain } from "@/data/strains";
import { Search, Star, Leaf, X, Heart, Droplets, Sprout, FlaskConical, Clock, Mountain, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.04 } } };

const plantImageIds = [
  "1503262028195-93c528f03218", "1416879595882-3373a0480b5b", "1466692476868-aef1dfb1e735",
  "1459411552884-841db9b3cc2a", "1490750967868-88aa4f44baee", "1518531933037-91b2f5f229cc",
  "1523348837708-15d4a09cfac2", "1471193945509-9ad0617afabf", "1487530811176-3780de880c2d",
  "1501004318855-fce2fc823eb9", "1462275646964-a0e3c11f18a6", "1464226184884-fa280b87c399",
  "1442458370899-ae20e367c5d8", "1476954789527-4a4e2cc60cf9", "1509223197845-458d87a6c3f4",
  "1457530378978-8bac673b8062", "1470058869958-2a77d9d5b726", "1426604966848-d7adac402bff",
  "1485637701894-09ad422f6de6", "1530968831187-a937ade57981",
];
const getPlantImageId = (id: number) => plantImageIds[(id - 1) % plantImageIds.length];

const tipoColor = (tipo: string) => {
  if (tipo === "Sativa") return "text-primary border-green bg-gradient-green";
  if (tipo === "Indica") return "text-secondary border-purple bg-gradient-purple";
  return "text-[hsl(45,76%,52%)] border-gold bg-gradient-gold";
};

const BibliotecaCientifica = () => {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [selected, setSelected] = useState<CannabisStrain | null>(null);

  const filtered = useMemo(() => {
    return strains.filter((s) => {
      const matchSearch = !search || s.nome.toLowerCase().includes(search.toLowerCase()) || s.efeitos.some(e => e.toLowerCase().includes(search.toLowerCase())) || s.beneficiosSaude.some(b => b.toLowerCase().includes(search.toLowerCase()));
      const matchTipo = !filterTipo || s.tipo === filterTipo;
      return matchSearch && matchTipo;
    });
  }, [search, filterTipo]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center">
                <Leaf size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">BIBLIOTECA CIENTÍFICA</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-black text-foreground leading-tight mb-6">
              Vamos crescer juntos 🌱
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-4xl leading-relaxed font-medium mb-8">
              A <span className="text-primary font-bold">Planta y Raiz</span> conecta milhares de pacientes e usuários de cannabis curiosos e conscientes com as diversas variedades, produtos e fornecedores que melhor atendem às suas necessidades. Seja você um dispensário, uma marca de produtos ou um profissional de saúde, a parceria com a Plataforma Planta y Raiz oferece a oportunidade de alcançar um público cada vez mais crescente, altamente engajado, informado e personalizado — exatamente quando ele está pronto para explorar, ser atendido e comprar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {strainCategories.map((cat) => (
              <Card key={cat.nome} className="border-border hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl mb-2 block">{cat.emoji}</span>
                  <p className="font-bold text-sm text-foreground">{cat.nome}</p>
                  <p className="text-xs text-muted-foreground">{cat.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="pb-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar variedade, efeito ou benefício..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="flex gap-2">
              {["Indica", "Sativa", "Híbrida"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTipo(filterTipo === t ? null : t)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                    filterTipo === t ? tipoColor(t) : "border-border bg-card/50 text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4 font-medium">
            Exibindo <span className="text-primary font-bold">{filtered.length}</span> variedades de {strains.length}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {filtered.map((strain) => (
              <motion.div key={strain.id} variants={fadeUp}>
                <Card
                  className="border-border hover:border-primary/40 transition-all cursor-pointer group hover:-translate-y-1"
                  onClick={() => setSelected(strain)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={`text-[10px] font-bold ${tipoColor(strain.tipo)}`}>
                        {strain.tipo}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" />
                        <span className="text-xs text-muted-foreground font-bold">{strain.avaliacao}</span>
                      </div>
                    </div>

                    <div className="w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden border border-border group-hover:scale-110 transition-transform">
                      <img 
                        src={strain.imageUrl || `https://images.unsplash.com/photo-${getPlantImageId(strain.id)}?w=200&h=200&fit=crop`}
                        alt={strain.nome}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </div>

                    <h3 className="font-display font-black text-sm text-foreground text-center mb-2">{strain.nome}</h3>

                    <p className="text-xs text-muted-foreground text-center line-clamp-2">
                      Efeitos: {strain.efeitos.slice(0, 3).join(", ")}
                    </p>

                    <div className="flex justify-center gap-2 mt-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">THC {strain.thc}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">CBD {strain.cbd}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3 text-[10px] h-7 font-bold border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to="/profissionais">
                        Saiba Mais <ArrowRight size={10} className="ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                    <img 
                      src={selected.imageUrl || `https://images.unsplash.com/photo-${getPlantImageId(selected.id)}?w=200&h=200&fit=crop`}
                      alt={selected.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                  </div>
                  <div>
                    <DialogTitle className="font-display font-black text-foreground text-xl">{selected.nome}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs font-bold ${tipoColor(selected.tipo)}`}>{selected.tipo}</Badge>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" />
                        <span className="text-sm text-muted-foreground font-bold">{selected.avaliacao}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* THC/CBD Bar */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50 border border-border my-4">
                <div>
                  <span className="text-xs text-muted-foreground">THC</span>
                  <p className="font-bold text-primary text-lg">{selected.thc}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <span className="text-xs text-muted-foreground">CBD</span>
                  <p className="font-bold text-secondary text-lg">{selected.cbd}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground font-medium">Avaliação:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={star <= Math.round(selected.avaliacao) ? "text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" : "text-muted-foreground/30"}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">({selected.avaliacao})</span>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                  <FlaskConical size={16} className="text-primary" /> Descrição Científica
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.descricao}</p>
              </div>

              {/* Effects */}
              <div className="mb-4">
                <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                  <Droplets size={16} className="text-secondary" /> Efeitos Potenciais
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selected.efeitos.map((e) => (
                    <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                  ))}
                </div>
              </div>

              {/* Health Benefits */}
              <div className="mb-4">
                <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                  <Heart size={16} className="text-destructive" /> Benefícios para Saúde
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selected.beneficiosSaude.map((b) => (
                    <Badge key={b} className="text-xs bg-primary/10 text-primary border-green">{b}</Badge>
                  ))}
                </div>
              </div>

              {/* Flavors */}
              <div className="mb-4">
                <h4 className="font-display font-bold text-foreground mb-2">🍃 Sabores</h4>
                <p className="text-sm text-muted-foreground">{selected.sabores.join(", ")}</p>
              </div>

              {/* Grow Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Mountain size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Origem</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{selected.origem}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Florescimento</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{selected.florescimento}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Sprout size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Dificuldade</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{selected.dificuldade}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Leaf size={14} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Rendimento</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{selected.rendimento}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                ⚠️ Informações educativas baseadas em literatura científica. Uso terapêutico depende de prescrição médica individual.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BibliotecaCientifica;
