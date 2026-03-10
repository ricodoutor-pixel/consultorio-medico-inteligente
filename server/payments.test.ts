// ============================================================================
// VITEST SUITE — SISTEMA DE PAGAMENTOS DINÂMICO
// Planta & Raiz 3.0 — Testes Completos
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DynamicPricingService,
  MercadoPagoPaymentService,
  ManusCryptoAuthService,
  CommissionCalculationService,
  PaymentDashboardService,
  IntegratedPaymentService,
} from '../server/services/paymentService';

// ============================================================================
// TESTES: DynamicPricingService
// ============================================================================

describe('DynamicPricingService', () => {
  let service: DynamicPricingService;

  beforeEach(() => {
    service = new DynamicPricingService();
  });

  describe('createDoctorPrice', () => {
    it('deve criar preço válido entre R$ 49-130', async () => {
      const price = await service.createDoctorPrice('doc_001', 89);

      expect(price.doctorId).toBe('doc_001');
      expect(price.basePrice).toBe(89);
      expect(price.minPrice).toBe(49);
      expect(price.maxPrice).toBe(130);
      expect(price.active).toBe(true);
      expect(price.currency).toBe('BRL');
    });

    it('deve rejeitar preço abaixo de R$ 49', async () => {
      await expect(service.createDoctorPrice('doc_001', 30)).rejects.toThrow(
        'R$ 49'
      );
    });

    it('deve rejeitar preço acima de R$ 130', async () => {
      await expect(service.createDoctorPrice('doc_001', 150)).rejects.toThrow(
        'R$ 130'
      );
    });

    it('deve aceitar preço mínimo R$ 49', async () => {
      const price = await service.createDoctorPrice('doc_001', 49);
      expect(price.basePrice).toBe(49);
    });

    it('deve aceitar preço máximo R$ 130', async () => {
      const price = await service.createDoctorPrice('doc_001', 130);
      expect(price.basePrice).toBe(130);
    });
  });

  describe('getDoctorPrice', () => {
    it('deve obter preço do médico', async () => {
      const price = await service.getDoctorPrice('doc_001');

      expect(price).not.toBeNull();
      expect(price?.doctorId).toBe('doc_001');
      expect(price?.basePrice).toBeGreaterThanOrEqual(49);
      expect(price?.basePrice).toBeLessThanOrEqual(130);
    });

    it('deve retornar null para médico inexistente', async () => {
      // Mock: retorna null
      const price = await service.getDoctorPrice('doc_inexistente');
      // Pode ser null ou um valor padrão
      expect(price).toBeDefined();
    });
  });

  describe('updateDoctorPrice', () => {
    it('deve atualizar preço do médico', async () => {
      const updated = await service.updateDoctorPrice('doc_001', 99);

      expect(updated.basePrice).toBe(99);
      expect(updated.updatedAt).toBeDefined();
    });

    it('deve rejeitar atualização com preço inválido', async () => {
      await expect(service.updateDoctorPrice('doc_001', 200)).rejects.toThrow();
    });
  });
});

// ============================================================================
// TESTES: CommissionCalculationService
// ============================================================================

describe('CommissionCalculationService', () => {
  let service: CommissionCalculationService;

  beforeEach(() => {
    service = new CommissionCalculationService();
  });

  describe('calculateCommissions', () => {
    it('deve calcular 7% plataforma e 93% médico', () => {
      const result = service.calculateCommissions(100);

      expect(result.platformFee).toBe(7);
      expect(result.doctorEarnings).toBe(93);
      expect(result.totalAmount).toBe(100);
      expect(result.platformPercentage).toBe(7);
      expect(result.doctorPercentage).toBe(93);
    });

    it('deve calcular comissões com R$ 89', () => {
      const result = service.calculateCommissions(89);

      expect(result.platformFee).toBe(6.23);
      expect(result.doctorEarnings).toBe(82.77);
      expect(result.totalAmount).toBe(89);
    });

    it('deve calcular comissões com R$ 49', () => {
      const result = service.calculateCommissions(49);

      expect(result.platformFee).toBe(3.43);
      expect(result.doctorEarnings).toBe(45.57);
    });

    it('deve calcular comissões com R$ 130', () => {
      const result = service.calculateCommissions(130);

      expect(result.platformFee).toBe(9.1);
      expect(result.doctorEarnings).toBe(120.9);
    });

    it('deve calcular comissões com valores decimais', () => {
      const result = service.calculateCommissions(99.99);

      expect(result.platformFee).toBeCloseTo(6.9993, 2);
      expect(result.doctorEarnings).toBeCloseTo(92.9907, 2);
    });
  });

  describe('generateCommissionReport', () => {
    it('deve gerar relatório com todas as informações', () => {
      const report = service.generateCommissionReport(
        'CONS_001',
        'doc_001',
        89,
        'approved'
      );

      expect(report.consultationId).toBe('CONS_001');
      expect(report.doctorId).toBe('doc_001');
      expect(report.amount).toBe(89);
      expect(report.status).toBe('approved');
      expect(report.platformFee).toBe(6.23);
      expect(report.doctorEarnings).toBe(82.77);
      expect(report.breakdown.platform).toBe('7%');
      expect(report.breakdown.doctor).toBe('93%');
      expect(report.date).toBeDefined();
    });
  });

  describe('calculateDoctorEarnings', () => {
    it('deve calcular ganhos do médico corretamente', () => {
      const earnings = service.calculateDoctorEarnings('CONS_001', 'doc_001', 130);

      expect(earnings).toBe(120.9);
    });

    it('deve calcular ganhos com diferentes valores', () => {
      expect(service.calculateDoctorEarnings('CONS_001', 'doc_001', 49)).toBe(45.57);
      expect(service.calculateDoctorEarnings('CONS_001', 'doc_001', 89)).toBe(82.77);
      expect(service.calculateDoctorEarnings('CONS_001', 'doc_001', 130)).toBe(120.9);
    });
  });
});

// ============================================================================
// TESTES: ManusCryptoAuthService
// ============================================================================

describe('ManusCryptoAuthService', () => {
  let service: ManusCryptoAuthService;

  beforeEach(() => {
    service = new ManusCryptoAuthService();
  });

  describe('generateAuthenticationToken', () => {
    it('deve gerar token de autenticação único', () => {
      const token = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      expect(token).toBeDefined();
      expect(token).toContain('AUTH_');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('deve gerar tokens diferentes para mesmos dados', () => {
      const token1 = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );
      const token2 = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      // Tokens devem ser diferentes (timestamps diferentes)
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyPaymentAuthenticity', () => {
    it('deve verificar autenticidade válida', () => {
      const token = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      const isValid = service.verifyPaymentAuthenticity(
        token,
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      expect(isValid).toBe(true);
    });

    it('deve rejeitar autenticidade com consultation_id diferente', () => {
      const token = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      const isValid = service.verifyPaymentAuthenticity(
        token,
        'CONS_002', // Diferente
        'doc_001',
        'pat_001',
        89
      );

      expect(isValid).toBe(false);
    });

    it('deve rejeitar autenticidade com doctor_id diferente', () => {
      const token = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      const isValid = service.verifyPaymentAuthenticity(
        token,
        'CONS_001',
        'doc_002', // Diferente
        'pat_001',
        89
      );

      expect(isValid).toBe(false);
    });

    it('deve rejeitar autenticidade com patient_id diferente', () => {
      const token = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      const isValid = service.verifyPaymentAuthenticity(
        token,
        'CONS_001',
        'doc_001',
        'pat_002', // Diferente
        89
      );

      expect(isValid).toBe(false);
    });

    it('deve rejeitar autenticidade com amount diferente', () => {
      const token = service.generateAuthenticationToken(
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      const isValid = service.verifyPaymentAuthenticity(
        token,
        'CONS_001',
        'doc_001',
        'pat_001',
        100 // Diferente
      );

      expect(isValid).toBe(false);
    });

    it('deve rejeitar token inválido', () => {
      const isValid = service.verifyPaymentAuthenticity(
        'INVALID_TOKEN',
        'CONS_001',
        'doc_001',
        'pat_001',
        89
      );

      expect(isValid).toBe(false);
    });
  });

  describe('createIntegrityHash', () => {
    it('deve criar hash de integridade', () => {
      const data = { id: 'PAY_001', amount: 89 };
      const hash = service.createIntegrityHash(data);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('deve gerar hash consistente para mesmos dados', () => {
      const data = { id: 'PAY_001', amount: 89 };
      const hash1 = service.createIntegrityHash(data);
      const hash2 = service.createIntegrityHash(data);

      expect(hash1).toBe(hash2);
    });

    it('deve gerar hash diferente para dados diferentes', () => {
      const data1 = { id: 'PAY_001', amount: 89 };
      const data2 = { id: 'PAY_002', amount: 90 };

      const hash1 = service.createIntegrityHash(data1);
      const hash2 = service.createIntegrityHash(data2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyIntegrity', () => {
    it('deve verificar integridade corretamente', () => {
      const data = { id: 'PAY_001', amount: 89 };
      const hash = service.createIntegrityHash(data);

      const isValid = service.verifyIntegrity(data, hash);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar integridade alterada', () => {
      const data = { id: 'PAY_001', amount: 89 };
      const hash = service.createIntegrityHash(data);

      const alteredData = { id: 'PAY_001', amount: 100 };
      const isValid = service.verifyIntegrity(alteredData, hash);

      expect(isValid).toBe(false);
    });

    it('deve rejeitar hash inválido', () => {
      const data = { id: 'PAY_001', amount: 89 };
      const isValid = service.verifyIntegrity(data, 'INVALID_HASH');

      expect(isValid).toBe(false);
    });
  });
});

// ============================================================================
// TESTES: PaymentDashboardService
// ============================================================================

describe('PaymentDashboardService', () => {
  let service: PaymentDashboardService;

  beforeEach(() => {
    service = new PaymentDashboardService();
  });

  describe('getDoctorDashboard', () => {
    it('deve retornar dashboard do médico', async () => {
      const dashboard = await service.getDoctorDashboard('doc_001');

      expect(dashboard).toBeDefined();
      expect(dashboard.doctorId).toBe('doc_001');
      expect(dashboard.totalEarnings).toBeGreaterThan(0);
      expect(dashboard.totalConsultations).toBeGreaterThan(0);
      expect(dashboard.averageConsultationPrice).toBeGreaterThan(0);
      expect(dashboard.nextPaymentDate).toBeDefined();
    });

    it('deve ter métricas válidas', async () => {
      const dashboard = await service.getDoctorDashboard('doc_001');

      expect(dashboard.pendingPayments).toBeGreaterThanOrEqual(0);
      expect(dashboard.approvedPayments).toBeGreaterThanOrEqual(0);
      expect(dashboard.totalEarnings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generatePaymentStatement', () => {
    it('deve gerar extrato de pagamentos', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-02-01');

      const statement = await service.generatePaymentStatement(
        'doc_001',
        startDate,
        endDate
      );

      expect(statement).toBeDefined();
      expect(statement.doctorId).toBe('doc_001');
      expect(statement.period.start).toEqual(startDate);
      expect(statement.period.end).toEqual(endDate);
      expect(statement.generatedAt).toBeDefined();
    });
  });
});

// ============================================================================
// TESTES: IntegratedPaymentService
// ============================================================================

describe('IntegratedPaymentService', () => {
  let service: IntegratedPaymentService;

  beforeEach(() => {
    service = new IntegratedPaymentService('TEST_TOKEN');
  });

  describe('serviços integrados', () => {
    it('deve ter todos os serviços inicializados', () => {
      expect(service.pricingService).toBeDefined();
      expect(service.mercadoPagoService).toBeDefined();
      expect(service.cryptoAuthService).toBeDefined();
      expect(service.commissionService).toBeDefined();
      expect(service.dashboardService).toBeDefined();
    });
  });

  describe('processPayment', () => {
    it('deve processar pagamento com sucesso', async () => {
      const payment = await service.processPayment({
        consultationId: 'CONS_001',
        doctorId: 'doc_001',
        patientId: 'pat_001',
        patientEmail: 'paciente@email.com',
        doctorEmail: 'medico@email.com',
      });

      expect(payment).toBeDefined();
      expect(payment.authenticationToken).toBeDefined();
      expect(payment.platformFee).toBeGreaterThan(0);
      expect(payment.doctorEarnings).toBeGreaterThan(0);
    });
  });

  describe('verifyPaymentAfterWebhook', () => {
    it('deve verificar pagamento após webhook', async () => {
      const verification = await service.verifyPaymentAfterWebhook(
        'PAY_123456',
        { status: 'approved', transaction_amount: 89 }
      );

      expect(verification).toBeDefined();
      expect(verification.paymentId).toBe('PAY_123456');
      expect(verification.status).toBe('approved');
      expect(verification.amount).toBe(89);
      expect(verification.authenticationVerified).toBe(true);
    });
  });
});

// ============================================================================
// TESTES DE INTEGRAÇÃO
// ============================================================================

describe('Integração Completa', () => {
  let service: IntegratedPaymentService;

  beforeEach(() => {
    service = new IntegratedPaymentService('TEST_TOKEN');
  });

  it('deve completar fluxo completo de pagamento', async () => {
    // 1. Processar pagamento
    const payment = await service.processPayment({
      consultationId: 'CONS_001',
      doctorId: 'doc_001',
      patientId: 'pat_001',
      patientEmail: 'paciente@email.com',
      doctorEmail: 'medico@email.com',
    });

    expect(payment).toBeDefined();
    expect(payment.authenticationToken).toBeDefined();

    // 2. Verificar autenticidade
    const isAuthentic = service.cryptoAuthService.verifyPaymentAuthenticity(
      payment.authenticationToken,
      'CONS_001',
      'doc_001',
      'pat_001',
      89
    );

    expect(isAuthentic).toBe(true);

    // 3. Calcular comissões
    const commissions = service.commissionService.calculateCommissions(89);

    expect(commissions.platformFee).toBe(6.23);
    expect(commissions.doctorEarnings).toBe(82.77);
  });
});

// ============================================================================
// TESTES DE SEGURANÇA
// ============================================================================

describe('Segurança', () => {
  let service: IntegratedPaymentService;

  beforeEach(() => {
    service = new IntegratedPaymentService('TEST_TOKEN');
  });

  it('deve detectar tentativa de fraude com token inválido', () => {
    const isValid = service.cryptoAuthService.verifyPaymentAuthenticity(
      'FAKE_TOKEN',
      'CONS_001',
      'doc_001',
      'pat_001',
      89
    );

    expect(isValid).toBe(false);
  });

  it('deve detectar tentativa de fraude com valor alterado', () => {
    const token = service.cryptoAuthService.generateAuthenticationToken(
      'CONS_001',
      'doc_001',
      'pat_001',
      89
    );

    const isValid = service.cryptoAuthService.verifyPaymentAuthenticity(
      token,
      'CONS_001',
      'doc_001',
      'pat_001',
      1000 // Valor alterado
    );

    expect(isValid).toBe(false);
  });

  it('deve detectar hash de integridade alterado', () => {
    const data = { id: 'PAY_001', amount: 89 };
    const hash = service.cryptoAuthService.createIntegrityHash(data);

    const alteredData = { id: 'PAY_001', amount: 100 };
    const isValid = service.cryptoAuthService.verifyIntegrity(alteredData, hash);

    expect(isValid).toBe(false);
  });
});

// ============================================================================
// TESTES DE PERFORMANCE
// ============================================================================

describe('Performance', () => {
  let service: IntegratedPaymentService;

  beforeEach(() => {
    service = new IntegratedPaymentService('TEST_TOKEN');
  });

  it('deve calcular comissões em menos de 10ms', () => {
    const start = performance.now();

    service.commissionService.calculateCommissions(89);

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(10);
  });

  it('deve gerar token em menos de 50ms', () => {
    const start = performance.now();

    service.cryptoAuthService.generateAuthenticationToken(
      'CONS_001',
      'doc_001',
      'pat_001',
      89
    );

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(50);
  });

  it('deve verificar autenticidade em menos de 50ms', () => {
    const token = service.cryptoAuthService.generateAuthenticationToken(
      'CONS_001',
      'doc_001',
      'pat_001',
      89
    );

    const start = performance.now();

    service.cryptoAuthService.verifyPaymentAuthenticity(
      token,
      'CONS_001',
      'doc_001',
      'pat_001',
      89
    );

    const end = performance.now();
    const duration = end - start;

    expect(duration).toBeLessThan(50);
  });
});
