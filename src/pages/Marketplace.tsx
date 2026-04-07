import React, { useState, useMemo } from "react";
import { Search, ShoppingCart, Star, Truck, Heart, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import BLISS_COLORS from "@/styles/bliss-colors";

interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  originalPrice?: number;
  rating: number;
  totalReviews: number;
  image: string;
  pharmacy: string;
  thcPercentage: number;
  cbdPercentage: number;
  stock: number;
  freeShipping: boolean;
}

// Mock data - will be replaced with API call
const mockProducts: Product[] = [
  {
    id: 101,
    name: "Óleo CBD 1000mg - Espectro Completo",
    type: "Óleo",
    price: 89.9,
    originalPrice: 129.9,
    rating: 4.9,
    totalReviews: 234,
    image: "🧴",
    pharmacy: "Farmácia Bem-Estar Natural",
    thcPercentage: 0.3,
    cbdPercentage: 10,
    stock: 45,
    freeShipping: true,
  },
  {
    id: 102,
    name: "Cápsulas CBD+THC Balanceadas - 30 caps",
    type: "Cápsula",
    price: 75.0,
    originalPrice: 99.9,
    rating: 4.8,
    totalReviews: 156,
    image: "💊",
    pharmacy: "Farmácia Bem-Estar Natural",
    thcPercentage: 5,
    cbdPercentage: 5,
    stock: 28,
    freeShipping: true,
  },
  {
    id: 201,
    name: "Flor de Cannabis - Variedade Charlotte's Web",
    type: "Flor",
    price: 65.0,
    originalPrice: 85.0,
    rating: 4.9,
    totalReviews: 112,
    image: "🌸",
    pharmacy: "Produtor Premium Cannabis RJ",
    thcPercentage: 1,
    cbdPercentage: 12,
    stock: 15,
    freeShipping: true,
  },
  {
    id: 202,
    name: "Extrato Concentrado - Resina CBD Pura",
    type: "Óleo",
    price: 120.0,
    rating: 4.8,
    totalReviews: 67,
    image: "🧴",
    pharmacy: "Produtor Premium Cannabis RJ",
    thcPercentage: 0.1,
    cbdPercentage: 80,
    stock: 8,
    freeShipping: true,
  },
  {
    id: 301,
    name: "Óleo Espectro Completo - Marca Canadense",
    type: "Óleo",
    price: 150.0,
    originalPrice: 199.9,
    rating: 4.9,
    totalReviews: 178,
    image: "🧴",
    pharmacy: "Importadora Cannabis Global MG",
    thcPercentage: 0.5,
    cbdPercentage: 20,
    stock: 12,
    freeShipping: true,
  },
];

const productTypes = ["Óleo", "Cápsula", "Flor", "Pomada", "Spray", "Chá"];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "rating" | "newest">("newest");

  const filteredProducts = useMemo(() => {
    let filtered = mockProducts.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.pharmacy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !selectedType || product.type === selectedType;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      return matchesSearch && matchesType && matchesPrice;
    });

    // Sort
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [searchTerm, selectedType, priceRange, sortBy]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLISS_COLORS.gray[50] }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
            Marketplace de Cannabis Medicinal
          </h1>
          <p className="text-gray-600 mb-6">
            Produtos de farmácias e produtores autorizados pela ANVISA. Frete grátis para todo Brasil.
          </p>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos, farmácias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: BLISS_COLORS.primary[200] }}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border"
              style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:outline-none"
              style={{ borderColor: BLISS_COLORS.primary[200] }}
            >
              <option value="newest">Mais Recentes</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="rating">Melhor Avaliado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Type Filter */}
              <div>
                <h3 className="font-bold mb-3" style={{ color: BLISS_COLORS.primary[700] }}>
                  Tipo de Produto
                </h3>
                <div className="space-y-2">
                  {productTypes.map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedType === type}
                        onChange={(e) => setSelectedType(e.target.checked ? type : null)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-bold mb-3" style={{ color: BLISS_COLORS.primary[700] }}>
                  Preço
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Mínimo: R$ {priceRange[0]}</label>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Máximo: R$ {priceRange[1]}</label>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedType(null);
                    setPriceRange([0, 300]);
                    setSearchTerm("");
                  }}
                  className="w-full px-4 py-2 rounded-lg border flex items-center justify-center gap-2"
                  style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600 mb-6">
          Mostrando {filteredProducts.length} produtos
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition"
              style={{ borderColor: BLISS_COLORS.primary[200] }}
            >
              {/* Image */}
              <div
                className="p-8 text-center text-5xl"
                style={{ backgroundColor: BLISS_COLORS.primary[50] }}
              >
                {product.image}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Type Badge */}
                <div className="inline-block px-2 py-1 rounded text-xs font-semibold mb-2" style={{ backgroundColor: BLISS_COLORS.primary[50], color: BLISS_COLORS.primary[700] }}>
                  {product.type}
                </div>

                {/* Name */}
                <h3 className="font-bold text-sm mb-2 line-clamp-2" style={{ color: BLISS_COLORS.primary[700] }}>
                  {product.name}
                </h3>

                {/* Pharmacy */}
                <p className="text-xs text-gray-600 mb-3">{product.pharmacy}</p>

                {/* Cannabinoids */}
                <div className="flex gap-2 mb-3 text-xs">
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: BLISS_COLORS.primary[50], color: BLISS_COLORS.primary[700] }}>
                    CBD {product.cbdPercentage}%
                  </span>
                  {product.thcPercentage > 0 && (
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: BLISS_COLORS.accent[50], color: BLISS_COLORS.accent[700] }}>
                      THC {product.thcPercentage}%
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3"
                        style={{
                          fill: i < Math.floor(product.rating) ? BLISS_COLORS.accent[500] : BLISS_COLORS.gray[300],
                          color: i < Math.floor(product.rating) ? BLISS_COLORS.accent[500] : BLISS_COLORS.gray[300]
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    ({product.totalReviews})
                  </span>
                </div>

                {/* Shipping */}
                {product.freeShipping && (
                  <div className="flex items-center gap-1 mb-3 text-xs text-green-600">
                    <Truck className="w-3 h-3" />
                    Frete grátis
                  </div>
                )}

                {/* Price */}
                <div className="mb-4">
                  {product.originalPrice && (
                    <p className="text-xs text-gray-500 line-through">R$ {product.originalPrice.toFixed(2)}</p>
                  )}
                  <p className="text-2xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                    R$ {product.price.toFixed(2)}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 py-2 font-bold rounded-lg text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: BLISS_COLORS.primary[500] }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Comprar
                  </Button>
                  <button
                    className="px-3 py-2 rounded-lg border"
                    style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[500] }}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">Nenhum produto encontrado</p>
            <p className="text-gray-500">Tente ajustar seus filtros ou busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
