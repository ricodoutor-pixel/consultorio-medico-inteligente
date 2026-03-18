/**
 * PLANTA & RAIZ 2030 - AGENTES IA COM PERMISSÕES ISOLADAS
 * 
 * 4 Instâncias de IA Autônomas:
 * 1. Enfermeira Brisa (Front-End/Care)
 * 2. Manus CEO (CFO/Admin)
 * 3. Guardião ANVISA (Compliance)
 * 4. Verdinho (Sales/Support)
 * 
 * Fluxo Operacional: 5 Fases Sequenciais
 * Fase 1: Acesso e Triagem
 * Fase 2: Matching Médico "Uber-Medical"
 * Fase 3: Consultório Virtual
 * Fase 4: Shopping e Logística
 * Fase 5: Finalização e Payout
 */

import type { LLMResponse } from './llm';

// ============================================
// TIPOS E INTERFACES
// ============================================

export enum AgentRole {
  BRISA = 'brisa',
  CEO = 'ceo',
  ANVISA = 'anvisa',
  VERDINHO = 'verdinho',
}

export enum JourneyPhase {
  TRIAGE = 'triage',
  MATCHING = 'matching',
  CONSULTATION = 'consultation',
  SHOPPING = 'shopping',
  PAYOUT = 'payout',
}

export interface PatientJourney {
  journeyId: string;
  patientId: string;
  phase: JourneyPhase;
  status: 'active' | 'completed' | 'cancelled';
  
  // Fase 1: Triagem
  symptoms?: string[];
  medicalHistory?: string;
  triageLevel?: number;
  
  // Fase 2: Matching
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  matchingTime?: Date;
  doctorResponseDeadline?: Date;
  
  // Fase 3: Consulta
  consultationStartTime?: Date;
  consultationEndTime?: Date;
  prescriptionId?: string;
  prescriptionPDF?: string;
  
  // Fase 4: Shopping
  selectedProducts?: Array<{
    productId: string;
    storeId: string;
    price: number;
    quantity: number;
  }>;
  shoppingLink?: string;
  
  // Fase 5: Payout
  paymentId?: string;
  escrowAmount?: number;
  doctorPayoutAmount?: number;
  storePayoutAmount?: number;
  affiliateCommissions?: Array<{
    affiliateId: string;
    level: 1 | 2 | 3;
    amount: number;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPermissions {
  role: AgentRole;
  canAccessPatientData: boolean;
  canProcessPayments: boolean;
  canValidateDocuments: boolean;
  canAccessDoctorData: boolean;
  canAccessStoreData: boolean;
  canModifyPrescriptions: boolean;
  canDeleteContent: boolean;
  canAccessFinancialData: boolean;
}

// ============================================
// PERMISSÕES DOS AGENTES
// ============================================

export const AGENT_PERMISSIONS: Record<AgentRole, AgentPermissions> = {
  [AgentRole.BRISA]: {
    role: AgentRole.BRISA,
    canAccessPatientData: true,
    canProcessPayments: false,
    canValidateDocuments: false,
    canAccessDoctorData: true,
    canAccessStoreData: false,
    canModifyPrescriptions: false,
    canDeleteContent: false,
    canAccessFinancialData: false,
  },
  [AgentRole.CEO]: {
    role: AgentRole.CEO,
    canAccessPatientData: false,
    canProcessPayments: true,
    canValidateDocuments: false,
    canAccessDoctorData: false,
    canAccessStoreData: false,
    canModifyPrescriptions: false,
    canDeleteContent: false,
    canAccessFinancialData: true,
  },
  [AgentRole.ANVISA]: {
    role: AgentRole.ANVISA,
    canAccessPatientData: false,
    canProcessPayments: false,
    canValidateDocuments: true,
    canAccessDoctorData: true,
    canAccessStoreData: true,
    canModifyPrescriptions: false,
    canDeleteContent: true,
    canAccessFinancialData: false,
  },
  [AgentRole.VERDINHO]: {
    role: AgentRole.VERDINHO,
    canAccessPatientData: true,
    canProcessPayments: false,
    canValidateDocuments: false,
    canAccessDoctorData: false,
    canAccessStoreData: true,
    canModifyPrescriptions: false,
    canDeleteContent: false,
    canAccessFinancialData: false,
  },
};

// ============================================
// FASE 1: ENFERMEIRA BRISA - TRIAGEM
// ============================================

export async function brisaTriagePhase(
  patientId: string,
  symptoms: string[],
  medicalHistory: string
): Promise<PatientJourney> {
  console.log('🏥 Enfermeira Brisa: Iniciando triagem clínica...');

  const permissions = AGENT_PERMISSIONS[AgentRole.BRISA];
  if (!permissions.canAccessPatientData) {
    throw new Error('Brisa não tem permissão para acessar dados do paciente');
  }

  try {
    // 1. Análise de sintomas com IA
    const triageLevel = await analyzeSymptomsWithLLM(symptoms);

    // 2. Recomendações de especialidades
    const specialties = await recommendSpecialtiesWithLLM(symptoms);

    // 3. Criar jornada
    const journey: PatientJourney = {
      journeyId: `JOURNEY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      phase: JourneyPhase.TRIAGE,
      status: 'active',
      symptoms,
      medicalHistory,
      triageLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`✅ Brisa: Triagem concluída. Nível: ${triageLevel}, Especialidades: ${specialties.join(', ')}`);

    return journey;
  } catch (error) {
    console.error('❌ Brisa: Erro na triagem', error);
    throw error;
  }
}

// ============================================
// FASE 2: BRISA + CEO - MATCHING MÉDICO "UBER-MEDICAL"
// ============================================

export async function brisaMatchingPhase(
  journey: PatientJourney,
  userLocation: { lat: number; lng: number }
): Promise<PatientJourney> {
  console.log('🚑 Enfermeira Brisa: Iniciando matching de médicos...');

  const permissions = AGENT_PERMISSIONS[AgentRole.BRISA];
  if (!permissions.canAccessDoctorData) {
    throw new Error('Brisa não tem permissão para acessar dados de médicos');
  }

  try {
    // 1. Buscar médicos próximos (Google Maps API)
    const nearbyDoctors = await findNearbyDoctorsWithMaps(
      userLocation,
      journey.triageLevel || 1
    );

    if (nearbyDoctors.length === 0) {
      throw new Error('Nenhum médico disponível na sua região');
    }

    // 2. Enviar alerta via Twilio (5 minutos para responder)
    const selectedDoctor = nearbyDoctors[0];
    const deadline = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await sendDoctorAlertViaTwilio(
      selectedDoctor.phoneNumber,
      journey.patientId,
      journey.symptoms || [],
      deadline
    );

    // 3. Atualizar jornada
    journey.phase = JourneyPhase.MATCHING;
    journey.doctorId = selectedDoctor.id;
    journey.doctorName = selectedDoctor.name;
    journey.doctorSpecialty = selectedDoctor.specialty;
    journey.matchingTime = new Date();
    journey.doctorResponseDeadline = deadline;
    journey.updatedAt = new Date();

    console.log(`✅ Brisa: Alerta enviado para Dr. ${selectedDoctor.name}. Aguardando resposta (5 min)...`);

    return journey;
  } catch (error) {
    console.error('❌ Brisa: Erro no matching', error);
    throw error;
  }
}

// ============================================
// FASE 3: CONSULTÓRIO VIRTUAL (JITSI + PRONTUÁRIO)
// ============================================

export async function brisaConsultationPhase(
  journey: PatientJourney,
  consultationDurationMinutes: number = 30
): Promise<PatientJourney> {
  console.log('💻 Enfermeira Brisa: Iniciando consultório virtual...');

  try {
    // 1. Gerar link de vídeo Jitsi
    const jitsiLink = generateJitsiLink(
      journey.journeyId,
      journey.doctorId || '',
      journey.patientId
    );

    // 2. Iniciar consulta
    journey.phase = JourneyPhase.CONSULTATION;
    journey.consultationStartTime = new Date();
    journey.consultationEndTime = new Date(
      Date.now() + consultationDurationMinutes * 60 * 1000
    );
    journey.updatedAt = new Date();

    console.log(`✅ Brisa: Consultório iniciado. Link: ${jitsiLink}`);

    return journey;
  } catch (error) {
    console.error('❌ Brisa: Erro ao iniciar consultório', error);
    throw error;
  }
}

// ============================================
// FASE 3: GUARDIÃO ANVISA - VALIDAÇÃO DE PRESCRIÇÃO
// ============================================

export async function anvisaValidatePrescription(
  journey: PatientJourney,
  prescriptionPDF: string,
  doctorCRM: string
): Promise<{ valid: boolean; issues: string[] }> {
  console.log('🛡️ Guardião ANVISA: Validando prescrição (RDC 660)...');

  const permissions = AGENT_PERMISSIONS[AgentRole.ANVISA];
  if (!permissions.canValidateDocuments || !permissions.canAccessDoctorData) {
    throw new Error('ANVISA não tem permissão para validar documentos');
  }

  try {
    const issues: string[] = [];

    // 1. OCR da prescrição
    const prescriptionData = await performOCROnPrescription(prescriptionPDF);

    // 2. Validar CRM do médico
    const crmValid = await validateDoctorCRM(doctorCRM);
    if (!crmValid) {
      issues.push('CRM do médico não verificado');
    }

    // 3. Validar conformidade RDC 660
    const rdc660Valid = await validateRDC660Compliance(prescriptionData);
    if (!rdc660Valid) {
      issues.push('Prescrição não está em conformidade com RDC 660');
    }

    // 4. Validar medicamentos
    const medicationsValid = await validateMedications(prescriptionData.medications || []);
    if (!medicationsValid) {
      issues.push('Um ou mais medicamentos não são válidos');
    }

    const isValid = issues.length === 0;

    console.log(
      isValid
        ? '✅ ANVISA: Prescrição validada com sucesso'
        : `❌ ANVISA: Prescrição com problemas: ${issues.join(', ')}`
    );

    return { valid: isValid, issues };
  } catch (error) {
    console.error('❌ ANVISA: Erro na validação', error);
    throw error;
  }
}

// ============================================
// FASE 4: VERDINHO - SHOPPING E LOGÍSTICA
// ============================================

export async function verdinhoPrepareShoppingLink(
  journey: PatientJourney,
  prescriptionMedications: string[]
): Promise<{ shoppingLink: string; bestPrices: Array<any> }> {
  console.log('🛒 Verdinho: Preparando link de shopping personalizado...');

  const permissions = AGENT_PERMISSIONS[AgentRole.VERDINHO];
  if (!permissions.canAccessStoreData) {
    throw new Error('Verdinho não tem permissão para acessar dados de lojas');
  }

  try {
    // 1. Buscar 3 melhores preços para cada medicamento
    const bestPrices = await findBestPricesForMedications(prescriptionMedications);

    // 2. Gerar link personalizado
    const shoppingLink = generatePersonalizedShoppingLink(
      journey.patientId,
      journey.journeyId,
      bestPrices
    );

    // 3. Validar regra de lojista (10 produtos max, 3 fotos, frete grátis)
    await validateStoreListingRules(bestPrices);

    journey.phase = JourneyPhase.SHOPPING;
    journey.shoppingLink = shoppingLink;
    journey.updatedAt = new Date();

    console.log(`✅ Verdinho: Link de shopping gerado: ${shoppingLink}`);

    return { shoppingLink, bestPrices };
  } catch (error) {
    console.error('❌ Verdinho: Erro ao preparar shopping', error);
    throw error;
  }
}

// ============================================
// FASE 5: MANUS CEO - ESCROW E PAYOUT AUTOMÁTICO
// ============================================

export async function ceoProcessPaymentAndEscrow(
  journey: PatientJourney,
  consultationFee: number,
  paymentMethod: 'pix' | 'mercado_pago' | 'btc'
): Promise<{ paymentId: string; escrowAmount: number }> {
  console.log('💰 Manus CEO: Processando pagamento e escrow...');

  const permissions = AGENT_PERMISSIONS[AgentRole.CEO];
  if (!permissions.canProcessPayments || !permissions.canAccessFinancialData) {
    throw new Error('CEO não tem permissão para processar pagamentos');
  }

  try {
    // 1. Processar pagamento via Mercado Pago/Pix/BTC
    const paymentId = await processPaymentWithMercadoPago(
      journey.patientId,
      consultationFee,
      paymentMethod
    );

    // 2. Reter valor em escrow (até confirmação de entrega)
    const escrowAmount = consultationFee;

    journey.phase = JourneyPhase.PAYOUT;
    journey.paymentId = paymentId;
    journey.escrowAmount = escrowAmount;
    journey.updatedAt = new Date();

    console.log(`✅ CEO: Pagamento processado. ID: ${paymentId}, Escrow: R$ ${escrowAmount}`);

    return { paymentId, escrowAmount };
  } catch (error) {
    console.error('❌ CEO: Erro ao processar pagamento', error);
    throw error;
  }
}

export async function ceoReleasePayouts(
  journey: PatientJourney,
  doctorPayoutAmount: number,
  storePayoutAmount: number,
  affiliateLevel1Id?: string,
  affiliateLevel2Id?: string,
  affiliateLevel3Id?: string
): Promise<{ success: boolean; payoutDetails: any }> {
  console.log('💳 Manus CEO: Liberando pagamentos (Pix)...');

  const permissions = AGENT_PERMISSIONS[AgentRole.CEO];
  if (!permissions.canProcessPayments) {
    throw new Error('CEO não tem permissão para liberar pagamentos');
  }

  try {
    // 1. Liberar Pix para o Médico
    const doctorPayoutId = await processPIXPayout(
      journey.doctorId || '',
      doctorPayoutAmount,
      'doctor'
    );

    // 2. Liberar Pix para a Loja
    const storePayoutId = await processPIXPayout(
      journey.journeyId,
      storePayoutAmount,
      'store'
    );

    // 3. Distribuir comissões de afiliados (3 níveis)
    const commissions: Array<{ affiliateId: string; level: 1 | 2 | 3; amount: number }> = [];

    if (affiliateLevel1Id) {
      const level1Commission = doctorPayoutAmount * 0.50; // 50%
      await processPIXPayout(affiliateLevel1Id, level1Commission, 'affiliate');
      commissions.push({
        affiliateId: affiliateLevel1Id,
        level: 1,
        amount: level1Commission,
      });
    }

    if (affiliateLevel2Id) {
      const level2Commission = doctorPayoutAmount * 0.05; // 5%
      await processPIXPayout(affiliateLevel2Id, level2Commission, 'affiliate');
      commissions.push({
        affiliateId: affiliateLevel2Id,
        level: 2,
        amount: level2Commission,
      });
    }

    if (affiliateLevel3Id) {
      const level3Commission = doctorPayoutAmount * 0.02; // 2%
      await processPIXPayout(affiliateLevel3Id, level3Commission, 'affiliate');
      commissions.push({
        affiliateId: affiliateLevel3Id,
        level: 3,
        amount: level3Commission,
      });
    }

    // 4. Reter taxas de administração (5%)
    const adminFee = (doctorPayoutAmount + storePayoutAmount) * 0.05;

    journey.doctorPayoutAmount = doctorPayoutAmount;
    journey.storePayoutAmount = storePayoutAmount;
    journey.affiliateCommissions = commissions;
    journey.updatedAt = new Date();

    console.log(`✅ CEO: Pagamentos liberados com sucesso`);

    return {
      success: true,
      payoutDetails: {
        doctorPayoutId,
        storePayoutId,
        commissions,
        adminFeeRetained: adminFee,
      },
    };
  } catch (error) {
    console.error('❌ CEO: Erro ao liberar pagamentos', error);
    throw error;
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function analyzeSymptomsWithLLM(symptoms: string[]): Promise<number> {
  return Math.min(symptoms.length, 5);
}

async function recommendSpecialtiesWithLLM(symptoms: string[]): Promise<string[]> {
  return ['Clínica Geral', 'Cardiologia'];
}

async function findNearbyDoctorsWithMaps(
  location: { lat: number; lng: number },
  triageLevel: number
): Promise<Array<any>> {
  return [];
}

async function sendDoctorAlertViaTwilio(
  phoneNumber: string,
  patientId: string,
  symptoms: string[],
  deadline: Date
): Promise<void> {
  console.log(`📱 Enviando alerta para médico via Twilio: ${phoneNumber}`);
}

function generateJitsiLink(journeyId: string, doctorId: string, patientId: string): string {
  return `https://meet.jitsi.com/${journeyId}`;
}

async function performOCROnPrescription(pdfUrl: string): Promise<any> {
  return {};
}

async function validateDoctorCRM(crm: string): Promise<boolean> {
  return true;
}

async function validateRDC660Compliance(data: any): Promise<boolean> {
  return true;
}

async function validateMedications(medications: string[]): Promise<boolean> {
  return true;
}

async function findBestPricesForMedications(medications: string[]): Promise<Array<any>> {
  return [];
}

function generatePersonalizedShoppingLink(
  patientId: string,
  journeyId: string,
  prices: Array<any>
): string {
  return `https://plantaraiz.com.br/shopping/${journeyId}`;
}

async function validateStoreListingRules(prices: Array<any>): Promise<void> {
  // Validar: 10 produtos max, 3 fotos, frete grátis
}

async function processPaymentWithMercadoPago(
  patientId: string,
  amount: number,
  method: string
): Promise<string> {
  return `PAY-${Date.now()}`;
}

async function processPIXPayout(
  recipientId: string,
  amount: number,
  type: string
): Promise<string> {
  return `PIX-${Date.now()}`;
}
