/**
 * Componente ContractSignature
 * 
 * Responsável por:
 * - Exibir contrato para leitura
 * - Gerar contrato personalizado
 * - Enviar para assinatura via Clicksign
 * - Rastrear status de assinatura
 * - Ativar conta após assinatura
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Loader } from 'lucide-react';

interface ContractSignatureProps {
  userType: 'medico' | 'lojista';
  userData: {
    name: string;
    email: string;
    cpf?: string;
    cnpj?: string;
    crm?: string;
    specialty?: string;
    phone: string;
    company?: string;
    location?: string;
  };
  onSignatureComplete: (contractId: string) => void;
  onError: (error: string) => void;
}

type SignatureStatus = 'pending' | 'loading' | 'signed' | 'error' | 'expired';

interface ContractData {
  id: string;
  type: 'medico' | 'lojista';
  status: SignatureStatus;
  signatureUrl?: string;
  signedAt?: Date;
  error?: string;
}

export const ContractSignature: React.FC<ContractSignatureProps> = ({
  userType,
  userData,
  onSignatureComplete,
  onError,
}) => {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Gerar e enviar contrato para assinatura
  const handleGenerateContract = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: userType,
          ...userData,
        }),
      });

      if (!response.ok) throw new Error('Erro ao gerar contrato');

      const data = await response.json();
      setContract({
        id: data.contractId,
        type: userType,
        status: 'loading',
        signatureUrl: data.signatureUrl,
      });

      // Abrir Clicksign em nova aba
      if (data.signatureUrl) {
        window.open(data.signatureUrl, '_blank');
      }

      // Iniciar polling para verificar assinatura
      startPolling(data.contractId);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setContract({
        id: '',
        type: userType,
        status: 'error',
        error: errorMsg,
      });
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling para verificar status de assinatura
  const startPolling = (contractId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/contracts/status/${contractId}`);
        if (!response.ok) throw new Error('Erro ao verificar status');

        const data = await response.json();

        if (data.status === 'signed') {
          setContract((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'signed',
                  signedAt: new Date(),
                }
              : null
          );
          clearInterval(interval);
          setPollInterval(null);
          onSignatureComplete(contractId);
        } else if (data.status === 'rejected') {
          setContract((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'error',
                  error: 'Assinatura rejeitada',
                }
              : null
          );
          clearInterval(interval);
          setPollInterval(null);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos

    setPollInterval(interval);
  };

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Renderizar status da assinatura
  const renderStatus = () => {
    if (!contract) return null;

    switch (contract.status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={20} />
            <span>Aguardando assinatura...</span>
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center gap-2 text-blue-500">
            <Loader size={20} className="animate-spin" />
            <span>Abrindo Clicksign...</span>
          </div>
        );
      case 'signed':
        return (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle size={20} />
            <span>Contrato assinado com sucesso!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span>{contract.error}</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Renderizar preview do contrato
  const renderPreview = () => {
    const contractType = userType === 'medico' ? 'MÉDICO' : 'LOJISTA';
    
    return (
      <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
        <h3 className="font-bold mb-4">CONTRATO DIGITAL DE PARCERIA - {contractType}</h3>
        
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <strong>Plataforma:</strong> Planta & Raiz — Mega Clínica Digital
          </div>
          
          <div>
            <strong>Dados do {userType === 'medico' ? 'Médico' : 'Lojista'}:</strong>
            <ul className="ml-4 mt-2">
              <li>Nome: {userData.name}</li>
              <li>Email: {userData.email}</li>
              <li>Telefone: {userData.phone}</li>
              {userType === 'medico' && userData.crm && (
                <li>CRM: {userData.crm}</li>
              )}
              {userType === 'lojista' && userData.cnpj && (
                <li>CNPJ: {userData.cnpj}</li>
              )}
            </ul>
          </div>

          <div>
            <strong>Objeto do Contrato:</strong>
            <p className="mt-2">
              {userType === 'medico'
                ? 'O MÉDICO aceita atuar na plataforma Planta & Raiz sob gestão 100% via Inteligência Artificial.'
                : 'O LOJISTA aceita fornecer medicamentos na plataforma Planta & Raiz sob gestão 100% via Inteligência Artificial.'}
            </p>
          </div>

          <div>
            <strong>Agentes IA:</strong>
            <ul className="ml-4 mt-2">
              <li>✓ Enfermeira Brisa - Triagem e matching</li>
              <li>✓ Manus CEO - Gestão financeira</li>
              <li>✓ Guardião ANVISA - Auditoria</li>
              <li>✓ Verdinho - Suporte</li>
            </ul>
          </div>

          <div>
            <strong>Plano:</strong>
            {userType === 'medico' ? (
              <p className="mt-2">Médico VIP (R$ 99/mês) - Receita 100%, sem taxa de saque</p>
            ) : (
              <p className="mt-2">Lojista Pro (R$ 49/mês) - Taxa zero, destaque nas recomendações</p>
            )}
          </div>

          <div>
            <strong>Conformidade:</strong>
            <ul className="ml-4 mt-2">
              <li>✓ CFM / ANVISA / LGPD</li>
              <li>✓ Assinatura digital via Clicksign</li>
              <li>✓ Validade jurídica conforme Lei 14.063/2020</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <FileText size={28} className="text-blue-600" />
        <h2 className="text-2xl font-bold">Contrato Digital de Parceria</h2>
      </div>

      {/* Informações sobre o contrato */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Importante:</strong> Este contrato estabelece os termos para sua participação na plataforma Planta & Raiz sob gestão 100% via Inteligência Artificial. Ao assinar, você aceita a autonomia dos Agentes IA (Brisa, CEO, ANVISA, Verdinho) para gerenciar suas operações.
        </p>
      </div>

      {/* Preview do contrato */}
      {!contract && (
        <div className="mb-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
          >
            {showPreview ? '▼' : '▶'} Visualizar Contrato
          </button>
          {showPreview && renderPreview()}
        </div>
      )}

      {/* Checkbox de aceitação */}
      {!contract && (
        <div className="mb-6 flex items-start gap-3">
          <input
            type="checkbox"
            id="accept"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="accept" className="text-sm text-gray-700">
            Eu li e aceito todos os termos do contrato, incluindo a gestão 100% via Inteligência Artificial pelos Agentes IA (Enfermeira Brisa, Manus CEO, Guardião ANVISA e Verdinho).
          </label>
        </div>
      )}

      {/* Status da assinatura */}
      {contract && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          {renderStatus()}
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3">
        {!contract ? (
          <>
            <button
              onClick={handleGenerateContract}
              disabled={!accepted || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={20} className="animate-spin" />
                  Gerando contrato...
                </span>
              ) : (
                'Assinar Contrato Digitalmente'
              )}
            </button>
          </>
        ) : contract.status === 'signed' ? (
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Continuar
          </button>
        ) : contract.status === 'error' ? (
          <button
            onClick={() => setContract(null)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Tentar Novamente
          </button>
        ) : (
          <button
            onClick={() => {
              if (contract.signatureUrl) {
                window.open(contract.signatureUrl, '_blank');
              }
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Abrir Clicksign
          </button>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 text-xs text-gray-500 border-t pt-4">
        <p>
          <strong>Segurança:</strong> Este contrato é assinado digitalmente via Clicksign, com validade jurídica conforme Lei 14.063/2020. Todos os dados são criptografados e protegidos conforme LGPD.
        </p>
      </div>
    </div>
  );
};

export default ContractSignature;
