import React, { useState } from "react";
import {
  Package,
  TrendingUp,
  DollarSign,
  Star,
  Edit2,
  Trash2,
  Plus,
  BarChart3,
  MessageSquare,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BLISS_COLORS from "@/styles/bliss-colors";

export default function PharmacyDashboard() {
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [showInventoryAlerts, setShowInventoryAlerts] = useState(true);

  // Mock data
  const pharmacy = {
    name: "Farmácia Bem-Estar Premium",
    cnpj: "12.345.678/0001-90",
    avatar: "💚",
    rating: 4.8,
    totalSales: 1250,
    totalRevenue: 18750,
  };

  const stats = {
    monthlyRevenue: 18750,
    totalSales: 1250,
    averageOrderValue: 15,
    pendingPayment: 1875,
    activeProducts: 15,
    averageRating: 4.8,
  };

  const products = [
    {
      id: 1,
      name: "Óleo CBD 10%",
      sku: "OC-10-001",
      price: 89.9,
      stock: 45,
      minStock: 20,
      maxStock: 100,
      sales: 234,
      rating: 4.9,
      image: "🫗",
    },
    {
      id: 2,
      name: "Cápsula THC:CBD 1:1",
      sku: "CP-11-002",
      price: 120,
      stock: 12,
      minStock: 20,
      maxStock: 80,
      sales: 156,
      rating: 4.7,
      image: "💊",
    },
    {
      id: 3,
      name: "Chá Medicinal Premium",
      sku: "CH-MP-003",
      price: 45,
      stock: 89,
      minStock: 30,
      maxStock: 150,
      sales: 412,
      rating: 4.8,
      image: "🍵",
    },
  ];

  const monthlyData = [
    { period: "1-5", revenue: 2500, sales: 180 },
    { period: "6-10", revenue: 4200, sales: 290 },
    { period: "11-15", revenue: 3800, sales: 250 },
    { period: "16-20", revenue: 4500, sales: 310 },
    { period: "21-25", revenue: 2100, sales: 140 },
    { period: "26-31", revenue: 1650, sales: 80 },
  ];

  const reviews = [
    {
      id: 1,
      customerName: "João Silva",
      productName: "Óleo CBD 10%",
      rating: 5,
      comment: "Produto de excelente qualidade, entrega rápida!",
      date: "2 dias atrás",
    },
    {
      id: 2,
      customerName: "Maria Santos",
      productName: "Cápsula THC:CBD 1:1",
      rating: 4,
      comment: "Bom custo-benefício, recomendo.",
      date: "5 dias atrás",
    },
  ];

  const lowStockAlerts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLISS_COLORS.gray[50] }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{pharmacy.avatar}</div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                  {pharmacy.name}
                </h1>
                <p className="text-gray-600">CNPJ: {pharmacy.cnpj} • ⭐ {pharmacy.rating}</p>
              </div>
            </div>
            <Button
              className="px-6 py-3 rounded-lg text-white font-bold flex items-center gap-2"
              style={{ backgroundColor: BLISS_COLORS.primary[500] }}
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: "Faturamento", value: `R$ ${stats.monthlyRevenue}`, icon: <DollarSign className="w-4 h-4" /> },
              { label: "Vendas", value: stats.totalSales, icon: <TrendingUp className="w-4 h-4" /> },
              { label: "Ticket Médio", value: `R$ ${stats.averageOrderValue}`, icon: <BarChart3 className="w-4 h-4" /> },
              { label: "Pendente", value: `R$ ${stats.pendingPayment}`, icon: <AlertCircle className="w-4 h-4" /> },
              { label: "Produtos", value: stats.activeProducts, icon: <Package className="w-4 h-4" /> },
              { label: "Rating", value: `${stats.averageRating}⭐`, icon: <Star className="w-4 h-4" /> },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg text-center text-sm"
                style={{ backgroundColor: BLISS_COLORS.primary[50] }}
              >
                <p className="text-gray-600 mb-1">{stat.label}</p>
                <p className="font-bold text-sm" style={{ color: BLISS_COLORS.primary[700] }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Inventory Alerts */}
            {lowStockAlerts.length > 0 && (
              <div
                className="p-4 rounded-lg border-2 flex items-start gap-3"
                style={{ borderColor: "#f59e0b", backgroundColor: "#fffbeb" }}
              >
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-yellow-900 mb-2">⚠️ Alertas de Estoque</p>
                  <p className="text-sm text-yellow-800">
                    {lowStockAlerts.length} produto(s) com estoque baixo. Reposição recomendada.
                  </p>
                </div>
                <button
                  onClick={() => setShowInventoryAlerts(!showInventoryAlerts)}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  {showInventoryAlerts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Products Management */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                📦 Produtos ({products.length})
              </h2>

              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 rounded-lg border flex items-start gap-4"
                    style={{ borderColor: BLISS_COLORS.primary[100] }}
                  >
                    <div className="text-3xl">{product.image}</div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                            className="p-2 rounded border"
                            style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded border"
                            style={{ borderColor: "#ef4444", color: "#ef4444" }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {editingProduct === product.id ? (
                        <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 rounded">
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Preço (R$)</label>
                            <input
                              type="number"
                              defaultValue={product.price}
                              className="w-full px-2 py-1 border rounded text-sm"
                              style={{ borderColor: BLISS_COLORS.primary[200] }}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Estoque</label>
                            <input
                              type="number"
                              defaultValue={product.stock}
                              className="w-full px-2 py-1 border rounded text-sm"
                              style={{ borderColor: BLISS_COLORS.primary[200] }}
                            />
                          </div>
                          <button
                            className="col-span-2 px-3 py-1 rounded text-sm text-white font-bold"
                            style={{ backgroundColor: BLISS_COLORS.primary[500] }}
                          >
                            Salvar Alterações
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Preço</p>
                            <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                              R$ {product.price}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Estoque</p>
                            <p
                              className="font-bold"
                              style={{
                                color: product.stock <= product.minStock ? "#ef4444" : BLISS_COLORS.primary[700],
                              }}
                            >
                              {product.stock}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Vendas</p>
                            <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                              {product.sales}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Rating</p>
                            <p className="font-bold">{product.rating}⭐</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                📊 Faturamento Este Mês
              </h2>

              <div className="flex items-end gap-2 h-40">
                {monthlyData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-2">R$ {data.revenue}</div>
                    <div
                      className="w-full rounded-t transition hover:opacity-80"
                      style={{
                        backgroundColor: BLISS_COLORS.primary[500],
                        height: `${(data.revenue / 4500) * 100}%`,
                      }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{data.period}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                ⭐ Avaliações Recentes
              </h2>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: BLISS_COLORS.primary[100] }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                          {review.customerName}
                        </p>
                        <p className="text-xs text-gray-600">{review.productName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg">{"⭐".repeat(review.rating)}</p>
                        <p className="text-xs text-gray-600">{review.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h3 className="font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                💰 Carteira
              </h3>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Disponível</p>
                  <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
                    R$ {stats.pendingPayment}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Faturado</p>
                  <p className="text-lg font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                    R$ {stats.monthlyRevenue + 5000}
                  </p>
                </div>
              </div>

              <Button
                className="w-full py-2 rounded-lg text-white font-bold"
                style={{ backgroundColor: BLISS_COLORS.primary[500] }}
              >
                Sacar via PIX
              </Button>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h3 className="font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                📈 Performance
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-600">Satisfação</p>
                    <p className="text-sm font-bold">4.8/5</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: BLISS_COLORS.primary[500], width: "96%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-600">Entrega no Prazo</p>
                    <p className="text-sm font-bold">99%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: "#10b981", width: "99%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h3 className="font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                Ações Rápidas
              </h3>

              <div className="space-y-2">
                <Button className="w-full py-2 rounded-lg border" style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}>
                  Editar Perfil
                </Button>
                <Button className="w-full py-2 rounded-lg border" style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}>
                  Gerenciar Estoque
                </Button>
                <Button className="w-full py-2 rounded-lg border" style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}>
                  Relatórios
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
