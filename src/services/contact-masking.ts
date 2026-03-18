/**
 * SISTEMA DE MASCARAMENTO DE CONTATOS
 * 
 * Regras Anti-Fraude:
 * - Bloqueio de troca de contatos externos
 * - Mascaramento de números de telefone
 * - Mascaramento de e-mails
 * - Rastreamento de tentativas de contato direto
 * - Auditoria de violações
 */

export interface MaskedContact {
  originalPhoneNumber?: string;
  maskedPhoneNumber: string;
  originalEmail?: string;
  maskedEmail: string;
  userId: string;
  userRole: 'patient' | 'doctor' | 'store' | 'affiliate';
  createdAt: Date;
  accessLog: Array<{
    timestamp: Date;
    accessedBy: string;
    accessType: 'view' | 'call' | 'message';
  }>;
}

export interface ContactViolation {
  id: string;
  userId: string;
  violationType: 'external_contact_exchange' | 'direct_call' | 'external_message';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  evidence?: string;
  resolved: boolean;
  action?: string;
}

// ============================================
// MASCARAMENTO DE CONTATOS
// ============================================

/**
 * Mascara um número de telefone
 * Exemplo: +55 11 98765-4321 → +55 11 9****-4321
 */
export function maskPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length < 8) {
    return '****';
  }

  const areaCode = cleaned.slice(0, 2);
  const firstPart = cleaned.slice(2, 7);
  const lastPart = cleaned.slice(-4);

  return `+55 ${areaCode} 9****-${lastPart}`;
}

/**
 * Mascara um endereço de e-mail
 * Exemplo: usuario@example.com → u****@example.com
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');

  if (!localPart || !domain) {
    return '****@****';
  }

  const firstChar = localPart[0];
  const maskedLocal = `${firstChar}****`;

  return `${maskedLocal}@${domain}`;
}

/**
 * Cria um contato mascarado
 */
export function createMaskedContact(
  userId: string,
  userRole: 'patient' | 'doctor' | 'store' | 'affiliate',
  phoneNumber?: string,
  email?: string
): MaskedContact {
  return {
    originalPhoneNumber: phoneNumber,
    maskedPhoneNumber: phoneNumber ? maskPhoneNumber(phoneNumber) : '****',
    originalEmail: email,
    maskedEmail: email ? maskEmail(email) : '****@****',
    userId,
    userRole,
    createdAt: new Date(),
    accessLog: [],
  };
}

/**
 * Registra acesso a um contato mascarado
 */
export function logContactAccess(
  maskedContact: MaskedContact,
  accessedBy: string,
  accessType: 'view' | 'call' | 'message'
): void {
  maskedContact.accessLog.push({
    timestamp: new Date(),
    accessedBy,
    accessType,
  });

  // Alertar se muitos acessos em pouco tempo (possível tentativa de fraude)
  const recentAccesses = maskedContact.accessLog.filter(
    log => Date.now() - log.timestamp.getTime() < 5 * 60 * 1000 // últimos 5 minutos
  );

  if (recentAccesses.length > 5) {
    console.warn(`⚠️ Múltiplos acessos ao contato de ${maskedContact.userId} em pouco tempo`);
  }
}

// ============================================
// DETECÇÃO DE VIOLAÇÕES
// ============================================

const violations: ContactViolation[] = [];

/**
 * Registra uma violação de contato
 */
export function recordViolation(
  userId: string,
  violationType: 'external_contact_exchange' | 'direct_call' | 'external_message',
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  evidence?: string
): ContactViolation {
  const violation: ContactViolation = {
    id: `VIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    violationType,
    description,
    severity,
    timestamp: new Date(),
    evidence,
    resolved: false,
  };

  violations.push(violation);

  // Alertar para violações críticas
  if (severity === 'critical') {
    console.error(`🚨 VIOLAÇÃO CRÍTICA: ${description} (Usuário: ${userId})`);
    // Aqui você poderia enviar um alerta para o Guardião ANVISA
  }

  return violation;
}

/**
 * Detecta tentativa de troca de contato externo
 */
export function detectExternalContactExchange(
  message: string,
  userId: string
): boolean {
  // Padrões de contato externo
  const patterns = [
    /(\+?55?\s?)?(\d{2})\s?9?\d{4}-?\d{4}/g, // Telefone
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // E-mail
    /(whatsapp|telegram|instagram|facebook|viber|signal)[\s:]*[\w\d]+/gi, // Redes sociais
    /(www\.|https?:\/\/)[\w\d.-]+\.\w+/g, // URLs
  ];

  for (const pattern of patterns) {
    if (pattern.test(message)) {
      recordViolation(
        userId,
        'external_contact_exchange',
        `Tentativa de compartilhar contato externo: ${message.substring(0, 50)}...`,
        'high',
        message
      );
      return true;
    }
  }

  return false;
}

/**
 * Bloqueia mensagens com contatos externos
 */
export function blockMessageWithExternalContact(
  message: string,
  userId: string
): { allowed: boolean; reason?: string } {
  if (detectExternalContactExchange(message, userId)) {
    return {
      allowed: false,
      reason: 'Mensagens com contatos externos são proibidas. Use apenas a plataforma Planta & Raiz para comunicação.',
    };
  }

  return { allowed: true };
}

// ============================================
// AUDITORIA DE CONTATOS
// ============================================

export interface ContactAuditLog {
  id: string;
  userId: string;
  action: 'view' | 'access' | 'violation' | 'block';
  details: string;
  timestamp: Date;
}

const auditLogs: ContactAuditLog[] = [];

/**
 * Registra ação de contato no log de auditoria
 */
export function logContactAudit(
  userId: string,
  action: 'view' | 'access' | 'violation' | 'block',
  details: string
): ContactAuditLog {
  const log: ContactAuditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    action,
    details,
    timestamp: new Date(),
  };

  auditLogs.push(log);

  // Manter apenas últimos 10k logs
  if (auditLogs.length > 10000) {
    auditLogs.splice(0, auditLogs.length - 10000);
  }

  return log;
}

/**
 * Obtém logs de auditoria de um usuário
 */
export function getUserAuditLogs(userId: string, limit: number = 100): ContactAuditLog[] {
  return auditLogs
    .filter(log => log.userId === userId)
    .slice(-limit);
}

// ============================================
// VALIDAÇÃO DE COMUNICAÇÃO
// ============================================

export interface CommunicationValidation {
  valid: boolean;
  message?: string;
  violations?: string[];
}

/**
 * Valida uma comunicação antes de ser enviada
 */
export function validateCommunication(
  message: string,
  senderUserId: string,
  receiverUserId: string
): CommunicationValidation {
  const violations: string[] = [];

  // 1. Verificar contatos externos
  const { allowed: contactsAllowed, reason: contactReason } = blockMessageWithExternalContact(
    message,
    senderUserId
  );

  if (!contactsAllowed) {
    violations.push(contactReason || 'Contatos externos não permitidos');
  }

  // 2. Verificar spam
  if (message.length > 5000) {
    violations.push('Mensagem muito longa (máximo 5000 caracteres)');
  }

  // 3. Verificar palavras-chave suspeitas
  const suspiciousKeywords = ['bitcoin', 'criptomoeda', 'transferência bancária', 'pix privado'];
  for (const keyword of suspiciousKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      violations.push(`Palavra-chave suspeita detectada: "${keyword}"`);
    }
  }

  return {
    valid: violations.length === 0,
    message: violations.length === 0 ? 'Comunicação validada' : 'Comunicação bloqueada',
    violations: violations.length > 0 ? violations : undefined,
  };
}

// ============================================
// ESTATÍSTICAS DE VIOLAÇÕES
// ============================================

export function getViolationStats(): {
  totalViolations: number;
  unresolvedViolations: number;
  criticalViolations: number;
  violationsByType: Record<string, number>;
} {
  const unresolvedViolations = violations.filter(v => !v.resolved);
  const criticalViolations = violations.filter(v => v.severity === 'critical' && !v.resolved);

  const violationsByType: Record<string, number> = {};
  for (const violation of violations) {
    violationsByType[violation.violationType] = (violationsByType[violation.violationType] || 0) + 1;
  }

  return {
    totalViolations: violations.length,
    unresolvedViolations: unresolvedViolations.length,
    criticalViolations: criticalViolations.length,
    violationsByType,
  };
}

/**
 * Resolve uma violação
 */
export function resolveViolation(violationId: string, action: string): void {
  const violation = violations.find(v => v.id === violationId);
  if (violation) {
    violation.resolved = true;
    violation.action = action;
  }
}
