import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Package, DollarSign, Users, BarChart3, Settings } from 'lucide-react';

const sellerStats = {
  totalSales: 45230.50,
  totalOrders: 1234,
  totalProducts: 28,
  totalReviews: 4.8,
  monthlyGrowth: '+32%',
  commissionRate: '15%',
};

const recentOrders = [
  {
    id: 'ORD-001',
    product: 'Óleo CBD 10ml',
    customer: 'João Silva',
    amount: 89.90,
    status: 'Entregue',
    date: '2026-02-22',
  },
  {
    id: 'ORD-002',
    product: 'Creme Cannabis 50g',
    customer: 'Maria Santos',
    amount: 59.90,
    status: 'Em Trânsito',
    date: '2026-02-21',
  },
  {
    id: 'ORD-003',
    product: 'Jujuba Cannabis 30un',
    customer: 'Carlos Oliveira',
    amount: 45.90,
    status: 'Processando',
    date: '2026-02-20',
  },
];

const products = [
  {
    id: 1,
    name: 'Óleo CBD 10ml',
    price: 89.90,
    stock: 45,
    sales: 234,
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Creme Cannabis 50g',
    price: 59.90,
    stock: 28,
    sales: 156,
    rating: 4.7,
  },
  {
    id: 3,
    name: 'Jujuba Cannabis 30un',
    price: 45.90,
    stock: 67,
    sales: 89,
    rating: 4.6,
  },
];

export default function SellerPanel() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = () => {
    console.log('Registrando vendedor:', formData);
    setIsRegistering(false);
    setFormData({
      businessName: '',
      cnpj: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-yellow-400">Painel de Vendedor</h1>
            <p className="text-muted-foreground">Gerencie seus produtos e vendas</p>
          </div>
          {!isRegistering && (
            <Button onClick={() => setIsRegistering(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              Novo Produto
            </Button>
          )}
        </div>

        {/* Registration Form */}
        {isRegistering && (
          <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-yellow-400">Cadastro Rápido de Vendedor</CardTitle>
              <CardDescription>Leve menos de 5 minutos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="businessName"
                  placeholder="Nome da Empresa"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="px-4 py-2 bg-background/50 border border-yellow-500/20 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-yellow-500"
                />
                <input
                  type="text"
                  name="cnpj"
                  placeholder="CNPJ (com pontuação)"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  className="px-4 py-2 bg-background/50 border border-yellow-500/20 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-yellow-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="px-4 py-2 bg-background/50 border border-yellow-500/20 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-yellow-500"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Telefone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="px-4 py-2 bg-background/50 border border-yellow-500/20 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-yellow-500"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Endereço Completo"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="px-4 py-2 bg-background/50 border border-yellow-500/20 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-yellow-500 md:col-span-2"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRegister} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold">
                  Confirmar Cadastro
                </Button>
                <Button onClick={() => setIsRegistering(false)} className="flex-1 bg-background/50 text-yellow-400 hover:bg-background/70">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vendas Totais</p>
                  <p className="text-2xl font-black text-green-400">R$ {sellerStats.totalSales.toLocaleString('pt-BR')}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pedidos</p>
                  <p className="text-2xl font-black text-yellow-400">{sellerStats.totalOrders}</p>
                </div>
                <Package className="h-10 w-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Crescimento</p>
                  <p className="text-2xl font-black text-yellow-400">{sellerStats.monthlyGrowth}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Comissão</p>
                  <p className="text-2xl font-black text-green-400">{sellerStats.commissionRate}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="bg-background/50 border border-yellow-500/20 rounded-lg p-1">
            <TabsTrigger value="products" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              Produtos ({sellerStats.totalProducts})
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              Pedidos Recentes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id} className="bg-card/50 border-yellow-500/20 rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-yellow-400">{product.name}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">Preço: <span className="text-green-400 font-bold">R$ {product.price.toFixed(2)}</span></span>
                        <span className="text-muted-foreground">Estoque: <span className="text-yellow-400 font-bold">{product.stock}</span></span>
                        <span className="text-muted-foreground">Vendas: <span className="text-yellow-400 font-bold">{product.sales}</span></span>
                        <span className="text-muted-foreground">Rating: <span className="text-yellow-400 font-bold">⭐ {product.rating}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-background/50 text-yellow-400 hover:bg-background/70">Editar</Button>
                      <Button className="bg-red-500 hover:bg-red-600 text-white">Remover</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4">
              {recentOrders.map((order) => (
                <Card key={order.id} className="bg-card/50 border-yellow-500/20 rounded-2xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-yellow-400">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.product} - {order.customer}</p>
                      <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">R$ {order.amount.toFixed(2)}</p>
                      <Badge className={`mt-2 ${
                        order.status === 'Entregue'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'Em Trânsito'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
              <CardContent className="p-6">
                <p className="text-muted-foreground">Gráficos de vendas e analytics em desenvolvimento</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-yellow-400">Chave PIX</label>
                  <input
                    type="text"
                    placeholder="Sua chave PIX"
                    className="w-full mt-2 px-4 py-2 bg-background/50 border border-yellow-500/20 rounded-lg text-white placeholder-muted-foreground focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-yellow-400">Comissão Automática</label>
                  <p className="text-xs text-muted-foreground mt-1">Receba 15% de comissão em cada venda</p>
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
