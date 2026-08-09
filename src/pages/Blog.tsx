import React, { useEffect, useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_POSTS = [
  {
    id: "1",
    title: "Cannabis Medicinal no Brasil: Guia Completo 2026",
    slug: "cannabis-medicinal-brasil-guia-2026",
    excerpt: "Tudo o que você precisa saber sobre a regulamentação da ANVISA, como conseguir sua receita e os benefícios comprovados do CBD.",
    author: "Dr. Edilson Bezerra",
    created_at: "2026-03-13",
    category: "Educação",
    image_url: "https://images.unsplash.com/photo-1603903660314-2993d8302228?auto=format&fit=crop&q=80&w=800",
    content: "",
  },
  {
    id: "2",
    title: "Como a IA está revolucionando a Telemedicina de Cannabis",
    slug: "ia-telemedicina-cannabis",
    excerpt: "Descubra como os novos protocolos de triagem inteligente garantem maior segurança e precisão no ajuste de doses para pacientes.",
    author: "Manus CEO",
    created_at: "2026-03-12",
    category: "Tecnologia",
    image_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
    content: "",
  },
  {
    id: "3",
    title: "CBD e Ansiedade: O que dizem os estudos mais recentes?",
    slug: "cbd-ansiedade-estudos",
    excerpt: "Análise profunda sobre o impacto do canabidiol no controle do estresse e na melhoria da qualidade do sono baseada em evidências.",
    author: "Equipe Clínica P&R",
    created_at: "2026-03-10",
    category: "Ciência",
    image_url: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800",
    content: "",
  },
];

type BlogPost = typeof FALLBACK_POSTS[0];

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, author, created_at, category, image_url, content")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error || !data || data.length === 0) {
        setPosts(FALLBACK_POSTS);
      } else {
        setPosts(data);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <SEO 
        title="Blog Planta y Raiz - Educação e Ciência em Cannabis Medicinal"
        description="Acesse artigos científicos, guias de saúde e as últimas notícias sobre cannabis medicinal e telemedicina no Brasil."
      />
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <header className="max-w-4xl mx-auto text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">BIBLIOTECA DE CONHECIMENTO</Badge>
            <h1 className="text-4xl md:text-6xl font-display font-black text-foreground mb-6">Educação que <span className="text-gradient-green">Liberta</span></h1>
            <p className="text-muted-foreground text-lg">
              Conteúdo científico e informativo validado por especialistas para democratizar o acesso à saúde canabinoide.
            </p>
          </motion.div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {posts.map((post, index) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border hover:border-primary/30 transition-all group overflow-hidden h-full flex flex-col">
                  <div className="aspect-video overflow-hidden relative">
                    <img 
                      src={post.image_url || "https://images.unsplash.com/photo-1603903660314-2993d8302228?auto=format&fit=crop&q=80&w=800"} 
                      alt={post.title}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 left-4 bg-background/80 backdrop-blur text-foreground border-border">
                      {post.category}
                    </Badge>
                  </div>
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase mb-3">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
                      <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
                    </div>
                    <CardTitle className="text-xl font-black group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-primary font-black flex items-center gap-2 group/btn">
                      Ler Artigo Completo <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Card className="border-primary/20 bg-primary/5 p-8 md:p-12 rounded-3xl text-center">
          <div className="max-w-2xl mx-auto">
            <Zap size={40} className="text-primary mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black mb-4">Newsletter Planta y Raiz</h2>
            <p className="text-muted-foreground mb-8">
              Receba semanalmente os últimos avanços da medicina canabinoide direto no seu e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">E-mail para a newsletter</label>
              <input 
                id="newsletter-email"
                name="newsletter-email"
                type="email" 
                placeholder="Seu melhor e-mail" 
                className="flex-1 bg-background border border-border rounded-2xl px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button className="bg-primary text-primary-foreground font-black rounded-2xl px-8 py-3">
                Inscrever-se
              </Button>
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground">
              Respeitamos sua privacidade. Cancele a inscrição a qualquer momento.
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
