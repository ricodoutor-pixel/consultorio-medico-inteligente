import * as dotenv from 'dotenv';
import https from 'node:https';
import tls from 'node:tls';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

console.log('====================================================');
console.log('🔍 INICIANDO DIAGNÓSTICO DO SISTEMA PLANTA Y RAIZ');
console.log('Data/Hora:', new Date().toLocaleString('pt-BR'));
console.log('====================================================\n');

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          sizeBytes: data.length,
          title: data.match(/<title>(.*?)<\/title>/i)?.[1] || 'N/A'
        });
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout (8s)' });
    });
  });
}

async function runAudit() {
  // 1. Web
  console.log('🌐 [1/5] TESTANDO PORTAL EM PRODUÇÃO (Hostinger CDN / SSL)');
  const pages = [
    'https://plantayraiz.com.br',
    'https://plantayraiz.com.br/telemedicina',
    'https://plantayraiz.com.br/planos',
    'https://plantayraiz.com.br/admin-login',
    'https://plantayraiz.com.br/shopping'
  ];
  for (const page of pages) {
    const res = await checkUrl(page);
    if (res.ok) {
      console.log(`  ✅ ${page} -> HTTP ${res.status} (${res.sizeBytes} bytes) - [${res.title}]`);
    } else {
      console.log(`  ❌ ${page} -> Falha: ${res.error || res.status}`);
    }
  }

  // 2. Supabase
  console.log('\n🗄️  [2/5] TESTANDO BANCO DE DADOS SUPABASE');
  const supaUrl = process.env.VITE_SUPABASE_URL || 'https://shmbwdjuddvquszwkvuq.supabase.co';
  const supaKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (supaUrl && supaKey) {
    try {
      const client = createClient(supaUrl, supaKey);
      const t0 = Date.now();
      const { count, error } = await client.from('profiles').select('*', { count: 'exact', head: true });
      const lat = Date.now() - t0;
      if (error) {
        console.log(`  ❌ Supabase (${supaUrl}): Erro: ${error.message}`);
      } else {
        console.log(`  ✅ Supabase Conectado! Latência: ${lat}ms | Registros na tabela profiles: ${count ?? 'OK'}`);
      }
    } catch (e) {
      console.log(`  ❌ Supabase Exception: ${e.message}`);
    }
  }

  // 3. SMTP Hostinger
  console.log('\n📧 [3/5] TESTANDO SERVIÇO DE E-MAIL (Hostinger SMTP SSL)');
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  await new Promise((resolve) => {
    const s = tls.connect({ host, port, timeout: 6000 }, () => {
      s.once('data', (d) => {
        console.log(`  ✅ SMTP Conectado com sucesso (${host}:${port}) - Resposta: ${d.toString().trim()}`);
        s.end();
        resolve();
      });
    });
    s.on('error', (e) => {
      console.log(`  ❌ SMTP Erro: ${e.message}`);
      resolve();
    });
    s.on('timeout', () => {
      s.destroy();
      console.log(`  ❌ SMTP Timeout`);
      resolve();
    });
  });

  // 4. Brevo API
  console.log('\n📨 [4/5] TESTANDO SERVIÇO DE MARKETING (Brevo API)');
  if (process.env.BREVO_API_KEY) {
    try {
      const r = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': process.env.BREVO_API_KEY }
      });
      if (r.ok) {
        const d = await r.json();
        console.log(`  ✅ Brevo Online! Conta: ${d.email} | Plano: ${d.plan?.[0]?.type || 'Standard'}`);
      } else {
        console.log(`  ⚠️  Brevo respondeu HTTP ${r.status}`);
      }
    } catch (e) {
      console.log(`  ❌ Brevo Erro: ${e.message}`);
    }
  }

  // 5. WhatsApp / WAHA
  console.log('\n📱 [5/5] TESTANDO INTEGRAÇÃO WHATSAPP (WAHA Railway)');
  try {
    const wahaUrl = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
    const wahaKey = process.env.WAHA_API_KEY || 'planta123';
    const r = await fetch(`${wahaUrl}/api/sessions?all=true`, {
      headers: { 'X-Api-Key': wahaKey },
      signal: AbortSignal.timeout(6000)
    });
    if (r.ok) {
      const d = await r.json();
      const s = Array.isArray(d) ? d[0] : d;
      console.log(`  ✅ WAHA Ativo! Sessão: ${s?.name || 'default'} - Status: ${s?.status || 'N/A'}`);
    } else {
      console.log(`  ⚠️  WAHA respondeu HTTP ${r.status}`);
    }
  } catch (e) {
    console.log(`  ℹ️  WAHA Railway Status: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
  console.log('====================================================\n');
}

runAudit();
