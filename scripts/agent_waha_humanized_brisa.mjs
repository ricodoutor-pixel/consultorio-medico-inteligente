/**
 * 🌿 Planta y Raiz — Agente Autônomo Enfª Brisa 360° Humanizada no WhatsApp
 * 
 * Funcionalidades:
 * 1. Atendimento humanizado, gentil, acolhedor e resolutivo (1 a 3 linhas, tom natural).
 * 2. Fluxos 360° para:
 *    - Pacientes de Tráfego Pago / Anúncios (triagem gratuita e médicos).
 *    - Médicos Prescritores (orientação, consultório virtual e recebimento de docs KYC).
 *    - Farmácias e Drogarias (dispensação Anvisa RDC 327 e Saúde Verde).
 *    - Solicitação de Atendente Humano.
 * 3. Integração em tempo real com o Brevo CRM (nenhum lead é perdido).
 * 4. IA Generativa via Gemini 2.5 Flash integrada com fallback inteligente.
 * 5. Prevenção de duplicidade e rate limit por contato.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// IPv4 priority
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'brisa_processed_wa_messages.json');

const WAHA_URL = 'https://waha-production-4e9c.up.railway.app';
const WAHA_KEY = process.env.WAHA_API_KEY || '';
const WAHA_SESSION = 'default';

import dotenv from 'dotenv';
dotenv.config();

const BREVO_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY || '';
const BREVO_LIST_WHATSAPP_INBOUND = 10;
const BREVO_LIST_PACIENTES_TRAFEGO = 11;
const BREVO_LIST_MEDICOS_CADASTRADOS = 8;
const BREVO_LIST_MEDICOS_PROSPECTS = 9;
const BREVO_LIST_FARMACIAS = 5;

const SUPABASE_URL = 'https://shmbwdjuddvquszwkvuq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ';

// Carregar estado de mensagens processadas
let processedMessages = new Set();
let lastRepliedChatTimes = new Map();

if (fs.existsSync(STATE_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    processedMessages = new Set(data.processedIds || []);
  } catch {}
}

function saveState() {
  try {
    // Manter últimos 5000 IDs para não crescer indefinidamente
    const list = Array.from(processedMessages).slice(-5000);
    fs.writeFileSync(STATE_FILE, JSON.stringify({ processedIds: list, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch {}
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Sincronizar lead no Brevo CRM ──────────────────────────────────────────
async function syncLeadToBrevo(phone, name, category, listIds) {
  try {
    const cleanNum = phone.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 8) return;
    const formattedPhone = cleanNum.startsWith('55') ? '+' + cleanNum : '+55' + cleanNum;
    const email = `wa.${cleanNum}@plantayraiz.com.br`;

    const parts = (name || '').trim().split(/\s+/);
    const firstName = parts[0] || 'Lead';
    const lastName = parts.slice(1).join(' ') || `WhatsApp ${cleanNum.slice(-4)}`;

    const payload = {
      email,
      attributes: {
        NOME: firstName,
        SOBRENOME: lastName,
        WHATSAPP: formattedPhone,
        SMS: formattedPhone,
        CATEGORIA: category,
        STATUS_PROSPECCAO: 'Conversa Ativa',
        FONTE: 'WhatsApp Inbound 360'
      },
      listIds: Array.from(new Set(listIds)),
      updateExistingContacts: true
    };

    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error(`[Brevo Sync Error] ${e.message}`);
  }
}

// ── Envio de mensagem pelo WAHA (MUTADO PERMANENTEMENTE PARA O CLAUDE RESPONDER) ────
async function sendWhatsAppMessage(chatId, text) {
  // HARD LOCK: Envio automatizado desativado para eliminar qualquer risco de respostas cruzadas.
  // O atendimento é conduzido exclusivamente pelo agente Claude no WhatsApp Web (Google Chrome).
  console.log(`[WAHA MUTE] 🔇 Resposta para ${chatId} silenciada. Atendimento exclusivo via Claude no WhatsApp Web.`);
  return false;
}

// ── IA Generativa Gemini 2.5 Flash via Supabase Edge Function ──────────────
async function generateGeminiReply(userText, contactName, category) {
  const systemPrompt = `Você é a Enfermeira Brisa, assistente virtual humanizada, educada, gentil, prestativa e calorosa da Planta y Raiz (plataforma de saúde integrativa e cannabis medicinal no Brasil).
Regras estritas de ouro:
1. Responda em no MÁXIMO 2 a 3 linhas, como uma mensagem natural e acolhedora de WhatsApp.
2. Seja sempre educada, empática e prestativa. Nunca use textos longos, burocráticos ou em blocos.
3. Não prescreva medicamentos nem dê diagnósticos.
4. Para dúvidas sobre tratamentos de saúde (ansiedade, insônia, dores, TEA, etc.), convide o paciente com carinho para fazer a triagem gratuita no link: https://www.plantayraiz.com.br/triagem ou consultar nossos médicos prescritores em https://www.plantayraiz.com.br/profissionais
5. Nome do contato: ${contactName || 'paciente'}.`;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/brisa-chat`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ]
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const text = await res.text();
    let reply = '';
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const j = JSON.parse(line.slice(6));
          reply += j.choices?.[0]?.delta?.content || '';
        } catch {}
      }
    }

    if (reply && reply.trim().length > 10) {
      return reply.trim();
    }
  } catch (e) {
    console.warn(`[Gemini Warn] ${e.message}. Usando resposta inteligente de fallback.`);
  }

  // Fallback humanizado
  return `Olá! Sou a Enfermeira Brisa da Planta y Raiz. 🌿 É um prazer te atender! Para te ajudar da melhor forma com seu caso ou orientação médica, você pode iniciar nossa triagem gratuita em https://www.plantayraiz.com.br/triagem ou conhecer nossos médicos em https://www.plantayraiz.com.br/profissionais. Como posso te auxiliar agora?`;
}

// ── Processador inteligente da mensagem ───────────────────────────────────
async function handleIncomingMessage(msg, chat) {
  const msgId = msg.id?._serialized || msg.id?.id || (typeof msg.id === 'string' ? msg.id : '');
  if (!msgId || processedMessages.has(msgId)) return;

  // Registrar imediatamente no estado
  processedMessages.add(msgId);
  saveState();

  const chatId = msg.from;
  const isGroup = chatId.includes('@g.us');
  if (isGroup || msg.fromMe || chatId === 'status@broadcast') return;

  const rawPhone = chatId.replace(/@.*/, '').replace(/\D/g, '');
  const contactName = chat.name && !chat.name.startsWith('+') ? chat.name : '';
  const bodyText = (msg.body || '').trim();
  const lower = bodyText.toLowerCase();
  const hasMedia = Boolean(msg.hasMedia || msg.type === 'image' || msg.type === 'document' || msg.type === 'ptt' || msg.type === 'audio');

  // Rate limit por chat: evitar responder mais de uma vez a cada 10 segundos
  const lastReply = lastRepliedChatTimes.get(chatId) || 0;
  if (Date.now() - lastReply < 10000) {
    console.log(`[RateLimit] Ignorando mensagem rápida consecutiva de ${chatId}`);
    return;
  }

  console.log(`\n💬 [Mensagem Recebida] de ${chat.name || rawPhone} (${chatId}): "${bodyText || (hasMedia ? '[MÍDIA/DOCUMENTO]' : '')}"`);

  let replyText = '';
  let category = 'Paciente Tráfego Pago';
  let listIds = [BREVO_LIST_WHATSAPP_INBOUND, BREVO_LIST_PACIENTES_TRAFEGO];

  // 1. SOLICITAÇÃO DE ATENDIMENTO HUMANO
  if (/humano|atendente|pessoa|falar com algu[eé]m|suporte humano|atendimento presencial/i.test(lower)) {
    replyText = `Com certeza! Já avisei nossa equipe de plantão aqui na central da Planta y Raiz. Em instantes um de nossos consultores humanos dará continuidade ao seu atendimento por aqui com todo o cuidado! 🌿`;
    category = 'Lead Solicitou Atendente Humano';
  }
  // 2. ENVIO DE DOCUMENTOS / COMPLIANCE MÉDICO (KYC)
  else if (hasMedia || /segue (meu )?(crm|diploma|comprovante|documento|rg|cnh|cpf)|minha chave pix|chave pix|comprovante de resid[eê]ncia/i.test(lower)) {
    const isDoc = contactName.toLowerCase().includes('dr') || /crm|m[eé]dic/i.test(lower);
    if (isDoc) {
      replyText = `Olá, Doutor(a)! Documentos recebidos com sucesso. 🌿 Nossa equipe de compliance e auditoria médica já está validando para homologação do seu consultório virtual. Qualquer dúvida, estou por aqui!`;
      category = 'Médico Cadastrado - Envio de Documentos';
      listIds = [BREVO_LIST_WHATSAPP_INBOUND, BREVO_LIST_MEDICOS_CADASTRADOS];
    } else {
      replyText = `Recebido com sucesso! 🌿 Muito obrigada pelo envio dos dados. Nossa equipe já está processando tudo com prioridade e em instantes te retornamos.`;
      category = 'Lead WhatsApp - Envio de Documentos';
    }
  }
  // 3. FLUXO DE MÉDICOS PRESCritORES / CREDENCIAMENTO
  else if (contactName.toLowerCase().includes('dr') || /\b(sou m[eé]dico|sou prescritor|me credenciar|cadastrar como m[eé]dico|consult[oó]rio virtual|prescrever cannabis|receita digital)\b/i.test(lower)) {
    replyText = `Olá, Doutor(a)! Seja muito bem-vindo(a) à Planta y Raiz. 🌿 Oferecemos consultório virtual completo, emissão de receitas com certificado ICP-Brasil e repasse de 100% dos honorários médicos via PIX. Para ativar seu perfil, basta acessar: https://www.plantayraiz.com.br/medicos/ativar`;
    category = 'Médico Prescritor - Credenciamento';
    listIds = [BREVO_LIST_WHATSAPP_INBOUND, BREVO_LIST_MEDICOS_PROSPECTS];
  }
  // 4. FLUXO DE FARMÁCIAS / DROGARIAS / B2B
  else if (/\b(farm[aá]cia|drogaria|distribuidora|dispensa[cç][aã]o|lojista|comprar no atacado|sa[uú]de verde)\b/i.test(lower)) {
    replyText = `Olá! Seja bem-vindo(a) à Planta y Raiz. 🌿 Temos um programa exclusivo de dispensação e distribuição para farmácias sob a RDC 327 da Anvisa. Conheça nosso portal institucional e credencie seu estabelecimento em: https://www.plantayraiz.com.br/saude-verde`;
    category = 'Farmácia / Drogaria B2B';
    listIds = [BREVO_LIST_WHATSAPP_INBOUND, BREVO_LIST_FARMACIAS];
  }
  // 5. PACIENTE / TRÁFEGO PAGO / DÚVIDAS GERAIS
  else {
    category = 'Paciente Tráfego Pago';
  }

  const isHarvesterOnly = process.argv.includes('--harvester-only') || process.env.HARVESTER_ONLY === 'true';

  if (!isHarvesterOnly) {
    // Enviar resposta humanizada via WAHA
    const sent = await sendWhatsAppMessage(chatId, replyText);
    if (sent) {
      lastRepliedChatTimes.set(chatId, Date.now());
    }
  } else {
    console.log(`[HARVESTER] 📡 Lead capturado: ${chat.name || rawPhone} (${category}). CRM atualizado na Brevo (Claude responde no WhatsApp Web).`);
  }

  // Sincronizar lead no Brevo CRM com a categoria correspondente
  await syncLeadToBrevo(rawPhone, contactName, category, listIds);
}

// ── Polling de mensagens no WAHA ──────────────────────────────────────────
async function pollWahaMessages() {
  try {
    const res = await fetch(`${WAHA_URL}/api/default/chats?limit=25`, {
      headers: { 'X-Api-Key': WAHA_KEY, 'accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return;

    const chats = await res.json();
    for (const chat of chats) {
      if (chat.isGroup) continue;

      // Se há mensagens não lidas ou última mensagem recebida
      const lastMsg = chat.lastMessage;
      if (lastMsg && !lastMsg.fromMe) {
        const msgId = lastMsg.id?._serialized || lastMsg.id?.id || (typeof lastMsg.id === 'string' ? lastMsg.id : '');
        if (msgId && !processedMessages.has(msgId)) {
          // Verificar se a mensagem é recente (últimas 2 horas) para não responder mensagens antigas
          const msgTime = lastMsg.timestamp ? lastMsg.timestamp * 1000 : Date.now();
          if (Date.now() - msgTime < 2 * 60 * 60 * 1000) {
            await handleIncomingMessage(lastMsg, chat);
          } else {
            // Ignorar mensagens muito antigas e marcar como processadas
            processedMessages.add(msgId);
          }
        }
      }
    }
    saveState();
  } catch (e) {
    // Falhas transitórias de conexão são tratadas silenciosamente
  }
}

// ── Execução Principal ────────────────────────────────────────────────────
async function run() {
  console.log('================================================================');
  console.log('🌿 AGENTE AUTÔNOMO ENFª BRISA 360° HUMANIZADA (WHATSAPP + BREVO)');
  console.log('================================================================');
  console.log(`📡 WAHA Endpoint:   ${WAHA_URL} (Sessão: ${WAHA_SESSION})`);
  console.log(`🧠 Cérebro IA:       Gemini 2.5 Flash via Supabase Edge Function`);
  console.log(`📬 CRM Brevo:        Listas 8, 9, 10, 11 integradas`);
  console.log('================================================================\n');

  // Modo Daemon se passado --daemon
  const isDaemon = process.argv.includes('--daemon');

  if (isDaemon) {
    console.log('🚀 Modo Daemon Ativado — Monitorando WhatsApp 24x7...');
    while (true) {
      await pollWahaMessages();
      await sleep(4000); // Polling a cada 4 segundos
    }
  } else {
    console.log('🔍 Executando verificação única de novas mensagens...');
    await pollWahaMessages();
    console.log('✅ Ciclo concluído.');
  }
}

run().catch(console.error);
