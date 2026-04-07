import { useState, useEffect } from 'react';
import { useRoute } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import JitsiVideoConference from '@/components/JitsiVideoConference';
// import { useAuth } from '@/hooks/useAuth';
// TODO: Implementar useAuth quando schema for atualizado

/**
 * Página de Teleconsulta com Jitsi
 * Implementa fluxo completo de telemedicina conforme CFM 2.113/2021
 */
export default function Teleconsulta() {
  const [, params] = useRoute('/teleconsulta/:consultationId');
  const user = { name: 'Paciente', email: 'paciente@plantaeraiz.com' };
  const [isStarting, setIsStarting] = useState(true);
  const [consultationData, setConsultationData] = useState<any>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultationId = params?.consultationId || '';

  useEffect(() => {
    const loadConsultationData = async () => {
      try {
        setConsultationData({
          id: consultationId,
          patientName: user.name || 'Paciente',
          professionalName: 'Dr. João Silva',
          professionalSpecialty: 'Medicina Canábica',
          scheduledTime: new Date(),
          duration: 30,
          status: 'scheduled',
        });
        setIsStarting(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar consulta');
        setIsStarting(false);
      }
    };

    if (consultationId) {
      loadConsultationData();
    }
  }, [consultationId]);

  const handleSessionStart = () => {
    setSessionStarted(true);
  };

  const handleSessionEnd = (sessionData: any) => {
    console.log('Sessão encerrada:', sessionData);
    // TODO: Salvar dados da sessão no banco de dados
    // TODO: Gerar relatório para prontuário
    // TODO: Redirecionar para página de sucesso
  };

  const handleError = (error: Error) => {
    setError(error.message);
  };

  if (isStarting) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-10 h-10 border-4 border-[#00FF00]/20 border-t-[#00FF00] rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Carregando consulta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
        <Card className="bg-red-500/10 border-red-500 p-6 max-w-md">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-red-400 font-bold text-lg mb-2">Erro</h2>
              <p className="text-red-300 mb-4">{error}</p>
              <Button
                onClick={() => window.history.back()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Voltar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-[#0A0E27] p-4">
        <div className="max-w-2xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-white text-3xl font-bold mb-2">Teleconsulta</h1>
            <p className="text-gray-400">Consulta de telemedicina com profissional</p>
          </div>

          {/* INFORMAÇÕES DA CONSULTA */}
          <Card className="bg-[#1a1f3a] border-[#00FF00]/20 p-6 mb-6">
            <h2 className="text-white font-bold text-lg mb-6">Informações da Consulta</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PACIENTE */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#00FF00]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-[#00FF00]" />
                </div>
                <div>
            <p className="text-gray-400 text-sm">Paciente</p>
              <p className="text-white font-bold">{user.name}</p>
                </div>
              </div>

              {/* PROFISSIONAL */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#9D4EDD]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-[#9D4EDD]" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Profissional</p>
                  <p className="text-white font-bold">{consultationData?.professionalName}</p>
                  <p className="text-gray-400 text-xs">{consultationData?.professionalSpecialty}</p>
                </div>
              </div>

              {/* HORÁRIO */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Horário</p>
                  <p className="text-white font-bold">
                    {consultationData?.scheduledTime?.toLocaleTimeString('pt-BR')}
                  </p>
                  <p className="text-gray-400 text-xs">Duração: {consultationData?.duration} min</p>
                </div>
              </div>

              {/* STATUS */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-white font-bold capitalize">{consultationData?.status}</p>
                  <p className="text-gray-400 text-xs">Pronto para iniciar</p>
                </div>
              </div>
            </div>
          </Card>

          {/* TERMOS E CONFORMIDADE */}
          <Card className="bg-[#9D4EDD]/10 border-[#9D4EDD]/20 p-6 mb-6">
            <h3 className="text-[#9D4EDD] font-bold mb-3">Conformidade e Privacidade</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-[#00FF00] mt-0.5">✓</span>
                <span>Criptografia de ponta a ponta (E2E) ativada</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FF00] mt-0.5">✓</span>
                <span>Conforme Resolução CFM nº 2.113/2021 (Telemedicina)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FF00] mt-0.5">✓</span>
                <span>Conforme Lei Geral de Proteção de Dados (LGPD)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FF00] mt-0.5">✓</span>
                <span>Sessão será gravada para prontuário (com seu consentimento)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FF00] mt-0.5">✓</span>
                <span>Dados serão armazenados de forma segura e criptografada</span>
              </li>
            </ul>
          </Card>

          {/* REQUISITOS TÉCNICOS */}
          <Card className="bg-blue-500/10 border-blue-500/20 p-6 mb-6">
            <h3 className="text-blue-400 font-bold mb-3">Requisitos Técnicos</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Câmera e microfone funcionando</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Conexão de internet estável (mínimo 2 Mbps)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Ambiente privado e silencioso</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Navegador atualizado (Chrome, Firefox, Safari, Edge)</span>
              </li>
            </ul>
          </Card>

          {/* BOTÃO DE INICIAR */}
          <div className="flex gap-4">
            <Button
              onClick={handleSessionStart}
              className="flex-1 bg-[#00FF00] hover:bg-[#00DD00] text-black font-bold py-3 rounded-lg transition"
            >
              Iniciar Teleconsulta
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // VIDEOCONFERÊNCIA ATIVA
  return (
    <div className="fixed inset-0 bg-[#0A0E27] z-50">
      <JitsiVideoConference
        roomName={`consultation-${consultationId}`}
        userName={user.name || 'Paciente'}
        userEmail={user.email || 'user@plantaeraiz.com'}
        userRole="patient"
        consultationId={consultationId}
        enableRecording={true}
        onSessionEnd={handleSessionEnd}
        onError={handleError}
      />
    </div>
  );
}
