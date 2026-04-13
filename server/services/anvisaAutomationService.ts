/**
 * Estratégia 10: Automação de Burocracia Anvisa
 * Preenchimento e submissão automática de formulários Anvisa
 */

export interface AnvisaFormData {
  // Patient
  patientName: string;
  patientCPF: string;
  patientEmail: string;
  patientPhone: string;
  patientAddress?: string;

  // Doctor
  doctorName: string;
  doctorCRM: string;
  doctorCRMState: string;
  doctorSpecialty: string;

  // Prescription
  medicines: AnvisaMedicine[];
  medicalJustification: string;
  treatmentDuration: string;
  diagnosisCID?: string;
}

export interface AnvisaMedicine {
  name: string;
  activePrinciple: string;
  concentration: string;
  dosage: string;
  quantity: number;
  indication: string;
  supplier?: string;
}

export interface AnvisaSubmission {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  protocol?: string;
  status: 'preparing' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired';
  formData: AnvisaFormData;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedReason?: string;
  estimatedDays: number;
  createdAt: Date;
}

export function validateAnvisaForm(data: AnvisaFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.patientName || data.patientName.length < 3) errors.push('Nome do paciente inválido');
  if (!data.patientCPF || !isValidCPF(data.patientCPF)) errors.push('CPF do paciente inválido');
  if (!data.doctorCRM) errors.push('CRM do médico obrigatório');
  if (!data.medicines || data.medicines.length === 0) errors.push('Ao menos um medicamento obrigatório');
  if (!data.medicalJustification || data.medicalJustification.length < 50) errors.push('Justificativa médica muito curta (mínimo 50 caracteres)');
  if (!data.treatmentDuration) errors.push('Duração do tratamento obrigatória');

  for (const med of data.medicines) {
    if (!med.name) errors.push(`Medicamento sem nome`);
    if (!med.activePrinciple) errors.push(`${med.name}: princípio ativo obrigatório`);
    if (!med.concentration) errors.push(`${med.name}: concentração obrigatória`);
    if (med.quantity <= 0) errors.push(`${med.name}: quantidade inválida`);
  }

  return { valid: errors.length === 0, errors };
}

function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (parseInt(cleaned[9]) !== digit) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  return parseInt(cleaned[10]) === digit;
}

export function estimateApprovalDays(medicines: AnvisaMedicine[]): number {
  const hasTHC = medicines.some(m =>
    m.activePrinciple.toLowerCase().includes('thc') ||
    m.activePrinciple.toLowerCase().includes('tetra')
  );
  // THC products take longer (RDC 660)
  return hasTHC ? 15 : 7;
}

export function generateAnvisaProtocol(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ANV-${year}${month}-${random}`;
}

export function buildSubmission(
  consultationId: string,
  patientId: string,
  doctorId: string,
  formData: AnvisaFormData
): Omit<AnvisaSubmission, 'id'> {
  return {
    consultationId,
    patientId,
    doctorId,
    status: 'preparing',
    formData,
    estimatedDays: estimateApprovalDays(formData.medicines),
    createdAt: new Date(),
  };
}

export function getStatusLabel(status: AnvisaSubmission['status']): string {
  const labels: Record<AnvisaSubmission['status'], string> = {
    preparing: 'Preparando documentos',
    submitted: 'Submetido à Anvisa',
    under_review: 'Em análise pela Anvisa',
    approved: 'Aprovado ✅',
    rejected: 'Rejeitado ❌',
    expired: 'Expirado',
  };
  return labels[status];
}
