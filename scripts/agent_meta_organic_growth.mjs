/**
 * scripts/agent_meta_organic_growth.mjs
 * 
 * MÓDULO 1: AGENTE META SOCIAL 24/7 (INSTAGRAM & FACEBOOK GRAPH API)
 * Plataforma Planta y Raíz Ltda (plantayraiz.com.br)
 * 
 * Funcionalidades:
 * 1. Webhook (/webhook/meta-social e /webhook) na porta 3030 com validação hub.challenge e HMAC-SHA256.
 * 2. Mecânica "Comente e Receba" (Comment-to-DM viral):
 *    - Detecção de gatilhos: "QUERO", "TRIAGEM", "RECEITA", "VIP", "MEDICO", "FARMACIA", "PARCERIA", "BRISA".
 *    - Ação 1 (Pública): Resposta imediata com rotação de 5 cópias humanizadas.
 *    - Ação 2 (Privada / DM em até 3s): Roteamento por persona (Paciente, Médico VIP R$ 99, Farmácia B2B).
 * 3. Atendimento Humanizado de DMs (Qualificação em 3 etapas e captação de WhatsApp/E-mail para Brevo CRM).
 * 4. Motor de Menções e Stories: Resposta com cupom de primeira triagem (BRISA10).
 * 5. Blindagem Anti-Bloqueio: Jittering de 2 a 6s, limite de 150 DMs/h e persistência de desduplicação de 24h.
 */

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'meta_organic_growth_state.json');
const LOG_FILE = path.join(__dirname, 'meta_organic_growth.log');

const PORT = parseInt(process.env.META_WEBHOOK_PORT || '3030', 10);
const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'planta_meta_webhook_2026';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || process.env.IG_PAGE_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || '';
const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '';
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '';
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const BREVO_LIST_MEDICOS = Number(process.env.BREVO_LIST_MEDICOS || 6);
const BREVO_LIST_LEADS = 8;

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';
const BRISA_WHATSAPP_PHONE = '5511991363154';
const MAX_MESSAGES_PER_HOUR = 150;
const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

// Rotação de cópias públicas humanizadas para aumentar engajamento no algoritmo da Meta
const PUBLIC_REPLIES = [
  'Te chamei no direct com todas as informações, @{user}! Dá uma olhadinha 🌿',
  'Enviei todos os detalhes no seu direct, @{user}! Confere lá 💚',
  'Mensagem enviada no seu direct com muito carinho, @{user}! Dá uma olhada 🌿',
  'Tudo o que você precisa já está no seu direct, @{user}! Dá uma conferida 📩',
  'Acabei de te responder por mensagem privada, @{user}! Qualquer dúvida estou por aqui 🌿'
];

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [META-ORGANIC] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function applyJittering(minMs = 2000, maxMs = 5000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  log(`⏳ Jittering de segurança: aguardando ${(delay / 1000).toFixed(1)}s...`);
  await sleep(delay);
}

function loadState() {
  const defaultState = {
    startedAt: new Date().toISOString(),
    messagesSentInLastHour: [],
    dedupComments: {},
    dedupUserPost: {},
    dedupDirects: {},
    dedupStoryMentions: {},
    activeDialogs: {}, // senderId -> { step, data: {} }
    metrics: {
      commentsEvaluated: 0,
      commentsReplied: 0,
      dmsSent: 0,
      patientsCaptured: 0,
      doctorsCaptured: 0,
      pharmaciesCaptured: 0,
      storyMentionsAnswered: 0,
      leadsSyncedBrevo: 0
    }
  };

  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return { ...defaultState, ...data, metrics: { ...defaultState.metrics, ...(data.metrics || {}) } };
    } catch (_) {}
  }
  return defaultState;
}

const state = loadState();

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {}
}

function canSendMessage() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  state.messagesSentInLastHour = (state.messagesSentInLastHour || []).filter(ts => ts > oneHourAgo);
  return state.messagesSentInLastHour.length < MAX_MESSAGES_PER_HOUR;
}

function registerMessageSent() {
  state.messagesSentInLastHour.push(Date.now());
  state.metrics.dmsSent++;
  saveState();
}

// ─── Envio para a Graph API da Meta ───
async function replyPublicComment(commentId, username) {
  if (!META_ACCESS_TOKEN) {
    log(`[MOCK META] Respondendo comentário público ${commentId} para @${username}`);
    return true;
  }
  try {
    await applyJittering(1500, 3500);
    const template = PUBLIC_REPLIES[Math.floor(Math.random() * PUBLIC_REPLIES.length)];
    const text = template.replace('{user}', username || 'amigo(a)');

    const res = await fetch(`${GRAPH_API_BASE}/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });
    if (res.ok) {
      state.metrics.commentsReplied++;
      saveState();
      log(`💬 Comentário respondido publicamente com sucesso: "${text}"`);
      return true;
    } else {
      const err = await res.json();
      log(`⚠️ Falha ao responder comentário: ${JSON.stringify(err)}`);
    }
  } catch (e) {
    log(`❌ Erro de rede ao responder comentário: ${e.message}`);
  }
  return false;
}

async function sendDirectMessage(recipientId, messageText) {
  if (!canSendMessage()) {
    log(`🛑 Rate limit de segurança atingido (${MAX_MESSAGES_PER_HOUR} DMs/h). Postergando.`);
    return false;
  }
  if (!META_ACCESS_TOKEN) {
    log(`[MOCK META] Enviando DM para ${recipientId}: "${messageText.slice(0, 60)}..."`);
    registerMessageSent();
    return true;
  }
  try {
    await applyJittering(2000, 4500);
    const res = await fetch(`${GRAPH_API_BASE}/me/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText }
      })
    });
    if (res.ok) {
      registerMessageSent();
      log(`📩 DM enviada com sucesso para ${recipientId}`);
      return true;
    } else {
      const err = await res.json();
      log(`⚠️ Falha ao enviar DM: ${JSON.stringify(err)}`);
    }
  } catch (e) {
    log(`❌ Erro ao enviar DM: ${e.message}`);
  }
  return false;
}

// ─── Sincronização Automática com Brevo CRM ───
async function syncLeadToBrevo(name, email, phone, persona) {
  if (!BREVO_KEY || !email) return false;
  const listId = persona === 'medico' ? BREVO_LIST_MEDICOS : BREVO_LIST_LEADS;
  const payload = {
    email: email.toLowerCase().trim(),
    attributes: {
      NOME: name || 'Lead Orgânico Meta',
      WHATSAPP: phone || '',
      ORIGEM: 'meta_organic_instagram_facebook',
      PERSONA: persona || 'paciente'
    },
    listIds: [listId],
    updateEnabled: true
  };
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok || res.status === 201 || res.status === 204 || res.status === 400) {
      state.metrics.leadsSyncedBrevo++;
      saveState();
      log(`✅ Lead sincronizado no Brevo [Lista ${listId}]: ${email}`);
      return true;
    }
  } catch (e) {
    log(`⚠️ Erro ao sincronizar lead no Brevo: ${e.message}`);
  }
  return false;
}

// ─── Lógica de Roteamento de Comentários (Comment-to-DM) ───
async function handleCommentEvent(entry) {
  const commentId = entry.comment_id || entry.id;
  const text = (entry.text || entry.message || '').toLowerCase();
  const username = entry.from?.username || entry.from?.name || 'amigo(a)';
  const userId = entry.from?.id;
  const postId = entry.media_id || entry.post_id || 'post';

  if (!commentId || !text) return;

  state.metrics.commentsEvaluated++;

  // Desduplicação em 24h
  const dedupKey = `${userId}_${postId}`;
  if (state.dedupComments[commentId] || (userId && state.dedupUserPost[dedupKey] && Date.now() - state.dedupUserPost[dedupKey] < WINDOW_24H_MS)) {
    log(`⏭️ Comentário ${commentId} de @${username} já processado recentemente. Ignorando.`);
    return;
  }

  const triggers = ['convite', 'quero', 'triagem', 'receita', 'vip', 'medico', 'médico', 'farmacia', 'farmácia', 'parceria', 'brisa', 'valor', 'consulta', 'ajuda', 'info'];
  const hasTrigger = triggers.some(t => text.includes(t));

  if (!hasTrigger) return;

  state.dedupComments[commentId] = { at: Date.now(), username };
  if (userId) state.dedupUserPost[dedupKey] = Date.now();
  saveState();

  log(`🎯 Gatilho detectado no comentário de @${username}: "${text}"`);

  // 1. Resposta pública imediata
  await replyPublicComment(commentId, username);

  // 2. Classificação de persona e disparo de DM personalizada (não assume "Dr(a)." sem CRM confirmado)
  const isDoctor = text.includes('medico') || text.includes('médico') || text.includes('crm') || text.includes('prescrever') || text.includes('convite');
  const isPharmacy = text.includes('farmacia') || text.includes('farmácia') || text.includes('parceria') || text.includes('dispensario') || text.includes('produtos');

  if (isDoctor) {
    state.metrics.doctorsCaptured++;
    const doctorMsg = `Olá, ${username}! Seja bem-vindo(a) à Planta y Raiz (Bezerra Med Soluções Integradas Ltda.).\n\nPara profissionais com registro ativo em conselho: cadastro gratuito, repasse de 93% de cada consulta via PIX (taxa fixa de 7%) e Plano Médico VIP opcional por R$ 99/mês com prioridade na fila e ferramentas de IA.\n\n👉 Ative seu cadastro gratuito: https://www.plantayraiz.com.br/cadastro-profissional?utm_source=instagram&utm_medium=comment_auto&utm_campaign=convite_medico\n\nSe preferir falar com nossa equipe humana, envie seu CRM ou WhatsApp por aqui! 🌿`;
    if (userId) await sendDirectMessage(userId, doctorMsg);
  } else if (isPharmacy) {
    state.metrics.pharmaciesCaptured++;
    const pharmMsg = `Olá, ${username}! Que alegria seu contato com a Planta y Raiz (Bezerra Med Soluções Integradas Ltda.).\n\nPara farmácias e lojistas parceiros, temos o plano Lojista VIP (R$ 99/mês, taxa padrão de 5% do marketplace — repasse de 95%) e cadastro em:\n👉 https://www.plantayraiz.com.br/cadastro-farmacia?utm_source=instagram&utm_medium=comment_auto&utm_campaign=farmacia_parceria\n\nSe preferir, informe seu WhatsApp comercial por aqui! 🌿`;
    if (userId) await sendDirectMessage(userId, pharmMsg);
  } else {
    state.metrics.patientsCaptured++;
    const patientMsg = `Olá, ${username}! Sou a Enf. Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha). 🌿\n\nVocê pode começar pela Orientação Técnica educativa (R$ 30 — não é consulta nem prescreve) ou escolher um médico na vitrine:\n👉 https://www.plantayraiz.com.br/orientacao-tecnica?utm_source=instagram&utm_medium=comment_auto&utm_campaign=triagem30\n👉 https://www.plantayraiz.com.br/profissionais\n\nQual faz mais sentido para você hoje?`;
    if (userId) await sendDirectMessage(userId, patientMsg);
  }
}

// ─── Lógica de Qualificação de DMs em 3 Etapas ───
async function handleDirectMessageEvent(entry) {
  const senderId = entry.sender?.id;
  const text = (entry.message?.text || '').trim();
  const mid = entry.message?.mid || entry.id;

  if (!senderId || !text) return;
  if (state.dedupDirects[mid]) return;

  state.dedupDirects[mid] = Date.now();
  saveState();

  const userDialog = state.activeDialogs[senderId] || { step: 1, data: {} };
  const lower = text.toLowerCase();

  // Verifica extração de e-mail e telefone
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.replace(/\D/g, '').match(/(?:55)?(\d{10,11})/);

  if (emailMatch) userDialog.data.email = emailMatch[0].toLowerCase();
  if (phoneMatch) userDialog.data.phone = phoneMatch[1].length === 11 ? `55${phoneMatch[1]}` : phoneMatch[0];

  // Se o usuário forneceu contato em qualquer momento, sincroniza no Brevo
  if (userDialog.data.email) {
    await syncLeadToBrevo(userDialog.data.name || 'Contato Instagram/Facebook', userDialog.data.email, userDialog.data.phone, userDialog.data.persona);
  }

  // Qualificação em 3 etapas
  if (userDialog.step === 1) {
    if (lower.includes('medico') || lower.includes('médico') || lower.includes('crm') || lower.includes('prescrever') || lower.includes('convite')) {
      userDialog.data.persona = 'medico';
      userDialog.step = 2;
      state.activeDialogs[senderId] = userDialog;
      saveState();
      await sendDirectMessage(senderId, `Ótimo! Na Planta y Raiz (Bezerra Med Soluções Integradas Ltda.), profissionais com registro em conselho têm cadastro gratuito e repasse de 93% via PIX (taxa fixa de 7%).\n\nQual o seu conselho/CRM e melhor e-mail para enviarmos o acesso ao cadastro?`);
      return;
    } else if (lower.includes('farmacia') || lower.includes('farmácia') || lower.includes('parceria') || lower.includes('empresa') || lower.includes('fornec')) {
      userDialog.data.persona = 'farmacia';
      userDialog.step = 2;
      state.activeDialogs[senderId] = userDialog;
      saveState();
      await sendDirectMessage(senderId, `Excelente! Para farmácias e lojistas parceiros, temos o plano Lojista VIP (R$ 99/mês, taxa padrão de 5%).\n\nQual o nome da sua empresa/farmácia e o WhatsApp comercial da equipe responsável?`);
      return;
    } else {
      userDialog.data.persona = 'paciente';
      userDialog.step = 2;
      state.activeDialogs[senderId] = userDialog;
      saveState();
      await sendDirectMessage(senderId, `Olá! Sou a Enf. Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha). 🌿\n\nO que te trouxe até a Planta y Raiz hoje? Você busca Orientação Técnica educativa (R$ 30) ou consulta direta com um médico da vitrine?`);
      return;
    }
  } else if (userDialog.step === 2) {
    userDialog.step = 3;
    state.activeDialogs[senderId] = userDialog;
    saveState();

    if (userDialog.data.persona === 'medico') {
      await sendDirectMessage(senderId, `Você pode fazer seu cadastro gratuito em https://www.plantayraiz.com.br/cadastro-profissional?utm_source=instagram&utm_medium=dm_auto&utm_campaign=medico_vip99 e ver os detalhes do Plano Médico VIP (R$ 99/mês) em https://www.plantayraiz.com.br/precos.\n\nSe tiver dúvida sobre repasse ou cadastro, informe seu WhatsApp com DDD para nossa equipe humana.`);
    } else if (userDialog.data.persona === 'farmacia') {
      await sendDirectMessage(senderId, `Perfeito! Você pode cadastrar sua farmácia/loja em https://www.plantayraiz.com.br/cadastro-farmacia?utm_source=instagram&utm_medium=dm_auto&utm_campaign=farmacia_parceria e conferir o plano Lojista VIP em https://www.plantayraiz.com.br/precos.`);
    } else {
      await sendDirectMessage(senderId, `Você pode iniciar sua Orientação Técnica educativa (R$ 30 — não é consulta nem prescreve) em https://www.plantayraiz.com.br/orientacao-tecnica?utm_source=instagram&utm_medium=dm_auto&utm_campaign=triagem30 ou escolher seu médico na vitrine em https://www.plantayraiz.com.br/profissionais. 🌿`);
    }
    return;
  } else {
    // Etapa 3 concluída ou mensagem contínua
    await sendDirectMessage(senderId, `Agradecemos sua mensagem! Nossa equipe humana acompanha seu atendimento. Para dúvidas, estamos no WhatsApp oficial: https://wa.me/${BRISA_WHATSAPP_PHONE} (em caso de emergência médica, ligue 192 SAMU). 🌿`);
  }
}

// ─── Motor de Menções e Stories (@plantayraiz) ───
async function handleStoryMention(entry) {
  const senderId = entry.sender?.id || entry.from?.id;
  const username = entry.sender?.username || entry.from?.username || 'amigo(a)';
  const mentionId = entry.id || `story_${senderId}_${Date.now()}`;

  if (state.dedupStoryMentions[mentionId]) return;
  state.dedupStoryMentions[mentionId] = Date.now();
  state.metrics.storyMentionsAnswered++;
  saveState();

  log(`🌟 Menção em Story detectada de @${username}! Enviando agradecimento...`);
  const storyMsg = `Obrigado por marcar a @plantayraiz no seu Story, @${username}! 🌿\n\nVocê pode conhecer nossa Orientação Técnica educativa (R$ 30) em https://www.plantayraiz.com.br/orientacao-tecnica?utm_source=instagram&utm_medium=story_mention ou nossa vitrine de médicos em https://www.plantayraiz.com.br/profissionais.`;

  if (senderId) {
    await sendDirectMessage(senderId, storyMsg);
  }
}

// ─── Servidor Webhook HTTP ───
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Endpoint de Health Check
  if (req.method === 'GET' && (pathname === '/health' || pathname === '/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'agent_meta_organic_growth',
      timestamp: new Date().toISOString(),
      metrics: state.metrics,
      slidingHourMessages: state.messagesSentInLastHour.length
    }, null, 2));
    return;
  }

  // Simulação de Teste para Validação Interna
  if (req.method === 'POST' && pathname === '/simulate-comment') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        await handleCommentEvent(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, simulated: payload, metrics: state.metrics }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Webhook Meta — Verificação de Inscrição (hub.challenge)
  if (req.method === 'GET' && (pathname === '/webhook' || pathname === '/webhook/meta-social')) {
    const mode = parsedUrl.searchParams.get('hub.mode');
    const token = parsedUrl.searchParams.get('hub.verify_token');
    const challenge = parsedUrl.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      log(`✅ Webhook Meta verificado com sucesso via hub.challenge!`);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(challenge);
    } else {
      log(`⚠️ Tentativa de verificação com token inválido: ${token}`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
    }
    return;
  }

  // Webhook Meta — Notificação de Eventos em Tempo Real (POST)
  if (req.method === 'POST' && (pathname === '/webhook' || pathname === '/webhook/meta-social')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      // Validação de assinatura HMAC-SHA256 se app secret estiver configurado
      const signature = req.headers['x-hub-signature-256'];
      if (META_APP_SECRET && signature) {
        const expectedSig = 'sha256=' + crypto.createHmac('sha256', META_APP_SECRET).update(body).digest('hex');
        if (signature !== expectedSig) {
          log(`⚠️ Assinatura de webhook inválida. Rejeitando.`);
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Invalid signature');
          return;
        }
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('EVENT_RECEIVED');

      try {
        const data = JSON.parse(body);
        if (data.object === 'instagram' || data.object === 'page') {
          for (const entry of data.entry || []) {
            // Comentários em Posts / Reels
            for (const change of entry.changes || []) {
              if (change.field === 'comments') {
                await handleCommentEvent(change.value);
              } else if (change.field === 'mentions') {
                await handleStoryMention(change.value);
              }
            }
            // Mensagens Diretas (DMs)
            for (const messaging of entry.messaging || []) {
              if (messaging.message) {
                await handleDirectMessageEvent(messaging);
              }
            }
          }
        }
      } catch (err) {
        log(`⚠️ Erro ao processar payload do webhook: ${err.message}`);
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  log(`🚀 [MÓDULO 1] Agente Meta Social Ativo na porta ${PORT}`);
  log(`📡 Webhook URL: http://0.0.0.0:${PORT}/webhook/meta-social`);
  log(`🛡️ Rate Limit: ${MAX_MESSAGES_PER_HOUR} DMs/h | Jittering 2-5s | Estado persistente em ${STATE_FILE}`);
});
