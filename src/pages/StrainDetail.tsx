import React, { useState } from "react";
import { Star, Heart, Share2, ChevronLeft, Zap, Leaf, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

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

// Mock strain data - will be fetched from server
const mockStrain: CannabisStrain = {
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
  description: "World-famous high-CBD strain developed for medicinal use. Minimal psychoactive effects with maximum therapeutic benefits.",
  scientificBenefits: "Extensively studied for epilepsy treatment. FDA-approved Epidiolex is derived from this strain. Reduces seizure frequency by up to 50% in clinical trials.",
  rating: 4.9,
  reviews: 2847
};

// Mock specialists
const specialists = [
  {
    id: 1,
    name: "Dr. João Silva",
    specialty: "Epilepsy & Seizures",
    rating: 4.9,
    price: 150,
    image: "👨‍⚕️"
  },
  {
    id: 2,
    name: "Dra. Maria Santos",
    specialty: "Anxiety Disorders",
    rating: 4.8,
    price: 150,
    image: "👩‍⚕️"
  },
  {
    id: 3,
    name: "Dr. Pedro Costa",
    specialty: "Neurological Conditions",
    rating: 4.7,
    price: 150,
    image: "👨‍⚕️"
  },
  {
    id: 4,
    name: "Dra. Ana Oliveira",
    specialty: "Inflammation & Pain",
    rating: 4.9,
    price: 200,
    image: "👩‍⚕️"
  }
];

export default function StrainDetail() {
  const [location, setLocation] = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [showSpecialists, setShowSpecialists] = useState(false);
  const strain = mockStrain;

  const handleConsultation = (specialistId: number) => {
    // Navigate to payment page with specialist and strain info
    setLocation(`/consultation/payment?specialist=${specialistId}&strain=${strain.id}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: strain.name,
        text: `Conheça a espécie medicinal ${strain.name}`,
        url: window.location.href
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0e27]/95 backdrop-blur border-b border-yellow-400/20 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/cannabis-library")}
            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-yellow-400">{strain.name}</h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-yellow-400/20 rounded-full transition"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image and Basic Info */}
          <div className="lg:col-span-1">
            {/* Image */}
            <div className="mb-6 rounded-lg overflow-hidden border border-yellow-400/20">
              <img
                src={strain.imageUrl || `https://via.placeholder.com/400x400/1a1f3a/FFD700?text=${encodeURIComponent(strain.name)}`}
                alt={strain.name}
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Rating and Favorite */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 cursor-pointer transition ${
                        i < Math.floor(strain.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-2 hover:bg-yellow-400/20 rounded-full transition"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isFavorite ? "fill-red-500 text-red-500" : "text-white"
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-400">
                {strain.rating} ⭐ ({strain.reviews} avaliações)
              </p>
            </div>

            {/* Your Rating */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-400 mb-3">Sua Avaliação</p>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setUserRating(i + 1)}
                    className="transition hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < userRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2">
            {/* Type and Origin */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Tipo</p>
                  <p className="text-lg font-semibold text-yellow-400">{strain.type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Origem</p>
                  <p className="text-lg font-semibold text-white">{strain.origin}</p>
                </div>
              </div>
            </div>

            {/* THC/CBD Sliders */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Composição</h3>
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">THC</span>
                  <span className="text-sm font-semibold text-yellow-400">{strain.thcPercentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full"
                    style={{ width: `${Math.min(strain.thcPercentage * 5, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">CBD</span>
                  <span className="text-sm font-semibold text-green-400">{strain.cbdPercentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(strain.cbdPercentage * 5, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Effects */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Efeitos Potenciais
              </h3>
              <div className="flex flex-wrap gap-2">
                {strain.effects.map((effect) => (
                  <span
                    key={effect}
                    className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm"
                  >
                    {effect}
                  </span>
                ))}
              </div>
            </div>

            {/* Medical Benefits */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Benefícios Médicos
              </h3>
              <div className="flex flex-wrap gap-2">
                {strain.medicalBenefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-sm"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            {/* Flavors */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Sabores</h3>
              <p className="text-gray-300">{strain.flavors.join(", ")}</p>
            </div>

            {/* Description */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Descrição</h3>
              <p className="text-gray-300 mb-4">{strain.description}</p>
            </div>

            {/* Scientific Benefits */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Benefícios Científicos</h3>
              <p className="text-gray-300">{strain.scientificBenefits}</p>
            </div>

            {/* Growth Info */}
            <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Informações de Cultivo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Dificuldade</p>
                  <p className="text-white font-semibold">{strain.growthDifficulty}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tempo de Floração</p>
                  <p className="text-white font-semibold">{strain.floweringTime} semanas</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Altura Interna</p>
                  <p className="text-white font-semibold">{strain.indoorHeight}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rendimento</p>
                  <p className="text-white font-semibold">{strain.yield}</p>
                </div>
              </div>
            </div>

            {/* Saiba Mais Button */}
            <Button
              onClick={() => setShowSpecialists(!showSpecialists)}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 rounded transition-all text-lg"
            >
              {showSpecialists ? "Ocultar Especialistas" : "Saiba Mais com Especialista"}
            </Button>
          </div>
        </div>

        {/* Specialists Section */}
        {showSpecialists && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Especialistas Recomendados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {specialists.map((specialist) => (
                <div
                  key={specialist.id}
                  className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-4 hover:border-yellow-400/50 transition"
                >
                  <div className="text-4xl mb-3">{specialist.image}</div>
                  <h3 className="font-semibold text-white mb-1">{specialist.name}</h3>
                  <p className="text-xs text-gray-400 mb-3">{specialist.specialty}</p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(specialist.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-yellow-400 font-semibold mb-3">R$ {specialist.price}</p>
                  <Button
                    onClick={() => handleConsultation(specialist.id)}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded transition-all text-sm"
                  >
                    Agendar Consulta
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
