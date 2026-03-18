/**
 * TESTES DE SEGURANÇA - OWASP TOP 10
 * 
 * Validações de segurança em produção
 * 
 * Executar:
 * node tests/security-test.js
 */

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ============================================
// 1. INJEÇÃO SQL
// ============================================

export function testSQLInjection() {
  console.log('🔍 Testando SQL Injection...');

  const payloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1 UNION SELECT * FROM users",
  ];

  payloads.forEach((payload) => {
    const res = http.post(`${BASE_URL}/api/trpc`, JSON.stringify({
      query: payload,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'SQL Injection bloqueado': (r) => r.status !== 200 || !r.body.includes('users'),
    });
  });
}

// ============================================
// 2. XSS (Cross-Site Scripting)
// ============================================

export function testXSS() {
  console.log('🔍 Testando XSS...');

  const payloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>',
  ];

  payloads.forEach((payload) => {
    const res = http.post(`${BASE_URL}/api/trpc`, JSON.stringify({
      message: payload,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'XSS bloqueado': (r) => !r.body.includes('<script>'),
    });
  });
}

// ============================================
// 3. CSRF (Cross-Site Request Forgery)
// ============================================

export function testCSRF() {
  console.log('🔍 Testando CSRF...');

  // Tentar fazer requisição sem token CSRF
  const res = http.post(`${BASE_URL}/api/trpc`, JSON.stringify({
    action: 'deleteUser',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://attacker.com',
    },
  });

  check(res, {
    'CSRF protegido': (r) => r.status === 403 || r.status === 401,
  });
}

// ============================================
// 4. AUTENTICAÇÃO FRACA
// ============================================

export function testWeakAuth() {
  console.log('🔍 Testando Autenticação...');

  // Tentar acessar sem autenticação
  const res = http.get(`${BASE_URL}/doctor`);

  check(res, {
    'Requer autenticação': (r) => r.status === 302 || r.status === 401,
  });

  // Tentar com token inválido
  const res2 = http.get(`${BASE_URL}/doctor`, {
    headers: {
      'Authorization': 'Bearer invalid-token',
    },
  });

  check(res2, {
    'Token inválido rejeitado': (r) => r.status === 401 || r.status === 302,
  });
}

// ============================================
// 5. CONTROLE DE ACESSO QUEBRADO
// ============================================

export function testAccessControl() {
  console.log('🔍 Testando Controle de Acesso...');

  // Tentar acessar recurso de outro usuário
  const res = http.get(`${BASE_URL}/api/trpc?user=admin`, {
    headers: {
      'Cookie': 'session=user-session',
    },
  });

  check(res, {
    'Acesso negado a recursos de outros': (r) => r.status === 403 || r.status === 401,
  });
}

// ============================================
// 6. CONFIGURAÇÃO DE SEGURANÇA INCORRETA
// ============================================

export function testSecurityHeaders() {
  console.log('🔍 Testando Headers de Segurança...');

  const res = http.get(`${BASE_URL}/`);

  check(res, {
    'X-Content-Type-Options presente': (r) => r.headers['x-content-type-options'] !== undefined,
    'X-Frame-Options presente': (r) => r.headers['x-frame-options'] !== undefined,
    'X-XSS-Protection presente': (r) => r.headers['x-xss-protection'] !== undefined,
    'Content-Security-Policy presente': (r) => r.headers['content-security-policy'] !== undefined,
    'Strict-Transport-Security presente': (r) => r.headers['strict-transport-security'] !== undefined,
  });
}

// ============================================
// 7. EXPOSIÇÃO DE DADOS SENSÍVEIS
// ============================================

export function testDataExposure() {
  console.log('🔍 Testando Exposição de Dados...');

  const res = http.get(`${BASE_URL}/api/trpc`);

  check(res, {
    'Não expõe senhas': (r) => !r.body.includes('password'),
    'Não expõe tokens': (r) => !r.body.includes('token'),
    'Não expõe chaves API': (r) => !r.body.includes('api_key'),
  });
}

// ============================================
// 8. VALIDAÇÃO DE ENTRADA
// ============================================

export function testInputValidation() {
  console.log('🔍 Testando Validação de Entrada...');

  const invalidInputs = [
    { email: 'invalid-email' },
    { phone: 'not-a-phone' },
    { amount: 'not-a-number' },
    { date: 'invalid-date' },
  ];

  invalidInputs.forEach((input) => {
    const res = http.post(`${BASE_URL}/api/trpc`, JSON.stringify(input), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'Entrada inválida rejeitada': (r) => r.status === 400 || r.status === 422,
    });
  });
}

// ============================================
// 9. LOGGING E MONITORAMENTO
// ============================================

export function testLogging() {
  console.log('🔍 Testando Logging...');

  // Fazer requisição suspeita
  const res = http.post(`${BASE_URL}/api/trpc`, JSON.stringify({
    action: 'deleteAllUsers',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'Ação suspeita bloqueada': (r) => r.status === 403 || r.status === 400,
  });
}

// ============================================
// 10. RATE LIMITING
// ============================================

export function testRateLimiting() {
  console.log('🔍 Testando Rate Limiting...');

  // Fazer múltiplas requisições rapidamente
  for (let i = 0; i < 100; i++) {
    const res = http.get(`${BASE_URL}/api/trpc`);

    if (i > 50) {
      check(res, {
        'Rate limit ativado': (r) => r.status === 429,
      });
    }
  }
}

// ============================================
// EXECUÇÃO DE TODOS OS TESTES
// ============================================

export default function () {
  console.log('🛡️ Iniciando Testes de Segurança OWASP...\n');

  testSQLInjection();
  testXSS();
  testCSRF();
  testWeakAuth();
  testAccessControl();
  testSecurityHeaders();
  testDataExposure();
  testInputValidation();
  testLogging();
  testRateLimiting();

  console.log('\n✅ Testes de Segurança Concluídos!');
}
