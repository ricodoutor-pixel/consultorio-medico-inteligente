import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Heart,
  Share2,
  TrendingUp,
  Zap,
  Droplet,
  Leaf,
  Star,
  ChevronRight,
} from 'lucide-react';

interface Strain {
  id: string;
  name: string;
  image: string;
  thc: number;
  cbd: number;
  effects: string[];
  flavors: string[];
  rating: number;
  reviews: number;
  price: number;
  inStock: boolean;
  category: 'high-cbd' | 'balanced' | 'high-thc' | 'medicinal';
  medical: string[];
}

const strains: Strain[] = [
  {
    id: '1',
    name: "Charlotte's Web",
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/hxiw6nyOTu5TwoAPflRU2h/sandbox/MudRkVlJ7zXSTHFOd1NS5m-img-1_1771902873000_na1fn_c3RyYWluLWNoYXJsb3R0ZXMtd2Vi.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80',
    thc: 0.3,
    cbd: 17,
    effects: ['Relaxamento', 'Foco', 'Alerta'],
    flavors: ['Herbal', 'Terroso', 'Doce'],
    rating: 4.9,
    reviews: 342,
    price: 89.99,
    inStock: true,
    category: 'high-cbd',
    medical: ['Epilepsia', 'Ansiedade', 'Inflamação'],
  },
  {
    id: '2',
    name: 'Harlequin',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/hxiw6nyOTu5TwoAPflRU2h/sandbox/MudRkVlJ7zXSTHFOd1NS5m-img-2_1771902897000_na1fn_c3RyYWluLWhhcmxlcXVpbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80',
    thc: 5,
    cbd: 10,
    effects: ['Alerta', 'Criatividade', 'Foco'],
    flavors: ['Frutas', 'Herbal', 'Cítrico'],
    rating: 4.7,
    reviews: 189,
    price: 79.99,
    inStock: true,
    category: 'balanced',
    medical: ['Dor', 'Ansiedade', 'Depressão'],
  },
  {
    id: '3',
    name: 'AC/DC',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/hxiw6nyOTu5TwoAPflRU2h/sandbox/MudRkVlJ7zXSTHFOd1NS5m-img-3_1771902893000_na1fn_c3RyYWluLWFjZGM.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80',
    thc: 1,
    cbd: 15,
    effects: ['Relaxamento', 'Alerta', 'Clareza'],
    flavors: ['Herbal', 'Especiado', 'Terroso'],
    rating: 4.8,
    reviews: 267,
    price: 84.99,
    inStock: true,
    category: 'high-cbd',
    medical: ['Dor Crônica', 'Inflamação', 'Insônia'],
  },
  {
    id: '4',
    name: 'Pennywise',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/hxiw6nyOTu5TwoAPflRU2h/sandbox/MudRkVlJ7zXSTHFOd1NS5m-img-4_1771902881000_na1fn_c3RyYWluLXBlbm55d2lzZQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80',
    thc: 6,
    cbd: 6,
    effects: ['Relaxamento', 'Felicidade', 'Alerta'],
    flavors: ['Frutas', 'Herbal', 'Doce'],
    rating: 4.6,
    reviews: 145,
    price: 74.99,
    inStock: true,
    category: 'balanced',
    medical: ['Ansiedade', 'PTSD', 'Dor'],
  },
  {
    id: '5',
    name: 'Remedy',
    image: 'https://private-us-east-1.manuscdn.com/sessionFile/hxiw6nyOTu5TwoAPflRU2h/sandbox/MudRkVlJ7zXSTHFOd1NS5m-img-5_1771902890000_na1fn_c3RyYWluLXJlbWVkeQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80',
    thc: 0.2,
    cbd: 13,
    effects: ['Relaxamento', 'Foco', 'Calma'],
    flavors: ['Herbal', 'Terroso', 'Floral'],
    rating: 4.7,
    reviews: 198,
    price: 79.99,
    inStock: true,
    category: 'high-cbd',
    medical: ['Insônia', 'Ansiedade', 'Dor'],
  },
];

export default function BibliotecaV2() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 150]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredStrains = useMemo(() => {
    return strains.filter(strain => {
      const matchesSearch =
        strain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strain.medical.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !selectedCategory || strain.category === selectedCategory;

      const matchesEffects =
        selectedEffects.length === 0 ||
        selectedEffects.some(effect => strain.effects.includes(effect));

      const matchesPrice = strain.price >= priceRange[0] && strain.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesEffects && matchesPrice;
    });
  }, [searchTerm, selectedCategory, selectedEffects, priceRange]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const toggleComparison = (id: string) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(prev => prev.filter(s => s !== id));
    } else if (selectedForComparison.length < 3) {
      setSelectedForComparison(prev => [...prev, id]);
    }
  };

  const comparisonStrains = strains.filter(s => selectedForComparison.includes(s.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white mb-2">Biblioteca de Variedades</h1>
          <p className="text-gray-400">Explore 100+ cepas medicinais com análise detalhada</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* SEARCH & FILTERS */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          {/* SEARCH */}
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-[#00FF00]" />
              <Input
                placeholder="Buscar variedade ou condição médica..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 bg-white/5 border-[#00FF00]/30 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* CATEGORY FILTER */}
          <Card className="bg-white/5 border-[#00FF00]/20 p-4 lg:col-span-1">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Categoria
            </h3>
            <div className="space-y-2">
              {['high-cbd', 'balanced', 'high-thc', 'medicinal'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedCategory === cat
                      ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cat === 'high-cbd' && 'Alto CBD'}
                  {cat === 'balanced' && 'Equilibrado'}
                  {cat === 'high-thc' && 'Alto THC'}
                  {cat === 'medicinal' && 'Medicinal'}
                </button>
              ))}
            </div>
          </Card>

          {/* EFFECTS FILTER */}
          <Card className="bg-white/5 border-[#00FF00]/20 p-4 lg:col-span-1">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Efeitos
            </h3>
            <div className="space-y-2">
              {['Relaxamento', 'Foco', 'Alerta', 'Criatividade'].map(effect => (
                <label key={effect} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEffects.includes(effect)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedEffects([...selectedEffects, effect]);
                      } else {
                        setSelectedEffects(selectedEffects.filter(f => f !== effect));
                      }
                    }}
                    className="w-4 h-4 rounded bg-[#00FF00]/20 border-[#00FF00]"
                  />
                  <span className="text-gray-400 text-sm">{effect}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* PRICE FILTER */}
          <Card className="bg-white/5 border-[#00FF00]/20 p-4 lg:col-span-1">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Preço
            </h3>
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="150"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
              <p className="text-[#00FF00] font-bold">
                R$ {priceRange[0]} - R$ {priceRange[1]}
              </p>
            </div>
          </Card>

          {/* ACTIONS */}
          <Card className="bg-white/5 border-[#00FF00]/20 p-4 lg:col-span-1">
            <h3 className="text-white font-bold mb-4">Ações</h3>
            <Button
              onClick={() => setCompareMode(!compareMode)}
              className={`w-full ${
                compareMode
                  ? 'bg-[#9D4EDD] text-white'
                  : 'bg-[#00FF00]/20 text-[#00FF00] hover:bg-[#00FF00]/30'
              }`}
            >
              {compareMode ? '✓ Modo Comparação' : 'Comparar'}
            </Button>
          </Card>
        </div>

        {/* COMPARISON VIEW */}
        {compareMode && comparisonStrains.length > 0 && (
          <Card className="bg-gradient-to-r from-[#00FF00]/10 to-[#9D4EDD]/10 border-[#00FF00]/30 p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Comparação de Variedades</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comparisonStrains.map(strain => (
                <div key={strain.id} className="bg-white/5 border border-[#00FF00]/20 rounded-lg p-4">
                  <img
                    src={strain.image}
                    alt={strain.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-white font-bold text-lg mb-2">{strain.name}</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">THC:</span>
                      <span className="text-[#00FF00] font-bold">{strain.thc}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CBD:</span>
                      <span className="text-blue-400 font-bold">{strain.cbd}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <span className="text-yellow-400 font-bold">★ {strain.rating}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => toggleComparison(strain.id)}
                    className="w-full mt-4 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* STRAINS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrains.map(strain => (
            <Card
              key={strain.id}
              className="bg-white/5 border-[#00FF00]/20 overflow-hidden hover:border-[#00FF00]/50 transition group"
            >
              {/* IMAGE */}
              <div className="relative h-48 overflow-hidden bg-black">
                <img
                  src={strain.image}
                  alt={strain.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* BADGES */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                  <Badge className="bg-[#00FF00]/80 text-black font-bold">
                    {strain.category === 'high-cbd' && 'Alto CBD'}
                    {strain.category === 'balanced' && 'Equilibrado'}
                    {strain.category === 'high-thc' && 'Alto THC'}
                    {strain.category === 'medicinal' && 'Medicinal'}
                  </Badge>
                  <button
                    onClick={() => toggleFavorite(strain.id)}
                    className="p-2 rounded-full bg-white/10 hover:bg-[#00FF00]/20 transition"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(strain.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-white'
                      }`}
                    />
                  </button>
                </div>

                {/* RATING */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">{strain.rating}</span>
                  <span className="text-gray-400 text-xs">({strain.reviews})</span>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-2">{strain.name}</h3>

                {/* CANNABINOIDS */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 rounded p-2">
                    <p className="text-gray-400 text-xs">THC</p>
                    <p className="text-[#00FF00] font-bold">{strain.thc}%</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                    <p className="text-gray-400 text-xs">CBD</p>
                    <p className="text-blue-400 font-bold">{strain.cbd}%</p>
                  </div>
                </div>

                {/* EFFECTS */}
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Efeitos</p>
                  <div className="flex flex-wrap gap-1">
                    {strain.effects.map(effect => (
                      <Badge key={effect} className="bg-white/10 text-gray-300 text-xs">
                        {effect}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* MEDICAL */}
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Indicações Médicas</p>
                  <div className="flex flex-wrap gap-1">
                    {strain.medical.slice(0, 2).map(med => (
                      <Badge key={med} className="bg-[#9D4EDD]/20 text-[#9D4EDD] text-xs">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* PRICE & ACTIONS */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[#00FF00] font-bold text-lg">R$ {strain.price}</p>
                    <p className="text-gray-400 text-xs">
                      {strain.inStock ? '✓ Em Estoque' : 'Fora de Estoque'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {compareMode && (
                      <button
                        onClick={() => toggleComparison(strain.id)}
                        className={`p-2 rounded-full transition ${
                          selectedForComparison.includes(strain.id)
                            ? 'bg-[#9D4EDD]/20 text-[#9D4EDD]'
                            : 'bg-white/10 hover:bg-[#9D4EDD]/20'
                        }`}
                      >
                        ✓
                      </button>
                    )}
                    <button className="p-2 rounded-full bg-white/10 hover:bg-[#00FF00]/20 transition">
                      <Share2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* BUY BUTTON */}
                <Button className="w-full mt-4 bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold hover:opacity-90">
                  Ver Detalhes <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredStrains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhuma variedade encontrada</p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
                setSelectedEffects([]);
                setPriceRange([0, 150]);
              }}
              className="mt-4 bg-[#00FF00]/20 text-[#00FF00] hover:bg-[#00FF00]/30"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
