#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://plantayraiz.com.br';
const API_URL = `${BASE_URL}/api/trpc`;

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
    tests.push({ name, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
    tests.push({ name, status: 'FAILED', error: error.message });
  }
}

async function apiCall(procedure, input = {}) {
  const response = await fetch(`${API_URL}/${procedure}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

console.log('🧪 TESTES DE FLUXO COMPLETO EM PRODUÇÃO');
console.log('========================================\n');

// FASE 1: Testes de Autenticação
console.log('📋 FASE 1: AUTENTICAÇÃO');
console.log('----------------------');

await test('Auth - Verificar status de login', async () => {
  const result = await apiCall('auth.me');
  if (!result.result) throw new Error('Auth endpoint não respondeu');
});

await test('Auth - Logout', async () => {
  const result = await apiCall('auth.logout');
  if (!result.result) throw new Error('Logout falhou');
});

// FASE 2: Testes de Agendamento
console.log('\n📋 FASE 2: AGENDAMENTO');
console.log('---------------------');

await test('Agendamento - Listar disponibilidade', async () => {
  const result = await apiCall('consultation.getAvailability');
  if (!result.result) throw new Error('Disponibilidade não carregada');
});

await test('Agendamento - Criar consulta', async () => {
  const result = await apiCall('consultation.schedule', {
    specialistId: 'test-specialist',
    dateTime: new Date().toISOString(),
    reason: 'Consulta de teste',
  });
  if (!result.result) throw new Error('Agendamento falhou');
});

// FASE 3: Testes de Checkout
console.log('\n📋 FASE 3: CHECKOUT');
console.log('-------------------');

await test('Checkout - Criar pedido', async () => {
  const result = await apiCall('checkout.createOrder', {
    items: [{ id: 'test-product', quantity: 1, price: 100 }],
    total: 100,
  });
  if (!result.result) throw new Error('Pedido não criado');
});

await test('Checkout - Processar pagamento', async () => {
  const result = await apiCall('checkout.processPayment', {
    orderId: 'test-order',
    paymentMethod: 'credit_card',
    amount: 100,
  });
  if (!result.result) throw new Error('Pagamento falhou');
});

// FASE 4: Testes de Conformidade
console.log('\n📋 FASE 4: CONFORMIDADE REGULATÓRIA');
console.log('-----------------------------------');

await test('LGPD - Auditoria de acesso', async () => {
  const result = await apiCall('audit.getAccessLog');
  if (!result.result) throw new Error('Auditoria não disponível');
});

await test('ANVISA/CFM - Validar prescrição', async () => {
  const result = await apiCall('prescription.validate', {
    prescriptionId: 'test-prescription',
  });
  if (!result.result) throw new Error('Validação de prescrição falhou');
});

// FASE 5: Testes de Segurança
console.log('\n📋 FASE 5: SEGURANÇA');
console.log('--------------------');

await test('Segurança - RLS (Row-Level Security)', async () => {
  try {
    const result = await apiCall('admin.getMetrics');
    // Deve falhar sem autenticação
    throw new Error('RLS não funcionando - acesso não protegido');
  } catch (error) {
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      // Esperado - acesso negado
    } else {
      throw error;
    }
  }
});

await test('Segurança - Validação de entrada', async () => {
  try {
    const result = await apiCall('checkout.createOrder', {
      items: null, // Input inválido
      total: -100, // Valor negativo
    });
    throw new Error('Validação não funcionando');
  } catch (error) {
    if (error.message.includes('400') || error.message.includes('Invalid')) {
      // Esperado - validação funcionando
    } else {
      throw error;
    }
  }
});

// FASE 6: Testes de Performance
console.log('\n📋 FASE 6: PERFORMANCE');
console.log('----------------------');

await test('Performance - Tempo de resposta < 2s', async () => {
  const start = Date.now();
  await apiCall('consultation.getAvailability');
  const duration = Date.now() - start;
  if (duration > 2000) throw new Error(`Resposta lenta: ${duration}ms`);
});

await test('Performance - Caching funcionando', async () => {
  const start1 = Date.now();
  await apiCall('consultation.getAvailability');
  const duration1 = Date.now() - start1;
  
  const start2 = Date.now();
  await apiCall('consultation.getAvailability');
  const duration2 = Date.now() - start2;
  
  if (duration2 > duration1 * 0.8) {
    throw new Error('Cache não está funcionando');
  }
});

// Relatório Final
console.log('\n\n📊 RELATÓRIO FINAL');
console.log('==================');
console.log(`✅ Testes Passados: ${passed}`);
console.log(`❌ Testes Falhados: ${failed}`);
console.log(`📈 Taxa de Sucesso: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);

if (failed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  console.log('✅ Plataforma pronta para produção');
} else {
  console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
}

// Exportar relatório
const report = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  totalTests: passed + failed,
  passed,
  failed,
  successRate: ((passed / (passed + failed)) * 100).toFixed(2) + '%',
  tests,
};

console.log('\n📄 Relatório JSON:');
console.log(JSON.stringify(report, null, 2));
