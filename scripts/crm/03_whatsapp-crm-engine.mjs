/**
 * 🌿 Planta y Raíz — WhatsApp CRM Engine (Dispatcher + AI Brisa)
 * Script: whatsapp-crm-engine.mjs
 *
 * Motor de disparo via WhatsApp Web + Puppeteer.
 * Envia convites, follow-ups e usa Gemini AI como "Enfermeira Brisa"
 * para responder dúvidas e guiar médicos até o cadastro.
 *
 * Uso: node scripts/crm/03_whatsapp-crm-engine.mjs
 * Com PM2: pm2 start scripts/crm/03_whatsapp-crm-engine.mjs --name "wpp-crm"
 */

// 🛑 DESATIVADO PERMANENTEMENTE: Disparos frios via Puppeteer/WhatsApp Web estão suspensos (decisão Dr. Edilson).
console.log('🛑 [WPP-CRM] Script desativado permanentemente. Convites só por envio manual do admin em horário comercial (Seg-Sáb, 9h-19h BRT) para médicos com CRM confirmado.');
process.exit(0);

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { T } from '../../supabase/functions/_shared/brisa-templates.mjs';

// ── CONFIG ────────────────────────────────────────────────
const SUPABASE_URL   = process.env.SUPABASE_URL || 'https://shmbwdjuddvquszwkvuq.supabase.co';
const SUPABASE_KEY   = process.env.SUPABASE_ANON_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MAX_PER_DAY    = 50;
const MIN_DELAY_MS   = 15000;
const MAX_DELAY_MS   = 45000;

const INVITE_MESSAGE = T.doctorInvite('');
const FOLLOWUP_MESSAGE = T.doctorGreeting('');

// ── SUPABASE & GEMINI ─────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let genAI = null;
try {
  genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
} catch (e) {
  console.warn('⚠️  Gemini AI não configurado. Respostas automáticas desabilitadas.');
}

const BRISA_SYSTEM_PROMPT = `Você é a Enfª Brisa, assistente virtual da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.).
- Taxa fixa da plataforma: 7% em todos os planos (repasse de 93% via PIX).
- Cadastro gratuito para médicos com CRM ativo: https://www.plantayraiz.com.br/cadastro-profissional
- Nunca prometa renda, lucros ou benefícios não implementados.`;

async function askBrisa(doctorMessage, history = []) {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: BRISA_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Entendido! Estou pronta para atender os médicos como a Brisa da Planta y Raíz.' }] },
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
      ],
    });
    const result = await chat.sendMessage(doctorMessage);
    return result.response.text();
  } catch (err) {
    console.error('Erro Gemini:', err.message);
    return null;
  }
}

// ── WHATSAPP WEB VIA PUPPETEER ────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function randomDelay() {
  return sleep(Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS) + MIN_DELAY_MS));
}

async function openWhatsAppWeb(browser) {
  const page = await browser.newPage();
  await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 60000 });

  // Esperar QR code ou login
  console.log('⏳ Aguardando WhatsApp Web carregar...');
  await page.waitForSelector('[data-testid="chat-list"], #side', { timeout: 60000 });
  console.log('✅ WhatsApp Web pronto!');
  return page;
}

async function sendWhatsAppMessage(browser, phone, message) {
  const page = await browser.newPage();
  try {
    const encoded = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(4000); // Aguarda chat abrir

    // Verificar se o número existe no WhatsApp
    const invalidPhone = await page.$('[data-testid="popup-contents"]')
      .then(el => el ? true : false)
      .catch(() => false);

    if (invalidPhone) {
      console.log(`   ⚠️  Número inválido: ***${String(phone).slice(-4)}`);
      return 'invalid';
    }

    // Clicar no botão de enviar
    const sendBtn = await page.waitForSelector(
      'span[data-testid="send"], button[aria-label="Enviar"], [data-testid="compose-btn-send"]',
      { timeout: 10000 }
    ).catch(() => null);

    if (!sendBtn) {
      // Fallback: usar Enter
      await page.keyboard.press('Enter');
    } else {
      await sendBtn.click();
    }

    await sleep(2000);
    return 'sent';
  } catch (err) {
    console.error(`   ❌ Erro ao enviar para ***${String(phone).slice(-4)}:`, err.message);
    return 'error';
  } finally {
    await page.close();
  }
}

// ── LÓGICA PRINCIPAL DO CRM ───────────────────────────────

async function processInvites(browser, dailyCount) {
  const remaining = MAX_PER_DAY - dailyCount;
  if (remaining <= 0) {
    console.log('📊 Limite diário de envios atingido. Retomando amanhã.');
    return 0;
  }

  // Buscar leads pendentes (status = scraped)
  const { data: leads, error } = await supabase
    .from('leads_crm')
    .select('*')
    .eq('status', 'scraped')
    .not('phone', 'ilike', 'nophone%')
    .order('created_at', { ascending: true })
    .limit(remaining);

  if (error || !leads?.length) {
    console.log('📭 Sem leads novos para processar.');
    return 0;
  }

  console.log(`\n📤 Processando ${leads.length} convites...`);
  let sent = 0;

  for (const lead of leads) {
    const phone = lead.phone.replace(/\D/g, '');
    console.log(`[${sent + 1}/${leads.length}] 📱 Enviando para: ***${String(phone).slice(-4)}`);

    const result = await sendWhatsAppMessage(browser, phone, INVITE_MESSAGE);

    if (result === 'sent') {
      await supabase.from('leads_crm').update({
        status: 'invited',
        first_contact_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString(),
      }).eq('id', lead.id);

      await supabase.from('crm_messages').insert({
        lead_id: lead.id,
        phone,
        direction: 'outbound',
        message: INVITE_MESSAGE,
        message_type: 'invite',
        status: 'sent',
      });

      sent++;
      console.log(`   ✅ Enviado! Total hoje: ${dailyCount + sent}`);
    } else if (result === 'invalid') {
      await supabase.from('leads_crm').update({ status: 'blocked' }).eq('id', lead.id);
    }

    await randomDelay();
  }

  return sent;
}

async function processFollowUps(browser) {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from('leads_crm')
    .select('*')
    .in('status', ['invited', 'in_progress'])
    .lt('last_contact_at', threeDaysAgo)
    .lt('follow_up_count', 3) // Máximo 3 follow-ups
    .limit(10);

  if (!leads?.length) return 0;

  console.log(`\n🔔 Processando ${leads.length} follow-ups...`);
  let sent = 0;

  for (const lead of leads) {
    const phone = lead.phone.replace(/\D/g, '');
    const result = await sendWhatsAppMessage(browser, phone, FOLLOWUP_MESSAGE);

    if (result === 'sent') {
      await supabase.from('leads_crm').update({
        follow_up_count: (lead.follow_up_count || 0) + 1,
        last_contact_at: new Date().toISOString(),
      }).eq('id', lead.id);

      sent++;
    }
    await randomDelay();
  }

  return sent;
}

// ── ENTRY POINT ───────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('🌿 PLANTA Y RAÍZ — WHATSAPP CRM ENGINE');
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);
  console.log('='.repeat(60));

  // Abrir Chrome COM WhatsApp Web visível na tela
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      `--user-data-dir=${process.env.APPDATA}\\WhatsAppWebProfile`, // Mantém sessão salva!
    ],
  });

  // Abrir WhatsApp Web (reusar sessão salva)
  await openWhatsAppWeb(browser);

  let dailySent = 0;

  // Processar convites novos
  const invitesSent = await processInvites(browser, dailySent);
  dailySent += invitesSent;

  // Processar follow-ups
  const followUpsSent = await processFollowUps(browser);
  dailySent += followUpsSent;

  // Relatório final
  const { count: totalRegistered } = await supabase
    .from('leads_crm')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'registered');

  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DO MOTOR CRM');
  console.log(`   Convites enviados hoje: ${invitesSent}`);
  console.log(`   Follow-ups enviados: ${followUpsSent}`);
  console.log(`   Médicos cadastrados (meta 500): ${totalRegistered || 0}/500`);
  console.log('='.repeat(60));

  // Manter o Chrome aberto 5 minutos para o usuário ver
  await sleep(5 * 60 * 1000);
  await browser.close();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erro fatal no CRM Engine:', err);
  process.exit(1);
});
