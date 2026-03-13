import React, { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, TrendingUp, Package, DollarSign, Clock, CheckCircle2, AlertCircle, BarChart3, Plus, ArrowUpRight, ArrowDownRight, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const salesData = [
  { name: 'Seg', vendas: 1200 }, { name: 'Ter', vendas: 1900 }, { name: 'Qua', vendas: 1500 },
  { name: 'Qui', vendas: 2100 }, { name: 'Sex', vendas: 2800 }, { name: 'Sab', vendas: 3200 },
  { name: 'Dom', vendas: 2400 },
];

const ShoppingDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary glow-purple">
                  <ShoppingBag size={24} />
                </div>
                <span className="text-sm font-bold text-secondary tracking-widest uppercase">Portal do Lojista • Planta y Raiz</span>
              </div>
              <h1 className="text-4xl font-display font-black text-foreground mb-3">Dashboard de <span className="text-gradient-purple">Vendas</span></h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Gerencie seu estoque, acompanhe suas comissões de 5% e monitore a logística de entrega para seus pacientes.
              </p>
            </div>
            <div className="flex gap-3">
              <Button className="bg-secondary text-secondary-foreground font-black rounded-2xl px-6 h-12">
                <Plus size={18} className="mr-2" /> Novo Produto
              </Button>
            </div>
          </header>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "Vendas Brutas", value: "R$ 15.100", change: "+12.5%", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Comissão P&R (5%)", value: "R$ 755", change: "Retido", icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10" },
              { label: "Líquido a Receber", value: "R$ 14.345", change: "Próx. 48h", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
              { label: "Pedidos Pendentes", value: "18", change: "Ação Necessária", icon: Package, color: "text-orange-500", bg: "bg-orange-500/10" },
            ].map((stat, i) => (
              <Card key={i} className="border-border bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${stat.color === 'text-green-500' ? 'border-green-500/30 text-green-500' : 'border-border'}`}>
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg font-bold">Visão Geral</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-lg font-bold">Estoque</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg font-bold">Pedidos & Logística</TabsTrigger>
              <TabsTrigger value="financial" className="rounded-lg font-bold">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 size={16} className="text-secondary" /> Desempenho de Vendas (Semanal)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[350px] p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                          cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
                        />
                        <Bar dataKey="vendas" radius={[6, 6, 0, 0]}>
                          {salesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 5 ? 'hsl(var(--secondary))' : 'hsl(var(--secondary) / 0.4)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                        <TrendingUp size={16} className="text-primary" /> Top Produtos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: "Óleo CBD Full Spectrum 30ml", sales: 42, growth: "+18%" },
                        { name: "Gummies Relax CBD 600mg", sales: 28, growth: "+5%" },
                        { name: "Creme Tópico Alívio 100mg", sales: 15, growth: "+12%" },
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-background/50 border border-border flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-foreground">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.sales} unidades vendidas</p>
                          </div>
                          <span className="text-[10px] font-black text-green-500">{item.growth}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-orange-500">
                        <AlertCircle size={16} /> Alerta de Estoque Baixo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                        3 itens do seu catálogo estão com menos de 5 unidades em estoque. Reabasteça para não perder vendas.
                      </p>
                      <Button variant="outline" size="sm" className="w-full border-orange-500/30 text-orange-500 text-[10px] font-bold uppercase">
                        Ver Itens
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card className="border-border bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-black">Pedidos Recentes</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-secondary">Ver Todos</Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <th className="pb-4">Pedido</th>
                          <th className="pb-4">Cliente</th>
                          <th className="pb-4">Data</th>
                          <th className="pb-4">Status</th>
                          <th className="pb-4 text-right">Valor Bruto</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {[
                          { id: "#9842", client: "João Silva", date: "13 Mar 2026", status: "Em Preparação", amount: "R$ 349,00", color: "text-blue-500" },
                          { id: "#9841", client: "Maria Oliveira", date: "12 Mar 2026", status: "Aguardando Receita", amount: "R$ 280,00", color: "text-orange-500" },
                          { id: "#9840", client: "Carlos Souza", date: "12 Mar 2026", status: "Enviado", amount: "R$ 420,00", color: "text-green-500" },
                          { id: "#9839", client: "Ana Santos", date: "11 Mar 2026", status: "Concluído", amount: "R$ 150,00", color: "text-primary" },
                        ].map((order, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="py-4 font-bold text-foreground">{order.id}</td>
                            <td className="py-4 text-muted-foreground">{order.client}</td>
                            <td className="py-4 text-muted-foreground">{order.date}</td>
                            <td className="py-4">
                              <span className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${order.color}`}>
                                <Clock size={12} /> {order.status}
                              </span>
                            </td>
                            <td className="py-4 text-right font-black text-foreground">{order.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card className="border-border bg-card/50 p-6 text-center">
                  <Truck size={32} className="text-secondary mx-auto mb-4" />
                  <h4 className="font-black text-lg mb-2">Logística ANVISA</h4>
                  <p className="text-xs text-muted-foreground mb-4">Gerencie a documentação de importação e autorizações RDC 660/2022.</p>
                  <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-secondary/30 text-secondary">Configurar Transportadora</Button>
                </Card>
                <Card className="border-border bg-card/50 p-6 text-center">
                  <ShieldCheck size={32} className="text-primary mx-auto mb-4" />
                  <h4 className="font-black text-lg mb-2">Validação de Receita</h4>
                  <p className="text-xs text-muted-foreground mb-4">Acesso direto ao prontuário para validar prescrições digitais.</p>
                  <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-primary/30 text-primary">Validar Pendentes</Button>
                </Card>
                <Card className="border-border bg-card/50 p-6 text-center">
                  <RefreshCw size={32} className="text-orange-500 mx-auto mb-4" />
                  <h4 className="font-black text-lg mb-2">Devoluções & SAC</h4>
                  <p className="text-xs text-muted-foreground mb-4">Central de atendimento e trocas conforme CDC e normas sanitárias.</p>
                  <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-orange-500/30 text-orange-500">Abrir Chamados</Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ShoppingDashboard;
