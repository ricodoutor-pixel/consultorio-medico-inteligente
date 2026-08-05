// apply-migration.js — Aplica a migration via Supabase REST API usando service_role
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://tkxxoghzhvhjzdoomgss.supabase.co';
// Usar o service_role key que está no .env
const { config } = await import('dotenv');
config({ path: join(__dirname, '.env') });

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE) {
  console.error('❌ SERVICE_ROLE_KEY não encontrado no .env');
  process.exit(1);
}

console.log('🔑 Service role key encontrada');

const sql = readFileSync(
  join(__dirname, 'supabase/migrations/20260805_fundoscopy_database.sql'),
  'utf-8'
);

console.log('📄 Migration SQL carregada:', sql.length, 'chars');

// Executar via fetch direto na API do Supabase
const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE}`,
    'apikey': SERVICE_ROLE,
  },
  body: JSON.stringify({ sql_query: sql }),
});

if (!resp.ok) {
  const err = await resp.text();
  console.error('❌ Erro na API:', resp.status, err);
  
  // Tentar via pg direto se disponível
  console.log('🔄 Tentando via PostgreSQL direto...');
  
  // Split SQL em statements individuais e executar via RPC Supabase
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  
  // Statements separados
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));
  
  console.log(`📊 ${statements.length} statements para executar`);
  
  let success = 0;
  let failed = 0;
  
  for (const stmt of statements) {
    try {
      const { error } = await sb.rpc('exec_sql', { sql_query: stmt + ';' });
      if (error) {
        console.warn('⚠️', stmt.slice(0, 50), '→', error.message);
        failed++;
      } else {
        success++;
      }
    } catch (e) {
      failed++;
    }
  }
  
  console.log(`✅ ${success} OK | ❌ ${failed} falhou`);
} else {
  const data = await resp.json();
  console.log('✅ Migration aplicada com sucesso!', JSON.stringify(data).slice(0, 200));
}
