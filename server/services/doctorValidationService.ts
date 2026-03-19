import axios from 'axios';
import { db } from '../db';
import { doctors } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Serviço de Validação de Médicos
 * Integração com CFM, CRMV e conselhos internacionais
 * Conformidade: CFM, ANVISA, LGPD
 */

interface DoctorValidationResult {
  valid: boolean;
  verified: boolean;
  councilName: string;
  licenseNumber: string;
  doctorName: string;
  specialty: string;
  status: 'active' | 'inactive' | 'suspended' | 'invalid';
  verifiedAt: Date;
  error?: string;
}

interface DoctorAlertPayload {
  doctorId: string;
  doctorEmail: string;
  doctorName: string;
  reason: string;
  councilName: string;
  severity: 'warning' | 'critical' | 'blocked';
}

// Configuração de APIs de conselhos
const COUNCIL_APIS = {
  CFM: {
    name: 'Conselho Federal de Medicina (Brasil)',
    url: 'https://portal.cfm.org.br/api/medicos',
    method: 'GET',
    timeout: 5000
  },
  CRMV: {
    name: 'Conselho Regional de Medicina Veterinária',
    url: 'https://crmv.org.br/api/profissionais',
    method: 'GET',
    timeout: 5000
  },
  CRMB: {
    name: 'Conselho Regional de Medicina da Bolívia',
    url: 'https://api.colegiomedicobolivia.org/verify',
    method: 'POST',
    timeout: 5000
  },
  CRMP: {
    name: 'Conselho Regional de Medicina do Peru',
    url: 'https://api.cmp.org.pe/verify',
    method: 'POST',
    timeout: 5000
  },
  CRMC: {
    name: 'Conselho Regional de Medicina da Colômbia',
    url: 'https://api.medicoscolumbia.org/verify',
    method: 'POST',
    timeout: 5000
  }
};

/**
 * Validar CRM em conselhos internacionais
 */
export const validateDoctorLicense = async (
  crm: string,
  doctorName: string,
  country: string = 'BR',
  specialty: string = 'general'
): Promise<DoctorValidationResult> => {
  const councils = getCouncilsByCountry(country);
  
  for (const council of councils) {
    try {
      const result = await validateWithCouncil(council, crm, doctorName);
      if (result.valid) {
        return result;
      }
    } catch (error) {
      console.error(`Erro ao validar com ${council.name}:`, error);
    }
  }

  return {
    valid: false,
    verified: false,
    councilName: 'Nenhum conselho',
    licenseNumber: crm,
    doctorName,
    specialty,
    status: 'invalid',
    verifiedAt: new Date(),
    error: 'CRM não encontrado em nenhum conselho registrado'
  };
};

/**
 * Validar com conselho específico
 */
const validateWithCouncil = async (
  council: typeof COUNCIL_APIS[keyof typeof COUNCIL_APIS],
  crm: string,
  doctorName: string
): Promise<DoctorValidationResult> => {
  try {
    let response;

    if (council.method === 'GET') {
      response = await axios.get(`${council.url}/${crm}`, {
        timeout: council.timeout,
        headers: {
          'User-Agent': 'PlantaRaiz/1.0',
          'Accept': 'application/json'
        }
      });
    } else {
      response = await axios.post(council.url, {
        crm,
        name: doctorName
      }, {
        timeout: council.timeout,
        headers: {
          'User-Agent': 'PlantaRaiz/1.0',
          'Accept': 'application/json'
        }
      });
    }

    const data = response.data;

    return {
      valid: data.valid || data.status === 'active',
      verified: true,
      councilName: council.name,
      licenseNumber: crm,
      doctorName: data.name || doctorName,
      specialty: data.specialty || 'general',
      status: data.status || (data.valid ? 'active' : 'inactive'),
      verifiedAt: new Date()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Obter conselhos por país
 */
const getCouncilsByCountry = (country: string): any[] => {
  const countryCouncils: Record<string, string[]> = {
    'BR': ['CFM', 'CRMV'],
    'BO': ['CRMB', 'CFM'],
    'PE': ['CRMP', 'CFM'],
    'CO': ['CRMC', 'CFM'],
    'default': ['CFM', 'CRMV', 'CRMB', 'CRMP', 'CRMC']
  };

  const councils = countryCouncils[country] || countryCouncils['default'];
  return councils.map(c => COUNCIL_APIS[c as keyof typeof COUNCIL_APIS]).filter(Boolean);
};

/**
 * Enviar alerta para médico inválido
 */
export const sendInvalidDoctorAlert = async (payload: DoctorAlertPayload) => {
  try {
    const emailContent = generateAlertEmail(payload);
    
    // Enviar email
    await sendEmailAlert({
      to: payload.doctorEmail,
      subject: `⚠️ Alerta de Inconformidade - Planta & Raiz`,
      html: emailContent,
      severity: payload.severity
    });

    // Registrar no banco de dados
    await logDoctorAlert({
      doctorId: payload.doctorId,
      reason: payload.reason,
      councilName: payload.councilName,
      severity: payload.severity,
      timestamp: new Date()
    });

    // Notificar administrador
    await notifyAdminOfInvalidDoctor(payload);

    return { success: true, alertSent: true };
  } catch (error) {
    console.error('Erro ao enviar alerta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gerar email de alerta
 */
const generateAlertEmail = (payload: DoctorAlertPayload): string => {
  const severityMessages = {
    'warning': 'Sua conta foi marcada com um aviso',
    'critical': 'Sua conta foi marcada como crítica',
    'blocked': 'Sua conta foi bloqueada'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
          .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { margin: 20px 0; line-height: 1.6; }
          .footer { background-color: #f9fafb; padding: 15px; border-radius: 8px; font-size: 12px; color: #666; }
          .alert-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Alerta de Inconformidade</h2>
          </div>
          
          <div class="content">
            <p>Prezado Dr. ${payload.doctorName},</p>
            
            <div class="alert-box">
              <strong>${severityMessages[payload.severity]}</strong>
              <p><strong>Motivo:</strong> ${payload.reason}</p>
              <p><strong>Conselho:</strong> ${payload.councilName}</p>
            </div>

            <p>Sua conta na plataforma Planta & Raiz foi marcada como <strong>${payload.severity}</strong> devido a uma inconformidade detectada durante a validação de seu registro profissional.</p>

            <p><strong>Ações Recomendadas:</strong></p>
            <ul>
              <li>Verifique seus dados de registro profissional</li>
              <li>Atualize suas informações se necessário</li>
              <li>Entre em contato com nosso suporte imediatamente</li>
            </ul>

            <p>Se você acredita que isso é um erro, por favor, responda este email com seus documentos de comprovação.</p>
          </div>

          <div class="footer">
            <p><strong>Planta & Raiz - Telemedicina Cannabis Medicinal</strong></p>
            <p>Contato: suporte@plantayraiz.com.br</p>
            <p>Telefone: +55 (11) 99136-3154</p>
            <p>Conformidade: ANVISA | CFM | LGPD | ICP-Brasil</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Enviar email de alerta
 */
const sendEmailAlert = async (options: {
  to: string;
  subject: string;
  html: string;
  severity: string;
}) => {
  // Integrar com serviço de email (SendGrid, AWS SES, etc.)
  console.log(`[EMAIL ALERT] Enviando para ${options.to}: ${options.subject}`);
  // TODO: Implementar integração com serviço de email
};

/**
 * Registrar alerta no banco de dados
 */
const logDoctorAlert = async (data: {
  doctorId: string;
  reason: string;
  councilName: string;
  severity: string;
  timestamp: Date;
}) => {
  // TODO: Implementar tabela de alertas no banco de dados
  console.log(`[ALERT LOG] Doctor: ${data.doctorId}, Reason: ${data.reason}`);
};

/**
 * Notificar administrador
 */
const notifyAdminOfInvalidDoctor = async (payload: DoctorAlertPayload) => {
  const adminMessage = `
    ⚠️ ALERTA: Médico com CRM Inválido
    
    Nome: ${payload.doctorName}
    ID: ${payload.doctorId}
    Email: ${payload.doctorEmail}
    Motivo: ${payload.reason}
    Conselho: ${payload.councilName}
    Severidade: ${payload.severity}
    
    Ação Recomendada: Revisar e tomar ação apropriada
  `;

  console.log(adminMessage);
  // TODO: Enviar notificação para administrador
};

/**
 * Validar todos os médicos da plataforma
 */
export const validateAllDoctors = async () => {
  try {
    // TODO: Implementar busca de todos os médicos
    console.log('[VALIDATION] Iniciando validação de todos os médicos...');
    
    // const allDoctors = await db.select().from(doctors);
    // for (const doctor of allDoctors) {
    //   const result = await validateDoctorLicense(
    //     doctor.crm,
    //     doctor.fullName,
    //     doctor.country,
    //     doctor.specialty
    //   );
    //   
    //   if (!result.valid) {
    //     await sendInvalidDoctorAlert({
    //       doctorId: doctor.id,
    //       doctorEmail: doctor.email,
    //       doctorName: doctor.fullName,
    //       reason: result.error || 'CRM inválido',
    //       councilName: result.councilName,
    //       severity: 'blocked'
    //     });
    //   }
    // }
  } catch (error) {
    console.error('Erro ao validar médicos:', error);
  }
};

export default {
  validateDoctorLicense,
  sendInvalidDoctorAlert,
  validateAllDoctors
};
