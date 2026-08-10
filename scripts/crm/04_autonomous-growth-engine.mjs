/**
 * 🌿 Planta y Raíz — Motor de Crescimento Autônomo 24/7
 * Script: autonomous-growth-engine.mjs
 *
 * Orquestrador principal que roda em loop infinito até atingir
 * a meta de 500 médicos cadastrados na plataforma.
 *
 * Uso direto: node scripts/crm/04_autonomous-growth-engine.mjs
 * Com PM2:    pm2 start scripts/crm/04_autonomous-growth-engine.mjs --name "growth-engine"
 *
 * FLUXO DIÁRIO:
 *   09:00h → Captação Instagram (100 leads)
 *   10:00h → Disparo WhatsApp (50 msgs)
 *   */30min → Verificar respostas e follow-ups
 *   23:59h → Relatório diário + checar meta 500
 */

import { createClient } from '@supabase/supabase-js';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIG ────────────────────────────────────────────────
const SUPABASE_URL = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';
const TARGET_DOCTORS = 500;
const LOG_FILE = path.join(__dirname, '../../scratch/growth-engine.log');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── UTILS ─────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(msg) {
  const timestamp = new Date().toLocaleString('pt-BR');
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function getHour() { return new Date().getHours(); }
function getMinute() { return new Date().getMinutes(); }

function msUntilHour(hour) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

// ── VERIFICAÇÃO DA META ───────────────────────────────────

async function checkGoalReached() {
  // Checar médicos aprovados na plataforma principal
  const { count: approvedDoctors } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'doctor')
    .eq('kyc_status', 'approved');

  const { count: crmRegistered } = await supabase
    .from('leads_crm')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'registered');

  const total = Math.max(approvedDoctors || 0, crmRegistered || 0);
  return { total, reached: total >= TARGET_DOCTORS };
}

// ── EXECUTAR SCRIPTS FILHOS ───────────────────────────────

async function runScript(scriptName, label) {
  return new Promise((resolve) => {
    log(`🚀 Iniciando: ${label}`);
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(data);
      fs.appendFileSync(LOG_FILE, data.toString());
    });
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    child.on('close', (code) => {
      log(`✅ ${label} concluído (código: ${code})`);
      resolve(code);
    });
    child.on('error', (err) => {
      log(`❌ Erro em ${label}: ${err.message}`);
      resolve(-1);
    });
  });
}

// ── IMPORTAR 438 MÉDICOS DA CAMPANHA EXISTENTE ───────────

async function importCampaignData() {
  const campaignPath = path.join(__dirname, '../../scratch/campaign_data.json');
  const progressPath = path.join(__dirname, '../../scratch/campaign_progress.json');

  if (!fs.existsSync(campaignPath)) {
    log('⚠️  campaign_data.json não encontrado. Pulando importação.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(campaignPath, 'utf8'));
  const progress = fs.existsSync(progressPath)
    ? JSON.parse(fs.readFileSync(progressPath, 'utf8'))
    : { sentNumbers: [] };

  const sentSet = new Set(progress.sentNumbers || []);
  const phones = data.phones || [];
  let imported = 0;

  log(`📥 Importando ${phones.length} médicos da campanha anterior...`);

  for (const phone of phones) {
    const clean = phone.replace(/\D/g, '');
    const status = sentSet.has(clean) ? 'invited' : 'scraped';

    const { error } = await supabase.from('leads_crm').upsert({
      phone: clean,
      name: 'Médico Prescritor',
      source: 'whatsapp_campaign',
      status,
      last_contact_at: status === 'invited' ? new Date().toISOString() : null,
      first_contact_at: status === 'invited' ? new Date().toISOString() : null,
    }, { onConflict: 'phone', ignoreDuplicates: true });

    if (!error) imported++;
  }
  log(`✅ ${imported} contatos importados para o CRM!`);
}

// ── DISPARO DIRETO VIA URL (Sem Puppeteer para lista inicial) ─

async function runDirectDispatch() {
  // Buscar leads com status scraped que têm telefone
  const { data: leads } = await supabase
    .from('leads_crm')
    .select('id, phone, name')
    .eq('status', 'scraped')
    .not('phone', 'ilike', 'nophone%')
    .order('created_at', { ascending: true })
    .limit(50);

  if (!leads?.length) {
    log('📭 Sem leads pendentes para disparo direto.');
    return;
  }

  const message = encodeURIComponent(
    `Assunto: *Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz* 🌿\n\nPrezado(a) Doutor(a),\n\nConvidamos você para se tornar *Médico Sócio Prescritor na Planta y Raíz* — com apenas 7% de taxa e repasse PIX instantâneo!\n\n🌿 Cadastro GRATUITO: https://plantayraiz.com.br\n\n*Diretoria Médica — Planta y Raíz Ltda* 💚`
  );

  log(`📤 Disparando para ${leads.length} leads via URL nativa...`);

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const phone = lead.phone.replace(/\D/g, '');
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${message}`;

    log(`[${i + 1}/${leads.length}] 📱 +${phone} — ${lead.name}`);

    // Abrir no Chrome do usuário
    try {
      const { exec } = await import('child_process');
      exec(`start chrome "${url}"`);
    } catch {}

    // Atualizar status no CRM
    await supabase.from('leads_crm').update({
      status: 'invited',
      first_contact_at: new Date().toISOString(),
      last_contact_at: new Date().toISOString(),
    }).eq('id', lead.id);

    // Delay humanizado
    const delay = Math.floor(Math.random() * 20000 + 15000);
    log(`   ⏳ Aguardando ${Math.round(delay / 1000)}s...`);
    await sleep(delay);
  }
}

// ── RELATÓRIO DIÁRIO ─────────────────────────────────────

async function generateDailyReport() {
  const { data: funnel } = await supabase
    .from('crm_funnel_summary')
    .select('*');

  const { total } = await checkGoalReached();

  log('\n' + '═'.repeat(60));
  log('📊 RELATÓRIO DIÁRIO — PLANTA Y RAÍZ GROWTH ENGINE');
  log('═'.repeat(60));

  if (funnel) {
    for (const row of funnel) {
      const bar = '█'.repeat(Math.min(20, Math.floor((row.total / 50))));
      log(`  ${row.status.padEnd(12)} | ${bar} ${row.total}`);
    }
  }

  log(`\n  🏆 META: ${total}/${TARGET_DOCTORS} médicos cadastrados`);
  const pct = Math.round((total / TARGET_DOCTORS) * 100);
  const progressBar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
  log(`  [${progressBar}] ${pct}%`);
  log('═'.repeat(60) + '\n');
}

// ── LOOP PRINCIPAL 24/7 ───────────────────────────────────

async function mainLoop() {
  log('');
  log('╔══════════════════════════════════════════════════════╗');
  log('║  🌿 PLANTA Y RAÍZ — MOTOR AUTÔNOMO DE CRESCIMENTO   ║');
  log('║  Meta: 500 médicos cadastrados na plataforma         ║');
  log('║  Modo: 24/7 Loop Infinito                            ║');
  log('╚══════════════════════════════════════════════════════╝');
  log('');

  // Importar campanha anterior na primeira execução
  const { count: existingLeads } = await supabase
    .from('leads_crm')
    .select('*', { count: 'exact', head: true });

  if ((existingLeads || 0) === 0) {
    log('🔄 Primeiro boot! Importando dados existentes...');
    await importCampaignData();
  } else {
    log(`📊 CRM já tem ${existingLeads} leads cadastrados.`);
  }

  let cycleCount = 0;

  // LOOP INFINITO
  while (true) {
    cycleCount++;
    log(`\n🔄 CICLO #${cycleCount} — ${new Date().toLocaleString('pt-BR')}`);

    // 1. Verificar se atingiu a meta
    const { total, reached } = await checkGoalReached();
    log(`🏆 Status da meta: ${total}/${TARGET_DOCTORS} médicos`);

    if (reached) {
      log('');
      log('╔══════════════════════════════════════════════════════╗');
      log('║  🎉🎉 META ATINGIDA! 500 MÉDICOS CADASTRADOS! 🎉🎉  ║');
      log('║  O sistema entra em modo STANDBY de acompanhamento.  ║');
      log('╚══════════════════════════════════════════════════════╝');
      log('');
      // Modo standby: verifica a cada 6 horas
      await sleep(6 * 60 * 60 * 1000);
      continue;
    }

    const hour = getHour();

    // 2. Horário comercial: 09:00 - 20:00
    if (hour >= 9 && hour < 20) {

      // 09:00 - 09:30: Captar novos leads
      if (hour === 9 && getMinute() < 30) {
        log('\n🕘 Horário de captação de leads...');
        await runScript('02_instagram-scraper.mjs', 'Instagram Scraper');
        await sleep(30 * 60 * 1000); // Aguarda 30 min
      }

      // 10:00+: Disparo de mensagens
      if (hour >= 10) {
        log('\n📤 Horário de disparo de mensagens...');
        await runDirectDispatch();
      }

    } else {
      log(`⏰ Fora do horário comercial (${hour}h). Aguardando 09:00h...`);
      const msToWait = Math.min(msUntilHour(9), 60 * 60 * 1000); // Máximo 1h de espera por ciclo
      await sleep(msToWait);
    }

    // 3. Relatório a cada 6 ciclos (~30min)
    if (cycleCount % 6 === 0) {
      await generateDailyReport();
    }

    // 4. Aguardar 5 minutos antes do próximo ciclo
    log(`\n⏳ Aguardando 5 minutos para o próximo ciclo...`);
    await sleep(5 * 60 * 1000);
  }
}

// ── INICIALIZAÇÃO ─────────────────────────────────────────
mainLoop().catch(err => {
  log(`❌ ERRO FATAL NO MOTOR: ${err.message}`);
  log('🔄 Reiniciando em 60 segundos...');
  setTimeout(() => mainLoop(), 60000);
});
