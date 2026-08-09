/**
 * Página de Onboarding com Assinatura Obrigatória
 * 
 * Fluxo completo:
 * 1. Seleção de tipo de usuário (Médico/Lojista)
 * 2. Preenchimento de dados pessoais/profissionais
 * 3. Verificação de email
 * 4. Verificação de WhatsApp
 * 5. Visualização e assinatura de contrato
 * 6. Ativação de conta
 * 7. Acesso ao dashboard
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, AlertCircle, Loader, Zap } from 'lucide-react';
import ContractSignature from '@/components/ContractSignature';
import { openBrisaWhatsApp } from '@/lib/whatsapp-brisa';


type UserType = 'medico' | 'lojista' | null;
type OnboardingStep = 'type-selection' | 'personal-data' | 'email-verification' | 'whatsapp-verification' | 'contract-signature' | 'completion';

interface OnboardingState {
  currentStep: OnboardingStep;
  userType: UserType;
  personalData: {
    name: string;
    email: string;
    phone: string;
    cpf?: string;
    cnpj?: string;
    crm?: string;
    specialty?: string;
    company?: string;
    location?: string;
  };
  emailVerified: boolean;
  whatsappVerified: boolean;
  contractSigned: boolean;
  contractId?: string;
}

const ONBOARDING_STEPS: Record<OnboardingStep, { title: string; description: string; order: number }> = {
  'type-selection': {
    title: 'Escolha seu tipo de conta',
    description: 'Selecione se você é Médico ou Lojista',
    order: 1,
  },
  'personal-data': {
    title: 'Dados Pessoais',
    description: 'Preencha seus dados profissionais',
    order: 2,
  },
  'email-verification': {
    title: 'Verificação de Email',
    description: 'Confirme seu email',
    order: 3,
  },
  'whatsapp-verification': {
    title: 'Verificação de WhatsApp',
    description: 'Confirme seu WhatsApp',
    order: 4,
  },
  'contract-signature': {
    title: 'Contrato Digital',
    description: 'Assine o contrato de parceria',
    order: 5,
  },
  'completion': {
    title: 'Conta Ativada',
    description: 'Bem-vindo à Planta & Raiz',
    order: 6,
  },
};

export const OnboardingFlow: React.FC = () => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'type-selection',
    userType: null,
    personalData: {
      name: '',
      email: '',
      phone: '',
    },
    emailVerified: false,
    whatsappVerified: false,
    contractSigned: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [whatsappCode, setWhatsappCode] = useState('');

  // Passo 1: Seleção de tipo de usuário
  const handleTypeSelection = (type: UserType) => {
    setState((prev) => ({
      ...prev,
      userType: type,
      currentStep: 'personal-data',
    }));
  };

  // Passo 2: Preenchimento de dados pessoais
  const handlePersonalDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validar dados
      if (!state.personalData.name || !state.personalData.email || !state.personalData.phone) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Enviar para backend para validação
      const response = await fetch('/api/onboarding/validate-personal-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: state.userType,
          ...state.personalData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao validar dados');
      }

      // Enviar código de verificação por email
      await fetch('/api/onboarding/send-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.personalData.email }),
      });

      setState((prev) => ({
        ...prev,
        currentStep: 'email-verification',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 3: Verificação de email
  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.personalData.email,
          code: emailCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Código de verificação inválido');
      }

      setState((prev) => ({
        ...prev,
        emailVerified: true,
        currentStep: 'whatsapp-verification',
      }));

      // Enviar código de verificação por WhatsApp
      await fetch('/api/onboarding/send-whatsapp-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.personalData.phone }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar email');
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 4: Verificação de WhatsApp
  const handleWhatsappVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/verify-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: state.personalData.phone,
          code: whatsappCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Código de verificação inválido');
      }

      setState((prev) => ({
        ...prev,
        whatsappVerified: true,
        currentStep: 'contract-signature',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  // Passo 5: Assinatura de contrato
  const handleContractSignatureComplete = async (contractId: string) => {
    setState((prev) => ({
      ...prev,
      contractSigned: true,
      contractId,
      currentStep: 'completion',
    }));

    // Ativar conta no backend
    try {
      await fetch('/api/onboarding/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: state.userType,
          email: state.personalData.email,
          contractId,
        }),
      });
    } catch (err) {
      console.error('Erro ao ativar conta:', err);
    }
  };

  // Renderizar barra de progresso
  const renderProgressBar = () => {
    const steps = Object.entries(ONBOARDING_STEPS).sort((a, b) => a[1].order - b[1].order);
    const currentStepOrder = ONBOARDING_STEPS[state.currentStep].order;

    return (
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {steps.map(([stepKey, stepInfo]) => (
            <div
              key={stepKey}
              className={`flex-1 text-center ${
                stepInfo.order <= currentStepOrder ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold ${
                  stepInfo.order < currentStepOrder
                    ? 'bg-green-500 text-white'
                    : stepInfo.order === currentStepOrder
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {stepInfo.order < currentStepOrder ? '✓' : stepInfo.order}
              </div>
              <p className="text-xs font-semibold">{stepInfo.title}</p>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${(currentStepOrder / steps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  // Renderizar conteúdo do passo atual
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'type-selection':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Escolha seu tipo de conta</h2>

            <button
              onClick={() => handleTypeSelection('medico')}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="text-xl font-bold mb-2">👨‍⚕️ Médico</h3>
              <p className="text-gray-600">
                Plano Médico VIP (R$ 99/mês) - Receita 100%, sem taxa de saque
              </p>
            </button>

            <button
              onClick={() => handleTypeSelection('lojista')}
              className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
            >
              <h3 className="text-xl font-bold mb-2">💊 Lojista/Farmácia</h3>
              <p className="text-gray-600">
                Plano Lojista VIP (R$ 99/mês) - Taxa zero, destaque nas recomendações
              </p>
            </button>
          </div>
        );

      case 'personal-data':
        return (
          <form onSubmit={handlePersonalDataSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Dados Pessoais</h2>

            <div>
              <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
              <input
                type="text"
                value={state.personalData.name}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    personalData: { ...prev.personalData, name: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input
                type="email"
                value={state.personalData.email}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    personalData: { ...prev.personalData, email: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">WhatsApp (+55) *</label>
              <input
                type="tel"
                value={state.personalData.phone}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    personalData: { ...prev.personalData, phone: e.target.value },
                  }))
                }
                placeholder="11987654321"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {state.userType === 'medico' && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2">CPF *</label>
                  <input
                    type="text"
                    value={state.personalData.cpf || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        personalData: { ...prev.personalData, cpf: e.target.value },
                      }))
                    }
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">CRM *</label>
                  <input
                    type="text"
                    value={state.personalData.crm || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        personalData: { ...prev.personalData, crm: e.target.value },
                      }))
                    }
                    placeholder="123456"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Especialidade *</label>
                  <input
                    type="text"
                    value={state.personalData.specialty || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        personalData: { ...prev.personalData, specialty: e.target.value },
                      }))
                    }
                    placeholder="Cannabis Medicinal"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </>
            )}

            {state.userType === 'lojista' && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2">Razão Social *</label>
                  <input
                    type="text"
                    value={state.personalData.company || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        personalData: { ...prev.personalData, company: e.target.value },
                      }))
                    }
                    placeholder="Farmácia XYZ LTDA"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">CNPJ *</label>
                  <input
                    type="text"
                    value={state.personalData.cnpj || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        personalData: { ...prev.personalData, cnpj: e.target.value },
                      }))
                    }
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Localização *</label>
                  <input
                    type="text"
                    value={state.personalData.location || ''}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        personalData: { ...prev.personalData, location: e.target.value },
                      }))
                    }
                    placeholder="São Paulo, SP"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>
        );

      case 'email-verification':
        return (
          <form onSubmit={handleEmailVerification} className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Verificação de Email</h2>
            <p className="text-gray-600 mb-4">
              Enviamos um código de 6 dígitos para <strong>{state.personalData.email}</strong>
            </p>

            <div>
              <label className="block text-sm font-semibold mb-2">Código de Verificação *</label>
              <input
                type="text"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || emailCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Verificar Email
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>
        );

      case 'whatsapp-verification':
        return (
          <form onSubmit={handleWhatsappVerification} className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Verificação de WhatsApp</h2>
            <p className="text-gray-600 mb-4">
              Enviamos um código de 6 dígitos para <strong>{state.personalData.phone}</strong> via WhatsApp
            </p>

            <div>
              <label className="block text-sm font-semibold mb-2">Código de Verificação *</label>
              <input
                type="text"
                value={whatsappCode}
                onChange={(e) => setWhatsappCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || whatsappCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Verificar WhatsApp
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>
        );

      case 'contract-signature':
        return (
          <div>
            <ContractSignature
              userType={state.userType || 'medico'}
              userData={state.personalData}
              onSignatureComplete={handleContractSignatureComplete}
              onError={(error) => setError(error)}
            />
          </div>
        );

      case 'completion':
        return (
          <div className="text-center space-y-6">
            <CheckCircle size={64} className="mx-auto text-green-500" />
            <h2 className="text-3xl font-bold">Bem-vindo à Planta & Raiz!</h2>
            <p className="text-gray-600 text-lg">
              Sua conta foi ativada com sucesso. Você agora tem acesso completo à plataforma.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg space-y-3">
              <h3 className="font-bold text-lg">Próximos Passos:</h3>
              <ul className="text-left space-y-2 text-gray-700">
                <li>✓ Acesse seu dashboard personalizado</li>
                <li>✓ Configure seu perfil profissional</li>
                <li>✓ Comece a usar a plataforma</li>
                <li>✓ Entre em contato com suporte se precisar</li>
              </ul>
            </div>

            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Ir para Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Planta & Raiz</h1>
          <p className="text-gray-600">Mega Clínica Digital</p>
        </div>

        {/* 🚀 MODO URGÊNCIA BRISA — atalho de 1 clique para WhatsApp da Enfª Brisa */}
        <div className="mb-6 rounded-2xl border-2 border-green-500/40 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-lg shadow-green-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center animate-pulse">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-green-900 leading-tight">Quero falar AGORA com a Enfª Brisa</p>
              <p className="text-xs text-green-700">Atalho de 3 passos · sem cadastro completo · WhatsApp imediato</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                openBrisaWhatsApp({ section: 'onboarding-urgencia', consultationType: 'initial' });
              } catch {
                window.open('https://wa.me/5511991363154?text=' + encodeURIComponent('Olá Brisa, quero iniciar minha orientação técnica agora.'), '_blank', 'noopener,noreferrer');
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            FALAR COM BRISA AGORA
          </button>
          <p className="text-[11px] text-green-800/70 text-center mt-2">
            Prefere o cadastro completo (7 etapas)? Continue abaixo ⬇️
          </p>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}


        {/* Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Suporte 24/7: contato@plantayraiz.com.br | +55 11 99136-3154</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
