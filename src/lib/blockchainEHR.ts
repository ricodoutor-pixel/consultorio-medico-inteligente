/**
 * Blockchain EHR (Electronic Health Record) Simulator
 * 
 * Este módulo provê a camada de imutabilidade criptográfica e anonimização
 * para o compartilhamento de casos clínicos (Prontuários) na Biblioteca Científica.
 * 
 * Em um ambiente de produção real, o `generateClinicalBlockHash` submeteria
 * os dados anonimizados para um Smart Contract (ex: Ethereum, Polygon) ou IPFS,
 * e retornaria o Transaction ID (TxID).
 */

export interface ClinicalCaseData {
  diagnosisCid?: string;
  symptoms: string;
  prescribedStrain: string;
  dosage: string;
  evolutionNotes: string;
  patientAgeRange: string; // Ex: "30-40" (Anonimizado)
  patientGender: string;
}

export interface BlockchainRecord {
  txId: string;
  hash: string;
  timestamp: string;
  anonymizedData: ClinicalCaseData;
}

/**
 * Função utilitária para gerar um Hash SHA-256 (Simulado para o Frontend).
 * O ideal é rodar via WebCrypto API.
 */
async function generateSHA256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Pega os dados clínicos, limpa qualquer PII (Personally Identifiable Information)
 * e gera um registro "imutável" em Blockchain.
 */
export const generateClinicalBlockHash = async (
  rawCaseData: any,
  doctorCrm: string
): Promise<BlockchainRecord> => {
  // 1. Anonimização Forçada (HIPAA/LGPD Compliance)
  // Remover explícitamente name, cpf, rg, address, email.
  const anonymizedData: ClinicalCaseData = {
    diagnosisCid: rawCaseData.diagnosisCid || "Não especificado",
    symptoms: rawCaseData.symptoms || "Sintomas não detalhados",
    prescribedStrain: rawCaseData.prescribedStrain || "Óleo CBD Padrão",
    dosage: rawCaseData.dosage || "Uso contínuo",
    evolutionNotes: rawCaseData.evolutionNotes || "Evolução positiva relatada.",
    patientAgeRange: rawCaseData.ageRange || "Adulto",
    patientGender: rawCaseData.gender || "Não informado",
  };

  // 2. Criar a string de assinatura contendo os dados e o CRM do médico assinante
  const signaturePayload = JSON.stringify({
    data: anonymizedData,
    doctor: doctorCrm,
    timestamp: new Date().toISOString()
  });

  // 3. Gerar Hash SHA-256 do payload
  const hash = await generateSHA256(signaturePayload);

  // 4. Simular um Transaction ID (TxID) de rede Blockchain (ex: 0x...)
  const txId = `0x${hash.substring(0, 40)}`;

  // 5. Retornar o registro consolidado
  return {
    txId,
    hash,
    timestamp: new Date().toISOString(),
    anonymizedData
  };
};
