import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, ThumbsDown, Search, Plus, Users, BookOpen, Clock, ChevronRight, ChevronDown, Stethoscope, ExternalLink, ArrowLeft, Send, Reply } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

type TopicReply = {
  id: number;
  author: string;
  authorType: "patient" | "doctor";
  content: string;
  date: string;
  upvotes: number;
  downvotes: number;
  replies: TopicReply[];
};

type Topic = {
  id: number;
  title: string;
  author: string;
  authorType: "patient" | "doctor";
  category: string;
  replies: TopicReply[];
  replyCount: number;
  upvotes: number;
  downvotes: number;
  date: string;
  preview: string;
  content: string;
};

const makeReplies = (base: { author: string; authorType: "patient" | "doctor"; content: string; date: string }[]): TopicReply[] =>
  base.map((r, i) => ({ id: i + 1, ...r, upvotes: Math.floor(Math.random() * 20), downvotes: Math.floor(Math.random() * 3), replies: [] }));

const initialTopics: Topic[] = [
  {
    id: 1, title: "Minha experiência com CBD para ansiedade", author: "Maria L.", authorType: "patient", category: "ansiedade", replyCount: 23, upvotes: 45, downvotes: 3, date: "2h atrás",
    preview: "Comecei o tratamento há 3 meses e quero compartilhar meus resultados...",
    content: "Comecei o tratamento com CBD há 3 meses após indicação da minha psiquiatra. Estou usando óleo full spectrum 1000mg, 3 gotas sublingual antes de dormir. Nos primeiros 15 dias não senti muita diferença, mas a partir da terceira semana percebi uma melhora significativa na qualidade do sono e redução dos picos de ansiedade durante o dia. Minha dose foi ajustada para 5 gotas e hoje me sinto muito mais estável emocionalmente. Alguém mais teve experiência semelhante?",
    replies: makeReplies([
      { author: "Dr. Felipe Andrade", authorType: "doctor", content: "Maria, fico feliz com seu relato! A resposta ao CBD geralmente leva de 2-4 semanas para estabilizar. O ajuste de dose que sua psiquiatra fez é o protocolo correto. Continue monitorando e relatando.", date: "1h atrás" },
      { author: "João P.", authorType: "patient", content: "Tive experiência parecida! No meu caso demorou 1 mês para sentir os efeitos. Hoje uso há 6 meses e a diferença é enorme.", date: "1h atrás" },
      { author: "Carolina M.", authorType: "patient", content: "Obrigada por compartilhar! Estou na segunda semana e ansiosa (rs) para ver os resultados. Seu relato me deu esperança.", date: "45min atrás" },
    ]),
  },
  {
    id: 2, title: "Dosagem ideal de óleo para insônia", author: "Dr. Felipe Andrade", authorType: "doctor", category: "insonia", replyCount: 18, upvotes: 67, downvotes: 1, date: "4h atrás",
    preview: "Com base na minha prática clínica, a dosagem recomendada varia conforme...",
    content: "Com base na minha prática clínica atendendo mais de 500 pacientes com insônia, compartilho um protocolo geral (sempre individualizar com seu médico): Início com CBD isolado 25mg/dia, sublingual 1h antes de dormir. Após 2 semanas, avaliar resposta. Se necessário, aumentar para 50mg. Para casos mais resistentes, considerar formulação com THC:CBD (1:20). O CBN também tem mostrado resultados promissores em estudos recentes. Lembrem-se: cada organismo é único.",
    replies: makeReplies([
      { author: "Roberto S.", authorType: "patient", content: "Dr. Felipe, no meu caso 25mg não foi suficiente. Com 50mg + melatonina 3mg tive ótimos resultados.", date: "3h atrás" },
      { author: "Dra. Camila Rocha", authorType: "doctor", content: "Excelente protocolo, Felipe! Acrescento que pacientes idosos geralmente respondem bem a doses menores. Importante monitorar interações medicamentosas.", date: "2h atrás" },
    ]),
  },
  {
    id: 3, title: "Cannabis + fisioterapia para fibromialgia", author: "João P.", authorType: "patient", category: "dor", replyCount: 31, upvotes: 89, downvotes: 5, date: "6h atrás",
    preview: "Descobri que a combinação de fisioterapia com CBD tópico melhorou...",
    content: "Descobri que a combinação de fisioterapia com CBD tópico (creme 500mg) aplicado nas áreas de dor antes da sessão melhorou drasticamente minha mobilidade. Faço fisio 3x/semana e aplico o creme 30min antes. A dor reduziu em cerca de 60% nos últimos 2 meses. Também uso óleo sublingual para dor generalizada. A combinação multimodal tem sido a chave para mim.",
    replies: makeReplies([
      { author: "Ana S.", authorType: "patient", content: "Incrível relato! Qual marca de creme você usa? Também tenho fibro e quero testar.", date: "5h atrás" },
    ]),
  },
  {
    id: 4, title: "Qual strain indicada para depressão leve?", author: "Ana S.", authorType: "patient", category: "depressao", replyCount: 14, upvotes: 28, downvotes: 2, date: "8h atrás",
    preview: "Estou procurando recomendações de strains com perfil mais energético...",
    content: "Estou procurando recomendações de strains com perfil mais energético e elevador de humor. Minha psiquiatra me indicou tratamento com cannabis mas disse que o perfil terpênico é importante. Alguém tem experiência com strains que ajudaram na depressão? Prefiro evitar as mais sedativas.",
    replies: makeReplies([
      { author: "Dr. Ricardo Mendes", authorType: "doctor", content: "Ana, para perfil antidepressivo, strains ricas em limoneno e pineno costumam ser mais indicadas. Harlequin e ACDC são boas opções com alto CBD e perfil energizante.", date: "7h atrás" },
      { author: "Maria L.", authorType: "patient", content: "Eu uso Harlequin e sinto mais disposição durante o dia. Vale a pena experimentar!", date: "6h atrás" },
    ]),
  },
  {
    id: 5, title: "Importação pela ANVISA — passo a passo atualizado", author: "Dra. Camila Rocha", authorType: "doctor", category: "geral", replyCount: 42, upvotes: 156, downvotes: 0, date: "12h atrás",
    preview: "Guia completo atualizado para 2026 sobre importação de cannabis medicinal...",
    content: "Guia completo atualizado para 2026:\n\n1. Orientação Técnica com médico prescritor habilitado\n2. Receita tipo B ou C (conforme produto)\n3. Cadastro no Portal ANVISA (anvisa.gov.br)\n4. Upload da receita + laudo médico + documentos pessoais\n5. Aguardar aprovação (prazo médio: 10 dias úteis)\n6. Autorização válida por 1 ano\n7. Importar via empresa autorizada\n\nDica: mantenham sempre a receita atualizada e renovem a autorização antes do vencimento. A Planta & Raiz pode ajudar em todo o processo!",
    replies: makeReplies([
      { author: "Roberto S.", authorType: "patient", content: "Dra. Camila, minha autorização foi aprovada em 7 dias! O processo está mais rápido em 2026.", date: "10h atrás" },
      { author: "João P.", authorType: "patient", content: "Obrigado pelo guia! Estava perdido no processo. Já agendei consulta pela plataforma.", date: "8h atrás" },
      { author: "Carolina M.", authorType: "patient", content: "A ANVISA aceita receita digital assinada pelo ICP-Brasil? Ou precisa ser física?", date: "6h atrás" },
      { author: "Dra. Camila Rocha", authorType: "doctor", content: "Carolina, sim! Desde 2024 a ANVISA aceita receitas digitais com assinatura ICP-Brasil. A Planta & Raiz já emite nesse formato.", date: "5h atrás" },
    ]),
  },
  {
    id: 6, title: "Relato: 6 meses usando Harlequin para dor", author: "Roberto S.", authorType: "patient", category: "dor", replyCount: 19, upvotes: 52, downvotes: 4, date: "1d atrás",
    preview: "Depois de anos tentando diversos tratamentos, finalmente encontrei alívio...",
    content: "Depois de anos tentando diversos tratamentos para dor crônica lombar, finalmente encontrei alívio com Harlequin (CBD:THC 5:2). Uso via vaporização 2x ao dia e óleo sublingual à noite. A dor reduziu cerca de 70% e consegui reduzir meu uso de tramadol de 3x para 1x ao dia (com acompanhamento médico). Minha qualidade de vida melhorou imensamente.",
    replies: makeReplies([]),
  },
  {
    id: 7, title: "Diferença entre CBD isolado e full spectrum", author: "Dr. Ricardo Mendes", authorType: "doctor", category: "geral", replyCount: 27, upvotes: 93, downvotes: 2, date: "1d atrás",
    preview: "Muitos pacientes me perguntam sobre as diferenças. Vou explicar...",
    content: "Muitos pacientes me perguntam sobre as diferenças entre CBD isolado, broad spectrum e full spectrum. Resumo:\n\n• CBD Isolado: Apenas CBD puro (>99%). Bom para quem não pode ter nenhum THC.\n• Broad Spectrum: Todos os canabinoides EXCETO THC. Efeito entourage parcial.\n• Full Spectrum: Todos os canabinoides incluindo THC (<0.3%). Efeito entourage completo.\n\nNa maioria dos casos, full spectrum é mais eficaz devido ao efeito entourage, onde os compostos agem sinergicamente.",
    replies: makeReplies([]),
  },
  {
    id: 8, title: "Lidando com estigma social do tratamento", author: "Carolina M.", authorType: "patient", category: "geral", replyCount: 35, upvotes: 112, downvotes: 1, date: "2d atrás",
    preview: "Compartilho minha experiência e como superei o preconceito da família...",
    content: "Compartilho minha experiência e como superei o preconceito da família e amigos em relação ao tratamento com cannabis medicinal. No início foi difícil — meus pais achavam que era 'droga'. O que me ajudou: 1) Levar estudos científicos para mostrar, 2) Convidar meu pai para uma consulta com o médico, 3) Mostrar minha evolução clínica documentada. Hoje minha família apoia 100% e meu pai até indicou o tratamento para um amigo com dor crônica.",
    replies: makeReplies([]),
  },
];

const Comunidade = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openTopic, setOpenTopic] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [nestedReply, setNestedReply] = useState("");

  const filtered = topics.filter((t) => {
    const matchCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.preview.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleVote = (id: number, type: "up" | "down") => {
    setTopics(topics.map(t => t.id === id ? { ...t, upvotes: type === "up" ? t.upvotes + 1 : t.upvotes, downvotes: type === "down" ? t.downvotes + 1 : t.downvotes } : t));
  };

  const handleReplyVote = (topicId: number, replyId: number, type: "up" | "down") => {
    setTopics(topics.map(t => t.id === topicId ? {
      ...t,
      replies: t.replies.map(r => r.id === replyId ? { ...r, upvotes: type === "up" ? r.upvotes + 1 : r.upvotes, downvotes: type === "down" ? r.downvotes + 1 : r.downvotes } : r),
    } : t));
  };

  const handleNewTopic = () => {
    if (!newTitle || !newContent || !newCategory) return;
    const topic: Topic = {
      id: topics.length + 1, title: newTitle, author: "Você", authorType: "patient", category: newCategory,
      replies: [], replyCount: 0, upvotes: 0, downvotes: 0, date: "agora",
      preview: newContent.slice(0, 120) + "...", content: newContent,
    };
    setTopics([topic, ...topics]);
    setNewTitle(""); setNewContent(""); setNewCategory(""); setDialogOpen(false);
  };

  const handleAddReply = (topicId: number) => {
    if (!replyText.trim()) return;
    setTopics(topics.map(t => t.id === topicId ? {
      ...t,
      replyCount: t.replyCount + 1,
      replies: [...t.replies, { id: t.replies.length + 1, author: "Você", authorType: "patient" as const, content: replyText, date: "agora", upvotes: 0, downvotes: 0, replies: [] }],
    } : t));
    setReplyText("");
  };

  const handleNestedReply = (topicId: number, replyId: number) => {
    if (!nestedReply.trim()) return;
    setTopics(topics.map(t => t.id === topicId ? {
      ...t,
      replyCount: t.replyCount + 1,
      replies: t.replies.map(r => r.id === replyId ? {
        ...r,
        replies: [...r.replies, { id: r.replies.length + 100, author: "Você", authorType: "patient" as const, content: nestedReply, date: "agora", upvotes: 0, downvotes: 0, replies: [] }],
      } : r),
    } : t));
    setNestedReply("");
    setReplyingTo(null);
  };

  const activeTopic = topics.find(t => t.id === openTopic);

  return (
    <div className="min-h-dvh bg-background">
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
            <p className="text-muted-foreground max-w-2xl font-medium mb-6">
              Troque experiências com outros pacientes e profissionais. Compartilhe relatos, tire dúvidas e acesse estudos científicos.
            </p>
            <Link to="/club" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform">
              🌿 Acessar Club Planta y Raiz <ChevronRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Thread View */}
          <AnimatePresence mode="wait">
            {activeTopic ? (
              <motion.div key="thread" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button aria-label="Voltar para a lista de tópicos" onClick={() => setOpenTopic(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                  <ArrowLeft size={16} /> Voltar aos tópicos
                </button>

                <Card className="border-border mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge className="text-[10px] bg-muted text-muted-foreground border-border">
                        {categories.find(c => c.id === activeTopic.category)?.emoji} {categories.find(c => c.id === activeTopic.category)?.label}
                      </Badge>
                      {activeTopic.authorType === "doctor" && (
                        <Badge className="text-[10px] bg-secondary/10 text-secondary border-purple">
                          <Stethoscope size={10} className="mr-1" /> Especialista
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-display font-black text-foreground mb-2">{activeTopic.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="font-bold">{activeTopic.author}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {activeTopic.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{activeTopic.content}</p>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                      <button aria-label="Votar a favor deste tópico" onClick={() => handleVote(activeTopic.id, "up")} className="flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors">
                        <ThumbsUp size={14} /> {activeTopic.upvotes}
                      </button>
                      <button aria-label="Votar contra este tópico" onClick={() => handleVote(activeTopic.id, "down")} className="flex items-center gap-1 text-xs text-muted-foreground hover:bg-destructive/10 px-2 py-1 rounded-lg transition-colors">
                        <ThumbsDown size={14} /> {activeTopic.downvotes}
                      </button>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare size={12} /> {activeTopic.replyCount} respostas</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Replies */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-display font-black text-foreground text-sm flex items-center gap-2">
                    <MessageSquare size={14} /> Respostas ({activeTopic.replies.length})
                  </h3>
                  {activeTopic.replies.map((reply) => (
                    <div key={reply.id}>
                      <Card className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-foreground">{reply.author}</span>
                                {reply.authorType === "doctor" && (
                                  <Badge className="text-[8px] bg-secondary/10 text-secondary border-purple px-1.5 py-0">
                                    <Stethoscope size={8} className="mr-0.5" /> Médico
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground">{reply.date}</span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{reply.content}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <button aria-label="Votar a favor desta resposta" onClick={() => handleReplyVote(activeTopic.id, reply.id, "up")} className="flex items-center gap-1 text-[10px] text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors">
                                  <ThumbsUp size={10} /> {reply.upvotes}
                                </button>
                                <button aria-label="Votar contra esta resposta" onClick={() => handleReplyVote(activeTopic.id, reply.id, "down")} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:bg-destructive/10 px-1.5 py-0.5 rounded transition-colors">
                                  <ThumbsDown size={10} /> {reply.downvotes}
                                </button>
                                <button onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                  <Reply size={10} /> Responder
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Nested replies */}
                          {reply.replies.length > 0 && (
                            <div className="ml-6 mt-3 pl-4 border-l-2 border-border space-y-3">
                              {reply.replies.map((nested) => (
                                <div key={nested.id}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-foreground">{nested.author}</span>
                                    {nested.authorType === "doctor" && (
                                      <Badge className="text-[7px] bg-secondary/10 text-secondary border-purple px-1 py-0">Médico</Badge>
                                    )}
                                    <span className="text-[9px] text-muted-foreground">{nested.date}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{nested.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Nested reply input */}
                          {replyingTo === reply.id && (
                            <div className="ml-6 mt-3 flex gap-2">
                              <Input placeholder={`Responder a ${reply.author}...`} value={nestedReply} onChange={(e) => setNestedReply(e.target.value)} className="bg-muted border-border text-xs h-8" onKeyDown={(e) => e.key === "Enter" && handleNestedReply(activeTopic.id, reply.id)} />
                              <Button size="sm" className="h-8 px-3 bg-primary text-primary-foreground" onClick={() => handleNestedReply(activeTopic.id, reply.id)}>
                                <Send size={12} />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Add reply */}
                <Card className="border-border">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-bold text-foreground mb-3">Adicionar Resposta</h4>
                    <div className="flex gap-2">
                      <Textarea placeholder="Escreva sua resposta..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="bg-muted border-border min-h-[80px]" />
                    </div>
                    <Button className="mt-3 font-bold bg-primary text-primary-foreground rounded-xl" onClick={() => handleAddReply(activeTopic.id)} disabled={!replyText.trim()}>
                      <Send size={14} className="mr-2" /> Publicar Resposta
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Categories */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  <button onClick={() => setSelectedCategory("all")} className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${selectedCategory === "all" ? "border-primary bg-gradient-green text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                    🌿 Todos ({topics.length})
                  </button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${selectedCategory === c.id ? "border-primary bg-gradient-green text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                      {c.emoji} {c.label} ({c.count})
                    </button>
                  ))}
                </div>

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
                  <div className="lg:col-span-2 space-y-3">
                    {filtered.map((topic) => (
                      <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-border hover:border-primary/20 transition-colors cursor-pointer group" onClick={() => setOpenTopic(topic.id)}>
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
                                  <span className="flex items-center gap-1"><MessageSquare size={10} /> {topic.replies.length}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button aria-label="Votar a favor do tópico" onClick={() => handleVote(topic.id, "up")} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><ThumbsUp size={14} className="text-primary" /></button>
                                <span className="text-xs font-bold text-foreground">{topic.upvotes - topic.downvotes}</span>
                                <button aria-label="Votar contra o tópico" onClick={() => handleVote(topic.id, "down")} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><ThumbsDown size={14} className="text-muted-foreground" /></button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-6">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Comunidade;
