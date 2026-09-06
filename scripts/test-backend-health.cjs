require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBackendHealth() {
  console.log('🧪 Iniciando Supabase Local Health Check...');

  // 1. Check RPC: Triage Severity
  console.log('\n--- Testando Fuzzy Triage ---');
  const { data: triageData, error: triageErr } = await supabase.rpc('calculate_fuzzy_triage_severity', { symptoms_text: 'Estou com dor no peito e febre alta' });
  if (triageErr) {
    console.error('❌ Erro RPC Triage:', triageErr.message);
  } else {
    console.log('✅ Triage Score Calculado:', triageData);
  }

  // 2. Check Affiliates Wallet
  console.log('\n--- Testando Carteira de Afiliados (MLM) ---');
  const mockUserId = '00000000-0000-0000-0000-000000000000'; 
  const { data: walletData, error: walletErr } = await supabase.rpc('ensure_affiliate_wallet', { user_uuid: mockUserId });
  if (walletErr && !walletErr.message.includes('foreign key')) {
    console.error('❌ Erro Ensure Wallet:', walletErr.message);
  } else {
    console.log('✅ Ensure Wallet executou com sucesso (ou constraint de teste de FK esperada).');
  }

  // 3. Check Crons
  console.log('\n--- Testando PG_CRON Health ---');
  const { data: cronData, error: cronErr } = await supabase.rpc('get_cron_health');
  if (cronErr) {
    console.error('❌ Erro Cron Health:', cronErr.message);
  } else {
    console.log('✅ Cron Health recuperado. Jobs Ativos:', cronData ? cronData.length : 0);
  }

  console.log('\n🎉 Health Check Concluído! Para resetar o banco local use: `supabase db reset`');
}

testBackendHealth();
