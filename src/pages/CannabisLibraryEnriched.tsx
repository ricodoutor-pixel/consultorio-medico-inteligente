import React, { useState } from "react";
import {
  Search,
  Filter,
  MessageCircle,
  Send,
  Heart,
  Share2,
  TrendingUp,
  BookOpen,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BLISS_COLORS from "@/styles/bliss-colors";

export default function CannabisLibraryEnriched() {
  const [selectedStrain, setSelectedStrain] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [userRating, setUserRating] = useState(0);

  // Mock data
  const strains = [
    {
      id: 1,
      name: "Blue Dream",
      type: "Hybrid",
      thc: "18-24%",
      cbd: "0.5-1%",
      image: "🌿",
      rating: 4.8,
      reviews: 342,
      scientificBenefits: [
        "Reduz ansiedade e depressão",
        "Melhora foco e criatividade",
        "Alívio de dor crônica",
        "Estimula apetite",
      ],
      medicalIndications: ["Depressão", "TDAH", "Dor Crônica", "Insônia"],
      comments: [
        {
          id: 1,
          author: "João Silva",
          avatar: "👨",
          date: "2 dias atrás",
          rating: 5,
          text: "Excelente para criatividade! Recomendo para artistas e profissionais criativos.",
          likes: 24,
          replies: 3,
        },
        {
          id: 2,
          author: "Maria Santos",
          avatar: "👩",
          date: "5 dias atrás",
          rating: 4,
          text: "Bom efeito, mas um pouco forte para mim. Comecei com meia dose.",
          likes: 12,
          replies: 1,
        },
        {
          id: 3,
          author: "Dr. Carlos",
          avatar: "👨‍⚕️",
          date: "1 semana atrás",
          rating: 5,
          text: "Pacientes relatam melhora significativa em sintomas de depressão. Recomendo.",
          likes: 87,
          replies: 12,
        },
      ],
    },
    {
      id: 2,
      name: "Charlotte's Web",
      type: "Sativa",
      thc: "0.3-0.5%",
      cbd: "13-20%",
      image: "🕷️",
      rating: 4.9,
      reviews: 521,
      scientificBenefits: [
        "Alto em CBD, baixo em THC",
        "Reduz convulsões",
        "Anti-inflamatório potente",
        "Sem efeitos psicoativos",
      ],
      medicalIndications: ["Epilepsia", "Inflamação", "Ansiedade", "Dor"],
      comments: [
        {
          id: 1,
          author: "Ana Costa",
          avatar: "👩",
          date: "3 dias atrás",
          rating: 5,
          text: "Meu filho com epilepsia teve redução de 70% nas crises. Vida mudada!",
          likes: 156,
          replies: 8,
        },
      ],
    },
    {
      id: 3,
      name: "OG Kush",
      type: "Indica",
      thc: "19-26%",
      cbd: "0.1-0.5%",
      image: "👑",
      rating: 4.7,
      reviews: 289,
      scientificBenefits: [
        "Relaxamento profundo",
        "Reduz insônia",
        "Alívio de estresse",
        "Efeito sedativo",
      ],
      medicalIndications: ["Insônia", "Estresse", "Dor Muscular", "Ansiedade"],
      comments: [
        {
          id: 1,
          author: "Pedro Oliveira",
          avatar: "👨",
          date: "4 dias atrás",
          rating: 5,
          text: "Finalmente durmo bem! Recomendo para quem tem insônia.",
          likes: 45,
          replies: 2,
        },
      ],
    },
  ];

  const selectedStrainData = strains.find((s) => s.id === selectedStrain);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLISS_COLORS.gray[50] }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
            📚 Biblioteca Científica de Cannabis
          </h1>
          <p className="text-gray-600 mb-4">
            Explore 100+ espécies com pesquisa científica, benefícios médicos e experiências de usuários
          </p>

          {/* Search and Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar espécie..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                style={{ borderColor: BLISS_COLORS.primary[200] }}
              />
            </div>
            <button
              className="px-4 py-2 rounded-lg border flex items-center gap-2"
              style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strains List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                Espécies Populares
              </h2>

              <div className="space-y-2">
                {strains.map((strain) => (
                  <button
                    key={strain.id}
                    onClick={() => setSelectedStrain(strain.id)}
                    className="w-full p-3 rounded-lg border text-left transition"
                    style={{
                      borderColor:
                        selectedStrain === strain.id ? BLISS_COLORS.primary[500] : BLISS_COLORS.primary[100],
                      backgroundColor:
                        selectedStrain === strain.id ? BLISS_COLORS.primary[50] : "white",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{strain.image}</div>
                      <div className="flex-1">
                        <p className="font-bold text-sm" style={{ color: BLISS_COLORS.primary[700] }}>
                          {strain.name}
                        </p>
                        <p className="text-xs text-gray-600">{strain.type}</p>
                      </div>
                      <p className="text-xs font-bold">⭐ {strain.rating}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Strain Details */}
          <div className="lg:col-span-2">
            {selectedStrainData ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">{selectedStrainData.image}</div>
                      <div>
                        <h1 className="text-3xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                          {selectedStrainData.name}
                        </h1>
                        <p className="text-gray-600 mb-2">{selectedStrainData.type}</p>
                        <div className="flex gap-4">
                          <span className="text-sm font-bold">THC: {selectedStrainData.thc}</span>
                          <span className="text-sm font-bold">CBD: {selectedStrainData.cbd}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                        {selectedStrainData.rating}⭐
                      </p>
                      <p className="text-sm text-gray-600">{selectedStrainData.reviews} avaliações</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button className="flex-1 py-2 rounded-lg border flex items-center justify-center gap-2" style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}>
                      <Heart className="w-4 h-4" />
                      Favoritar
                    </Button>
                    <Button className="flex-1 py-2 rounded-lg border flex items-center justify-center gap-2" style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}>
                      <Share2 className="w-4 h-4" />
                      Compartilhar
                    </Button>
                  </div>
                </div>

                {/* Scientific Info */}
                <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5" style={{ color: BLISS_COLORS.primary[500] }} />
                    <h2 className="text-xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                      Benefícios Científicos
                    </h2>
                  </div>

                  <div className="space-y-2">
                    {selectedStrainData.scientificBenefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2">
                        <span style={{ color: BLISS_COLORS.primary[500] }}>✓</span>
                        <p className="text-sm">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medical Indications */}
                <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5" style={{ color: BLISS_COLORS.primary[500] }} />
                    <h2 className="text-xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                      Indicações Médicas
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedStrainData.medicalIndications.map((indication, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{ backgroundColor: BLISS_COLORS.primary[100], color: BLISS_COLORS.primary[700] }}
                      >
                        {indication}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5" style={{ color: BLISS_COLORS.primary[500] }} />
                    <h2 className="text-xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                      Experiências de Usuários ({selectedStrainData.comments.length})
                    </h2>
                  </div>

                  {/* Add Comment */}
                  <div className="mb-6 pb-6 border-b" style={{ borderColor: BLISS_COLORS.primary[100] }}>
                    <p className="text-sm font-bold mb-2">Sua Avaliação</p>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          className="text-2xl transition"
                        >
                          {star <= userRating ? "⭐" : "☆"}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Compartilhe sua experiência..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        style={{ borderColor: BLISS_COLORS.primary[200] }}
                      />
                      <button
                        className="px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2"
                        style={{ backgroundColor: BLISS_COLORS.primary[500] }}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {selectedStrainData.comments.map((comment) => (
                      <div key={comment.id} className="pb-4 border-b" style={{ borderColor: BLISS_COLORS.primary[100] }}>
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{comment.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                                {comment.author}
                              </p>
                              <p className="text-xs text-gray-600">{comment.date}</p>
                            </div>
                            <p className="text-xs mb-2">{"⭐".repeat(comment.rating)}</p>
                            <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                            <div className="flex gap-4 text-xs">
                              <button className="flex items-center gap-1" style={{ color: BLISS_COLORS.primary[600] }}>
                                👍 {comment.likes}
                              </button>
                              <button className="flex items-center gap-1" style={{ color: BLISS_COLORS.primary[600] }}>
                                💬 {comment.replies}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-12 text-center" style={{ borderColor: BLISS_COLORS.primary[200] }}>
                <p className="text-gray-600 mb-4">Selecione uma espécie para ver detalhes</p>
                <TrendingUp className="w-10 h-10 mx-auto text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
