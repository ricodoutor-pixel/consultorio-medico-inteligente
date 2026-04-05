import { TRPCError } from '@trpc/server';
import { validateAuthHeader, TokenPayload } from './auth-enhanced';

export type UserRole = 'user' | 'admin' | 'doctor';

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Check if user is doctor
 */
export function isDoctor(userRole: UserRole): boolean {
  return userRole === 'doctor';
}

/**
 * Check if user is regular user
 */
export function isRegularUser(userRole: UserRole): boolean {
  return userRole === 'user';
}

/**
 * Validate user has required role
 */
export function validateRole(userRole: UserRole, requiredRoles: UserRole[]): void {
  if (!hasRole(userRole, requiredRoles)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `User role "${userRole}" does not have access to this resource. Required roles: ${requiredRoles.join(', ')}`,
    });
  }
}

/**
 * Validate user is admin
 */
export function validateAdmin(userRole: UserRole): void {
  if (!isAdmin(userRole)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
}

/**
 * Validate user is doctor
 */
export function validateDoctor(userRole: UserRole): void {
  if (!isDoctor(userRole)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Doctor access required',
    });
  }
}

/**
 * Validate user owns resource
 */
export function validateOwnership(userId: string, resourceOwnerId: string): void {
  if (userId !== resourceOwnerId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }
}

/**
 * Validate user is admin or owner
 */
export function validateAdminOrOwner(
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string
): void {
  if (!isAdmin(userRole) && userId !== resourceOwnerId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }
}

/**
 * Permission matrix for resources
 */
export const PERMISSIONS = {
  // User management
  'users:read': ['admin', 'user'],
  'users:create': ['admin'],
  'users:update': ['admin'],
  'users:delete': ['admin'],

  // Doctor management
  'doctors:read': ['admin', 'user', 'doctor'],
  'doctors:create': ['admin'],
  'doctors:update': ['admin', 'doctor'],
  'doctors:delete': ['admin'],

  // Consultation management
  'consultations:read': ['admin', 'user', 'doctor'],
  'consultations:create': ['admin', 'user', 'doctor'],
  'consultations:update': ['admin', 'user', 'doctor'],
  'consultations:delete': ['admin'],

  // Payment management
  'payments:read': ['admin', 'user'],
  'payments:create': ['admin', 'user'],
  'payments:update': ['admin'],
  'payments:delete': ['admin'],

  // Product management
  'products:read': ['admin', 'user'],
  'products:create': ['admin'],
  'products:update': ['admin'],
  'products:delete': ['admin'],

  // Admin dashboard
  'admin:dashboard': ['admin'],
  'admin:analytics': ['admin'],
  'admin:settings': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if user has permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

/**
 * Validate user has permission
 */
export function validatePermission(userRole: UserRole, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Permission denied: ${permission}`,
    });
  }
}

/**
 * Get user permissions
 */
export function getUserPermissions(userRole: UserRole): Permission[] {
  return Object.entries(PERMISSIONS)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([permission]) => permission as Permission);
}

/**
 * Row-Level Security (RLS) - Validar acesso a dados financeiros/sensíveis
 */
export function validateFinancialAccess(
  userRole: UserRole,
  userId: string,
  dataOwnerId: string,
  dataType: 'transactions' | 'commissions' | 'balance' | 'reports'
): { allowed: boolean; reason?: string } {
  // Validar inputs vazios
  if (!userRole || !userId || !dataOwnerId) {
    return { allowed: false, reason: 'Dados invalidos' };
  }

  // Admin pode acessar tudo
  if (isAdmin(userRole)) {
    return { allowed: true };
  }

  // Relatorios financeiros: apenas admin
  if (dataType === 'reports') {
    return { allowed: false, reason: 'Acesso a relatorios restrito a administradores' };
  }

  // Usuario so pode acessar seus proprios dados
  if (userId === dataOwnerId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Acesso negado a ${dataType} de outro usuario`,
  };
}

/**
 * Validar acesso a canais em tempo real
 */
export function validateRealtimeChannelAccess(
  userRole: UserRole,
  channelName: string,
  channelOwnerId?: string,
  currentUserId?: string
): { allowed: boolean; reason?: string } {
  // Admin pode acessar todos os canais
  if (isAdmin(userRole)) {
    return { allowed: true };
  }

  // Canais privados do usuario
  if (channelOwnerId && currentUserId === channelOwnerId) {
    return { allowed: true };
  }

  // Canais publicos (sem owner)
  if (!channelOwnerId) {
    // Apenas canais explicitamente publicos
    const publicChannels = ['system', 'announcements', 'public-events'];
    if (publicChannels.includes(channelName)) {
      return { allowed: true };
    }
  }

  // Canais por role
  const roleChannels: Record<string, string[]> = {
    doctor: ['doctors-network', 'doctors-commissions', 'doctors-consultations'],
    user: ['users-consultations', 'users-health'],
    admin: ['admin-monitoring', 'admin-reports', 'admin-alerts'],
  };

  const allowedChannels = roleChannels[userRole] || [];
  if (allowedChannels.includes(channelName)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Acesso negado ao canal ${channelName}`,
  };
}

/**
 * Validar acesso ao AI Gateway
 */
export function validateAIGatewayAccess(
  userRole: UserRole,
  endpoint: string
): { allowed: boolean; reason?: string } {
  // Endpoints sensíveis requerem admin
  const adminOnlyEndpoints = [
    '/api/ai/admin/reports',
    '/api/ai/admin/analytics',
    '/api/ai/admin/users',
  ];

  if (adminOnlyEndpoints.includes(endpoint) && !isAdmin(userRole)) {
    return { allowed: false, reason: 'Acesso restrito a administradores' };
  }

  // Endpoints de médico
  const doctorEndpoints = [
    '/api/ai/doctor/prescriptions',
    '/api/ai/doctor/patients',
    '/api/ai/doctor/consultations',
  ];

  if (
    doctorEndpoints.some((ep) => endpoint.includes(ep)) &&
    !isDoctor(userRole) &&
    !isAdmin(userRole)
  ) {
    return { allowed: false, reason: 'Acesso restrito a médicos' };
  }

  return { allowed: true };
}

/**
 * Auditoria de acesso a dados sensíveis
 */
export interface AccessAuditLog {
  userId: string;
  userRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  allowed: boolean;
  timestamp: Date;
  ipAddress?: string;
}

const auditLogs: AccessAuditLog[] = [];

export function logAccessAttempt(
  userId: string,
  userRole: UserRole,
  action: string,
  resourceType: string,
  resourceId: string,
  allowed: boolean,
  ipAddress?: string
): void {
  const log: AccessAuditLog = {
    userId,
    userRole,
    action,
    resourceType,
    resourceId,
    allowed,
    timestamp: new Date(),
    ipAddress,
  };

  auditLogs.push(log);

  // Manter apenas últimos 10000 logs em memória
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }

  // Log de tentativas de acesso negado
  if (!allowed) {
    console.warn(
      `[SECURITY] Acesso negado: ${userId} tentou acessar ${resourceType}/${resourceId}`
    );
  }
}

export function getAccessAuditLogs(
  limit: number = 100,
  filter?: { userId?: string; allowed?: boolean }
): AccessAuditLog[] {
  let logs = [...auditLogs];

  if (filter?.userId) {
    logs = logs.filter((log) => log.userId === filter.userId);
  }

  if (filter?.allowed !== undefined) {
    logs = logs.filter((log) => log.allowed === filter.allowed);
  }

  return logs.slice(-limit);
}
