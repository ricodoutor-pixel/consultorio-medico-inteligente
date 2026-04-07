import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Star, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchFilters {
  query: string;
  specialty: string;
  minRating: number;
  maxPrice: number;
  availability: 'now' | 'today' | 'week' | 'any';
  language: string;
  location: string;
  experienceYears: number;
}

interface SearchResult {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  price: number;
  responseTime: number;
  availability: string;
  languages: string[];
  experience: number;
  matchScore: number;
  image?: string;
  verified: boolean;
  location: string;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    name: 'Dr. Carlos Silva',
    specialty: 'Cannabis Medicinal',
    rating: 4.9,
    reviews: 287,
    price: 150,
    responseTime: 5,
    availability: 'Online agora',
    languages: ['Português', 'Inglês'],
    experience: 15,
    matchScore: 98,
    verified: true,
    location: 'São Paulo, SP'
  },
  {
    id: '2',
    name: 'Dra. Marina Santos',
    specialty: 'Farmacologia Clínica',
    rating: 4.8,
    reviews: 156,
    price: 180,
    responseTime: 10,
    availability: 'Disponível em 30 min',
    languages: ['Português', 'Inglês', 'Espanhol'],
    experience: 12,
    matchScore: 95,
    verified: true,
    location: 'Rio de Janeiro, RJ'
  },
  {
    id: '3',
    name: 'Dr. João Oliveira',
    specialty: 'Neurologia',
    rating: 4.7,
    reviews: 203,
    price: 160,
    responseTime: 8,
    availability: 'Disponível em 1h',
    languages: ['Português'],
    experience: 18,
    matchScore: 92,
    verified: true,
    location: 'Belo Horizonte, MG'
  }
];

const specialties = [
  'Cannabis Medicinal',
  'Farmacologia Clínica',
  'Neurologia',
  'Psiquiatria',
  'Medicina Geral',
  'Dermatologia'
];

const languages = ['Português', 'Inglês', 'Espanhol', 'Francês'];

export default function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    specialty: '',
    minRating: 4.0,
    maxPrice: 300,
    availability: 'any',
    language: '',
    location: '',
    experienceYears: 0
  });

  const [showFilters, setShowFilters] = useState(false);

  const filteredResults = useMemo(() => {
    return mockResults.filter(result => {
      if (filters.query && !result.name.toLowerCase().includes(filters.query.toLowerCase())) {
        return false;
      }
      if (filters.specialty && result.specialty !== filters.specialty) {
        return false;
      }
      if (result.rating < filters.minRating) {
        return false;
      }
      if (result.price > filters.maxPrice) {
        return false;
      }
      if (filters.language && !result.languages.includes(filters.language)) {
        return false;
      }
      if (filters.experienceYears && result.experience < filters.experienceYears) {
        return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-green-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Busca Inteligente de Especialistas</h1>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Buscar especialista, sintoma ou especialidade..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="pl-10 py-2 h-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {['Online agora', 'Top avaliados', 'Mais econômicos', 'Mais experientes'].map((filter) => (
              <Badge
                key={filter}
                variant="outline"
                className="cursor-pointer hover:bg-green-50 transition-colors"
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <Card className="p-4 sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>

                {/* Specialty */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Especialidade
                  </label>
                  <select
                    value={filters.specialty}
                    onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Todas</option>
                    {specialties.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Avaliação mínima: {filters.minRating.toFixed(1)}★
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Preço máximo: R$ {filters.maxPrice}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Language */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Idioma
                  </label>
                  <select
                    value={filters.language}
                    onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Qualquer um</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Disponibilidade
                  </label>
                  <select
                    value={filters.availability}
                    onChange={(e) => setFilters({ ...filters, availability: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="any">Qualquer hora</option>
                    <option value="now">Agora</option>
                    <option value="today">Hoje</option>
                    <option value="week">Esta semana</option>
                  </select>
                </div>

                {/* Experience */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Anos de experiência: {filters.experienceYears}+
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={filters.experienceYears}
                    onChange={(e) => setFilters({ ...filters, experienceYears: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Aplicar Filtros
                </Button>
              </Card>
            </div>
          )}

          {/* Results */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredResults.length} especialista{filteredResults.length !== 1 ? 's' : ''} encontrado{filteredResults.length !== 1 ? 's' : ''}
              </p>
              <select className="text-sm px-3 py-1 border border-gray-300 rounded-lg">
                <option>Relevância</option>
                <option>Avaliação</option>
                <option>Preço (menor)</option>
                <option>Experiência</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredResults.map((specialist) => (
                <Card
                  key={specialist.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {specialist.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                            {specialist.name}
                            {specialist.verified && (
                              <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{specialist.specialty}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {specialist.matchScore}%
                          </div>
                          <p className="text-xs text-gray-500">Compatibilidade</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold">{specialist.rating}</span>
                          <span className="text-gray-500">({specialist.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span>R$ {specialist.price}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>{specialist.responseTime} min</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span>{specialist.experience} anos</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span>{specialist.location}</span>
                        </div>
                      </div>

                      {/* Languages & Availability */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {specialist.languages.map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-800">{specialist.availability}</Badge>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Agendar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
