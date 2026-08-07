// 🌿 Planta y Raiz — brisa-bot v2026.8.05-SEM-NOMES (modelos corrigidos)
// Nenhum nome de médico citado. Foco: orientação técnica, consulta por chat e por vídeo.
//
// ARQUITETURA (2 estágios, nunca falha):
// 1. INSTANT REPLY — resposta garantida por palavras-chave, sem depender de IA
// 2. GEMINI BACKGROUND — enriquece a resposta se a API estiver disponível
//
// CORRIGIDO: gemini-1.5-* (DESCONTINUADO pela Google, sempre 404) -> gemini-2.5-*

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const GEMINI_KEY   = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || '';
const WAHA_URL     = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/+$/, '');
const WAHA_KEY     = Deno.env.get('WAHA_API_KEY') || 'planta123';
const WAHA_SESSION = Deno.env.get('WAHA_SESSION') || 'default';
const EVO_URL      = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/+$/, '');
const EVO_KEY      = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVO_INST     = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz';
const LOVABLE_KEY  = Deno.env.get('LOVABLE_API_KEY') || '';
const SB_URL       = Deno.env.get('SUPABASE_URL') || '';
const SB_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// ── PERSONA — SEM nomes de médicos. Fala de serviços, não de pessoas ──────
const PERSONA = `Você é a Brisa 🌿, assistente virtual da Planta y Raiz, clínica digital de Cannabis Medicinal.

REGRA CRÍTICA: Você NUNCA cita nome de nenhum médico, nem CRM, nem "Dr." ou "Dra." seguido de nome. Fale sempre de forma institucional: "nossa equipe médica", "nossos especialistas", "a orientação técnica".

REGRAS INVIOLÁVEIS (CFM 2.314/2022, ANVISA RDC 1.015/2026, LGPD):
• NUNCA prescreva, NUNCA diagnostique, NUNCA recomende produto específico
• NUNCA afirme que cannabis "cura" doenças
• Emergências médicas → SAMU 192 imediatamente
• Planta y Raiz é plataforma de intermediação tecnológica (CNAE 6209-1/00)

ESTILO WhatsApp: respostas curtas (máx 4 linhas), acolhedora, profissional, emojis com moderação (🌿 ✅ 💚). Português brasileiro natural. PROIBIDO: "amor", "querida", "meu bem".

OBJETIVO: apresentar os dois formatos de atendimento e conduzir para https://plantayraiz.com.br:
• Orientação Técnica via Chat — R$ 30
• Consulta via Vídeo — R$ 30 (Brasil) / US$ 10 (internacional)
Não mencione preço na primeira mensagem.`;

// ── RESPOSTAS INSTANTÂNEAS — sem nomes, focadas em chat e vídeo ──────────
const MSGS = {
  boas_vindas: `Olá! 🌿 Sou a *Enfermeira Brisa*, assistente da *Planta y Raiz* — clínica digital de Cannabis Medicinal.

Temos dois formatos de atendimento:
💬 *Orientação Técnica via Chat*
📹 *Consulta via Vídeo*

Para começarmos:
1️⃣ *Qual é o seu nome?*
2️⃣ *Você é:* paciente, médico ou parceiro?
3️⃣ *Já tem cadastro?*

Cadastro *gratuito*: 🔗 *https://plantayraiz.com.br* 🌿`,

  cadastrado: `Ótimo! Você pode escolher:

💬 *Orientação Técnica via Chat* — R$ 30
📹 *Consulta via Vídeo* — R$ 30 (Brasil) | US$ 10 (internacional)

Acesse: 🔗 *https://plantayraiz.com.br*
PIX ou cartão ✅`,

  cannabis_info: `*Cannabis Medicinal no Brasil* 🌿

100% legal com prescrição médica! +870 mil pacientes ativos no país.

Pode beneficiar: epilepsia, dor crônica, ansiedade, TEA, Parkinson, distúrbios do sono e mais.

Fale com nossa equipe por *Chat* ou *Vídeo*:
🔗 *https://plantayraiz.com.br* | a partir de R$ 30`,

  medico: `Olá, Doutor(a)! 👨‍⚕️ Bem-vindo(a) à *Planta y Raiz*!

Plataforma de telemedicina em Cannabis Medicinal com atendimento por Chat e Vídeo.

Parceria, biblioteca científica e protocolos clínicos:
🔗 *https://plantayraiz.com.br* 🌿`,

  lojista: `Olá! 🏪 Interesse em parceria com a *Planta y Raiz*?

Afiliados (até 30%), marketplace ANVISA e co-marketing:
🔗 *https://plantayraiz.com.br*

Me conte sobre sua empresa! 🌿`,

  agendamento: `Você pode agendar:

💬 *Orientação Técnica via Chat* — R$ 30
📹 *Consulta via Vídeo* — R$ 30 (Brasil) | US$ 10 (internacional)

🔗 *https://plantayraiz.com.br*
PIX ou cartão ✅`,

  generica: `Olá! 🌿 Sou a *Enfermeira Brisa* da *Planta y Raiz*.

Oferecemos *Orientação Técnica via Chat* e *Consulta via Vídeo* sobre Cannabis Medicinal.

Cadastro gratuito: 🔗 *https://plantayraiz.com.br*

Você é paciente, médico ou parceiro? 😊`,
};

function norm(t: string) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

function intent(text: string): keyof typeof MSGS {
  const t = norm(text);
  if (/ja (tenho|fiz|possuo) cadastro|ja sou cadastrad|ja me cadastrei/.test(t)) return 'cadastrado';
  if (/\bmedico\b|\bdoutor?a?\b|\bdr\.?\b|\bdra\.?\b|crm\b|prescri|especialista|neurologista|psiquiatr/.test(t)) return 'medico';
  if (/lojista|parceiro|parceria|afiliado|comissao|distribuid|revend|atacado|fornec|empresa/.test(t)) return 'lojista';
  if (/cannabis|canabis|cbd|thc|canabidiol|maconha|epileps|autismo|fibromialgi|parkinson|alzheimer|dor cronica|ansiedade|insonia|sono|cancer|endometriose|legal\?|funciona|tratamento|o que e|para que serve/.test(t)) return 'cannabis_info';
  if (/agend|consult|marcar|horario|quando|disponivel|atend|teleconsult|chat|video/.test(t)) return 'agendamento';
  if (/^(ola|oi|hey|bom dia|boa tarde|boa noite|tudo bem|salve|e ai|oie|brisa|alo|hello|hola|eai|boa|hi\b)/.test(t.trim())) return 'boas_vindas';
  return 'generica';
}

function instantReply(text: string, name: string | null): string {
  const k = intent(text);
  const saud = name ? `Olá, *${name}*! ` : '';
  const msg = MSGS[k];
  return (k === 'boas_vindas' || k === 'medico' || k === 'lojista') ? msg : saud + msg;
}

// ── PARSER WAHA universal (com messageId para idempotência via DB) ───────
function parseWAHA(body: Record<string, unknown>) {
  const event = String(body?.event ?? '').toLowerCase();
  const SKIP = ['session.status','session.created','session.deleted','qr','auth.qr',
    'connection.update','presence.update','disconnected','initializing','connecting'];
  if (SKIP.some(e => event.includes(e))) return { skip: true, reason: `system_event:${event}` } as const;

  const payload = (body?.payload ?? body) as Record<string, unknown>;
  const chatId  = String(payload?.from ?? payload?.chatId ?? payload?.id ?? '');
  const fromMe  = Boolean(payload?.fromMe ?? payload?.from_me ?? false);
  const text    = String(payload?.body ?? payload?.text ?? payload?.caption ?? '').trim();
  const name    = String(payload?.senderName ?? payload?.notifyName ?? (payload?._data as Record<string,unknown>)?.notifyName ?? '') || null;

  let messageId = '';
  if (typeof payload?.id === 'string') messageId = payload.id;
  else if (payload?.id && typeof payload.id === 'object') {
    messageId = String((payload.id as Record<string,unknown>).id || (payload.id as Record<string,unknown>)._serialized || '');
  }

  return {
    skip: false as const, messageId, chatId, phone: chatId.replace(/@.*/, '').replace(/\D/g, ''),
    fromMe, text, name, event,
    isGroup:  chatId.includes('@g.us') || /\d{10,}-\d+/.test(chatId),
    isStatus: chatId === 'status@broadcast',
  };
}

// ── DEDUP via banco (persiste entre cold starts) ───────────────────
async function isDup(waId: string): Promise<boolean> {
  if (!waId || !SB_URL || !SB_KEY) return false;
  try {
    const sb = createClient(SB_URL, SB_KEY);
    const { data } = await sb.from('brisa_processed_messages').select('wa_message_id').eq('wa_message_id', waId).maybeSingle();
    return Boolean(data);
  } catch { return false; }
}
async function markDone(waId: string, chatId: string) {
  if (!waId || !SB_URL || !SB_KEY) return;
  try {
    const sb = createClient(SB_URL, SB_KEY);
    await sb.from('brisa_processed_messages').upsert({ wa_message_id: waId, remote_jid: chatId }, { onConflict: 'wa_message_id', ignoreDuplicates: true });
  } catch {}
}

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
    if (r.ok) { console.log(`[brisa][EVO] ✅ ${phone}`); return true; }
    console.error(`[brisa][EVO] HTTP ${r.status}`);
    return false;
  } catch (e: unknown) { console.error(`[brisa][EVO] ${(e as Error)?.message}`); return false; }
}
async function sendMsg(chatId: string, phone: string, text: string): Promise<boolean> {
  const ok = await sendWAHA(chatId, text);
  if (ok) return true;
  console.warn('[brisa] WAHA falhou → Evolution...');
  return sendEvo(phone, text);
}

// ── GEMINI (Estágio 2 — background, opcional) ────────────────────
async function tryGemini(text: string, name: string | null, phone: string): Promise<string | null> {
  const ctx  = name ? `[${name}|+${phone}]` : `[+${phone}]`;
  const user = `${ctx}\n${text}`;

  if (LOVABLE_KEY) {
    try {
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_KEY}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash', max_tokens: 350, temperature: 0.75,
          messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (r.ok) {
        const j = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
        const rep = j?.choices?.[0]?.message?.content?.trim();
        if (rep) { console.log('[brisa] ✅ Lovable/Gemini'); return rep; }
      } else {
        console.warn(`[brisa][LOVABLE] HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
      }
    } catch (e: unknown) { console.warn(`[brisa][LOVABLE] timeout: ${(e as Error)?.message}`); }
  }

  if (!GEMINI_KEY) { console.warn('[brisa][GEMINI] GEMINI_API_KEY ausente — só instant reply'); return null; }

  for (const model of ['gemini-2.5-flash', 'gemini-2.5-pro']) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: PERSONA }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: 350, temperature: 0.75 },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            ],
          }),
          signal: AbortSignal.timeout(25_000),
        }
      );
      if (r.ok) {
        const j = await r.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          promptFeedback?: { blockReason?: string };
        };
        if (j?.promptFeedback?.blockReason) { console.error(`[brisa][${model}] bloqueado: ${j.promptFeedback.blockReason}`); continue; }
        const rep = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rep) { console.log(`[brisa] ✅ Gemini ${model}`); return rep; }
      } else {
        const errBody = await r.text();
        console.error(`[brisa][GEMINI/${model}] HTTP ${r.status}: ${errBody.slice(0,300)}`);
      }
    } catch (e: unknown) {
      console.error(`[brisa][GEMINI/${model}] ${(e as Error)?.message}`);
    }
  }
  return null;
}

// ── LOG ────────────────────────────────────────────────────────────────────
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
      ok: true, version: '2026.8.05-SEM-NOMES-gemini2.5',
      responsavel: 'institucional — sem nome de médico citado',
      gemini: GEMINI_KEY ? `configurada (${GEMINI_KEY.slice(0,8)}...)` : 'ausente — instant reply garante funcionamento',
      waha: `${WAHA_URL} | session: ${WAHA_SESSION}`,
      instant_reply: '✅ SEMPRE ATIVO (não depende de IA)',
      dedup: '✅ via banco (brisa_processed_messages)',
      verify_jwt: false,
    }, null, 2), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405, headers: cors });

  let raw: Record<string, unknown> = {};
  try { raw = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }

  const ev = String(raw?.event ?? 'unknown');
  console.log(`[brisa][IN] event=${ev}`);

  const p = parseWAHA(raw);
  if (p.skip) {
    console.log(`[brisa][SKIP] ${p.reason}`);
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: p.reason }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const { chatId, phone, fromMe, text, name, isGroup, isStatus, messageId } = p;
  console.log(`[brisa][MSG] chatId=${chatId} fromMe=${fromMe} group=${isGroup} len=${text.length} id=${messageId.slice(0,16)}`);

  if (fromMe)   return new Response(JSON.stringify({ ok: true, ignored: 'fromMe' }),  { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (isGroup)  return new Response(JSON.stringify({ ok: true, ignored: 'group' }),   { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (isStatus) return new Response(JSON.stringify({ ok: true, ignored: 'status' }),  { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (!chatId || !text) {
    return new Response(JSON.stringify({ ok: true, ignored: 'no_text', chatId, textLen: text.length }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  if (messageId) {
    if (await isDup(messageId)) {
      console.log(`[brisa][DEDUP] já processado: ${messageId.slice(0,16)}`);
      return new Response(JSON.stringify({ ok: true, ignored: 'duplicate' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    await markDone(messageId, chatId);
  }

  // ── ESTÁGIO 1: resposta instantânea garantida (sem nomes) ──
  const instant = instantReply(text, name);
  console.log(`[brisa][INSTANT] intent=${intent(text)}`);
  const sent = await sendMsg(chatId, phone, instant);
  await log(phone, text, instant, sent ? 'waha_instant' : 'evo_instant');

  // ── ESTÁGIO 2: Gemini em background (sem nomes) ──
  if (GEMINI_KEY || LOVABLE_KEY) {
    const bg = async () => {
      const gemRep = await tryGemini(text, name, phone);
      if (!gemRep || gemRep.length < 30) return;
      const similar = gemRep.includes('plantayraiz.com.br') && instant.includes('plantayraiz.com.br') && gemRep.length < instant.length * 1.5;
      if (similar) { console.log('[brisa][GEMINI] similar ao instant — skip'); return; }
      console.log('[brisa][GEMINI] enviando enriquecimento...');
      await sendMsg(chatId, phone, gemRep);
      await log(phone, text, gemRep, 'gemini_enriched');
    };
    const rt = (globalThis as unknown as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
    if (rt?.waitUntil) rt.waitUntil(bg()); else bg().catch(e => console.warn('[brisa][GEMINI bg]', e));
  }

  return new Response(
    JSON.stringify({ ok: true, sent, phone, chatId, via: sent ? 'waha' : 'evolution' }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  );
});
