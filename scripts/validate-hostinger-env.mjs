/**
 * 🔍 Validador de Variáveis de Ambiente de Produção — Hostinger / Planta y Raiz
 *
 * Valida as 7 variáveis obrigatórias identificadas na auditoria técnica de zero tolerância:
 * 1. SUPABASE_URL
 * 2. SUPABASE_PUBLISHABLE_KEY
 * 3. MERCADO_PAGO_PUBLIC_KEY
 * 4. PAYMENTS_CLIENT_TOKEN
 * 5. FACEBOOK_PIXEL_ID
 * 6. API_URL
 * 7. RUVIEW_WS_URL
 */

import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const envMap = new Map();

  // Carrega .env se existir
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key) {
        const rawVal = rest.join('=').trim();
        const cleanVal = rawVal.replace(/^["']|["']$/g, '').trim();
        envMap.set(key.trim(), cleanVal);
      }
    }
  }

  // Permite sobreposição com process.env
  for (const [k, v] of Object.entries(process.env)) {
    if (v) envMap.set(k, v.replace(/^["']|["']$/g, '').trim());
  }

  return envMap;
}

const env = loadEnv();

const HOSTINGER_REQUIRED_VARS = [
  {
    name: 'SUPABASE_URL',
    aliases: ['VITE_SUPABASE_URL'],
    description: 'Endpoint REST e Realtime do Supabase',
    validate: (val) => val && val.startsWith('https://') && val.includes('.supabase.co'),
  },
  {
    name: 'SUPABASE_PUBLISHABLE_KEY',
    aliases: ['VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY'],
    description: 'Chave pública (anon) do Supabase para o cliente frontend',
    validate: (val) => val && val.length > 20,
  },
  {
    name: 'MERCADO_PAGO_PUBLIC_KEY',
    aliases: ['VITE_MERCADO_PAGO_PUBLIC_KEY'],
    description: 'Chave pública do Mercado Pago para checkout transparente e split PIX',
    validate: (val) => val && (val.startsWith('APP_USR-') || val.startsWith('TEST-') || val.length > 10),
  },
  {
    name: 'PAYMENTS_CLIENT_TOKEN',
    aliases: ['VITE_PAYMENTS_CLIENT_TOKEN', 'VITE_STRIPE_PUBLISHABLE_KEY'],
    description: 'Token de cliente do gateway de pagamentos internacionais (Stripe/MP)',
    validate: (val) => val && val.length > 5,
  },
  {
    name: 'FACEBOOK_PIXEL_ID',
    aliases: ['VITE_FACEBOOK_PIXEL_ID'],
    description: 'ID do Meta/Facebook Pixel para conversões CAPI e PageView',
    validate: (val) => val && /^\d+$/.test(val),
  },
  {
    name: 'API_URL',
    aliases: ['VITE_API_URL', 'VITE_FRONTEND_URL'],
    description: 'URL base da API / Webhooks da plataforma',
    validate: (val) => val && /^https?:\/\//.test(val),
  },
  {
    name: 'RUVIEW_WS_URL',
    aliases: ['VITE_RUVIEW_WS_URL'],
    description: 'Endpoint WebSocket para telemetria de monitoramento CSI em tempo real',
    validate: (val) => val && /^(wss?|https?):\/\//.test(val),
  },
];

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('🔍 AUDITORIA DE VARIÁVEIS DE AMBIENTE — HOSTINGER PRODUÇÃO');
console.log('═══════════════════════════════════════════════════════════════════════\n');

let validCount = 0;
let missingCount = 0;
const report = [];

for (const item of HOSTINGER_REQUIRED_VARS) {
  let matchedKey = null;
  let val = null;

  if (env.has(item.name) && env.get(item.name)) {
    matchedKey = item.name;
    val = env.get(item.name);
  } else {
    for (const alias of item.aliases) {
      if (env.has(alias) && env.get(alias)) {
        matchedKey = alias;
        val = env.get(alias);
        break;
      }
    }
  }

  const isValid = val && item.validate(val);

  if (isValid) {
    validCount++;
    const masked = val.length > 12 ? `${val.slice(0, 6)}...${val.slice(-4)}` : '******';
    report.push({
      status: '✅ ATIVA',
      key: item.name,
      matched: matchedKey,
      preview: masked,
      description: item.description,
    });
  } else if (val) {
    report.push({
      status: '⚠️ INVÁLIDA',
      key: item.name,
      matched: matchedKey,
      preview: 'Formato divergente',
      description: item.description,
    });
  } else {
    missingCount++;
    report.push({
      status: '❌ AUSENTE',
      key: item.name,
      matched: 'Não configurada',
      preview: 'Sem valor',
      description: item.description,
    });
  }
}

for (const r of report) {
  console.log(`${r.status.padEnd(10)} | ${r.key.padEnd(26)} | Match: ${r.matched.padEnd(28)} | ${r.description}`);
}

console.log('\n───────────────────────────────────────────────────────────────────────');
console.log(`Resultado: ${validCount}/${HOSTINGER_REQUIRED_VARS.length} variáveis validadas com sucesso.`);
if (missingCount > 0) {
  console.log(`Aviso: ${missingCount} variável(is) requer(em) atenção nas variáveis de ambiente do painel Hostinger.`);
}
console.log('───────────────────────────────────────────────────────────────────────\n');
