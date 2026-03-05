import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, ThumbsDown, Search, Plus, Users, BookOpen, Clock, ChevronRight, Stethoscope, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const categories = [
  { id: "ansiedade", label: "Ansiedade", emoji: "😰", count: 234 },
  { id: "insonia", label: "Insônia", emoji: "🌙", count: 187 },
  { id: "dor", label: "Dor Crônica", emoji: "💊", count: 312 },
  { id: "depressao", label: "Depressão", emoji: "🧠", count: 156 },
  { id: "geral", label: "Geral", emoji: "🌿", count: 445 },
];

const scientificPapers = [
  { title: "Cannabis e Insônia: Revisão Sistemática 2024", journal: "Journal of Clinical Sleep Medicine", year: 2024, doi: "#", category: "insonia" },
  { title: "Canabinoides no Tratamento da Ansiedade Generalizada", journal: "Brazilian Journal of Psychiatry", year: 2024, doi: "#", category: "ansiedade" },
  { title: "Eficácia do CBD na Dor Crônica Neuropática", journal: "Pain Medicine", year: 2023, doi: "#", category: "dor" },
  { title: "Cannabis Medicinal e Depressão: Meta-Análise", journal: "The Lancet Psychiatry", year: 2024, doi: "#", category: "depressao" },
  { title: "Canabidiol na Epilepsia Refratária Pediátrica", journal: "Epilepsia", year: 2023, doi: "#", category: "geral" },
];

const initialTopics = [
  { id: 1, title: "Minha experiência com CBD para ansiedade", author: "Maria L.", authorType: "patient", category: "ansiedade", replies: 23, upvotes: 45, downvotes: 3, date: "2h atrás", preview: "Comecei o tratamento há 3 meses e quero compartilhar meus resultados..." },
  { id: 2, title: "Dosagem ideal de óleo para insônia", author: "Dr. Felipe Andrade", authorType: "doctor", category: "insonia", replies: 18, upvotes: 67, downvotes: 1, date: "4h atrás", preview: "Com base na minha prática clínica, a dosagem recomendada varia conforme..." },
  { id: 3, title: "Cannabis + fisioterapia para fibromialgia", author: "João P.", authorType: "patient", category: "dor", replies: 31, upvotes: 89, downvotes: 5, date: "6h atrás", preview: "Descobri que a combinação de fisioterapia com CBD tópico melhorou..." },
  { id: 4, title: "Qual strain indicada para depressão leve?", author: "Ana S.", authorType: "patient", category: "depressao", replies: 14, upvotes: 28, downvotes: 2, date: "8h atrás", preview: "Estou procurando recomendações de strains com perfil mais energético..." },
  { id: 5, title: "Importação pela ANVISA — passo a passo atualizado", author: "Dra. Camila Rocha", authorType: "doctor", category: "geral", replies: 42, upvotes: 156, downvotes: 0, date: "12h atrás", preview: "Guia completo atualizado para 2026 sobre importação de cannabis medicinal..." },
  { id: 6, title: "Relato: 6 meses usando Harlequin para dor", author: "Roberto S.", authorType: "patient", category: "dor", replies: 19, upvotes: 52, downvotes: 4, date: "1d atrás", preview: "Depois de anos tentando diversos tratamentos, finalmente encontrei alívio..." },
  { id: 7, title: "Diferença entre CBD isolado e full spectrum", author: "Dr. Ricardo Mendes", authorType: "doctor", category: "geral", replies: 27, upvotes: 93, downvotes: 2, date: "1d atrás", preview: "Muitos pacientes me perguntam sobre as diferenças. Vou explicar..." },
  { id: 8, title: "Lidando com estigma social do tratamento", author: "Carolina M.", authorType: "patient", category: "geral", replies: 35, upvotes: 112, downvotes: 1, date: "2d atrás", preview: "Compartilho minha experiência e como superei o preconceito da família..." },
];

const Comunidade = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useState(initialTopics);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = topics.filter((t) => {
    const matchCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.preview.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleVote = (id: number, type: "up" | "down") => {
    setTopics(topics.map(t => t.id === id ? { ...t, upvotes: type === "up" ? t.upvotes + 1 : t.upvotes, downvotes: type === "down" ? t.downvotes + 1 : t.downvotes } : t));
  };

  const handleNewTopic = () => {
    if (!newTitle || !newContent || !newCategory) return;
    const topic = { id: topics.length + 1, title: newTitle, author: "Você", authorType: "patient" as const, category: newCategory, replies: 0, upvotes: 0, downvotes: 0, date: "agora", preview: newContent.slice(0, 120) + "..." };
    setTopics([topic, ...topics]);
    setNewTitle(""); setNewContent(""); setNewCategory(""); setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-purple border border-purple flex items-center justify-center glow-purple">
                <Users size={24} className="text-secondary" />
              </div>
              <span className="text-sm font-bold text-secondary">COMUNIDADE</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Comunidade <span className="text-gradient-purple">Planta & Raiz</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Troque experiências com outros pacientes e profissionais. Compartilhe relatos, tire dúvidas e acesse estudos científicos.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Categories */}
          <motion.div className="flex gap-2 mb-6 flex-wrap" initial="hidden" animate="visible" variants={stagger}>
            <button onClick={() => setSelectedCategory("all")} className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${selectedCategory === "all" ? "border-primary bg-gradient-green text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
              🌿 Todos ({topics.length})
            </button>
            {categories.map(c => (
              <motion.button key={c.id} variants={fadeUp} onClick={() => setSelectedCategory(c.id)} className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${selectedCategory === c.id ? "border-primary bg-gradient-green text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                {c.emoji} {c.label} ({c.count})
              </motion.button>
            ))}
          </motion.div>

          {/* Search + New Topic */}
          <div className="flex gap-3 mb-8 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar tópicos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted border-border rounded-xl" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-black bg-primary text-primary-foreground rounded-xl"><Plus size={16} className="mr-1" /> Novo Tópico</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display font-black text-foreground">Criar Novo Tópico</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Título do tópico" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-muted border-border" />
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Escreva seu tópico..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="bg-muted border-border min-h-[120px]" />
                  <Button className="w-full font-black bg-primary text-primary-foreground rounded-xl" onClick={handleNewTopic}>Publicar Tópico</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Topics List */}
            <div className="lg:col-span-2 space-y-3">
              {filtered.map((topic) => (
                <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-border hover:border-primary/20 transition-colors cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className="text-[10px] bg-muted text-muted-foreground border-border">
                              {categories.find(c => c.id === topic.category)?.emoji} {categories.find(c => c.id === topic.category)?.label}
                            </Badge>
                            {topic.authorType === "doctor" && (
                              <Badge className="text-[10px] bg-secondary/10 text-secondary border-purple">
                                <Stethoscope size={10} className="mr-1" /> Especialista
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-display font-black text-foreground text-sm group-hover:text-primary transition-colors">{topic.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{topic.preview}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="font-bold">{topic.author}</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {topic.date}</span>
                            <span className="flex items-center gap-1"><MessageSquare size={10} /> {topic.replies}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <button onClick={() => handleVote(topic.id, "up")} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><ThumbsUp size={14} className="text-primary" /></button>
                          <span className="text-xs font-bold text-foreground">{topic.upvotes - topic.downvotes}</span>
                          <button onClick={() => handleVote(topic.id, "down")} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><ThumbsDown size={14} className="text-muted-foreground" /></button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Scientific Papers */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-display font-black text-foreground text-sm mb-4 flex items-center gap-2">
                    <BookOpen size={16} className="text-secondary" /> Estudos Científicos
                  </h3>
                  <div className="space-y-3">
                    {scientificPapers.map((paper, i) => (
                      <a key={i} href={paper.doi} className="block p-3 rounded-xl bg-muted/30 border border-border hover:border-secondary/20 transition-colors group/paper">
                        <p className="text-xs font-bold text-foreground group-hover/paper:text-secondary transition-colors">{paper.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{paper.journal} • {paper.year}</p>
                        <span className="text-[10px] text-secondary flex items-center gap-1 mt-1"><ExternalLink size={8} /> Acessar</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats */}
              <Card className="border-border">
                <CardContent className="p-5">
                  <h3 className="font-display font-black text-foreground text-sm mb-4">📊 Estatísticas</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Membros ativos", value: "12.450" },
                      { label: "Tópicos criados", value: "1.334" },
                      { label: "Respostas hoje", value: "287" },
                      { label: "Especialistas verificados", value: "48" },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                        <span className="text-xs font-bold text-foreground">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Comunidade;
