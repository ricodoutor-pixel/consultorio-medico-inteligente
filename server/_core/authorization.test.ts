import { describe, expect, it } from 'vitest';
import { hasPermission, validateFinancialAccess, validateAIGatewayAccess } from './authorization';

describe('authorization helpers', () => {
  it('allows admin access to admin dashboard permissions', () => {
    expect(hasPermission('admin', 'admin:dashboard')).toBe(true);
  });

  it('blocks financial reports for non-admin users', () => {
    const result = validateFinancialAccess('user', 'u1', 'u1', 'reports');
    expect(result.allowed).toBe(false);
  });

  it('restricts ai admin endpoints to admins', () => {
    const result = validateAIGatewayAccess('user', '/api/ai/admin/reports');
    expect(result.allowed).toBe(false);
  });
});
