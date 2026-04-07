import React, { useState, useEffect } from "react";
import { MessageSquare, Video, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

export default function SpecialistAccess() {
  const [location, setLocation] = useLocation();
  const [specialist, setSpecialist] = useState<any>(null);
  const [accessToken, setAccessToken] = useState("");

  // Get query params
  const params = new URLSearchParams(window.location.search);
  const specialistId = params.get("specialist");
  const strainId = params.get("strain");
  const orderId = params.get("order");

  // Mock specialist data
  const specialistData = {
    id: specialistId,
    name: "Dr. João Silva",
    specialty: "Epilepsy & Seizures",
    rating: 4.9,
    image: "👨‍⚕️",
    bio: "Especialista em neurologia com 15 anos de experiência em tratamentos com cannabis medicinal.",
    availability: "Seg-Sex: 9h-18h",
    responseTime: "Geralmente responde em 2-4 horas",
    consultationMethods: ["Chat", "Vídeo"],
    price: 150
  };

  useEffect(() => {
    setSpecialist(specialistData);
    // Generate mock access token
    setAccessToken(`access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  const handleStartConsultation = (method: string) => {
    // Navigate to consultation room
    setLocation(`/consultation/room?specialist=${specialistId}&method=${method}&token=${accessToken}`);
  };

  const handleShoppingRedirect = () => {
    // Navigate to shopping with strain context
    setLocation(`/shopping?strain=${strainId}&consultation=${orderId}`);
  };

  if (!specialist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#1a1f3a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0e27]/95 backdrop-blur border-b border-yellow-400/20 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-yellow-400">Acesso Liberado ao Especialista</h1>
          <p className="text-gray-400 text-sm">Sua entrevista foi aprovada. Você pode iniciar a consulta agora.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold text-green-400 mb-1">Parabéns!</h2>
            <p className="text-green-200 text-sm">
              Sua entrevista foi processada com sucesso. Você agora tem acesso total ao especialista selecionado.
            </p>
          </div>
        </div>

        {/* Specialist Card */}
        <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Specialist Info */}
            <div className="md:col-span-1">
              <div className="text-6xl mb-4 text-center">{specialist.image}</div>
              <h2 className="text-2xl font-bold text-white mb-1 text-center">{specialist.name}</h2>
              <p className="text-yellow-400 text-center font-semibold mb-4">{specialist.specialty}</p>
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < Math.floor(specialist.rating) ? "text-yellow-400" : "text-gray-600"}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-400 text-sm text-center">{specialist.rating} ({specialist.rating * 100} avaliações)</p>
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Sobre o Especialista</h3>
              <p className="text-gray-300 mb-6">{specialist.bio}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0a0e27] rounded p-4">
                  <p className="text-gray-400 text-sm mb-1">Disponibilidade</p>
                  <p className="text-white font-semibold">{specialist.availability}</p>
                </div>
                <div className="bg-[#0a0e27] rounded p-4">
                  <p className="text-gray-400 text-sm mb-1">Tempo de Resposta</p>
                  <p className="text-white font-semibold">{specialist.responseTime}</p>
                </div>
              </div>

              <div className="bg-[#0a0e27] rounded p-4">
                <p className="text-gray-400 text-sm mb-2">Métodos de Consulta</p>
                <div className="flex gap-2">
                  {specialist.consultationMethods.map((method: string) => (
                    <span key={method} className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded text-sm">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation Methods */}
        <h2 className="text-2xl font-bold text-yellow-400 mb-6">Iniciar Consulta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Chat Consultation */}
          <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 hover:border-yellow-400/50 transition">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-8 h-8 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Consulta por Chat</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Converse com o especialista via mensagens de texto. Ideal para dúvidas rápidas e acompanhamento.
            </p>
            <ul className="text-sm text-gray-300 space-y-2 mb-6">
              <li>✓ Resposta em 2-4 horas</li>
              <li>✓ Histórico de conversas salvo</li>
              <li>✓ Suporte 24/7</li>
            </ul>
            <Button
              onClick={() => handleStartConsultation("chat")}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded transition-all flex items-center justify-center gap-2"
            >
              Iniciar Chat <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Consultation */}
          <div className="bg-[#1a1f3a] border border-yellow-400/20 rounded-lg p-6 hover:border-yellow-400/50 transition">
            <div className="flex items-center gap-3 mb-4">
              <Video className="w-8 h-8 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Consulta por Vídeo</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Faça uma videochamada com o especialista para uma consulta mais detalhada e pessoal.
            </p>
            <ul className="text-sm text-gray-300 space-y-2 mb-6">
              <li>✓ Agendamento flexível</li>
              <li>✓ Até 30 minutos de consulta</li>
              <li>✓ Gravação disponível</li>
            </ul>
            <Button
              onClick={() => handleStartConsultation("video")}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded transition-all flex items-center justify-center gap-2"
            >
              Agendar Vídeo <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Próximos Passos</h3>
          <ol className="space-y-3 text-blue-200 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-400/30 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
              <span>Escolha o método de consulta (chat ou vídeo)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-400/30 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
              <span>Descreva seus sintomas e dúvidas sobre a espécie de cannabis</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-400/30 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
              <span>Receba recomendações personalizadas do especialista</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-400/30 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
              <span>Acesse o shopping para adquirir os produtos recomendados</span>
            </li>
          </ol>
        </div>

        {/* Shopping CTA */}
        <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border border-yellow-400/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Pronto para Comprar?</h3>
          <p className="text-gray-300 mb-4">
            Após a consulta, você poderá acessar nosso shopping para adquirir os produtos recomendados pelo especialista.
          </p>
          <Button
            onClick={handleShoppingRedirect}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition-all flex items-center gap-2"
          >
            Ir para Shopping <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
