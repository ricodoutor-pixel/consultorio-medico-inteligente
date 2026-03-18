/**
 * Clicksign Integration Service
 * Handles digital document signatures and consent forms
 * 
 * Environment Variables Required:
 * - CLICKSIGN_API_KEY: API key for Clicksign (server-side only)
 * - CLICKSIGN_SANDBOX_MODE: true for testing, false for production
 */

interface SignerData {
  name: string;
  email: string;
  phone: string;
}

interface DocumentData {
  name: string;
  content: string | Buffer;
  signers: SignerData[];
  templateType?: 'consent' | 'contract' | 'receipt' | 'other';
}

interface DocumentResponse {
  success: boolean;
  documentId?: string;
  status?: string;
  message: string;
  signingUrl?: string;
  createdAt?: string;
}

interface SignatureData {
  documentId: string;
  signerId: string;
  signature: string;
  timestamp: string;
}

interface SignatureResponse {
  success: boolean;
  signatureId?: string;
  status?: string;
  message: string;
  signedAt?: string;
}

interface DocumentStatusResponse {
  success: boolean;
  status?: string;
  signers?: Array<{
    name: string;
    email: string;
    signed: boolean;
    signedAt?: string;
  }>;
  message: string;
  completedAt?: string;
}

/**
 * Create a document for signature
 */
export async function createDocument(data: DocumentData): Promise<DocumentResponse> {
  try {
    const response = await fetch('/api/clicksign/documents/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        content: typeof data.content === 'string' 
          ? data.content 
          : data.content.toString('base64'),
        signers: data.signers,
        templateType: data.templateType || 'other',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Document creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      documentId: result.documentId,
      status: result.status,
      message: 'Document created successfully',
      signingUrl: result.signingUrl,
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error('[Clicksign] Document creation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create document',
    };
  }
}

/**
 * Send document for signature
 */
export async function sendDocumentForSignature(documentId: string): Promise<DocumentResponse> {
  try {
    const response = await fetch(`/api/clicksign/documents/${documentId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Send document failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      documentId: result.documentId,
      status: result.status,
      message: 'Document sent for signature',
    };
  } catch (error) {
    console.error('[Clicksign] Send document error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send document',
    };
  }
}

/**
 * Get document status
 */
export async function getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
  try {
    const response = await fetch(`/api/clicksign/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get document status: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      status: result.status,
      signers: result.signers,
      message: 'Document status retrieved successfully',
      completedAt: result.completedAt,
    };
  } catch (error) {
    console.error('[Clicksign] Get document status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get document status',
    };
  }
}

/**
 * Download signed document
 */
export async function downloadSignedDocument(documentId: string): Promise<{
  success: boolean;
  downloadUrl?: string;
  message: string;
}> {
  try {
    const response = await fetch(`/api/clicksign/documents/${documentId}/download`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      downloadUrl: result.downloadUrl,
      message: 'Document download link generated',
    };
  } catch (error) {
    console.error('[Clicksign] Download document error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download document',
    };
  }
}

/**
 * Create consent form for medical consultation
 */
export async function createMedicalConsentForm(data: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorEmail: string;
  doctorPhone: string;
  consultationDate: string;
  specialty: string;
  procedures: string[];
}): Promise<DocumentResponse> {
  const consentContent = `
TERMO DE CONSENTIMENTO INFORMADO

Paciente: ${data.patientName}
Médico: ${data.doctorName}
Especialidade: ${data.specialty}
Data da Consulta: ${data.consultationDate}

PROCEDIMENTOS AUTORIZADOS:
${data.procedures.map((p) => `- ${p}`).join('\n')}

Eu, ${data.patientName}, declaro que:

1. Fui informado(a) sobre meu diagnóstico e as opções de tratamento disponíveis;
2. Entendo os riscos e benefícios dos procedimentos acima descritos;
3. Autorizo o Dr(a). ${data.doctorName} a realizar os procedimentos descritos;
4. Autorizo a gravação e armazenamento de dados médicos conforme LGPD;
5. Consinto com o processamento de meus dados pessoais para fins de tratamento;

Data: ${new Date().toLocaleDateString('pt-BR')}

Assinado digitalmente por:
${data.patientName}
${data.patientEmail}
${data.patientPhone}
  `;

  return createDocument({
    name: `Termo_Consentimento_${data.patientName}_${Date.now()}.pdf`,
    content: consentContent,
    signers: [
      {
        name: data.patientName,
        email: data.patientEmail,
        phone: data.patientPhone,
      },
      {
        name: data.doctorName,
        email: data.doctorEmail,
        phone: data.doctorPhone,
      },
    ],
    templateType: 'consent',
  });
}

/**
 * Create prescription form
 */
export async function createPrescriptionForm(data: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorCRM: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes: string;
}): Promise<DocumentResponse> {
  const prescriptionContent = `
PRESCRIÇÃO MÉDICA

Paciente: ${data.patientName}
Médico: ${data.doctorName}
CRM: ${data.doctorCRM}
Data: ${new Date().toLocaleDateString('pt-BR')}

MEDICAMENTOS PRESCRITOS:
${data.medications
  .map(
    (m) =>
      `
- ${m.name}
  Dosagem: ${m.dosage}
  Frequência: ${m.frequency}
  Duração: ${m.duration}
`
  )
  .join('\n')}

OBSERVAÇÕES:
${data.notes}

Esta prescrição é válida por 30 dias.

Assinado digitalmente por:
${data.doctorName}
CRM: ${data.doctorCRM}
  `;

  return createDocument({
    name: `Prescricao_${data.patientName}_${Date.now()}.pdf`,
    content: prescriptionContent,
    signers: [
      {
        name: data.doctorName,
        email: data.patientEmail,
        phone: data.patientPhone,
      },
    ],
    templateType: 'receipt',
  });
}

/**
 * Create affiliate agreement
 */
export async function createAffiliateAgreement(data: {
  affiliateName: string;
  affiliateEmail: string;
  affiliatePhone: string;
  commissionLevel: 1 | 2 | 3;
  commissionRate: number;
  startDate: string;
}): Promise<DocumentResponse> {
  const commissionPercentage = (data.commissionRate * 100).toFixed(1);
  const levelName = ['', 'Nível 1', 'Nível 2', 'Nível 3'][data.commissionLevel];

  const agreementContent = `
CONTRATO DE AFILIADO - PLANTA & RAIZ

Afiliado: ${data.affiliateName}
Email: ${data.affiliateEmail}
Telefone: ${data.affiliatePhone}
Nível de Comissão: ${levelName}
Taxa de Comissão: ${commissionPercentage}%
Data de Início: ${data.startDate}

TERMOS E CONDIÇÕES:

1. COMISSÕES
   - O afiliado receberá ${commissionPercentage}% de comissão sobre as vendas geradas através de seu link único
   - Pagamentos são processados mensalmente via Pix
   - Saques acima de R$ 100 são permitidos

2. OBRIGAÇÕES DO AFILIADO
   - Cumprir com as políticas de marketing da Planta & Raiz
   - Não fazer publicidade enganosa
   - Respeitar direitos autorais e marcas registradas
   - Manter dados de contato atualizados

3. RESCISÃO
   - Qualquer parte pode rescindir este contrato com 30 dias de aviso prévio
   - Comissões pendentes serão pagas na rescisão

4. CONFORMIDADE
   - Este contrato está em conformidade com LGPD e legislação brasileira

Data: ${new Date().toLocaleDateString('pt-BR')}

Aceito os termos acima:
${data.affiliateName}
${data.affiliateEmail}
${data.affiliatePhone}
  `;

  return createDocument({
    name: `Contrato_Afiliado_${data.affiliateName}_${Date.now()}.pdf`,
    content: agreementContent,
    signers: [
      {
        name: data.affiliateName,
        email: data.affiliateEmail,
        phone: data.affiliatePhone,
      },
    ],
    templateType: 'contract',
  });
}

/**
 * Get signing link for signer
 */
export async function getSigningLink(documentId: string, signerEmail: string): Promise<{
  success: boolean;
  signingLink?: string;
  message: string;
}> {
  try {
    const response = await fetch(`/api/clicksign/documents/${documentId}/signers/${signerEmail}/link`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get signing link: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      signingLink: result.signingLink,
      message: 'Signing link retrieved successfully',
    };
  } catch (error) {
    console.error('[Clicksign] Get signing link error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get signing link',
    };
  }
}

/**
 * Webhook handler for Clicksign events
 */
export async function handleClicksignWebhook(event: any): Promise<void> {
  try {
    const { type, data } = event;

    switch (type) {
      case 'document.signed':
        console.log('[Clicksign] Document signed:', data.documentId);
        // Update document status in database
        // Send notification to signers
        break;

      case 'document.completed':
        console.log('[Clicksign] Document completed:', data.documentId);
        // Mark as fully signed
        // Generate certificate
        // Send completion notification
        break;

      case 'signer.signed':
        console.log('[Clicksign] Signer signed:', data.signerEmail);
        // Update signer status
        // Send notification to other signers
        break;

      default:
        console.warn('[Clicksign] Unknown webhook type:', type);
    }
  } catch (error) {
    console.error('[Clicksign] Webhook handling error:', error);
  }
}

export default {
  createDocument,
  sendDocumentForSignature,
  getDocumentStatus,
  downloadSignedDocument,
  createMedicalConsentForm,
  createPrescriptionForm,
  createAffiliateAgreement,
  getSigningLink,
  handleClicksignWebhook,
};
