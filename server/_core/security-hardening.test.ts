import { describe, expect, it } from 'vitest';
import { rateLimiters, corsConfig, authSecurity } from './security-hardening';

describe('security hardening configuration', () => {
  it('exposes rate limiters for critical endpoints', () => {
    expect(rateLimiters.global).toBeDefined();
    expect(rateLimiters.login).toBeDefined();
    expect(rateLimiters.api).toBeDefined();
  });

  it('allows localhost and production origins', () => {
    const allowedOrigin = 'https://plantayraiz.com.br';
    corsConfig.origin!(allowedOrigin, (err, allow) => {
      expect(err).toBeNull();
      expect(allow).toBe(true);
    });
  });

  it('configures authentication security defaults', () => {
    expect(authSecurity.session.cookie.httpOnly).toBe(true);
    expect(authSecurity.twoFactor.enabled).toBe(true);
  });
});
