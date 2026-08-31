import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Package, AlertTriangle, Building2, BookOpen, Clock, FileText, CheckCircle, Truck, FileSignature, Wallet, Navigation, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VipUpgradePopup } from "@/components/VipUpgradePopup";
import { useLojista } from "@/hooks/useLojista";
import { RastreioPedidoModal } from "@/components/delivery/RastreioPedidoModal";
import { MedicamentoSatelliteTracker } from "@/components/delivery/MedicamentoSatelliteTracker";

export default function LojistaDashboard() {
  const { toast } = useToast();
  const { profile, metrics, loading, authError, addProduct } = useLojista();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRastreioOpen, setIsRastreioOpen] = useState(false);

  // Mock data para Receitas Inbox
  const [inbox] = useState([
    { id: "1", patient: "João M.", hash: "a8f9c...12x", mode: "1click", status: "recebida", date: "Hoje, 10:30" },
    { id: "2", patient: "Maria S.", hash: "b2x4...99z", mode: "manual", status: "em_analise_farmaceutica", date: "Ontem, 15:45" }
  ]);

  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    concentration: "",
    category: "oleo_cbd",
    price: "",
    stock: "",
    image_url: ""
  });

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground font-medium">Carregando painel...</p>
      </div>
    );
  }

  if (authError || !profile) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center pt-24">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">{authError}</p>
          <Button asChild><Link to="/login">Ir para o Login</Link></Button>
        </div>
      </div>
    );
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addProduct({
        ...formData,
        proportion: formData.concentration
      });
      toast({
        title: "Sucesso!",
        description: "Produto cadastrado com sucesso. Pendente de aprovação (Compliance).",
      });
      setFormData({ name: "", concentration: "", category: "oleo_cbd", price: "", stock: "", image_url: "" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8 px-4 space-y-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div className="flex flex-col items-start gap-2">
            <VipUpgradePopup role="lojista" inline className="ml-1" />
            <div className="flex items-center gap-2 mb-2 mt-4 md:mt-0">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                Lojista Verificado
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                Split 95% Ativo
              </Badge>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground flex items-center gap-3">
                <Building2 className="text-primary h-8 w-8 shrink-0" /> 
                Painel: {profile.company_name || 'Farmácia Planta y Raíz'}
              </h1>
              <Button 
                onClick={() => setIsRastreioOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/30 text-xs sm:text-sm h-10 px-4 flex items-center gap-2 border border-emerald-400/30 hover:scale-105 transition-all"
              >
                <Truck size={17} className="text-white" /> 🚚 Rastreio de Pedido & Entregas
              </Button>
              <Button 
                variant="outline"
                className="bg-card/80 hover:bg-muted text-foreground font-bold rounded-xl border border-primary/30 text-xs sm:text-sm h-10 px-4 flex items-center gap-2 hover:scale-105 transition-all shadow-md"
                asChild
              >
                <Link to="/manual?tab=farmacia">
                  <BookOpen size={16} className="text-emerald-400" /> 📖 Como Funciona Passo a Passo
                </Link>
              </Button>
            </div>
          </div>
          <Button size="lg" variant="outline" className="font-bold rounded-xl border-primary/20 text-primary" asChild>
             <Link to="/cadastro-farmacia"><FileSignature size={18} className="mr-2" /> Atualizar KYC</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto bg-muted/60 p-1.5 rounded-2xl border border-border">
            <TabsTrigger value="overview" className="py-3 font-bold text-xs sm:text-sm rounded-xl">Visão Geral</TabsTrigger>
            <TabsTrigger value="rastreio" className="py-3 font-bold text-xs sm:text-sm rounded-xl text-emerald-400">
              <Truck size={14} className="mr-1 inline" /> Rastreamento Satélite
            </TabsTrigger>
            <TabsTrigger value="inbox" className="py-3 font-bold text-xs sm:text-sm rounded-xl">Receitas & Dispensação</TabsTrigger>
            <TabsTrigger value="catalog" className="py-3 font-bold text-xs sm:text-sm rounded-xl">Catálogo (Vitrine)</TabsTrigger>
            <TabsTrigger value="financial" className="py-3 font-bold text-xs sm:text-sm rounded-xl">Financeiro & Repasse</TabsTrigger>
          </TabsList>

          {/* ABA 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-emerald-950/20 border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-500 flex justify-between">
                    Receitas Aguardando <AlertTriangle size={16} className="animate-pulse" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground mt-1">Requer análise farmacêutica</p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Bruto (Mês)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">R$ 14.500,00</div>
                  <p className="text-xs text-green-500 mt-1">+15% em relação a julho</p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Repasse Líquido (95%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">R$ 13.775,00</div>
                  <p className="text-xs text-muted-foreground mt-1">Disponível para saque Pix</p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taxa da Plataforma (5%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-400">R$ 725,00</div>
                  <p className="text-xs text-muted-foreground mt-1">Retido na fonte</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ABA RASTREAMENTO SATÉLITE ESTILO UBER */}
          <TabsContent value="rastreio" className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Truck size={20} className="text-emerald-400" /> Central de Rastreamento Satélite & Entregas
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acompanhe o trajeto dos seus entregadores com GPS em tempo real até a residência do paciente.
                  </p>
                </div>
                <Button 
                  onClick={() => setIsRastreioOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs h-9"
                >
                  <Navigation size={14} className="mr-1.5" /> Abrir Painel Completo
                </Button>
              </div>

              <MedicamentoSatelliteTracker isPharmacyView={true} />
            </div>
          </TabsContent>

          {/* ABA 2: RECEITAS & DISPENSAÇÃO */}
          <TabsContent value="inbox" className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Caixa de Entrada: Receitas ICP-Brasil</CardTitle>
                <CardDescription>Auditoria e liberação de despachos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-900">
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Hash Digital</TableHead>
                        <TableHead>Envio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inbox.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.patient}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell><Badge variant="outline" className="font-mono text-[10px]">{item.hash}</Badge></TableCell>
                          <TableCell>{item.mode === '1click' ? <Badge className="bg-primary/20 text-primary">Automático</Badge> : <Badge variant="secondary">Upload Manual</Badge>}</TableCell>
                          <TableCell>
                            {item.status === 'recebida' && <Badge className="bg-amber-500/20 text-amber-500"><Clock size={12} className="mr-1"/> Nova Receita</Badge>}
                            {item.status === 'em_analise_farmaceutica' && <Badge className="bg-blue-500/20 text-blue-500">Em Análise</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => setSelectedPrescription(item)}>Auditar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: CATÁLOGO */}
          <TabsContent value="catalog" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle>Novo Produto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome (ex: Óleo CBD Full Spectrum)</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Concentração (ex: 3000mg/30ml)</Label>
                        <Input value={formData.concentration} onChange={e => setFormData({...formData, concentration: e.target.value})} required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Preço (R$)</Label>
                          <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Estoque</Label>
                          <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Enviando..." : "Cadastrar Produto"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Vitrine Principal (Máx 10)</CardTitle>
                    <CardDescription>Controle o que aparece no Shopping para os pacientes.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                          <Package size={32} className="mx-auto mb-2 opacity-50" />
                          <p>Nenhum produto cadastrado.</p>
                        </div>
                      ) : (
                        metrics.products.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-900/50">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                <Package size={20} className="text-muted-foreground"/>
                              </div>
                              <div>
                                <h4 className="font-bold text-sm">{p.name}</h4>
                                <p className="text-xs text-muted-foreground">{p.description} • R$ {p.price}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Em análise</Badge>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Na Vitrine</Label>
                                <Switch checked={false} disabled />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* ABA 4: FINANCEIRO */}
          <TabsContent value="financial" className="space-y-6">
             <Card>
                <CardHeader>
                  <CardTitle>Extrato Financeiro (Split Automático)</CardTitle>
                  <CardDescription>Você recebe 95% direto na sua conta conectada.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 border rounded-xl border-dashed">
                    <Wallet size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-bold text-lg">Histórico de Repasses</h3>
                    <p className="text-muted-foreground mt-2">Nenhuma liquidação recente.</p>
                  </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Auditoria de Receita */}
      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-2xl bg-slate-950 border-border">
          <DialogHeader>
            <DialogTitle>Auditoria Farmacêutica de Receita</DialogTitle>
            <DialogDescription>Validação do PDF e assinatura ICP-Brasil.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-slate-900 rounded-xl flex justify-between items-center border border-slate-800">
               <div>
                 <p className="text-xs text-muted-foreground">Paciente</p>
                 <p className="font-bold">{selectedPrescription?.patient}</p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-muted-foreground">Hash SHA-512</p>
                 <p className="font-mono text-xs text-primary bg-primary/10 p-1 rounded mt-1">{selectedPrescription?.hash}</p>
               </div>
            </div>

            <div className="h-48 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
               <FileText size={48} className="text-slate-600 mb-2" />
               <div className="ml-4">
                 <p className="font-bold">ReceitaDigital.pdf</p>
                 <Badge className="bg-green-500 mt-1">Assinatura Válida</Badge>
               </div>
            </div>

            <div className="space-y-2">
              <Label>Código de Rastreio (Se aprovado e enviado)</Label>
              <Input placeholder="BR123456789BR" />
            </div>
            
            <div className="space-y-2">
              <Label>Motivo de Recusa (Opcional)</Label>
              <Textarea placeholder="Descreva o motivo se a receita for irregular..." />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            <Button variant="destructive">Recusar Receita</Button>
            <div className="flex gap-2">
              <Button variant="outline"><FileText className="mr-2" size={16}/> Ver PDF</Button>
              <Button className="bg-primary text-primary-foreground"><CheckCircle className="mr-2" size={16}/> Aprovar & Despachar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rastreamento de Pedido & Entregas */}
      <RastreioPedidoModal
        open={isRastreioOpen}
        onOpenChange={setIsRastreioOpen}
        isPharmacy={true}
      />
    </div>
  );
}
