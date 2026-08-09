import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, Download, Search, FileText, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateEducationalPDF } from "@/lib/pdfGeneratorService";

export default function ComunidadeConteudoIA() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = () => {
    generateEducationalPDF({
      patientName: "João Silva",
      doctorName: "Dr. Edilson",
      date: new Date().toLocaleDateString("pt-BR"),
      products: ["Óleo CBD Full Spectrum 3000mg", "Gummies de THC 5mg"],
      posology: "Semana 1: 2 gotas à noite antes de dormir.\nSemana 2: 3 gotas à noite, 1 gota pela manhã se necessário.",
      generalGuidelines: [
        "Mantenha o frasco em local fresco e longe da luz.",
        "Pingue embaixo da língua e aguarde 1 minuto antes de engolir.",
        "Não interrompa outros medicamentos sem aviso prévio."
      ]
    });
    toast({
      title: "PDF Gerado!",
      description: "O guia foi preparado para impressão/download.",
    });
  };

  const handleCreateArticle = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Artigo Criado com Sucesso!",
        description: "O caso anônimo foi convertido em um post de blog otimizado para SEO.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8 px-4 space-y-8 pt-24">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="bg-primary/20 text-primary mb-4 border-primary/30">Educação Canabinoide</Badge>
          <h1 className="text-4xl md:text-5xl font-display font-black text-foreground mb-4">
            Biblioteca Científica & SEO
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore nossos guias e artigos. Se você é médico parceiro, converta seus casos clínicos de sucesso em conteúdo indexável com 1 clique (powered by Brisa IA).
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto relative mb-12">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar artigos, estudos ou FAQs..." className="pl-10 h-12 rounded-full border-border/50 bg-card" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-primary" /> Artigos em Destaque
            </h2>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-3">Ansiedade & Sono</Badge>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Como o CBD interage com receptores de serotonina no combate à ansiedade</h3>
                <p className="text-muted-foreground mt-2 text-sm line-clamp-2">
                  Um mergulho técnico, porém acessível, sobre a farmacodinâmica do Canabidiol e seu potencial como ansiolítico natural.
                </p>
                <div className="flex items-center gap-2 text-primary font-bold text-sm mt-4">
                  Ler Artigo <ArrowRight size={14} />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-3">Titulação</Badge>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">Start Low, Go Slow: O Guia Definitivo de Dosagem</h3>
                <p className="text-muted-foreground mt-2 text-sm line-clamp-2">
                  Por que a microdosagem é tão importante na adaptação do Sistema Endocanabinoide durante os primeiros 30 dias.
                </p>
                <div className="flex items-center gap-2 text-primary font-bold text-sm mt-4">
                  Ler Artigo <ArrowRight size={14} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Tools */}
          <div className="space-y-6">
            
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="text-primary h-5 w-5" /> 
                  Meu Guia em PDF
                </CardTitle>
                <CardDescription>Baixe as orientações da sua última consulta diagramadas em alta qualidade.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full font-bold shadow-lg" onClick={handleGeneratePdf}>
                  Gerar e Baixar PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="border-indigo-500/30 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-indigo-500">
                  <Sparkles className="h-5 w-5" /> 
                  IA SEO Creator (Médicos)
                </CardTitle>
                <CardDescription>Converta o relato do seu último paciente em um post de blog otimizado para o Google em 5 segundos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-background rounded-lg border border-border mb-4 text-xs font-mono text-muted-foreground">
                  <FileText size={12} className="inline mr-1" />
                  Caso Clínico #3944 (Anônimo) carregado na memória.
                </div>
                <Button 
                  variant="outline" 
                  className="w-full font-bold border-indigo-500/50 text-indigo-500 hover:bg-indigo-500 hover:text-white"
                  onClick={handleCreateArticle}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Gerando Artigo (IA)..." : "Transformar em Artigo SEO"}
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
