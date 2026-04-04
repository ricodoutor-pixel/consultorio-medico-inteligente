/**
 * VALIDADOR RDC 660 - ANVISA
 * Validação de Receitas Médicas para Cannabis Medicinal
 * Plantayraiz.com.br
 */

import { invokeLLM } from '../_core/llm';
import { storagePut, storageGet } from '../storage';

interface ReceiptValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  extractedData: {
    physicianName?: string;
    physicianCRM?: string;
    physicianRQE?: string;
    patientName?: string;
    patientCPF?: string;
    patientAge?: number;
    medications?: Array<{
      name: string;
      dosage: string;
      quantity: number;
      frequency: string;
    }>;
    diagnosis?: string;
    cid10?: string;
    date?: string;
    signature?: boolean;
  };
  confidence: number;
  timestamp: string;
}

/**
 * Validar receita usando OCR e IA
 */
export async function validateReceiptRDC660(
  receiptImageUrl: string,
  physicianCRM: string,
  patientCPF: string
): Promise<ReceiptValidation> {
  const validation: ReceiptValidation = {
    isValid: false,
    errors: [],
    warnings: [],
    extractedData: {},
    confidence: 0,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Extrair texto da imagem usando IA
    const extractedText = await extractTextFromReceipt(receiptImageUrl);

    // 2. Analisar estrutura da receita
    const structureAnalysis = analyzeReceiptStructure(extractedText);

    if (!structureAnalysis.isValid) {
      validation.errors.push(...structureAnalysis.errors);
      return validation;
    }

    // 3. Validar dados obrigatórios
    const dataValidation = validateRequiredData(extractedText, physicianCRM, patientCPF);

    if (!dataValidation.isValid) {
      validation.errors.push(...dataValidation.errors);
      validation.warnings.push(...dataValidation.warnings);
      return validation;
    }

    // 4. Extrair dados estruturados
    validation.extractedData = extractStructuredData(extractedText);

    // 5. Validar CRM do médico
    const crmValidation = await validatePhysicianCRM(physicianCRM, validation.extractedData.physicianCRM);

    if (!crmValidation.isValid) {
      validation.errors.push(...crmValidation.errors);
      return validation;
    }

    // 6. Validar CID-10
    const cidValidation = validateCID10(validation.extractedData.cid10);

    if (!cidValidation.isValid) {
      validation.errors.push(...cidValidation.errors);
    } else {
      validation.warnings.push(...cidValidation.warnings);
    }

    // 7. Validar medicamentos
    const medicationValidation = validateMedications(validation.extractedData.medications);

    if (!medicationValidation.isValid) {
      validation.errors.push(...medicationValidation.errors);
    } else {
      validation.warnings.push(...medicationValidation.warnings);
    }

    // 8. Calcular confiança
    validation.confidence = calculateConfidence(validation);

    // 9. Determinar validade final
    validation.isValid = validation.errors.length === 0 && validation.confidence >= 0.85;

    return validation;
  } catch (error) {
    validation.errors.push(`Erro ao processar receita: ${error.message}`);
    return validation;
  }
}

/**
 * Extrair texto da imagem usando OCR/IA
 */
async function extractTextFromReceipt(imageUrl: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em OCR médico. Extraia TODO o texto visível da receita médica, mantendo a estrutura e formatação.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Extraia todo o texto desta receita médica. Inclua nomes, datas, medicamentos, dosagens, assinaturas e qualquer outro texto visível.',
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`Falha ao extrair texto: ${error.message}`);
  }
}

/**
 * Analisar estrutura da receita
 */
function analyzeReceiptStructure(text: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar se tem cabeçalho médico
  if (!text.match(/CRM|CREMESP|Médico|Dr\.|Dra\./i)) {
    errors.push('Receita não contém identificação de médico');
  }

  // Verificar se tem data
  if (!text.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/)) {
    errors.push('Receita não contém data');
  }

  // Verificar se tem medicamentos
  if (!text.match(/medicamento|prescrição|Rx|mg|ml|comprimido|cápsula/i)) {
    errors.push('Receita não contém informações de medicamentos');
  }

  // Verificar se tem assinatura
  if (!text.match(/assinatura|rubrica|_____|_______|signature/i)) {
    errors.push('Receita não contém assinatura do médico');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validar dados obrigatórios
 */
function validateRequiredData(
  text: string,
  expectedCRM: string,
  expectedCPF: string
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar CRM
  if (!text.includes(expectedCRM)) {
    warnings.push(`CRM ${expectedCRM} não encontrado na receita`);
  }

  // Validar CPF do paciente
  const cpfPattern = expectedCPF.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (!text.includes(cpfPattern) && !text.includes(expectedCPF.replace(/\D/g, ''))) {
    warnings.push('CPF do paciente não encontrado na receita');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extrair dados estruturados
 */
function extractStructuredData(text: string): any {
  const data: any = {};

  // Extrair nome do médico
  const physicianMatch = text.match(/(?:Dr\.|Dra\.|Médico:?)\s+([A-Za-z\s]+)/i);
  if (physicianMatch) {
    data.physicianName = physicianMatch[1].trim();
  }

  // Extrair CRM
  const crmMatch = text.match(/CRM\s*:?\s*(\d+)/i);
  if (crmMatch) {
    data.physicianCRM = crmMatch[1];
  }

  // Extrair RQE
  const rqeMatch = text.match(/RQE\s*:?\s*(\d+)/i);
  if (rqeMatch) {
    data.physicianRQE = rqeMatch[1];
  }

  // Extrair nome do paciente
  const patientMatch = text.match(/(?:Paciente|Patient|Nome:?)\s+([A-Za-z\s]+)/i);
  if (patientMatch) {
    data.patientName = patientMatch[1].trim();
  }

  // Extrair CPF
  const cpfMatch = text.match(/CPF\s*:?\s*(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})/i);
  if (cpfMatch) {
    data.patientCPF = cpfMatch[1];
  }

  // Extrair CID-10
  const cidMatch = text.match(/CID(?:-10)?:?\s*([A-Z]\d{2}(?:\.\d+)?)/i);
  if (cidMatch) {
    data.cid10 = cidMatch[1];
  }

  // Extrair data
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    data.date = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
  }

  // Extrair medicamentos
  data.medications = extractMedications(text);

  return data;
}

/**
 * Extrair medicamentos
 */
function extractMedications(text: string): any[] {
  const medications: any[] = [];

  // Padrão: Nome do medicamento, dosagem, quantidade, frequência
  const medPattern = /([A-Za-z\s]+?)\s+(\d+\s*(?:mg|ml|%))\s+(?:x\s*)?(\d+)\s+(?:comprimidos?|cápsulas?|ml)\s*(?:,?\s*)?(\d+x\s*(?:ao dia|por dia|diariamente))?/gi;

  let match;
  while ((match = medPattern.exec(text)) !== null) {
    medications.push({
      name: match[1].trim(),
      dosage: match[2],
      quantity: parseInt(match[3]),
      frequency: match[4] || 'Conforme prescrito',
    });
  }

  return medications;
}

/**
 * Validar CRM do médico
 */
async function validatePhysicianCRM(
  expectedCRM: string,
  extractedCRM?: string
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (extractedCRM && extractedCRM !== expectedCRM) {
    errors.push(`CRM na receita (${extractedCRM}) não corresponde ao CRM esperado (${expectedCRM})`);
  }

  // Aqui você poderia fazer uma chamada para validar o CRM no banco de dados do CFM
  // const crmValid = await validateCRMWithCFM(expectedCRM);
  // if (!crmValid) {
  //   errors.push(`CRM ${expectedCRM} não encontrado no registro do CFM`);
  // }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validar CID-10
 */
function validateCID10(cid?: string): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cid) {
    errors.push('CID-10 não encontrado na receita');
    return { isValid: false, errors, warnings };
  }

  // Validar formato CID-10
  if (!cid.match(/^[A-Z]\d{2}(?:\.\d+)?$/)) {
    errors.push(`Formato de CID-10 inválido: ${cid}`);
  }

  // Verificar se é CID válido para cannabis medicinal
  const validCIDsForCannabis = [
    'G89', // Dor
    'F41', // Ansiedade
    'F32', // Depressão
    'G47', // Distúrbios do sono
    'G43', // Enxaqueca
    'M79', // Dor muscular
  ];

  const cidPrefix = cid.substring(0, 3);
  if (!validCIDsForCannabis.includes(cidPrefix)) {
    warnings.push(`CID-10 ${cid} pode não ser indicação típica para cannabis medicinal`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validar medicamentos
 */
function validateMedications(
  medications?: any[]
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!medications || medications.length === 0) {
    errors.push('Nenhum medicamento encontrado na receita');
    return { isValid: false, errors, warnings };
  }

  // Validar cada medicamento
  for (const med of medications) {
    if (!med.name) {
      errors.push('Medicamento sem nome identificado');
    }

    if (!med.dosage) {
      errors.push(`Medicamento ${med.name} sem dosagem especificada`);
    }

    if (!med.quantity || med.quantity <= 0) {
      errors.push(`Medicamento ${med.name} com quantidade inválida`);
    }

    // Avisar se medicamento é controlado
    if (med.name.toLowerCase().includes('cannabis') || med.name.toLowerCase().includes('cbd')) {
      warnings.push(`Medicamento controlado: ${med.name} - Requer validação adicional`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calcular confiança da validação
 */
function calculateConfidence(validation: ReceiptValidation): number {
  let confidence = 1.0;

  // Reduzir confiança por erros
  confidence -= validation.errors.length * 0.2;

  // Reduzir confiança por avisos
  confidence -= validation.warnings.length * 0.05;

  // Reduzir confiança se faltam dados
  const requiredFields = ['physicianName', 'physicianCRM', 'patientName', 'cid10', 'medications'];
  const missingFields = requiredFields.filter((field) => !validation.extractedData[field]);
  confidence -= missingFields.length * 0.1;

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Armazenar validação no banco de dados
 */
export async function storeReceiptValidation(
  userId: string,
  validation: ReceiptValidation,
  receiptImageUrl: string
): Promise<string> {
  const validationId = `VAL_${Date.now()}`;

  const validationData = {
    id: validationId,
    userId,
    validation,
    receiptImageUrl,
    createdAt: new Date().toISOString(),
  };

  // Armazenar em S3
  const key = `receipts/validations/${userId}/${validationId}.json`;
  const { url } = await storagePut(key, JSON.stringify(validationData), 'application/json');

  return validationId;
}

/**
 * Recuperar validação
 */
export async function getReceiptValidation(validationId: string): Promise<ReceiptValidation | null> {
  try {
    const key = `receipts/validations/*/${validationId}.json`;
    // Aqui você faria uma busca no S3
    // const { url } = await storageGet(key);
    // const response = await fetch(url);
    // return response.json();
    return null;
  } catch (error) {
    console.error('Erro ao recuperar validação:', error);
    return null;
  }
}
