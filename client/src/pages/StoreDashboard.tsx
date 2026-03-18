import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, TrendingUp, Package, DollarSign, Users, AlertCircle } from "lucide-react";

export default function StoreDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: "Vendas Hoje", value: "R$ 2.340", icon: ShoppingCart, color: "text-emerald-400" },
    { label: "Produtos Ativos", value: "156", icon: Package, color: "text-cyan-400" },
    { label: "Clientes", value: "892", icon: Users, color: "text-emerald-400" },
    { label: "Comissão Pendente", value: "R$ 0", icon: DollarSign, color: "text-cyan-400" },
  ];

  const topProducts = [
    { id: 1, name: "Dipirona 500mg", sales: 45, revenue: "R$ 450" },
    { id: 2, name: "Vitamina C 1000mg", sales: 38, revenue: "R$ 380" },
    { id: 3, name: "Omeprazol 20mg", sales: 32, revenue: "R$ 640" },
  ];

  const lowStock = [
    { id: 1, name: "Amoxicilina 500mg", stock: 5, reorder: 50 },
    { id: 2, name: "Ibuprofeno 400mg", stock: 8, reorder: 100 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Bem-vindo, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{user?.name}</span>
        </h1>
        <p className="text-slate-400">Lojista Pro • Taxa de venda 0% • Destaque nas recomendações</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Vendas Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{product.name}</p>
                      <p className="text-sm text-slate-400">{product.sales} unidades vendidas</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-400">{product.revenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produtos Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Gerenciar Produtos</CardTitle>
              <CardDescription>Adicione, edite ou remova produtos do seu catálogo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                + Adicionar Novo Produto
              </Button>
              <div className="text-slate-400 text-sm">
                Você tem <span className="font-semibold text-white">156 produtos</span> ativos no marketplace
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estoque Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Alerta de Estoque Baixo</CardTitle>
              <CardDescription>Produtos que precisam ser reabastecidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-slate-400">{item.stock} unidades • Reordenar: {item.reorder}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-500/50 text-red-300 hover:bg-red-500/10">
                      Reordenar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Nome da Loja</label>
                <p className="text-white font-semibold">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">CNPJ</label>
                <p className="text-white font-semibold">12.345.678/0001-90</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Endereço</label>
                <p className="text-white font-semibold">Rua das Flores, 123 - São Paulo, SP</p>
              </div>
              <Button variant="outline" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
                Editar Informações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
