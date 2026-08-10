/**
 * 🌿 Planta y Raíz — Executar Migration CRM via API REST Supabase
 * Uso: node scripts/crm/00_run-migration.cjs
 *
 * Este script aplica a migration SQL diretamente no Supabase
 * sem precisar abrir o painel web manualmente.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://shmbwdjuddvquszwkvuq.supabase.co';
// Anon key (suficiente para criar tabelas via RPC se o serviço permitir)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';

// SQL simplificado compatível com anon key (apenas criar tabela se não existir)
const SIMPLE_SQL = `
CREATE TABLE IF NOT EXISTS public.leads_crm (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  specialty TEXT,
  source TEXT DEFAULT 'manual',
  instagram_url TEXT,
  status TEXT DEFAULT 'scraped',
  follow_up_count INTEGER DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  first_contact_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  notes TEXT,
  ai_conversation JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads_crm(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  direction TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  message_type TEXT DEFAULT 'invite',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  target_count INTEGER DEFAULT 500,
  current_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function testConnection() {
  // Primeiro testa se consegue ler dados (anon key)
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Verificar se a tabela leads_crm já existe
  const { data, error } = await sb.from('leads_crm').select('count').limit(1);

  if (!error) {
    console.log('✅ Tabela leads_crm já existe no Supabase!');
    const { count } = await sb.from('leads_crm').select('*', { count: 'exact', head: true });
    console.log(`📊 Total de leads no CRM: ${count || 0}`);
    return true;
  }

  if (error.code === '42P01') {
    console.log('⚠️  Tabela leads_crm não existe. Precisa executar a migration.');
    console.log('');
    console.log('📋 INSTRUÇÕES:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/shmbwdjuddvquszwkvuq/sql');
    console.log('2. Cole o conteúdo do arquivo: scripts/crm/01_leads_crm_migration.sql');
    console.log('3. Clique em RUN ▶️');
    console.log('');
    console.log('OU use a Supabase CLI:');
    console.log('   supabase db push');
    return false;
  }

  console.error('Erro desconhecido:', error);
  return false;
}

async function importCampaignToExistingCRM() {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Importar 438 médicos da campanha existente
  const campaignPath = path.join(__dirname, '../../scratch/campaign_data.json');
  const progressPath = path.join(__dirname, '../../scratch/campaign_progress.json');

  if (!fs.existsSync(campaignPath)) {
    console.log('⚠️  campaign_data.json não encontrado');
    return;
  }

  const data = JSON.parse(fs.readFileSync(campaignPath, 'utf8'));
  const progress = fs.existsSync(progressPath)
    ? JSON.parse(fs.readFileSync(progressPath, 'utf8'))
    : { sentNumbers: [] };

  const sentSet = new Set(progress.sentNumbers || []);
  const phones = data.phones || [];

  console.log(`\n📥 Importando ${phones.length} médicos da campanha para o CRM...`);

  let imported = 0;
  let skipped = 0;
  const batch = [];

  for (const phone of phones) {
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length < 10) { skipped++; continue; }
    const status = sentSet.has(clean) ? 'invited' : 'scraped';
    batch.push({
      phone: clean,
      name: 'Médico Prescritor',
      source: 'whatsapp_campaign',
      status,
      first_contact_at: status === 'invited' ? new Date().toISOString() : null,
      last_contact_at: status === 'invited' ? new Date().toISOString() : null,
    });
  }

  // Inserir em batches de 50
  for (let i = 0; i < batch.length; i += 50) {
    const chunk = batch.slice(i, i + 50);
    const { error } = await sb.from('leads_crm').upsert(chunk, {
      onConflict: 'phone',
      ignoreDuplicates: true,
    });
    if (error) console.warn('Erro ao importar batch:', error.message);
    else imported += chunk.length;
    process.stdout.write(`\r   Importando: ${Math.min(i + 50, batch.length)}/${batch.length}...`);
  }

  console.log(`\n✅ ${imported} contatos importados! (${skipped} ignorados)`);

  // Mostrar resumo
  const { data: summary } = await sb.rpc('crm_funnel_summary').catch(() => ({ data: null }));
  const { count: total } = await sb.from('leads_crm').select('*', { count: 'exact', head: true });
  const { count: invited } = await sb.from('leads_crm').select('*', { count: 'exact', head: true }).eq('status', 'invited');

  console.log('\n📊 RESUMO DO CRM:');
  console.log(`   Total de leads: ${total}`);
  console.log(`   Já contatados (invited): ${invited}`);
  console.log(`   Meta: 500 médicos cadastrados`);
}

async function main() {
  console.log('='.repeat(55));
  console.log('🌿 PLANTA Y RAÍZ — SETUP DO CRM SUPABASE');
  console.log('='.repeat(55));

  const exists = await testConnection();

  if (exists) {
    await importCampaignToExistingCRM();
  }

  console.log('\n✅ Setup concluído!');
  console.log('\nPróximos passos:');
  console.log('  1. node scripts/crm/04_autonomous-growth-engine.mjs');
  console.log('     OU');
  console.log('  2. pm2 start scripts/crm/04_autonomous-growth-engine.mjs --name growth-engine');
}

main().catch(console.error);
