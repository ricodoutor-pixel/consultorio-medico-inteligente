import React, { useState, useMemo } from "react";
import { Search, Star, Heart, Filter, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "react-router-dom";


// Types
interface CannabisStrain {
  id: number;
  name: string;
  type: "Sativa" | "Indica" | "Hybrid";
  thcPercentage: number;
  cbdPercentage: number;
  effects: string[];
  medicalBenefits: string[];
  flavors: string[];
  origin: string;
  growthDifficulty: "Easy" | "Medium" | "Hard";
  floweringTime: number;
  yield: string;
  indoorHeight: string;
  outdoorYield: string;
  description: string;
  scientificBenefits: string;
  imageUrl?: string;
  rating: number;
  reviews: number;
}

const strainTypes = ["Sativa", "Indica", "Hybrid"];
const medicalConditions = [
  "Pain",
  "Anxiety",
  "Insomnia",
  "Depression",
  "Inflammation",
  "Epilepsy",
  "Nausea",
  "PTSD",
  "ADHD",
  "Migraines",
  "Stress",
  "Fatigue",
  "Cancer symptoms",
  "Arthritis",
  "Muscle spasms"
];
const effects = [
  "Relaxing",
  "Uplifting",
  "Creative",
  "Focused",
  "Happy",
  "Energetic",
  "Calm",
  "Euphoric",
  "Clear-headed",
  "Sleepy",
  "Meditative",
  "Talkative"
];

// Mock data for now - will be fetched from server
const cannabisStrains: CannabisStrain[] = [
  {
    id: 1,
    name: "Charlotte's Web",
    type: "Hybrid",
    thcPercentage: 0.3,
    cbdPercentage: 15,
    effects: ["Relaxing", "Clear-headed", "Calm", "Focused"],
    medicalBenefits: ["Epilepsy", "Seizures", "Anxiety", "Inflammation"],
    flavors: ["Earthy", "Pine", "Sweet"],
    origin: "Colorado, USA",
    growthDifficulty: "Easy",
    floweringTime: 8,
    yield: "500g/m²",
    indoorHeight: "Short",
    outdoorYield: "100-150g/plant",
    description: "World-famous high-CBD strain developed for medicinal use.",
    scientificBenefits: "Extensively studied for epilepsy treatment.",
    rating: 4.9,
    reviews: 2847
  },
  // Add more strains here...
];

export default function CannabisLibrary() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [thcRange, setThcRange] = useState([0, 25]);
  const [cbdRange, setCbdRange] = useState([0, 20]);

  // Filter strains based on search and filters
  const filteredStrains = useMemo(() => {
    return cannabisStrains.filter((strain: CannabisStrain) => {
      const matchesSearch =
        strain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strain.effects.some((e: string) => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
        strain.medicalBenefits.some((b: string) => b.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = !selectedType || strain.type === selectedType;
      const matchesCondition =
        !selectedCondition || strain.medicalBenefits.includes(selectedCondition as string);
      const matchesTHC = strain.thcPercentage >= thcRange[0] && strain.thcPercentage <= thcRange[1];
      const matchesCBD = strain.cbdPercentage >= cbdRange[0] && strain.cbdPercentage <= cbdRange[1];

      return matchesSearch && matchesType && matchesCondition && matchesTHC && matchesCBD;
    });
  }, [searchQuery, selectedType, selectedCondition, thcRange, cbdRange]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case "Sativa":
        return "text-orange-400";
      case "Indica":
        return "text-purple-400";
      case "Hybrid":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getTypeBgColor = (type: string | undefined) => {
    switch (type) {
      case "Sativa":
        return "bg-orange-500/20";
      case "Indica":
        return "bg-purple-500/20";
      case "Hybrid":
        return "bg-yellow-500/20";
      default:
        return "bg-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0e27]/95 backdrop-blur border-b border-yellow-400/20 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400">Cannabis Medicinal</h1>
              <p className="text-gray-400 text-sm">Catálogo com 100+ espécies certificadas ANVISA</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-yellow-400/50 hover:border-yellow-400"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-400/50" />
            <Input
              type="text"
              placeholder="Buscar por nome, efeito ou benefício..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1f3a] border-yellow-400/30 focus:border-yellow-400 text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 p-6 bg-[#1a1f3a] border border-yellow-400/20 rounded-lg backdrop-blur">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-yellow-400 mb-3">
                  Tipo de Planta
                </label>
                <div className="space-y-2">
                  {strainTypes.map((type: string) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                      className={`w-full text-left px-3 py-2 rounded transition ${
                        selectedType === type
                          ? "bg-yellow-400/30 border border-yellow-400"
                          : "bg-[#0a0e27] border border-gray-600 hover:border-yellow-400/50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-semibold text-yellow-400 mb-3">
                  Indicação Médica
                </label>
                <select
                  value={selectedCondition || ""}
                  onChange={(e) => setSelectedCondition(e.target.value || null)}
                  className="w-full px-3 py-2 bg-[#0a0e27] border border-gray-600 rounded text-white"
                >
                  <option value="">Todas as condições</option>
                  {medicalConditions.map((condition: string) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* THC Range */}
              <div>
                <label className="block text-sm font-semibold text-yellow-400 mb-3">
                  THC: {thcRange[0]}% - {thcRange[1]}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={thcRange[1]}
                  onChange={(e) => setThcRange([thcRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>

              {/* CBD Range */}
              <div>
                <label className="block text-sm font-semibold text-yellow-400 mb-3">
                  CBD: {cbdRange[0]}% - {cbdRange[1]}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={cbdRange[1]}
                  onChange={(e) => setCbdRange([cbdRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-400">
          Mostrando {filteredStrains.length} de {cannabisStrains.length} espécies
        </div>

        {/* Strains Grid (2x2 WeedPro style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredStrains.map((strain: CannabisStrain) => (
            <div
              key={strain.id}
              className="group bg-gradient-to-br from-[#1a1f3a] to-[#0f1425] border border-yellow-400/20 rounded-lg overflow-hidden hover:border-yellow-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/20"
            >
              {/* Image Container */}
              <div className="relative h-48 bg-[#0a0e27] overflow-hidden">
                <img
                  src={
                    strain.imageUrl ||
                    `https://via.placeholder.com/400x400/1a1f3a/FFD700?text=${encodeURIComponent(strain.name)}`
                  }
                  alt={strain.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e27] to-transparent" />

                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(strain.id)}
                  className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-yellow-400/30 transition"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.includes(strain.id)
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    }`}
                  />
                </button>

                {/* Type Badge */}
                <div
                  className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-sm font-semibold ${getTypeBgColor(
                    strain.type
                  )} ${getTypeColor(strain.type)}`}
                >
                  {strain.type}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Name */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition">
                  {strain.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(strain.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">({strain.reviews})</span>
                </div>

                {/* THC/CBD Info */}
                <div className="flex gap-4 mb-3 text-xs">
                  <div>
                    <span className="text-gray-400">THC:</span>
                    <span className="text-yellow-400 font-semibold ml-1">{strain.thcPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">CBD:</span>
                    <span className="text-green-400 font-semibold ml-1">{strain.cbdPercentage}%</span>
                  </div>
                </div>

                {/* Effects */}
                <p className="text-xs text-gray-400 mb-4">
                  <span className="text-gray-500">Efeitos:</span> {strain.effects.slice(0, 3).join(", ")}...
                </p>

                {/* Saiba Mais Button */}
                <Button
                  onClick={() => setLocation(`/strain/${strain.id}`)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-2 rounded transition-all"
                >
                  Saiba Mais <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredStrains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhuma espécie encontrada com esses filtros.</p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedType(null);
                setSelectedCondition(null);
              }}
              variant="outline"
              className="mt-4"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
