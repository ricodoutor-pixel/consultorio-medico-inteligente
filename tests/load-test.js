/**
 * TESTES DE CARGA - PLANTA & RAIZ
 * 
 * Usando k6 para simular carga em produção
 * 
 * Executar:
 * k6 run tests/load-test.js
 * 
 * Com cloud:
 * k6 cloud tests/load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

// ============================================
// CONFIGURAÇÃO DE CARGA
// ============================================

export const options = {
  stages: [
    // Ramp-up: 0 para 100 usuários em 2 minutos
    { duration: '2m', target: 100 },
    // Pico: 100 usuários por 5 minutos
    { duration: '5m', target: 100 },
    // Ramp-down: 100 para 0 usuários em 2 minutos
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.1'], // Taxa de erro < 10%
    checks: ['rate>0.95'], // 95% dos checks devem passar
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

// ============================================
// TESTES DE ENDPOINTS PRINCIPAIS
// ============================================

export default function () {
  // 1. Teste de Homepage
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      'status é 200': (r) => r.status === 200,
      'tempo < 1s': (r) => r.timings.duration < 1000,
      'contém Planta & Raiz': (r) => r.body.includes('Planta & Raiz'),
    });
  });

  sleep(1);

  // 2. Teste de Planos SaaS
  group('Plans Page', () => {
    const res = http.get(`${BASE_URL}/plans`);
    check(res, {
      'status é 200': (r) => r.status === 200,
      'tempo < 1s': (r) => r.timings.duration < 1000,
      'contém tabela de planos': (r) => r.body.includes('Planos SaaS'),
    });
  });

  sleep(1);

  // 3. Teste de API tRPC - Auth
  group('tRPC - Auth Check', () => {
    const res = http.post(`${API_URL}?batch=1`, JSON.stringify([
      {
        0: {
          json: null,
        },
      },
    ]), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    check(res, {
      'status é 200': (r) => r.status === 200,
      'tempo < 500ms': (r) => r.timings.duration < 500,
      'resposta é JSON': (r) => r.headers['content-type'].includes('application/json'),
    });
  });

  sleep(1);

  // 4. Teste de Dashboard (requer autenticação)
  group('Doctor Dashboard', () => {
    const res = http.get(`${BASE_URL}/doctor`, {
      headers: {
        'Cookie': 'session=test-session', // Simulado
      },
    });

    check(res, {
      'status é 200 ou 302': (r) => r.status === 200 || r.status === 302,
      'tempo < 1.5s': (r) => r.timings.duration < 1500,
    });
  });

  sleep(1);

  // 5. Teste de Afiliados Dashboard
  group('Affiliate Dashboard', () => {
    const res = http.get(`${BASE_URL}/affiliate`);

    check(res, {
      'status é 200 ou 302': (r) => r.status === 200 || r.status === 302,
      'tempo < 1.5s': (r) => r.timings.duration < 1500,
    });
  });

  sleep(1);

  // 6. Teste de Loja Dashboard
  group('Store Dashboard', () => {
    const res = http.get(`${BASE_URL}/store`);

    check(res, {
      'status é 200 ou 302': (r) => r.status === 200 || r.status === 302,
      'tempo < 1.5s': (r) => r.timings.duration < 1500,
    });
  });

  sleep(2);
}

// ============================================
// TESTE DE SPIKE (Pico de Tráfego)
// ============================================

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

// ============================================
// TESTE DE STRESS
// ============================================

export const stressOptions = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m30s', target: 500 },
    { duration: '20s', target: 1000 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed: ['rate<0.5'],
  },
};

// ============================================
// TESTE DE RESISTÊNCIA
// ============================================

export const enduranceOptions = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '30m', target: 100 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};
