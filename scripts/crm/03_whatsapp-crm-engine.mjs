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

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── CONFIG ────────────────────────────────────────────────
const SUPABASE_URL   = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDemo'; // Configurar no .env
const MAX_PER_DAY    = 50;   // Limite diário de mensagens (protege contra banimento)
const MIN_DELAY_MS   = 15000; // 15 segundos mínimo entre envios
const MAX_DELAY_MS   = 45000; // 45 segundos máximo

const INVITE_MESSAGE = `Assunto: *Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz | A Revolução da Medicina Canabinoide* 🌿

Prezado(a) Doutor(a),

A medicina canabinoide no Brasil vive uma expansão sem precedentes. Convidamos você para se tornar *Médico Sócio Prescritor na Planta y Raíz* — a melhor, mais rentável e mais completa plataforma de telemedicina do país.

🏆 *POR QUE A PLANTA Y RAÍZ É INCOMPARÁVEL?*
• *Taxa da Plataforma:* Apenas 7% (você retém 93% do valor da consulta)
• *Repasse Financeiro:* PIX Instantâneo na sua conta ao término da consulta
• *Preço da Consulta:* Total liberdade para definir seus honorários
• *Distribuição de Lucros:* Sócio Prescritor com participação nos resultados globais
• *Plano de Indicação:* Bonificação recorrente até a 3ª Geração de médicos indicados
• *Tecnologia IA:* Triagem inteligente, prontuário integrado e checagem CYP450
• *Custo de Adesão:* Cadastro 100% GRATUITO

🌿 *Garanta sua vaga como Médico Sócio Prescritor!*
O cadastro é gratuito e leva menos de 2 minutos.

👉 *Realize seu cadastro agora mesmo:*
https://plantayraiz.com.br

Seja muito bem-vindo(a) à medicina do futuro.

Atenciosamente,
*Diretoria Médica & Conselho Executivo*
*Planta y Raíz Ltda* 🌿💚`;

const FOLLOWUP_MESSAGE = `🌿 *Olá, Doutor(a)!*

Sou a *Brisa*, assistente da *Planta y Raíz*.

Queria retomar o contato sobre nossa plataforma de telemedicina canabinoide — a única com *93% de repasse e PIX instantâneo* ao médico.

Ficou com alguma dúvida? Estou aqui para ajudar! 😊

👉 Cadastro gratuito em: https://plantayraiz.com.br`;

// ── SUPABASE & GEMINI ─────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let genAI = null;
try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} catch (e) {
  console.warn('⚠️  Gemini AI não configurado. Respostas automáticas desabilitadas.');
}

// ── BRISA AI SYSTEM PROMPT ────────────────────────────────
const BRISA_SYSTEM_PROMPT = `Você é a *Brisa*, a Enfermeira Digital da plataforma Planta y Raíz — a maior plataforma de telemedicina canabinoide do Brasil.

Sua missão é atender médicos prescritores que receberam nosso convite e guiá-los até o cadastro na plataforma.

SOBRE A PLATAFORMA:
- Taxa de apenas 7% (médico retém 93% do valor)
- PIX instantâneo ao término da consulta
- Distribuição de lucros como sócio-prescritor
- Plano de indicação: bonificação até 3ª geração
- Tecnologia IA com prontuário integrado e checagem CYP450
- Cadastro 100% GRATUITO em: https://plantayraiz.com.br

COMO AGIR:
1. Seja sempre calorosa, profissional e empática
2. Responda dúvidas sobre a plataforma com clareza
3. Quebre objeções mostrando os benefícios exclusivos
4. Sempre termine com o link: https://plantayraiz.com.br
5. Nunca prometa o que a plataforma não oferece
6. Máximo 3 parágrafos curtos por resposta

OBJEÇÕES COMUNS:
- "Já tenho plataforma": Mostre a diferença nos 93% e o plano de sócios
- "Tenho medo de questões legais": A plataforma é 100% legal e regulamentada
- "Não sei prescrever cannabis": Oferecemos treinamento e suporte
- "Taxa muito alta": Nossa taxa é a MENOR do mercado (7% vs 20-40% dos concorrentes)`;

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
      console.log(`   ⚠️  Número inválido: ${phone}`);
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
    console.error(`   ❌ Erro ao enviar para ${phone}:`, err.message);
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
    console.log(`[${sent + 1}/${leads.length}] 📱 Enviando para: ${lead.name} | +${phone}`);

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
