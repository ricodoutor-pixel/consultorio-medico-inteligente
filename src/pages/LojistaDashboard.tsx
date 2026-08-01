import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Package, AlertTriangle, Building2, UploadCloud, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const demandData = [
  { day: 'Seg', cbd: 120, thc: 45, fullSpectrum: 150 },
  { day: 'Ter', cbd: 132, thc: 55, fullSpectrum: 180 },
  { day: 'Qua', cbd: 101, thc: 40, fullSpectrum: 190 },
  { day: 'Qui', cbd: 145, thc: 60, fullSpectrum: 210 },
  { day: 'Sex', cbd: 180, thc: 75, fullSpectrum: 250 },
  { day: 'Sab', cbd: 220, thc: 90, fullSpectrum: 310 },
  { day: 'Dom', cbd: 210, thc: 85, fullSpectrum: 290 },
];

const terpenesData = [
  { name: 'Mirceno', prescricoes: 420 },
  { name: 'Limoneno', prescricoes: 380 },
  { name: 'Linalol', prescricoes: 290 },
  { name: 'Pineno', prescricoes: 210 },
  { name: 'Cariofileno', prescricoes: 180 },
];

export default function LojistaDashboard() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Produto Enviado",
        description: "Seu produto passará pela curadoria técnica em até 24h úteis.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8 px-4 space-y-8 pt-24">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">Lojista VIP</Badge>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Conta Ativa</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground flex items-center gap-3">
              <Building2 className="text-primary h-8 w-8" /> 
              Inteligência B2B
            </h1>
            <p className="text-muted-foreground mt-2">Monitore a demanda preditiva e posicione seus produtos no ecossistema.</p>
          </div>
          
          <Button size="lg" className="font-bold rounded-xl shadow-lg shadow-primary/20">
            <TrendingUp size={18} className="mr-2" /> Upgrade para Relatórios Avançados
          </Button>
        </div>

        <Tabs defaultValue="demanda" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="demanda">Demanda Preditiva</TabsTrigger>
            <TabsTrigger value="catalogo">Meu Catálogo (Shopping)</TabsTrigger>
          </TabsList>

          <TabsContent value="demanda" className="space-y-6">
            
            {/* Alerts */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="text-red-500 h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-red-500">Alerta de Estoque Preditivo</h4>
                    <p className="text-sm text-foreground mt-1">
                      Aumento de <strong>+45%</strong> nas prescrições de <em>Óleo CBD Full Spectrum 3000mg</em> nas últimas 48 horas. A demanda deve esgotar o estoque das marcas parceiras em 3 dias.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <TrendingUp className="text-green-500 h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-green-500">Oportunidade: Gummies de Limoneno</h4>
                    <p className="text-sm text-foreground mt-1">
                      O IA Matchmaker está direcionando 3x mais pacientes ansiosos para formulações ricas em Limoneno. Margem sugerida: alta.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Evolução de Prescrições na Semana</CardTitle>
                  <CardDescription>Volume de pacientes que receberam prescrição na plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demandData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCbd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorFull" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="fullSpectrum" name="Full Spectrum" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorFull)" />
                        <Area type="monotone" dataKey="cbd" name="Isolado CBD" stroke="#10b981" fillOpacity={1} fill="url(#colorCbd)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Top Terpenos Prescritos (Top 5)</CardTitle>
                  <CardDescription>Frequência em laudos do IA Matchmaker.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={terpenesData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={12} fontWeight="bold" width={80} />
                        <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                        <Bar dataKey="prescricoes" name="Qtd Prescrições" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="catalogo">
            <div className="grid lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1">
                <Card className="border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="text-primary" /> Adicionar Produto
                    </CardTitle>
                    <CardDescription>Submeta ao Shopping Planta y Raíz</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Produto</Label>
                        <Input placeholder="Ex: Óleo Full Spectrum 1500mg" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Proporção (CBD:THC)</Label>
                        <Input placeholder="Ex: 10:1" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Estoque Inicial</Label>
                        <Input type="number" placeholder="100" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço de Venda (R$)</Label>
                        <Input type="number" step="0.01" placeholder="399.00" required />
                      </div>
                      
                      <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
                        {isSubmitting ? "Enviando..." : "Submeter para Curadoria"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Produtos Ativos no Catálogo</CardTitle>
                    <CardDescription>Produtos visíveis para os pacientes e médicos no IA Matchmaker.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
                      <Package size={48} className="text-muted-foreground/50 mb-4" />
                      <h4 className="font-bold text-foreground mb-1">Nenhum produto listado ainda</h4>
                      <p className="text-sm">Os produtos aprovados pela nossa diretoria técnica aparecerão aqui com métricas de conversão ao vivo.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
