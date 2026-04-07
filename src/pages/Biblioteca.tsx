import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter, Star, Leaf } from 'lucide-react';

const MOCK_STRAINS = [
  { id: 1, name: 'Charlotte\'s Web', type: 'Sativa', thc: 0.3, cbd: 12, effects: 'Relaxamento', rating: 4.9, reviews: 234, image: '🌿' },
  { id: 2, name: 'Harlequin', type: 'Sativa', thc: 5, cbd: 12, effects: 'Foco', rating: 4.8, reviews: 189, image: '🌿' },
  { id: 3, name: 'Pennywise', type: 'Indica', thc: 1, cbd: 12, effects: 'Sono', rating: 4.7, reviews: 156, image: '🌿' },
  { id: 4, name: 'Cannatonic', type: 'Híbrida', thc: 6, cbd: 7, effects: 'Equilíbrio', rating: 4.9, reviews: 312, image: '🌿' },
  { id: 5, name: 'ACDC', type: 'Sativa', thc: 1, cbd: 20, effects: 'Clareza', rating: 4.6, reviews: 98, image: '🌿' },
  { id: 6, name: 'Ringo\'s Gift', type: 'Híbrida', thc: 1, cbd: 15, effects: 'Alívio', rating: 4.8, reviews: 201, image: '🌿' },
];

const TYPES = ['Todos', 'Sativa', 'Indica', 'Híbrida'];
const EFFECTS = ['Todos', 'Relaxamento', 'Foco', 'Sono', 'Alívio', 'Clareza', 'Equilíbrio'];

export default function Biblioteca() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedEffect, setSelectedEffect] = useState('Todos');
  const [sortBy, setSortBy] = useState('rating');

  const filtered = useMemo(() => {
    let result = MOCK_STRAINS;

    if (search) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedType !== 'Todos') {
      result = result.filter(s => s.type === selectedType);
    }

    if (selectedEffect !== 'Todos') {
      result = result.filter(s => s.effects === selectedEffect);
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'cbd-high') {
      result.sort((a, b) => b.cbd - a.cbd);
    } else if (sortBy === 'thc-low') {
      result.sort((a, b) => a.thc - b.thc);
    }

    return result;
  }, [search, selectedType, selectedEffect, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white mb-2">Biblioteca de Variedades</h1>
          <p className="text-gray-400">100+ cepas de cannabis com análise científica completa</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* SIDEBAR */}
          <div>
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
                    placeholder="Nome da variedade..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white/10 border-[#00FF00]/30 text-white"
                  />
                </div>
              </div>

              {/* Tipo */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Tipo</label>
                <div className="space-y-2">
                  {TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        selectedType === type
                          ? 'bg-[#00FF00] text-[#0A0E27] font-semibold'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Efeitos */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Efeitos</label>
                <div className="space-y-2">
                  {EFFECTS.map(effect => (
                    <button
                      key={effect}
                      onClick={() => setSelectedEffect(effect)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all text-sm ${
                        selectedEffect === effect
                          ? 'bg-[#9D4EDD] text-white font-semibold'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordenação */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Ordenar</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-[#00FF00]/30 rounded-lg text-white text-sm"
                >
                  <option value="rating">Melhor Avaliação</option>
                  <option value="cbd-high">Maior CBD</option>
                  <option value="thc-low">Menor THC</option>
                </select>
              </div>
            </Card>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-gray-400">
                Mostrando <span className="text-[#00FF00] font-bold">{filtered.length}</span> variedades
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map(strain => (
                <Card
                  key={strain.id}
                  className="bg-gradient-to-br from-[#9D4EDD]/10 to-[#00FF00]/5 border border-[#00FF00]/20 p-6 hover:border-[#00FF00]/50 transition-all group"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-4xl">{strain.image}</span>
                        <h3 className="text-lg font-bold text-white">{strain.name}</h3>
                      </div>
                      <span className="text-xs bg-[#9D4EDD]/30 text-[#9D4EDD] px-3 py-1 rounded-full">
                        {strain.type}
                      </span>
                    </div>
                  </div>

                  {/* CANNABINOIDS */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">THC</p>
                      <p className="text-xl font-bold text-[#9D4EDD]">{strain.thc}%</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">CBD</p>
                      <p className="text-xl font-bold text-[#00FF00]">{strain.cbd}%</p>
                    </div>
                  </div>

                  {/* EFFECTS */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Efeitos Principais</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-[#00FF00]/20 text-[#00FF00] px-3 py-1 rounded-full">
                        {strain.effects}
                      </span>
                    </div>
                  </div>

                  {/* RATING */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#00FF00]/20">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(strain.rating)
                              ? 'fill-[#00FF00] text-[#00FF00]'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[#00FF00] font-bold">{strain.rating}</span>
                    <span className="text-gray-500 text-sm">({strain.reviews})</span>
                  </div>

                  {/* CTA */}
                  <Button className="w-full bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold flex items-center justify-center gap-2">
                    <Leaf className="w-4 h-4" />
                    Saiba Mais
                  </Button>
                </Card>
              ))}
            </div>

            {filtered.length === 0 && (
              <Card className="bg-white/5 border border-[#00FF00]/20 p-12 text-center">
                <p className="text-gray-400 text-lg">Nenhuma variedade encontrada</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
