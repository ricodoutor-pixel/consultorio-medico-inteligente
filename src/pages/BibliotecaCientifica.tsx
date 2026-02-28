import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { strains, strainCategories, type CannabisStrain } from "@/data/strains";
import { Search, Star, Leaf, Heart, Droplets, Sprout, FlaskConical, Clock, Mountain, ArrowRight, Grid3X3, List, SlidersHorizontal, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.03 } } };

const getTipoCategory = (tipo: string) => {
  const t = tipo.toLowerCase();
  if (t.includes("cbd")) return "cbd";
  if (t.includes("sativa")) return "sativa";
  if (t.includes("indica")) return "indica";
  return "hibrida";
};

const tipoColor = (tipo: string) => {
  const cat = getTipoCategory(tipo);
  if (cat === "sativa") return "text-primary border-green bg-gradient-green";
  if (cat === "indica") return "text-secondary border-purple bg-gradient-purple";
  if (cat === "cbd") return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
  return "text-[hsl(45,76%,52%)] border-gold bg-gradient-gold";
};

const tipoBadgeStyle = (tipo: string) => {
  const cat = getTipoCategory(tipo);
  if (cat === "sativa") return "bg-primary/20 text-primary border-primary/30";
  if (cat === "indica") return "bg-secondary/20 text-secondary border-secondary/30";
  if (cat === "cbd") return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
  return "bg-[hsl(45,76%,52%)]/20 text-[hsl(45,76%,52%)] border-[hsl(45,76%,52%)]/30";
};

type ViewMode = "grid" | "list";
type SortMode = "relevancia" | "avaliacao" | "nome" | "thc";

const BibliotecaCientifica = () => {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [selected, setSelected] = useState<CannabisStrain | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("relevancia");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let results = strains.filter((s) => {
      const matchSearch = !search || s.nome.toLowerCase().includes(search.toLowerCase()) || s.efeitos.some(e => e.toLowerCase().includes(search.toLowerCase())) || s.beneficiosSaude.some(b => b.toLowerCase().includes(search.toLowerCase()));
      const matchTipo = !filterTipo || getTipoCategory(s.tipo) === filterTipo;
      return matchSearch && matchTipo;
    });

    switch (sortMode) {
      case "avaliacao": results.sort((a, b) => b.avaliacao - a.avaliacao); break;
      case "nome": results.sort((a, b) => a.nome.localeCompare(b.nome)); break;
      case "thc": results.sort((a, b) => parseFloat(b.thc) - parseFloat(a.thc)); break;
    }
    return results;
  }, [search, filterTipo, sortMode]);

  const stats = useMemo(() => ({
    avgRating: (filtered.reduce((a, b) => a + b.avaliacao, 0) / (filtered.length || 1)).toFixed(1),
    total: filtered.length,
  }), [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center">
                <Leaf size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary tracking-wider">ENCICLOPÉDIA DE PLANTAS</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-black text-foreground leading-tight mb-4">
              🌿 Maior Biblioteca de Cannabis Medicinal do Mundo
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed font-medium mb-6">
              Explore <span className="text-primary font-bold">{strains.length}+</span> variedades medicinais com informações científicas completas, fotos reais e dados de cultivo.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { label: "Plantas", value: `${strains.length}+`, icon: "🌱" },
                { label: "Estudos", value: "1000+", icon: "📚" },
                { label: "Especialistas", value: "500+", icon: "👨‍⚕️" },
                { label: "Países", value: "150+", icon: "🌍" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
                  <span className="text-lg">{stat.icon}</span>
                  <div>
                    <p className="text-sm font-black text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {strainCategories.map((cat) => (
              <Card
                key={cat.nome}
                className={`border-border hover:border-primary/30 transition-all cursor-pointer group ${filterTipo === cat.nome ? "border-primary/50 glow-green" : ""}`}
                onClick={() => setFilterTipo(filterTipo === cat.nome ? null : cat.nome)}
              >
                <CardContent className="p-4 text-center">
                  <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <p className="font-bold text-sm text-foreground">{cat.nome}</p>
                  <p className="text-xs text-muted-foreground">{cat.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Search, Filters & Controls */}
      <section className="pb-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, nome científico, efeito ou benefício..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "cbd", label: "Alto CBD" },
                { key: "sativa", label: "Sativa" },
                { key: "indica", label: "Indica" },
                { key: "hibrida", label: "Híbrida" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilterTipo(filterTipo === t.key ? null : t.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    filterTipo === t.key ? tipoColor(t.label) : "border-border bg-card/50 text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* View controls */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground font-medium">
              <span className="text-primary font-bold">{stats.total}</span> plantas encontradas • Avaliação média: <span className="text-[hsl(45,76%,52%)] font-bold">{stats.avgRating}★</span>
            </p>
            <div className="flex items-center gap-2">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-xs bg-card border border-border rounded-lg px-2 py-1.5 text-muted-foreground font-bold focus:outline-none focus:border-primary/30"
              >
                <option value="relevancia">Relevância</option>
                <option value="avaliacao">Melhor Avaliado</option>
                <option value="nome">Nome A-Z</option>
                <option value="thc">Maior THC</option>
              </select>
              <div className="flex gap-1 border border-border rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid / List */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Leaf size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-bold text-muted-foreground mb-2">Nenhuma planta encontrada</p>
              <Button variant="outline" onClick={() => { setSearch(""); setFilterTipo(null); }} className="text-primary border-primary/30">
                Limpar Filtros
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {filtered.map((strain) => (
                <motion.div key={strain.id} variants={fadeUp}>
                  <Card
                    className="border-border hover:border-primary/40 transition-all cursor-pointer group hover:-translate-y-1 overflow-hidden"
                    onClick={() => setSelected(strain)}
                  >
                    {/* Image */}
                    <div className="relative w-full aspect-square overflow-hidden">
                      <img
                        src={strain.imagem}
                        alt={strain.nome}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
                      {/* Top badges */}
                      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        <Badge className={`text-[10px] font-bold ${tipoBadgeStyle(strain.tipo)}`}>
                          {strain.tipo}
                        </Badge>
                        <button
                          onClick={(e) => toggleFavorite(strain.id, e)}
                          className="p-1 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
                        >
                          <Heart
                            size={14}
                            className={favorites.has(strain.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}
                          />
                        </button>
                      </div>
                      {/* Bottom info overlay */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" />
                          <span className="text-[10px] text-foreground font-bold">{strain.avaliacao}</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <h3 className="font-display font-black text-sm text-foreground mb-1 truncate">{strain.nome}</h3>

                      <div className="flex gap-2 mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">THC {strain.thc}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold">CBD {strain.cbd}</span>
                      </div>

                      <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">
                        {strain.efeitos.slice(0, 3).join(" • ")}
                      </p>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-[10px] h-7 font-bold border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link to="/profissionais">
                          Consultar Especialista <ArrowRight size={10} className="ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* List View */
            <motion.div className="space-y-2" initial="hidden" animate="visible" variants={stagger}>
              {filtered.map((strain) => (
                <motion.div key={strain.id} variants={fadeUp}>
                  <Card
                    className="border-border hover:border-primary/30 transition-all cursor-pointer group"
                    onClick={() => setSelected(strain)}
                  >
                    <CardContent className="p-3 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                        <img
                          src={strain.imagem}
                          alt={strain.nome}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-black text-sm text-foreground truncate">{strain.nome}</h3>
                          <Badge className={`text-[9px] font-bold ${tipoBadgeStyle(strain.tipo)}`}>{strain.tipo}</Badge>
                          <div className="flex items-center gap-0.5">
                            <Star size={10} className="text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" />
                            <span className="text-[10px] text-muted-foreground font-bold">{strain.avaliacao}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-primary font-bold">THC {strain.thc}</span>
                          <span className="text-secondary font-bold">CBD {strain.cbd}</span>
                          <span className="text-muted-foreground">📍 {strain.origem.split("—")[0].trim()}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {strain.efeitos.slice(0, 4).join(" • ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={(e) => toggleFavorite(strain.id, e)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Heart size={14} className={favorites.has(strain.id) ? "fill-destructive text-destructive" : "text-muted-foreground"} />
                        </button>
                        <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
          {selected && (
            <>
              {/* Hero image */}
              <div className="relative w-full h-48 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg" style={{ width: "calc(100% + 48px)" }}>
                <img
                  src={selected.imagem}
                  alt={selected.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <DialogTitle className="font-display font-black text-foreground text-xl mb-1">{selected.nome}</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs font-bold ${tipoBadgeStyle(selected.tipo)}`}>{selected.tipo}</Badge>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" />
                      <span className="text-sm text-foreground font-bold">{selected.avaliacao}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogHeader className="sr-only">
                <DialogTitle>{selected.nome}</DialogTitle>
              </DialogHeader>

              {/* THC/CBD Bar */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50 border border-border mb-4">
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">THC</span>
                  <p className="font-bold text-primary text-lg">{selected.thc}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">CBD</span>
                  <p className="font-bold text-secondary text-lg">{selected.cbd}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">Avaliação</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} className={star <= Math.round(selected.avaliacao) ? "text-[hsl(45,76%,52%)] fill-[hsl(45,76%,52%)]" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                </div>
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
                  <Heart size={16} className="text-destructive" /> Indicações Terapêuticas
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

              {/* CTA */}
              <Button className="w-full bg-primary text-primary-foreground font-black rounded-xl" asChild>
                <Link to="/profissionais">
                  Consultar Especialista <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">
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
