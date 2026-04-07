import React, { useState, useMemo } from "react";
import { Search, Star, MapPin, MessageSquare, Video, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import BLISS_COLORS from "@/styles/bliss-colors";
// Import specialists data
const specialists: any[] = []; // Will be loaded from API
interface Specialist {
  id: number;
  name: string;
  specialty: string;
  specialization: string;
  crm: string;
  country: string;
  state?: string;
  city?: string;
  bio: string;
  experience: number;
  consultationPrice: number;
  rating: number;
  totalConsultations: number;
  languages: string[];
  consultationMethods: string[];
  avatar: string;
}

export default function SpecialistsDirectory() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([30, 150]);
  const [showFilters, setShowFilters] = useState(false);

  const specialtyTypes: string[] = ["Médico", "Farmacêutico", "Terapeuta"];
  const specializations: string[] = Array.from(new Set(specialists.map((s: Specialist) => s.specialization)));

  const filteredSpecialists = useMemo(() => {
    return specialists.filter((specialist: Specialist) => {
      const matchesSearch =
        specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.bio.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !selectedType || specialist.specialty === selectedType;
      const matchesSpecialty = !selectedSpecialty || specialist.specialization === selectedSpecialty;
      const matchesPrice = specialist.consultationPrice >= priceRange[0] && specialist.consultationPrice <= priceRange[1];

      return matchesSearch && matchesType && matchesSpecialty && matchesPrice;
    });
  }, [searchTerm, selectedType, selectedSpecialty, priceRange]);

  const handleConsultation = (specialistId: number) => {
    setLocation(`/consultation/payment?specialist=${specialistId}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLISS_COLORS.gray[50] }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
            Encontre seu Especialista
          </h1>
          <p className="text-gray-600 mb-6">
            Escolha entre {specialists.length}+ profissionais verificados de todo o mundo
          </p>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou condição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: BLISS_COLORS.primary[200], "--tw-ring-color": BLISS_COLORS.primary[500] } as any}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border"
            style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Type Filter */}
              <div>
                <h3 className="font-bold mb-3" style={{ color: BLISS_COLORS.primary[700] }}>
                  Tipo de Profissional
                </h3>
                <div className="space-y-2">
                  {specialtyTypes.map((type: string) => (
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

              {/* Specialization Filter */}
              <div>
                <h3 className="font-bold mb-3" style={{ color: BLISS_COLORS.primary[700] }}>
                  Especialidade
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(specializations as string[]).map((spec: string) => (
                    <label key={spec} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSpecialty === spec}
                        onChange={(e) => setSelectedSpecialty(e.target.checked ? spec : null)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-700 text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-bold mb-3" style={{ color: BLISS_COLORS.primary[700] }}>
                  Preço da Consulta
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Mínimo: R$ {priceRange[0]}</label>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Máximo: R$ {priceRange[1]}</label>
                    <input
                      type="range"
                      min="30"
                      max="150"
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
                    setSelectedSpecialty(null);
                    setPriceRange([30, 150]);
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

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600 mb-6">
          Mostrando {filteredSpecialists.length} de {specialists.length} especialistas
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialists.map((specialist: Specialist) => (
            <div
              key={specialist.id}
              className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition"
              style={{ borderColor: BLISS_COLORS.primary[200] }}
            >
              {/* Header */}
              <div
                className="p-6"
                style={{ backgroundColor: BLISS_COLORS.primary[50] }}
              >
                <div className="text-5xl mb-3">{specialist.avatar}</div>
                <h3 className="text-xl font-bold mb-1" style={{ color: BLISS_COLORS.primary[700] }}>
                  {specialist.name}
                </h3>
                <p className="text-sm font-semibold" style={{ color: BLISS_COLORS.accent[500] }}>
                  {specialist.specialization}
                </p>
                <p className="text-xs text-gray-600 mt-1">{specialist.specialty}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4"
                        style={{
                          fill: i < Math.floor(specialist.rating) ? BLISS_COLORS.accent[500] : BLISS_COLORS.gray[300],
                          color: i < Math.floor(specialist.rating) ? BLISS_COLORS.accent[500] : BLISS_COLORS.gray[300]
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: BLISS_COLORS.primary[700] }}>
                    {specialist.rating} ({specialist.totalConsultations})
                  </span>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {specialist.bio}
                </p>

                {/* Location & Languages */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: BLISS_COLORS.primary[500] }} />
                    <span>{specialist.city}, {specialist.state} - {specialist.country}</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">Idiomas:</span> {specialist.languages.join(", ")}
                  </div>
                </div>

                {/* Methods */}
                <div className="flex gap-2 mb-4">
                  {specialist.consultationMethods.includes("chat") && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: BLISS_COLORS.primary[50], color: BLISS_COLORS.primary[700] }}>
                      <MessageSquare className="w-3 h-3" />
                      Chat
                    </div>
                  )}
                  {specialist.consultationMethods.includes("video") && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: BLISS_COLORS.primary[50], color: BLISS_COLORS.primary[700] }}>
                      <Video className="w-3 h-3" />
                      Vídeo
                    </div>
                  )}
                </div>

                {/* CRM */}
                <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                  ✓ {specialist.specialty === "Médico" ? "CRM" : specialist.specialty === "Farmacêutico" ? "CRF" : "Certificado"}: {specialist.crm}
                </div>

                {/* Price & Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Consulta a partir de</p>
                    <p className="text-2xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                      R$ {specialist.consultationPrice}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleConsultation(specialist.id)}
                    className="px-4 py-2 font-bold rounded-lg text-white"
                    style={{ backgroundColor: BLISS_COLORS.primary[500] }}
                  >
                    Consultar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSpecialists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">Nenhum especialista encontrado</p>
            <p className="text-gray-500">Tente ajustar seus filtros ou busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
