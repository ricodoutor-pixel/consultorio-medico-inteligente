import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

console.log('=================================================================');
console.log('🩺 AUDITORIA PROFUNDA DE INTEGRIDADE PÓS-QUEDA DE ENERGIA');
console.log('=================================================================\n');

async function testSupabaseShmb() {
  console.log('📌 1. Banco Supabase Principal (shmbwdjuddvquszwkvuq):');
  const url = process.env.VITE_SUPABASE_URL || 'https://shmbwdjuddvquszwkvuq.supabase.co';
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const client = createClient(url, key);

  const tables = ['profiles', 'doctors', 'appointments', 'prescriptions', 'products', 'tcle_consents', 'leads'];
  for (const table of tables) {
    try {
      const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`   - Tabela '${table}': [RLS / Protegido / Não existe: ${error.message}]`);
      } else {
        console.log(`   - Tabela '${table}': ✅ Acessível (Total de registros: ${count ?? 0})`);
      }
    } catch (e) {
      console.log(`   - Tabela '${table}': ❌ Erro: ${e.message}`);
    }
  }
}

async function testSupabaseTkxx() {
  console.log('\n📌 2. Banco Supabase Secundário (tkxxoghzhvhjzdoomgss):');
  const url = process.env.SUPABASE_URL || 'https://tkxxoghzhvhjzdoomgss.supabase.co';
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.log('   (Não configurado)');
    return;
  }
  const client = createClient(url, key);
  const tables = ['doctors', 'profiles', 'patients', 'leads'];
  for (const table of tables) {
    try {
      const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`   - Tabela '${table}': [${error.message}]`);
      } else {
        console.log(`   - Tabela '${table}': ✅ Acessível (Total de registros: ${count ?? 0})`);
      }
    } catch (e) {
      console.log(`   - Tabela '${table}': ❌ Erro: ${e.message}`);
    }
  }
}

async function testSmtpAuth() {
  console.log('\n📌 3. Autenticação Completa SMTP Hostinger:');
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'contato@plantayraiz.com.br',
        pass: process.env.SMTP_PASS || '95654045Pa#'
      },
      connectionTimeout: 7000
    });

    const verifyResult = await transporter.verify();
    if (verifyResult) {
      console.log(`   ✅ Autenticação SMTP Aprovada! Credenciais válidas para ${process.env.SMTP_USER}`);
    }
  } catch (err) {
    console.log(`   ❌ Falha na autenticação SMTP: ${err.message}`);
  }
}

async function testBrevo() {
  console.log('\n📌 4. Brevo API (Campanhas & Transacional):');
  try {
    const r = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY || '' }
    });
    if (r.ok) {
      const d = await r.json();
      console.log(`   ✅ Conexão OK | Conta: ${d.email} | Plano: ${d.plan?.[0]?.type || 'N/A'} | Créditos: ${JSON.stringify(d.plan?.[0]?.credits || 'OK')}`);
    } else {
      console.log(`   ⚠️ Resposta Brevo: HTTP ${r.status}`);
    }
  } catch (e) {
    console.log(`   ❌ Erro Brevo: ${e.message}`);
  }
}

async function testWaha() {
  console.log('\n📌 5. WAHA WhatsApp Engine (Railway):');
  const wahaUrl = (process.env.WAHA_API_URL || 'https://waha-production-4e9c.up.railway.app').replace(/\/$/, '');
  const wahaKey = process.env.WAHA_API_KEY || 'planta123';
  try {
    const r = await fetch(`${wahaUrl}/api/sessions?all=true`, {
      headers: { 'X-Api-Key': wahaKey },
      signal: AbortSignal.timeout(6000)
    });
    if (r.ok) {
      const sessions = await r.json();
      console.log(`   ✅ Servidor WAHA Online! Sessões encontradas:`, JSON.stringify(sessions));
    } else {
      console.log(`   ⚠️ Resposta WAHA: HTTP ${r.status}`);
    }
  } catch (e) {
    console.log(`   ❌ WAHA Erro: ${e.message}`);
  }
}

async function run() {
  await testSupabaseShmb();
  await testSupabaseTkxx();
  await testSmtpAuth();
  await testBrevo();
  await testWaha();
  console.log('\n=================================================================');
  console.log('✅ AUDITORIA CONCLUÍDA');
  console.log('=================================================================');
}

run();
