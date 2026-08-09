import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, ThumbsUp, Eye, Clock, Search, TrendingUp, Filter } from "lucide-react";

const categories = [
  { id: "all", label: "Todos", count: 156 },
  { id: "dor", label: "Dor Crônica", count: 42 },
  { id: "ansiedade", label: "Ansiedade", count: 38 },
  { id: "insonia", label: "Insônia", count: 28 },
  { id: "epilepsia", label: "Epilepsia", count: 15 },
  { id: "legislacao", label: "Legislação", count: 20 },
  { id: "pesquisa", label: "Pesquisa", count: 13 },
];

const topics = [
  {
    id: 1,
    title: "Qual a melhor forma de iniciar tratamento com CBD para ansiedade?",
    author: "Maria S.",
    avatar: "MS",
    category: "ansiedade",
    replies: 23,
    views: 450,
    likes: 34,
    time: "2h atrás",
    isPinned: true,
    tags: ["CBD", "Ansiedade", "Iniciante"],
  },
  {
    id: 2,
    title: "Experiência com óleo full spectrum para fibromialgia - 6 meses de uso",
    author: "Dr. Carlos M.",
    avatar: "CM",
    category: "dor",
    replies: 45,
    views: 890,
    likes: 67,
    time: "5h atrás",
    isPinned: true,
    isDoctor: true,
    tags: ["Full Spectrum", "Fibromialgia", "Relato"],
  },
  {
    id: 3,
    title: "Nova RDC da ANVISA: mudanças para importação em 2026",
    author: "João P.",
    avatar: "JP",
    category: "legislacao",
    replies: 18,
    views: 320,
    likes: 25,
    time: "1d atrás",
    tags: ["ANVISA", "Importação", "RDC 660"],
  },
  {
    id: 4,
    title: "CBD + melatonina para insônia: alguém já tentou?",
    author: "Ana L.",
    avatar: "AL",
    category: "insonia",
    replies: 31,
    views: 540,
    likes: 28,
    time: "1d atrás",
    tags: ["CBD", "Melatonina", "Insônia"],
  },
  {
    id: 5,
    title: "Estudo publicado: THC microdose para TEPT em veteranos",
    author: "Dr. Rafael N.",
    avatar: "RN",
    category: "pesquisa",
    replies: 12,
    views: 280,
    likes: 41,
    time: "2d atrás",
    isDoctor: true,
    tags: ["THC", "TEPT", "Pesquisa"],
  },
  {
    id: 6,
    title: "Meu filho tem epilepsia refratária - buscando orientação",
    author: "Paula R.",
    avatar: "PR",
    category: "epilepsia",
    replies: 56,
    views: 1200,
    likes: 89,
    time: "3d atrás",
    tags: ["Epilepsia", "Pediátrico", "Ajuda"],
  },
];

export default function Forum() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = topics.filter((t) => {
    const matchCat = selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <SEO title="Fórum | Comunidade Cannabis Medicinal | Planta & Raiz" description="Participe das discussões sobre cannabis medicinal. Tire dúvidas, compartilhe experiências e aprenda com especialistas." />
      <Navbar />
      <main className="min-h-dvh bg-background pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3">
              Fórum <span className="text-primary">Colaborativo</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Discuta, aprenda e compartilhe com a maior comunidade de cannabis medicinal do Brasil.</p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar tópicos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-center flex-wrap">
            {categories.map((cat) => (
              <Button key={cat.id} size="sm" variant={selectedCategory === cat.id ? "default" : "outline"} onClick={() => setSelectedCategory(cat.id)} className="rounded-full whitespace-nowrap">
                {cat.label} <span className="ml-1 text-xs opacity-60">({cat.count})</span>
              </Button>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp size={14} /> {filtered.length} tópicos</span>
            <Button size="sm" className="font-bold"><MessageSquare size={14} className="mr-1" /> Novo Tópico</Button>
          </div>

          {/* Topics */}
          <div className="space-y-3">
            {filtered.map((topic) => (
              <Card key={topic.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-start gap-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className={topic.isDoctor ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}>
                      {topic.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {topic.isPinned && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">📌 Fixado</Badge>}
                      {topic.isDoctor && <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">🩺 Médico</Badge>}
                    </div>
                    <h3 className="font-bold text-foreground text-sm md:text-base line-clamp-1 hover:text-primary transition-colors">{topic.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>{topic.author}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {topic.time}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {topic.replies}</span>
                      <span className="flex items-center gap-1"><Eye size={12} /> {topic.views}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={12} /> {topic.likes}</span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {topic.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
