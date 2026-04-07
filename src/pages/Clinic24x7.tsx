import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  FileText,
  ShoppingCart,
  Phone,
  MessageSquare,
  Calendar,
  User,
  Heart,
  TrendingUp,
  Zap,
  AlertCircle,
  ChevronRight,
  MapPin,
  Star,
} from 'lucide-react';

type FlowStep = 'welcome' | 'symptoms' | 'professional-select' | 'schedule' | 'payment' | 'prescription' | 'medication' | 'success';

interface Appointment {
  id: string;
  professionalName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  prescription?: string;
}

export default function Clinic24x7() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('welcome');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const commonSymptoms = [
    'Ansiedade',
    'Insônia',
    'Dor Crônica',
    'Inflamação',
    'Enxaqueca',
    'Depressão',
    'PTSD',
    'Epilepsia',
  ];

  const professionals = [
    {
      id: '1',
      name: 'Dr. Carlos Silva',
      specialty: 'Medicina Canábica',
      rating: 4.9,
      reviews: 234,
      price: 150,
      available: true,
      image: '👨‍⚕️',
    },
    {
      id: '2',
      name: 'Dra. Ana Costa',
      specialty: 'Neurologia',
      rating: 4.8,
      reviews: 189,
      price: 160,
      available: true,
      image: '👩‍⚕️',
    },
    {
      id: '3',
      name: 'Dr. Pedro Oliveira',
      specialty: 'Psiquiatria',
      rating: 4.7,
      reviews: 156,
      price: 140,
      available: true,
      image: '👨‍⚕️',
    },
  ];

  const availableTimes = [
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleProfessionalSelect = (id: string) => {
    setSelectedProfessional(id);
    setCurrentStep('schedule');
  };

  const handleScheduleAppointment = () => {
    if (selectedDate && selectedTime && selectedProfessional) {
      const professional = professionals.find(p => p.id === selectedProfessional);
      const newAppointment: Appointment = {
        id: Math.random().toString(),
        professionalName: professional?.name || '',
        specialty: professional?.specialty || '',
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
      };
      setAppointments([...appointments, newAppointment]);
      setCurrentStep('payment');
    }
  };

  const handlePayment = () => {
    setCurrentStep('prescription');
  };

  const handlePrescriptionGenerated = () => {
    setCurrentStep('medication');
  };

  const handleMedicationAdded = () => {
    setCurrentStep('success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white mb-2">Clínica 24/7 Automática</h1>
          <p className="text-gray-400">Atendimento completo: Diagnóstico → Profissional → Prescrição → Medicamento</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* PROGRESS BAR */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[
              { step: 'welcome', label: 'Bem-vindo', icon: '👋' },
              { step: 'symptoms', label: 'Sintomas', icon: '🔍' },
              { step: 'professional-select', label: 'Profissional', icon: '👨‍⚕️' },
              { step: 'schedule', label: 'Agendar', icon: '📅' },
              { step: 'payment', label: 'Pagamento', icon: '💳' },
              { step: 'prescription', label: 'Prescrição', icon: '📋' },
              { step: 'medication', label: 'Medicamento', icon: '💊' },
              { step: 'success', label: 'Sucesso', icon: '✅' },
            ].map((item, idx) => {
              const stepOrder = [
                'welcome',
                'symptoms',
                'professional-select',
                'schedule',
                'payment',
                'prescription',
                'medication',
                'success',
              ];
              const isActive = stepOrder.indexOf(currentStep) >= idx;
              const isCompleted = stepOrder.indexOf(currentStep) > idx;

              return (
                <div key={item.step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition ${
                      isCompleted
                        ? 'bg-[#00FF00] text-black'
                        : isActive
                        ? 'bg-[#9D4EDD] text-white'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {item.icon}
                  </div>
                  {idx < 7 && (
                    <div
                      className={`w-8 h-1 mx-2 transition ${
                        isCompleted ? 'bg-[#00FF00]' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <p className="text-[#00FF00] font-bold text-lg">
              {currentStep === 'welcome' && 'Bem-vindo à Clínica 24/7'}
              {currentStep === 'symptoms' && 'Descreva seus sintomas'}
              {currentStep === 'professional-select' && 'Escolha um profissional'}
              {currentStep === 'schedule' && 'Agende sua consulta'}
              {currentStep === 'payment' && 'Realize o pagamento'}
              {currentStep === 'prescription' && 'Prescrição gerada'}
              {currentStep === 'medication' && 'Selecione seu medicamento'}
              {currentStep === 'success' && 'Consulta agendada com sucesso!'}
            </p>
          </div>
        </div>

        {/* CONTENT */}
        {currentStep === 'welcome' && (
          <Card className="bg-white/5 border-[#00FF00]/20 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Bem-vindo à Clínica 24/7</h2>
              <p className="text-gray-400 mb-6">
                Nosso sistema automático de IA ajudará você a encontrar o profissional certo e obter sua prescrição em minutos.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-lg">
                <Zap className="w-6 h-6 text-[#00FF00] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-bold mb-1">Rápido e Fácil</h3>
                  <p className="text-gray-400 text-sm">Processo simplificado em 3 cliques</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 rounded-lg">
                <Heart className="w-6 h-6 text-[#9D4EDD] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-bold mb-1">Profissionais Verificados</h3>
                  <p className="text-gray-400 text-sm">Médicos especializados em cannabis medicinal</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-bold mb-1">24/7 Disponível</h3>
                  <p className="text-gray-400 text-sm">Consultas em qualquer hora do dia</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep('symptoms')}
              className="w-full bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold py-3 text-lg"
            >
              Iniciar Consulta <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        )}

        {currentStep === 'symptoms' && (
          <Card className="bg-white/5 border-[#00FF00]/20 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Quais são seus sintomas?</h2>
            <p className="text-gray-400 mb-6">Selecione todos os que se aplicam:</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {commonSymptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`p-4 rounded-lg border-2 transition ${
                    symptoms.includes(symptom)
                      ? 'bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#00FF00]/50'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep('welcome')}
                className="flex-1 bg-white/10 text-white hover:bg-white/20"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setCurrentStep('professional-select')}
                disabled={symptoms.length === 0}
                className="flex-1 bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold disabled:opacity-50"
              >
                Continuar <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 'professional-select' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Escolha um Profissional</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {professionals.map(prof => (
                <Card
                  key={prof.id}
                  className="bg-white/5 border-[#00FF00]/20 p-6 hover:border-[#00FF00]/50 transition cursor-pointer"
                  onClick={() => handleProfessionalSelect(prof.id)}
                >
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-4">{prof.image}</div>
                    <h3 className="text-white font-bold text-lg">{prof.name}</h3>
                    <p className="text-gray-400 text-sm">{prof.specialty}</p>
                  </div>

                  <div className="space-y-3 mb-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{prof.rating}</span>
                      <span className="text-gray-400 text-sm">({prof.reviews})</span>
                    </div>
                    <p className="text-[#00FF00] font-bold text-lg">R$ {prof.price}</p>
                  </div>

                  <Button
                    onClick={() => handleProfessionalSelect(prof.id)}
                    className="w-full bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold"
                  >
                    Selecionar
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'schedule' && (
          <Card className="bg-white/5 border-[#00FF00]/20 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Agende sua Consulta</h2>

            <div className="space-y-6 mb-8">
              <div>
                <label className="text-gray-400 mb-2 block">Data</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-white/5 border-[#00FF00]/30 text-white"
                />
              </div>

              <div>
                <label className="text-gray-400 mb-2 block">Horário</label>
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg border-2 transition ${
                        selectedTime === time
                          ? 'bg-[#00FF00]/20 border-[#00FF00] text-[#00FF00]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#00FF00]/50'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep('professional-select')}
                className="flex-1 bg-white/10 text-white hover:bg-white/20"
              >
                Voltar
              </Button>
              <Button
                onClick={handleScheduleAppointment}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold disabled:opacity-50"
              >
                Confirmar <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 'payment' && (
          <Card className="bg-white/5 border-[#00FF00]/20 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Pagamento</h2>

            <div className="bg-white/5 border border-[#00FF00]/20 rounded-lg p-6 mb-8">
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Consulta com Profissional</span>
                <span className="text-[#00FF00] font-bold">R$ 150,00</span>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-[#00FF00] font-bold text-xl">R$ 150,00</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <button className="w-full p-4 bg-[#00FF00]/20 border border-[#00FF00] rounded-lg text-white font-bold hover:bg-[#00FF00]/30 transition">
                💳 Cartão de Crédito
              </button>
              <button className="w-full p-4 bg-[#9D4EDD]/20 border border-[#9D4EDD] rounded-lg text-white font-bold hover:bg-[#9D4EDD]/30 transition">
                📱 PIX
              </button>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep('schedule')}
                className="flex-1 bg-white/10 text-white hover:bg-white/20"
              >
                Voltar
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold"
              >
                Pagar <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 'prescription' && (
          <Card className="bg-white/5 border-[#00FF00]/20 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-[#00FF00]/20 rounded-full mb-4">
                <FileText className="w-10 h-10 text-[#00FF00]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Prescrição Gerada</h2>
              <p className="text-gray-400">Sua prescrição digital foi criada com sucesso</p>
            </div>

            <div className="bg-white/5 border border-[#00FF00]/20 rounded-lg p-6 mb-8">
              <h3 className="text-white font-bold mb-4">Detalhes da Prescrição</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Paciente:</span>
                  <span className="text-white">João Silva</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profissional:</span>
                  <span className="text-white">Dr. Carlos Silva</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Variedade Recomendada:</span>
                  <span className="text-[#00FF00] font-bold">Charlotte's Web</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dosagem:</span>
                  <span className="text-white">5-10mg diários</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duração:</span>
                  <span className="text-white">30 dias</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePrescriptionGenerated}
              className="w-full bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold py-3"
            >
              Ir para Medicamento <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        )}

        {currentStep === 'medication' && (
          <Card className="bg-white/5 border-[#00FF00]/20 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Selecione seu Medicamento</h2>

            <div className="space-y-4 mb-8">
              {[
                { name: "Charlotte's Web - 10g", price: 89.99, stock: true },
                { name: "Charlotte's Web - 30g", price: 249.99, stock: true },
                { name: "Charlotte's Web - 100g", price: 799.99, stock: false },
              ].map((med, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white/5 border border-[#00FF00]/20 rounded-lg flex items-center justify-between hover:border-[#00FF00]/50 transition"
                >
                  <div>
                    <h3 className="text-white font-bold">{med.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {med.stock ? '✓ Em Estoque' : 'Fora de Estoque'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00FF00] font-bold text-lg">R$ {med.price}</p>
                    <Button
                      disabled={!med.stock}
                      className="mt-2 bg-[#00FF00]/20 text-[#00FF00] hover:bg-[#00FF00]/30 disabled:opacity-50"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleMedicationAdded}
              className="w-full bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold py-3"
            >
              Finalizar <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        )}

        {currentStep === 'success' && (
          <Card className="bg-white/5 border-[#00FF00]/20 p-8 max-w-2xl mx-auto text-center">
            <div className="inline-block p-4 bg-[#00FF00]/20 rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-[#00FF00]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Sucesso!</h2>
            <p className="text-gray-400 mb-8">
              Sua consulta foi agendada com sucesso. Você receberá um link de acesso 30 minutos antes da consulta.
            </p>

            <div className="bg-white/5 border border-[#00FF00]/20 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-white font-bold mb-4">Próximos Passos:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00FF00] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Consulta confirmada para hoje às 15:00</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00FF00] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Prescrição digital disponível em sua conta</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00FF00] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">Medicamento será entregue em 24h</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button className="flex-1 bg-white/10 text-white hover:bg-white/20">
                Ver Consulta
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] text-white font-bold">
                Ir para Home
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
