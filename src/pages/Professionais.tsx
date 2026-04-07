import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Star, Filter } from 'lucide-react';

// Mock data - será substituído por tRPC
const MOCK_PROFESSIONALS = [
  {
    id: 1,
    name: 'Dr. João Silva',
    specialty: 'Medicina Geral',
    crm: 'CRM 12345/SP',
    rating: 4.9,
    reviews: 234,
    consultationFee: 150,
    responseTime: 15,
    languages: ['Português', 'Inglês'],
    avatar: '👨‍⚕️',
    verified: true,
    online: true,
  },
  {
    id: 2,
    name: 'Dra. Maria Santos',
    specialty: 'Psicologia',
    crm: 'CRP 06/12345',
    rating: 4.8,
    reviews: 189,
    consultationFee: 120,
    responseTime: 20,
    languages: ['Português', 'Espanhol'],
    avatar: '👩‍⚕️',
    verified: true,
    online: true,
  },
  {
    id: 3,
    name: 'Dr. Carlos Costa',
    specialty: 'Farmácia',
    crm: 'CRF 98765/RJ',
    rating: 4.7,
    reviews: 156,
    consultationFee: 100,
    responseTime: 10,
    languages: ['Português'],
    avatar: '👨‍🔬',
    verified: true,
    online: false,
  },
  {
    id: 4,
    name: 'Dra. Ana Oliveira',
    specialty: 'Medicina Geral',
    crm: 'CRM 54321/MG',
    rating: 4.9,
    reviews: 312,
    consultationFee: 160,
    responseTime: 12,
    languages: ['Português', 'Inglês', 'Francês'],
    avatar: '👩‍⚕️',
    verified: true,
    online: true,
  },
  {
    id: 5,
    name: 'Dr. Roberto Lima',
    specialty: 'Psicologia',
    crm: 'CRP 07/54321',
    rating: 4.6,
    reviews: 98,
    consultationFee: 130,
    responseTime: 25,
    languages: ['Português'],
    avatar: '👨‍⚕️',
    verified: true,
    online: true,
  },
  {
    id: 6,
    name: 'Dra. Juliana Ferreira',
    specialty: 'Farmácia',
    crm: 'CRF 11111/BA',
    rating: 4.8,
    reviews: 201,
    consultationFee: 110,
    responseTime: 8,
    languages: ['Português', 'Inglês'],
    avatar: '👩‍🔬',
    verified: true,
    online: false,
  },
];

const SPECIALTIES = ['Todas', 'Medicina Geral', 'Psicologia', 'Farmácia'];
const LANGUAGES = ['Português', 'Inglês', 'Espanhol', 'Francês'];

export default function Professionais() {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas');
  const [selectedLanguage, setSelectedLanguage] = useState('Português');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = MOCK_PROFESSIONALS;

    // Filtro por busca
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtro por especialidade
    if (selectedSpecialty !== 'Todas') {
      result = result.filter(p => p.specialty === selectedSpecialty);
    }

    // Filtro por idioma
    result = result.filter(p => p.languages.includes(selectedLanguage));

    // Ordenação
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.consultationFee - b.consultationFee);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.consultationFee - a.consultationFee);
    } else if (sortBy === 'online') {
      result.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
    }

    return result;
  }, [search, selectedSpecialty, selectedLanguage, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white mb-4">Profissionais Verificados</h1>
          <p className="text-gray-400">Encontre o especialista perfeito para sua saúde</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* SIDEBAR - FILTROS */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <Card className="bg-white/5 border border-[#00FF00]/20 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#00FF00]" />
                Filtros
              </h3>

              {/* Busca */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Nome ou especialidade..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white/10 border-[#00FF00]/30 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Especialidade */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Especialidade</label>
                <div className="space-y-2">
                  {SPECIALTIES.map(specialty => (
                    <button
                      key={specialty}
                      onClick={() => setSelectedSpecialty(specialty)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        selectedSpecialty === specialty
                          ? 'bg-[#00FF00] text-[#0A0E27] font-semibold'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idioma */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Idioma</label>
                <div className="space-y-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        selectedLanguage === lang
                          ? 'bg-[#9D4EDD] text-white font-semibold'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordenação */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-[#00FF00]/30 rounded-lg text-white"
                >
                  <option value="rating">Melhor Avaliação</option>
                  <option value="price-low">Menor Preço</option>
                  <option value="price-high">Maior Preço</option>
                  <option value="online">Online Agora</option>
                </select>
              </div>
            </Card>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            {/* MOBILE FILTER TOGGLE */}
            <div className="lg:hidden mb-6">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full bg-[#9D4EDD] text-white hover:bg-[#8a3fbf]"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>
            </div>

            {/* RESULTS COUNT */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-400">
                Mostrando <span className="text-[#00FF00] font-bold">{filtered.length}</span> profissionais
              </p>
            </div>

            {/* PROFESSIONALS GRID */}
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map(prof => (
                <Card
                  key={prof.id}
                  className="bg-gradient-to-br from-[#9D4EDD]/10 to-[#00FF00]/5 border border-[#00FF00]/20 p-6 hover:border-[#00FF00]/50 transition-all group"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{prof.avatar}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{prof.name}</h3>
                          {prof.verified && (
                            <span className="text-[#00FF00] text-sm font-bold">✓ Verificado</span>
                          )}
                        </div>
                        <p className="text-sm text-[#9D4EDD] font-semibold">{prof.specialty}</p>
                        <p className="text-xs text-gray-500">{prof.crm}</p>
                      </div>
                    </div>
                    {prof.online && (
                      <div className="w-3 h-3 bg-[#00FF00] rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* RATING */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(prof.rating)
                              ? 'fill-[#00FF00] text-[#00FF00]'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[#00FF00] font-bold">{prof.rating}</span>
                    <span className="text-gray-500 text-sm">({prof.reviews} avaliações)</span>
                  </div>

                  {/* INFO */}
                  <div className="space-y-2 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#9D4EDD]" />
                      Responde em {prof.responseTime} min
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#9D4EDD]" />
                      {prof.languages.join(', ')}
                    </div>
                  </div>

                  {/* PRICE & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#00FF00]/20">
                    <div>
                      <p className="text-xs text-gray-500">Consulta</p>
                      <p className="text-2xl font-bold text-[#00FF00]">
                        R$ {prof.consultationFee.toFixed(2)}
                      </p>
                    </div>
                    <Link href={`/agendar?professional=${prof.id}`}>
                      <Button className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold">
                        Agendar
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {filtered.length === 0 && (
              <Card className="bg-white/5 border border-[#00FF00]/20 p-12 text-center">
                <p className="text-gray-400 text-lg">Nenhum profissional encontrado com os filtros selecionados</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
