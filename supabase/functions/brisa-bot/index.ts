// 🌿 Planta y Raiz — brisa-bot v2026.8.08-DR-EDILSON-ORIENTACAO
// Resposta oficial de Orientação Técnica e Mentoria do Dr. Edilson Bezerra
// 
// ARQUITETURA (2 estágios, nunca falha):
// 1. INSTANT REPLY — resposta garantida por palavras-chave com o roteiro completo de Orientação Técnica
// 2. GEMINI BACKGROUND — enriquece com base no modelo gemini-2.5-flash

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { claimBrisaInbound } from '../_shared/brisa-inbound-claim.ts';
import { LOOPING_BOT_NUMBERS, patientName, quickResponse, sanitizeOutboundAnswer } from '../_shared/brisa-response-policy.mjs';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

// 🔐 Segredo compartilhado do webhook (anti-spoof). POSTs sem o segredo são rejeitados.
const WAHA_WEBHOOK_SECRET = Deno.env.get('WAHA_WEBHOOK_SECRET') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
function webhookSecretOk(req: Request): boolean {
  const hdr = req.headers.get('x-webhook-secret') || req.headers.get('x-api-key') || '';
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (WAHA_WEBHOOK_SECRET && (hdr === WAHA_WEBHOOK_SECRET || auth === WAHA_WEBHOOK_SECRET)) return true;
  if (SERVICE_ROLE_KEY && auth === SERVICE_ROLE_KEY) return true;
  return false;
}

const GEMINI_KEY   = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || '';
const WAHA_URL     = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/+$/, '');
const WAHA_KEY     = Deno.env.get('WAHA_API_KEY') || '';
const WAHA_SESSION = Deno.env.get('WAHA_SESSION') || 'default';
const EVO_URL      = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/+$/, '');
const EVO_KEY      = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVO_INST     = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz';
const LOVABLE_KEY  = Deno.env.get('LOVABLE_API_KEY') || '';
const SB_URL       = Deno.env.get('SUPABASE_URL') || '';
const SB_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

import { DOCTOR_NAME, DOCTOR_CRM, DOCTOR_PHONE } from '../_shared/clinic-info.ts';

// ── ROTEIRO COMPLETO DE ORIENTAÇÃO TÉCNICA (DR. EDILSON BEZERRA ON) ──────
const ROTEIRO_ORIENTACAO_TECNICA = `📲 *COMO FUNCIONA A ORIENTAÇÃO TÉCNICA (R$ 30):*

1️⃣ *Início do Cuidado (Triagem e Educação em Saúde):*
A Orientação Técnica é o início do seu atendimento na plataforma e é conduzida pelo *${DOCTOR_NAME} ON*, um assistente de inteligência artificial supervisionado pelo ${DOCTOR_NAME} (registro médico boliviano nº 10963, consultório físico no 1º Anillo, Santa Cruz de la Sierra). A Orientação Técnica é apenas o início do cuidado e não realiza prescrição médica:
👉 https://www.plantayraiz.com.br/orientacao-tecnica

2️⃣ *Modalidades na Plataforma:*
💬 *Orientação Técnica (30 min):* R$ 30,00 — etapa inicial educativa e de triagem, com relatório de encaminhamento ao médico prescritor mais indicado.
🩺 *Consulta Médica com Prescritor da Vitrine:* Chat R$ 100,00 ou Vídeo ao vivo R$ 150,00 — acesse em https://www.plantayraiz.com.br/agendamento

3️⃣ *Pagamento Rápido e Seguro:*
O pagamento é feito via PIX ou Cartão no site oficial. Assim que confirmado, sua sala de Orientação Técnica é liberada imediatamente.

4️⃣ *Encaminhamento Clínico:*
Ao final da Orientação Técnica, você recebe seu Relatório de Encaminhamento para seguir o tratamento com um médico prescritor habilitado da nossa vitrine.

Como posso te ajudar agora? 🌿💚`;

// ── PERSONAS SEPARADAS (mesmo cérebro Gemini, conteúdos diferentes) ─────
// Enf. Brisa    → triagem curta + paywall
// Dr. Edilson On → orientação técnica paga (30 min por pagamento)
import {
  BRISA_TRIAGE_PERSONA,
  drEdilsonPersona,
  paywallMessage,
  sessionOpenedMessage,
  sessionExpiredMessage,
  sessionEndingSoonMessage,
} from '../_shared/agents.ts';
import {
  serviceClient,
  resolveOtSession,
  touchOtSession,
  closeOtSession,
  markClosingNotice,
  minutesLeft,
} from '../_shared/ot-session.ts';

const PERSONA = BRISA_TRIAGE_PERSONA;


// ── RESPOSTAS INSTANTÂNEAS POR PERFIL (Médico, Paciente, Farmácia) ──────
const MSGS = {
  boas_vindas: `Olá! 🌿 Sou a assistente virtual da *Planta y Raíz*.

Para eu te enviar o link certo, você busca atendimento como *paciente* ou informações como *médico(a) prescritor(a)*?

1️⃣ *Sou Paciente* — Quero agendar Consulta Médica (Chat R$ 100 / Vídeo R$ 150) ou iniciar pela Orientação Técnica (R$ 30).
2️⃣ *Sou Médico(a) Prescritor(a)* — Quero credenciar meu consultório virtual (repasse líquido de 93% via PIX).
3️⃣ *Sou Farmácia / Lojista / Associação* — Quero integrar produtos ao canal de dispensação.

Pode responder com o *número* ou me contar como posso te ajudar! 💚`,

  paciente: `Olá! 🌿💚 Sou a assistente virtual da *Planta y Raíz*.

Veja os caminhos disponíveis para o seu atendimento:

🩺 *Consulta Médica (Chat R$ 100 | Vídeo R$ 150):*
Atendimento direto com médico prescritor habilitado da nossa vitrine:
👉 https://www.plantayraiz.com.br/agendamento

📋 *Orientação Técnica Inicial (R$ 30 · 30 min):*
Início do cuidado conduzido pelo Dr. Edilson Bezerra ON (assistente de IA supervisionado pelo Dr. Edilson Bezerra, registro médico boliviano 10963, 1º Anillo, Santa Cruz de la Sierra), para educação em saúde e encaminhamento ao médico ideal (não realiza prescrição):
👉 https://www.plantayraiz.com.br/orientacao-tecnica

📝 *Cadastro Gratuito de Paciente:*
👉 https://www.plantayraiz.com.br/cadastro

Você prefere ir direto para a consulta médica ou começar pela Orientação Técnica?`,

  medico: `Olá, Doutor(a)! 👨‍⚕️🌿 Sou a assistente virtual de credenciamento da *Planta y Raíz*!

Somos um ecossistema completo para médicos prescritores:
🩺 *Consultório Virtual Inteligente:* Prontuário eletrônico em conformidade com o CFM (Resolução 2.314/2022), Copiloto de Evidências, Assistente Jurídico e Escriba de IA.
💰 *Política de Repasse Oficial:* 93% líquido de cada consulta via PIX (taxa fixa de 7% da plataforma em todos os planos).
📄 *Prescrição Eletrônica RDC 327/660:* Emissão de receitas assinadas via ICP-Brasil / Gov.br.
⏳ *Homologação em 24 a 48h úteis:* Após conferência dos 4 documentos (CRM, Residência, Diploma/RQE e Chave PIX).

👉 Faça seu credenciamento gratuito em:
🔗 https://www.plantayraiz.com.br/cadastro-profissional

Como posso apoiar a sua prática clínica hoje?`,

  farmacia_lojista: `Olá! 🏪🌿 Bem-vindo(a) ao canal corporativo da *Planta y Raíz*!

Conectamos farmácias, fornecedores e associações a médicos prescritores e pacientes:
📦 *Shopping & Vitrine Oficial:* Seus produtos em destaque na nossa farmácia digital.
💰 *Split 95/5 no Checkout:* 95% do valor da venda vai para o lojista parceiro (taxa de 5% do marketplace).

👉 Cadastre sua farmácia ou associação na plataforma:
🔗 https://www.plantayraiz.com.br/cadastro

Qual marca, farmácia ou associação você representa?`,

  cadastrado: `Ótimo! Se você já tem cadastro como paciente, pode escolher seu médico e agendar sua consulta em https://www.plantayraiz.com.br/agendamento ou iniciar a Orientação Técnica (R$ 30) em https://www.plantayraiz.com.br/orientacao-tecnica 🌿`,

  orientacao_tecnica: ROTEIRO_ORIENTACAO_TECNICA,

  cannabis_info: `*Acompanhamento na Planta y Raiz* 🌿

O tratamento é avaliado individualmente pelo médico prescritor em consulta. Veja como iniciar seu atendimento:

${ROTEIRO_ORIENTACAO_TECNICA}`,

  generica: `Olá! 🌿 Sou a assistente virtual da *Planta y Raíz*. Para eu te ajudar com o link certo: você busca atendimento como *paciente* (Consulta ou Orientação Técnica) ou informações como *médico(a) prescritor(a)*?`,
};

function norm(t: string) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

function intent(text: string): keyof typeof MSGS {
  const t = norm(text);
  // Somente identifica como médico quando a pessoa diz que É médico/prescritor ou pede credenciamento profissional
  if (/^2\b|\bsou medic[oa]\b|\bsou doutor?a?\b|\bsou prescritor?a?\b|\bmeu crm\b|\btenho crm\b|\bquero prescrever\b|\bquero me credenciar\b|\bcredenciamento\b|\bcadastro profissional\b|\bminha clinica\b/.test(t)) return 'medico';
  if (/^3\b|\bfarmacia\b|\blojista\b|\bparceiro\b|\bparceria\b|\bafiliado\b|\bdistribuid|\brevend|\bassocia|\bforneced|\blaboratorio\b|\bmarca\b/.test(t)) return 'farmacia_lojista';
  if (/orientacao|tecnica|mentoria|edilson|bezerra/.test(t)) return 'orientacao_tecnica';
  if (/ja (tenho|fiz|possuo) cadastro|ja sou cadastrad|ja me cadastrei/.test(t)) return 'cadastrado';
  if (/^1\b|\bpaciente\b|\bsou paciente\b|\bconsulta\b|\btratamento\b|\bminha dor\b|\bremedio\b|\breceita\b|\bsintoma\b|\bagendar\b|\bagendamento\b|\bquero passar\b|\bquanto custa\b|\bvalor\b/.test(t)) return 'paciente';
  if (/cannabis|canabis|cbd|thc|canabidiol|epileps|autismo|fibromialgi|parkinson|ansiedade|insonia/.test(t)) return 'paciente';
  if (/^(ola|oi|hey|bom dia|boa tarde|boa noite|tudo bem|salve|brisa|alo|hello|hola)[\s!.,?]*$/.test(t.trim())) return 'boas_vindas';
  return 'generica';
}

function instantReply(text: string, name: string | null): string {
  const k = intent(text);
  const cleanName = patientName(name || '');
  const saud = cleanName ? `Olá, *${cleanName}*! ` : '';
  const msg = MSGS[k];
  return (k === 'boas_vindas' || k === 'medico' || k === 'farmacia_lojista' || k === 'paciente' || k === 'generica') ? msg : saud + msg;
}

// ── PARSER WAHA universal ────────────────────────────────────────────────
function parseWAHA(body: Record<string, unknown>) {
  const event = String(body?.event ?? '').toLowerCase();
  const SKIP = ['session.status','session.created','session.deleted','qr','auth.qr',
    'connection.update','presence.update','disconnected','initializing','connecting'];
  if (SKIP.some(e => event.includes(e))) return { skip: true, reason: `system_event:${event}` } as const;

  const payload = (body?.payload ?? body) as Record<string, unknown>;
  const payloadData = (payload?._data ?? {}) as Record<string, unknown>;
  const payloadId = (payload?.id && typeof payload.id === 'object' ? payload.id : payloadData?.id) as Record<string, unknown> | undefined;

  const fromMe = Boolean(
    payload?.fromMe ??
    payload?.from_me ??
    payloadData?.fromMe ??
    payloadId?.fromMe ??
    false
  );

  const chatId = String(payload?.from ?? payload?.chatId ?? payload?.id ?? '');
  const text   = String(payload?.body ?? payload?.text ?? payload?.caption ?? '').trim();
  const name   = String(payload?.senderName ?? payload?.notifyName ?? payloadData?.notifyName ?? '') || null;

  let messageId = '';
  if (typeof payload?.id === 'string') messageId = payload.id;
  else if (payloadId?.id || payloadId?._serialized) {
    messageId = String(payloadId.id || payloadId._serialized || '');
  }

  return {
    skip: false as const, messageId, chatId, phone: chatId.replace(/@.*/, '').replace(/\D/g, ''),
    fromMe, text, name, event,
    isGroup:  chatId.includes('@g.us') || /\d{10,}-\d+/.test(chatId),
    isStatus: chatId === 'status@broadcast',
  };
}

// ── DEDUP via banco ──────────────────────────────────────────────────────

// ── ENVIO WAHA / Evolution ────────────────────────────────────────────────
async function sendWAHA(chatId: string, text: string): Promise<boolean> {
  try {
    const base = WAHA_URL.startsWith('http') ? WAHA_URL : `https://${WAHA_URL}`;
    const r = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
      signal: AbortSignal.timeout(40_000),
    });
    if (r.ok) { console.log(`[brisa][WAHA] ✅ ${chatId}`); return true; }
    console.error(`[brisa][WAHA] HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
    return false;
  } catch (e: unknown) { console.error(`[brisa][WAHA] ${(e as Error)?.message}`); return false; }
}
async function sendEvo(phone: string, text: string): Promise<boolean> {
  if (!EVO_URL || !EVO_KEY) return false;
  try {
    const base = EVO_URL.startsWith('http') ? EVO_URL : `https://${EVO_URL}`;
    const r = await fetch(`${base}/message/sendText/${encodeURIComponent(EVO_INST)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: phone, text, options: { delay: 800, presence: 'composing' } }),
      signal: AbortSignal.timeout(20_000),
    });
    if (r.ok) { console.log(`[brisa][EVO] ✅ ***${String(phone).slice(-4)}`); return true; }
    console.error(`[brisa][EVO] HTTP ${r.status}`);
    return false;
  } catch (e: unknown) { console.error(`[brisa][EVO] ${(e as Error)?.message}`); return false; }
}
async function sendMsg(chatId: string, phone: string, rawText: string): Promise<boolean> {
  const text = sanitizeOutboundAnswer(rawText);
  if (!text) return false;
  const ok = await sendWAHA(chatId, text);
  if (ok) return true;
  console.warn('[brisa] WAHA falhou → Evolution...');
  return sendEvo(phone, text);
}

import { GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL, GEMINI_MODELS_FALLBACK_CHAIN, GATEWAY_GEMINI_CHAIN, GATEWAY_NO_REASONING } from '../_shared/gemini.ts';
import { buildScientificContextBlock } from '../_shared/scientific-context.ts';

// ── GEMINI (cérebro único, persona injetada por agente) ─────────────────
async function tryGemini(
  text: string,
  name: string | null,
  phone: string,
  persona: string = PERSONA,
): Promise<string | null> {
  const ctx  = name ? `[${name}|+${phone}]` : `[+${phone}]`;
  const user = `${ctx}\n${text}`;

  // 📚 RAG: evidências reais da biblioteca científica interna
  const evidence = await buildScientificContextBlock(text, 3);
  const systemPrompt = persona + evidence;


  if (LOVABLE_KEY) {
    for (const model of GATEWAY_GEMINI_CHAIN) {
      try {
        const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_KEY}` },
          body: JSON.stringify({
            model, max_tokens: 900, temperature: 0.7, reasoning: GATEWAY_NO_REASONING,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: user }],
          }),
          signal: AbortSignal.timeout(25_000),
        });
        if (r.ok) {
          const j = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
          const rep = j?.choices?.[0]?.message?.content?.trim();
          if (rep) { console.log(`[brisa] ✅ Lovable/${model} | evidências: ${evidence ? 'sim' : 'nao'}`); return rep; }
        } else {
          console.error(`[brisa] gateway ${model} HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
          if (r.status === 402 || r.status === 403) break; // terminal — não insistir
        }
      } catch (e: unknown) { console.error(`[brisa] gateway ${model}: ${(e as Error)?.message}`); }
    }
  }


  if (!GEMINI_KEY) return null;

  for (const model of GEMINI_MODELS_FALLBACK_CHAIN) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: 450, temperature: 0.75 },
          }),
          signal: AbortSignal.timeout(25_000),
        }
      );
      if (r.ok) {
        const j = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const rep = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rep) return rep;
      }
    } catch {}
  }
  return null;
}

// ── LOG ──────────────────────────────────────────────────────────────────
async function log(phone: string, inText: string, outText: string, via: string) {
  if (!SB_URL || !SB_KEY) return;
  try {
    const sb = createClient(SB_URL, SB_KEY);
    await Promise.allSettled([
      sb.from('brisa_interaction_logs').insert({
        channel: 'whatsapp', user_ref: phone, status: 'replied',
        meta: { text: inText.slice(0,400), reply: outText.slice(0,400), via },
      }),
      sb.from('whatsapp_messages').insert([
        { remote_jid: `${phone}@c.us`, message_text: inText,  direction: 'in',  status: 'received', from_me: false },
        { remote_jid: `${phone}@c.us`, message_text: outText, direction: 'out', status: 'sent',     from_me: true, sender_name: 'Enfermeira Brisa' },
      ]),
    ]);
  } catch {}
}

// ── HANDLER PRINCIPAL ─────────────────────────────────────────────────────
serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      ok: true, version: '2026.9.09-AGENTES-SEPARADOS-30MIN',
      agentes: { triagem: 'Enf. Brisa', orientacao_tecnica: 'Dr. Edilson Bezerra On (30 min por pagamento)' },
      roteiro_ativo: true,
      instant_reply: '✅ ATIVO (com o roteiro completo 5 passos)',
    }, null, 2), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405, headers: cors });

  // 🔐 Só aceita payloads assinados com o segredo do webhook (ou service-role)
  if (!webhookSecretOk(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let raw: Record<string, unknown> = {};
  try { raw = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }

  const p = parseWAHA(raw);
  if (p.skip) return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  const { chatId, phone, fromMe, text, name, isGroup, isStatus, messageId } = p;

  if (fromMe || isGroup || isStatus || !chatId || !text) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  // Bloqueio imediato dos números em laço e respostas automáticas de consultórios
  if ((phone && LOOPING_BOT_NUMBERS.has(phone)) || LOOPING_BOT_NUMBERS.has(chatId.replace(/@.*/, ''))) {
    return new Response(JSON.stringify({ ok: true, ignored: 'looping_bot_blacklisted' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  const quick = quickResponse({ question: text, senderName: name || '' });
  if (quick?.suppressed) {
    return new Response(JSON.stringify({ ok: true, ignored: quick.model }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const claim = SB_URL && SB_KEY
    ? await claimBrisaInbound(createClient(SB_URL, SB_KEY), messageId, chatId)
    : 'unavailable';
  if (claim !== 'claimed') {
    return new Response(JSON.stringify({ ok: claim === 'duplicate', ignored: claim }), {
      status: claim === 'duplicate' ? 200 : 503,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // ── ROTEADOR DE AGENTES ────────────────────────────────────────────────
  // Sessão paga ativa → Dr. Edilson Bezerra On (Orientação Técnica, 30 min).
  // Sem sessão paga  → Enf. Brisa (triagem curta + link de pagamento).
  const sb = serviceClient();
  const session = sb ? await resolveOtSession(sb, phone, name) : null;

  // Tempo esgotado → desliga o atendimento e avisa o paciente.
  if (sb && session && session.seconds_left <= 0) {
    await closeOtSession(sb, session.session_id);
    const bye = sessionExpiredMessage();
    const sentBye = await sendMsg(chatId, phone, bye);
    await log(phone, text, bye, 'ot_session_expired');
    return new Response(
      JSON.stringify({ ok: true, sent: sentBye, agent: 'session_expired', phone }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  if (sb && session) {
    // ── AGENTE: Dr. Edilson Bezerra On (pago, com relógio) ──
    const left = minutesLeft(session);

    if (session.opened_now) {
      const hello = sessionOpenedMessage(name);
      await sendMsg(chatId, phone, hello);
      await log(phone, '(pagamento aprovado)', hello, 'ot_session_opened');
    }

    let reply = await tryGemini(text, name, phone, drEdilsonPersona(left));
    if (!reply || reply.length < 20) {
      reply = `Recebi sua mensagem e estou analisando tecnicamente. Pode me detalhar os sintomas principais e o que já usou até hoje? Restam cerca de ${left} minuto(s) desta Orientação Técnica.`;
    }
    if (left <= 5 && (await markClosingNotice(sb, session.session_id))) {
      reply += `\n\n${sessionEndingSoonMessage(left)}`;
    }
    const sentOt = await sendMsg(chatId, phone, reply);
    await log(phone, text, reply, 'dr_edilson_on');
    await touchOtSession(sb, session.session_id);
    return new Response(
      JSON.stringify({ ok: true, sent: sentOt, agent: 'dr_edilson_on', minutes_left: left, phone }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  // ── AGENTE: Enf. Brisa (triagem) ───────────────────────────────────────
  const kind = intent(text);
  const useInstant = kind === 'boas_vindas' || kind === 'medico' || kind === 'farmacia_lojista' || (!GEMINI_KEY && !LOVABLE_KEY);
  const instant = useInstant ? instantReply(text, name) : '';
  let sent = false;
  if (instant) {
    sent = await sendMsg(chatId, phone, instant);
    await log(phone, text, instant, sent ? 'brisa_instant' : 'brisa_instant_failed');
  }

  if (!instant && (GEMINI_KEY || LOVABLE_KEY)) {
    const bg = async () => {
      let triage = await tryGemini(text, name, phone, BRISA_TRIAGE_PERSONA);
      if (!triage || triage.length < 20) {
        if (instant) return; // já respondemos com o roteiro
        triage = paywallMessage();
      }
      await sendMsg(chatId, phone, triage);
      await log(phone, text, triage, 'enf_brisa_triagem');
    };
    const rt = (globalThis as unknown as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
    if (rt?.waitUntil) rt.waitUntil(bg()); else await bg().catch(() => {});
    sent = true;
  }


  return new Response(
    JSON.stringify({ ok: true, sent, phone, chatId }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  );
});
