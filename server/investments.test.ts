import { describe, expect, it } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('Investment System', () => {
  it('should get investment plans', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.investments.getPlans();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    if (Array.isArray(result.data) && result.data.length > 0) {
      const bronzePlan = result.data.find((p) => p.name === 'Bronze');
      expect(bronzePlan).toBeDefined();
    }
  });

  it('should get user summary', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.investments.getSummary();

    if (result.success && result.data) {
      expect(result.data.availableBalance).toBeGreaterThanOrEqual(0);
      expect(result.data.investedAmount).toBeGreaterThanOrEqual(0);
      expect(result.data.totalEarnings).toBeGreaterThanOrEqual(0);
    }
  });

  it('should get active investments', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.investments.getActiveInvestments();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe('Affiliate System', () => {
  it('should get affiliate stats', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.affiliates.getStats();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.referralCode).toBeDefined();
    expect(result.data?.totalReferrals).toBeGreaterThanOrEqual(0);
    expect(result.data?.totalCommissions).toBeGreaterThanOrEqual(0);
  });

  it('should generate referral link', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.affiliates.generateLink({});

    expect(result.success).toBe(true);
    expect(result.data?.link).toBeDefined();
    expect(result.data?.link).toContain('ref=');
  });
});

describe('Transaction System', () => {
  it('should get transaction history', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.getHistory({ limit: 10 });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data?.transactions)).toBe(true);
  });

  it('should get transaction history with filter', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.getHistory({ type: 'deposit', limit: 10 });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data?.transactions)).toBe(true);
  });
});

describe('Admin System', () => {
  it('should deny access to non-admin users', async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.getStats();
      expect.fail('Should have thrown FORBIDDEN error');
    } catch (error: any) {
      expect(error.code).toBe('FORBIDDEN');
    }
  });

  it('should allow admin access', async () => {
    const ctx = createAuthContext();
    ctx.user.role = 'admin';
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getStats();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalUsers).toBeGreaterThanOrEqual(0);
    expect(result.data?.adminUsers).toBeGreaterThanOrEqual(0);
    expect(result.data?.regularUsers).toBeGreaterThanOrEqual(0);
  });
});
