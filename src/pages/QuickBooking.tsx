import React, { useState } from 'react';
import { ChevronRight, Calendar, Clock, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type Step = 1 | 2 | 3;

interface BookingData {
  step1: {
    symptoms: string[];
    urgency: 'routine' | 'urgent' | 'emergency';
  };
  step2: {
    specialistId: string;
    date: string;
    time: string;
    consultationType: 'video' | 'phone' | 'chat';
  };
  step3: {
    paymentMethod: 'pix' | 'credit_card';
    email: string;
  };
}

const commonSymptoms = [
  'Dor crônica',
  'Ansiedade',
  'Insônia',
  'Epilepsia',
  'Inflamação',
  'Náusea',
  'Falta de apetite',
  'Espasticidade'
];

const specialists = [
  {
    id: '1',
    name: 'Dr. Carlos Silva',
    specialty: 'Cannabis Medicinal',
    rating: 4.9,
    price: 150,
    responseTime: '5 min',
    available: true
  },
  {
    id: '2',
    name: 'Dra. Marina Santos',
    specialty: 'Farmacologia',
    rating: 4.8,
    price: 180,
    responseTime: '10 min',
    available: true
  }
];

export default function QuickBooking() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    step1: { symptoms: [], urgency: 'routine' },
    step2: { specialistId: '', date: '', time: '', consultationType: 'video' },
    step3: { paymentMethod: 'pix', email: '' }
  });
  const [completed, setCompleted] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setBookingData({
      ...bookingData,
      step1: {
        ...bookingData.step1,
        symptoms: bookingData.step1.symptoms.includes(symptom)
          ? bookingData.step1.symptoms.filter(s => s !== symptom)
          : [...bookingData.step1.symptoms, symptom]
      }
    });
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      setCompleted(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            Sua consulta foi agendada com sucesso. Você receberá um email de confirmação em breve.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Código de Confirmação:</strong> CONF123ABC
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Data:</strong> 25 de Fevereiro de 2026, 14:00
            </p>
            <p className="text-sm text-gray-700">
              <strong>Especialista:</strong> Dr. Carlos Silva
            </p>
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700 mb-3">
            Ver Detalhes da Consulta
          </Button>
          <Button variant="outline" className="w-full">
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Agendar Consulta em 3 Cliques</h1>
            <span className="text-sm font-semibold text-green-600">Etapa {currentStep}/3</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Symptoms */}
        {currentStep === 1 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual é o seu principal sintoma?</h2>
            <p className="text-gray-600 mb-6">Selecione um ou mais sintomas para encontrar o especialista ideal</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`p-3 rounded-lg border-2 transition-all text-left font-medium ${
                    bookingData.step1.symptoms.includes(symptom)
                      ? 'border-green-600 bg-green-50 text-green-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Qual é a urgência?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'routine', label: 'Rotina', desc: 'Sem pressa' },
                  { value: 'urgent', label: 'Urgente', desc: 'Próximos dias' },
                  { value: 'emergency', label: 'Emergência', desc: 'Hoje' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBookingData({
                      ...bookingData,
                      step1: { ...bookingData.step1, urgency: option.value as any }
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bookingData.step1.urgency === option.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleNextStep}
                disabled={bookingData.step1.symptoms.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Specialist & Time */}
        {currentStep === 2 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha um especialista e horário</h2>
            <p className="text-gray-600 mb-6">Recomendamos os melhores especialistas para seus sintomas</p>

            <div className="space-y-3 mb-6">
              {specialists.map((specialist) => (
                <button
                  key={specialist.id}
                  onClick={() => setBookingData({
                    ...bookingData,
                    step2: { ...bookingData.step2, specialistId: specialist.id }
                  })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    bookingData.step2.specialistId === specialist.id
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{specialist.name}</div>
                      <div className="text-sm text-gray-600">{specialist.specialty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">⭐ {specialist.rating}</div>
                      <div className="text-sm text-gray-600">R$ {specialist.price}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Data</label>
                <Input
                  type="date"
                  value={bookingData.step2.date}
                  onChange={(e) => setBookingData({
                    ...bookingData,
                    step2: { ...bookingData.step2, date: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Horário</label>
                <Input
                  type="time"
                  value={bookingData.step2.time}
                  onChange={(e) => setBookingData({
                    ...bookingData,
                    step2: { ...bookingData.step2, time: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Tipo de consulta
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'video', label: 'Vídeo', icon: '📹' },
                  { value: 'phone', label: 'Telefone', icon: '☎️' },
                  { value: 'chat', label: 'Chat', icon: '💬' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBookingData({
                      ...bookingData,
                      step2: { ...bookingData.step2, consultationType: option.value as any }
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bookingData.step2.consultationType === option.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="font-semibold text-sm text-gray-900">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePrevStep} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!bookingData.step2.specialistId || !bookingData.step2.date || !bookingData.step2.time}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirme seu agendamento</h2>
            <p className="text-gray-600 mb-6">Escolha seu método de pagamento</p>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Resumo da Consulta</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Especialista:</strong> Dr. Carlos Silva
                </p>
                <p className="text-gray-700">
                  <strong>Data:</strong> {bookingData.step2.date} às {bookingData.step2.time}
                </p>
                <p className="text-gray-700">
                  <strong>Tipo:</strong> {bookingData.step2.consultationType === 'video' ? 'Vídeo' : 'Telefone'}
                </p>
                <p className="text-gray-700">
                  <strong>Valor:</strong> R$ 150,00
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Método de Pagamento
              </label>
              <div className="space-y-3">
                {[
                  { value: 'pix', label: 'PIX', desc: 'Instantâneo', icon: '💳' },
                  { value: 'credit_card', label: 'Cartão de Crédito', desc: 'Parcelado em até 12x', icon: '💰' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBookingData({
                      ...bookingData,
                      step3: { ...bookingData.step3, paymentMethod: option.value as any }
                    })}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      bookingData.step3.paymentMethod === option.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.desc}</div>
                      </div>
                      <span className="text-2xl">{option.icon}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email de Confirmação
              </label>
              <Input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={bookingData.step3.email}
                onChange={(e) => setBookingData({
                  ...bookingData,
                  step3: { ...bookingData.step3, email: e.target.value }
                })}
              />
            </div>

            {/* Terms */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Ao confirmar, você concorda com nossos termos de serviço e política de privacidade.
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handlePrevStep} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!bookingData.step3.email}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              >
                Confirmar Agendamento <CheckCircle className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
