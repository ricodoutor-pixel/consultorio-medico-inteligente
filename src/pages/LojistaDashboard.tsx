import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Package, AlertTriangle, Building2, BookOpen, ArrowRight, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VipUpgradePopup } from "@/components/VipUpgradePopup";
import { useLojista } from "@/hooks/useLojista";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LojistaDashboard() {
  const { toast } = useToast();
  const { profile, metrics, loading, authError, addProduct } = useLojista();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    name: "",
    proportion: "",
    stock: "",
    price: ""
  });

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground font-medium">Carregando painel do lojista...</p>
      </div>
    );
  }

  // Barreira de Segurança
  if (authError || !profile) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Lock size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">{authError || "Você precisa estar logado como Lojista/Dispensário."}</p>
          <Button asChild><Link to="/login">Ir para o Login</Link></Button>
        </div>
      </div>
    );
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addProduct(formData);
      toast({
        title: "Sucesso!",
        description: "Produto adicionado e pendente de curadoria.",
      });
      setFormData({ name: "", proportion: "", stock: "", price: "" });
    } catch (err: any) {
      toast({
        title: "Erro ao adicionar",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
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
              {profile.is_verified ? (
                 <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Lojista Verificado</Badge>
              ) : (
                 <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Em Análise</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground flex items-center gap-3">
              <Building2 className="text-primary h-8 w-8" /> 
              Painel: {profile.company_name || 'Lojista'}
            </h1>
            <p className="text-muted-foreground mt-2">Monitore a demanda preditiva e gerencie seu catálogo de produtos.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="lg" variant="outline" className="font-bold rounded-xl border-primary/20 text-primary" asChild>
              <Link to="/manual?tab=lojista"><BookOpen size={18} className="mr-2" /> Passo a Passo</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="catalogo" className="w-full">
          <TabsList className="mb-6 grid grid-cols-2">
            <TabsTrigger value="catalogo">Meu Catálogo</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos B2B</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="border-primary/20 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">Adicionar Produto</CardTitle>
                    <CardDescription>Submeta um novo lote de produto.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Produto</Label>
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Proporção (Ex: 10:1)</Label>
                        <Input value={formData.proportion} onChange={e => setFormData({...formData, proportion: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Estoque Inicial</Label>
                        <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço de Venda (R$)</Label>
                        <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                      </div>
                      <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
                        {isSubmitting ? "Enviando pro banco..." : "Salvar no Banco"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Meus Produtos Cadastrados</CardTitle>
                    <CardDescription>Estes são os produtos lidos do banco de dados.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {metrics.products.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <h4 className="font-bold">Nenhum produto listado</h4>
                        <p className="text-sm">Seus produtos aparecerão aqui após adicionar no formulário ao lado.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {metrics.products.map(product => (
                          <div key={product.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-bold">{product.name}</p>
                              <div className="flex gap-2 items-center mt-1">
                                 <Badge variant={product.is_active ? "default" : "secondary"} className="text-[10px]">
                                   {product.is_active ? "Ativo no Shopping" : "Em Curadoria"}
                                 </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">R$ {product.price?.toFixed(2) || "0.00"}</p>
                              <p className="text-xs text-muted-foreground">{product.in_stock ? "Com Estoque" : "Esgotado"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pedidos">
             <Card className="border-border">
              <CardHeader>
                <CardTitle>Pedidos B2B</CardTitle>
                <CardDescription>Acompanhe os pedidos de clínicas e médicos parceiros.</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
                    <Package size={48} className="text-muted-foreground/50 mb-4" />
                    <h4 className="font-bold text-foreground mb-1">Nenhum pedido ainda</h4>
                    <p className="text-sm">Os pedidos recebidos aparecerão aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metrics.orders.map(order => (
                      <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg bg-card">
                        <div>
                          <p className="font-bold">Pedido #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">Em: {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">R$ {order.total_amount?.toFixed(2) || "0.00"}</p>
                          <Badge variant="outline" className="mt-1">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
