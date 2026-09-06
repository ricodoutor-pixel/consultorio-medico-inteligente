import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tkxxoghzhvhjzdoomgss.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrado no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function run() {
  const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260828030000_lead_hunter_engine.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log(`📄 Aplicando migração Lead Hunter (${sql.length} bytes)...`);

  // Try RPC exec_sql / execute_sql
  const rpcNames = ['exec_sql', 'execute_sql', 'exec_ddl', 'run_sql'];
  let applied = false;

  for (const rpc of rpcNames) {
    try {
      const { data, error } = await supabase.rpc(rpc, { sql_query: sql, query: sql, sql });
      if (!error) {
        console.log(`✅ Migração aplicada via RPC ${rpc}!`);
        applied = true;
        break;
      }
    } catch (_) {}
  }

  if (!applied) {
    // Direct Postgres execution via Supabase management API if available
    console.log('ℹ️ RPC de DDL direto indisponível, testando conectividade de tabela...');
  }

  // Check if doctor_leads_hunt is queryable
  const { data: testData, error: testErr } = await supabase
    .from('doctor_leads_hunt')
    .select('*')
    .limit(5);

  if (testErr) {
    console.log('⚠️ Tabela doctor_leads_hunt ainda não existe no Postgres remoto:', testErr.message);
  } else {
    console.log(`✅ Tabela doctor_leads_hunt pronta e acessível com ${testData.length} registros!`);
  }
}

run();
