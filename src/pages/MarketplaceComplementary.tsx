import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Clock, DollarSign, Filter } from "lucide-react";

const CATEGORIES = [
  { value: "nutrition", label: "Nutrição" },
  { value: "physiotherapy", label: "Fisioterapia" },
  { value: "psychology", label: "Psicologia" },
  { value: "fitness", label: "Fitness" },
  { value: "wellness", label: "Bem-estar" },
  { value: "mental_health", label: "Saúde Mental" },
  { value: "other", label: "Outros" },
];

export default function MarketplaceComplementary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: services, isLoading } = trpc.marketplace.listServices.useQuery({
    category: selectedCategory || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    limit: 20,
    offset: 0,
  });

  const { data: stats } = trpc.marketplace.getMarketplaceStats.useQuery();

  const bookServiceMutation = trpc.marketplace.bookService.useMutation();

  const handleBookService = async (serviceId: string) => {
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 7); // Book for next week

    try {
      await bookServiceMutation.mutateAsync({
        serviceId,
        bookingDate,
      });
      alert("Serviço agendado com sucesso!");
    } catch (error) {
      alert("Erro ao agendar serviço");
    }
  };

  const filteredServices = services?.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Serviços Complementares de Saúde
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Acesse nutricionistas, fisioterapeutas, psicólogos e muito mais
          </p>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-green-400">{stats.totalServices}</div>
                  <p className="text-slate-300">Serviços Ativos</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-blue-400">{stats.totalBookings}</div>
                  <p className="text-slate-300">Agendamentos</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-purple-400">
                    R$ {(stats.totalRevenue / 100).toFixed(0)}
                  </div>
                  <p className="text-slate-300">Receita Total</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-yellow-400">
                    R$ {(stats.platformEarnings / 100).toFixed(0)}
                  </div>
                  <p className="text-slate-300">Ganhos Plataforma</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Buscar</label>
              <Input
                placeholder="Nome do serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="">Todas</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Preço Mín (R$)</label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Preço Máx (R$)</label>
              <Input
                type="number"
                placeholder="10000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="text-center text-slate-300">Carregando serviços...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center text-slate-300">Nenhum serviço encontrado</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="bg-slate-800/50 border-slate-700 hover:border-green-500 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <CardTitle className="text-white">{service.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {CATEGORIES.find((c) => c.value === service.category)?.label}
                      </CardDescription>
                    </div>
                    {service.rating > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-yellow-400">
                          {(service.rating / 100).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{service.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span>R$ {(service.price / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>{service.duration} minutos</span>
                    </div>
                    {service.reviewCount > 0 && (
                      <div className="text-sm text-slate-400">
                        {service.reviewCount} avaliações
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleBookService(service.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={bookServiceMutation.isPending}
                  >
                    {bookServiceMutation.isPending ? "Agendando..." : "Agendar Agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
