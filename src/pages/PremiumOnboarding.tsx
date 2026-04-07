import React, { useState } from "react";
import { ChevronRight, Check, Zap, Shield, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * AGENTE 5 - UX/DESIGN
 * Premium Onboarding Page
 * Interface intuitiva, acessibilidade, conversão, mobile-first
 */

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  completed: boolean;
}

export default function PremiumOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Bem-vindo à Planta & Raiz",
      description: "A plataforma mais segura e completa para telemedicina + cannabis medicinal + marketplace",
      icon: <Zap className="w-10 h-10 text-green-500" />,
      action: "Começar",
      completed: false,
    },
    {
      id: 2,
      title: "Escolha seu Perfil",
      description: "Você é paciente, especialista, farmácia ou produtor?",
      icon: <Users className="w-10 h-10 text-blue-500" />,
      action: "Selecionar",
      completed: false,
    },
    {
      id: 3,
      title: "Consulte com Especialistas",
      description: "Conecte-se com médicos, farmacêuticos e terapeutas verificados globalmente",
      icon: <Shield className="w-10 h-10 text-purple-500" />,
      action: "Explorar",
      completed: false,
    },
    {
      id: 4,
      title: "Receba sua Receita Digital",
      description: "Receita com assinatura eletrônica ANVISA-compliant, válida em farmácias",
      icon: <Check className="w-10 h-10 text-green-600" />,
      action: "Entender",
      completed: false,
    },
    {
      id: 5,
      title: "Compre no Marketplace",
      description: "Medicamentos com frete grátis, preços irresistíveis, entrega 24-48h",
      icon: <TrendingUp className="w-10 h-10 text-yellow-500" />,
      action: "Descobrir",
      completed: false,
    },
  ];

  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const progress = ((completedSteps.length + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 pt-8">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Planta & Raiz
            </h1>
            <p className="text-xl text-green-200">
              Democratizando o acesso a medicamentos à base de cannabis
            </p>
          </div>

          {/* Onboarding Card */}
          <Card className="bg-slate-800 border-green-600 overflow-hidden mb-8">
            {/* Step Indicator */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-green-100">
                  Passo {currentStep + 1} de {steps.length}
                </span>
                <span className="text-sm font-semibold text-green-100">
                  {Math.round(progress)}% Completo
                </span>
              </div>
              <div className="w-full bg-green-900 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-12 text-center">
              <div className="flex justify-center mb-8">
                {steps[currentStep].icon}
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                {steps[currentStep].title}
              </h2>

              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                {steps[currentStep].description}
              </p>

              {/* Features List */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-white">Telemedicina 24/7</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Consulte com especialistas de qualquer lugar
                    </p>
                  </div>

                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-white">Receita Digital</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Assinada digitalmente e ANVISA-compliant
                    </p>
                  </div>

                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-white">Frete Grátis</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Entrega 24-48h em todo Brasil
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Selection */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { label: "👨‍⚕️ Sou Paciente", desc: "Busco consultas e medicamentos" },
                    { label: "💊 Sou Especialista", desc: "Quero atender pacientes" },
                    { label: "🏥 Sou Farmácia", desc: "Vendo medicamentos" },
                    { label: "🌱 Sou Produtor", desc: "Produzo medicamentos" },
                  ].map((profile, idx) => (
                    <button
                      key={idx}
                      className="bg-slate-700 hover:bg-slate-600 p-6 rounded-lg transition-colors text-left"
                    >
                      <div className="font-semibold text-white mb-1">
                        {profile.label}
                      </div>
                      <div className="text-sm text-slate-400">
                        {profile.desc}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-slate-700 px-8 py-6 flex items-center justify-between gap-4">
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-white transition-colors font-medium"
              >
                Pular
              </button>

              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-600"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    Voltar
                  </Button>
                )}

                <Button
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2"
                  onClick={handleStepComplete}
                >
                  {steps[currentStep].action}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((step, idx) => (
                    <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-green-500 w-8'
                    : completedSteps.includes(idx)
                    ? 'bg-green-600'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-slate-300 text-sm">
            <div>
              <div className="font-semibold text-green-400 mb-1">100%</div>
              <div>Seguro e Criptografado</div>
            </div>
            <div>
              <div className="font-semibold text-green-400 mb-1">ANVISA</div>
              <div>Autorizado e Regulado</div>
            </div>
            <div>
              <div className="font-semibold text-green-400 mb-1">50K+</div>
              <div>Usuários Ativos</div>
            </div>
            <div>
              <div className="font-semibold text-green-400 mb-1">24/7</div>
              <div>Suporte Disponível</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
