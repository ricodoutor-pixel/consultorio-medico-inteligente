// 🌿 Planta y Raiz — brisa-bot v2026.8.08-DR-EDILSON-ORIENTACAO
// Resposta oficial de Orientação Técnica e Mentoria do Dr. Edilson Bezerra
// 
// ARQUITETURA (2 estágios, nunca falha):
// 1. INSTANT REPLY — resposta garantida por palavras-chave com o roteiro completo de Orientação Técnica
// 2. GEMINI BACKGROUND — enriquece com base no modelo gemini-2.5-flash

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

// ── ROTEIRO COMPLETO DE ORIENTAÇÃO TÉCNICA DO DR. EDILSON BEZERRA ──────
const ROTEIRO_ORIENTACAO_TECNICA = `📲 *PASSO A PASSO DO SEU ATENDIMENTO:*

1️⃣ *Acesse o Perfil do Profissional:*
Acesse o link direto do Dr. Edilson Bezerra na nossa plataforma:
👉 https://plantayraiz.com.br/profissionais

_(O Dr. Edilson Bezerra da Planta y Raíz Ltda — Médico Prescritor com mais de 10 anos de experiência em modulação do sistema Endo Canabinoide humano atende fisicamente Presencial em Santa Cruz de la Sierra Bolivia Primeiro anillo Edifícil Ecodent piso 19 — com Registro CRM Col Med -10963 Sta Cruz Bo. No Brasil, atua apenas Prestando Mentoria Orientação Técnica Especializada)._

2️⃣ *Escolha a Modalidade Desejada:*

💬 *Orientação Técnica via Chat (30 min):* R$ 30,00
_(Ideal para tirar dúvidas iniciais, entender posologia e histórico)._

📹 *Orientação Técnica Completa (Chat + Vídeo):* R$ 100,00
_(Atendimento por chamada de vídeo ao vivo para avaliação detalhada)._

3️⃣ *Pagamento Rápido e Seguro:*
O pagamento pode ser feito via PIX Instantâneo ou Cartão de Crédito (Mercado Pago).
Assim que o pagamento é confirmado, nossa assistente virtual Enfermeira Brisa envia o comprovante e o link de acesso direto para o seu WhatsApp!

4️⃣ *Seu Atendimento ao Vivo:*
No horário combinado, você entra na sala virtual segura pelo celular ou computador.
O Dr. Edilson analisará o seu caso, histórico de saúde, sintomas e a indicação de canabinoides medicinais.

5️⃣ *Recebimento do Relatório Técnico Digital:*
Ao final da orientação, você receberá o seu Relatório de Encaminhamento Técnico Completo, assinado digitalmente.
Este relatório contém o seu resumo clínico, a sugestão de protocolo terapêutico e o encaminhamento formal para que você possa dar continuidade ao seu tratamento com um médico prescritor referendado na plataforma.

❓ Ficou com alguma dúvida ou precisa de ajuda para agendar?
Nossa equipe e a Enfermeira Brisa estão prontas para te auxiliar no WhatsApp:
💬 https://wa.me/5511991363154

Seja muito bem-vindo(a) à medicina do futuro! 🌿💚`;

// ── PERSONA DA ENFERMEIRA BRISA ─────────────────────────────────────────
const PERSONA = `Você é a Enfermeira Brisa 🌿, assistente virtual oficial da Planta y Raiz (clínica digital de Cannabis Medicinal).

CONHECIMENTO OBRIGATÓRIO DE ATENDIMENTO E ORIENTAÇÃO TÉCNICA:
Sempre que um usuário perguntar sobre orientação técnica, consultas, Dr. Edilson Bezerra, mentoria, valores ou agendamento, responda utilizando com precisão as seguintes informações:

${ROTEIRO_ORIENTACAO_TECNICA}

REGRAS CONFORME REGULAMENTAÇÃO:
• Para orientação técnica e mentoria no Brasil, encaminhar para https://plantayraiz.com.br/profissionais
• Chat (30 min): R$ 30,00 | Vídeo Completo: R$ 100,00
• Emergências médicas → SAMU 192 imediatamente
• Estilo WhatsApp: acolhedora, profissional, transparente, emojis com moderação (🌿 💬 📹 💚).`;

// ── RESPOSTAS INSTANTÂNEAS ──────────────────────────────────────────────
const MSGS = {
  boas_vindas: `Olá! 🌿 Sou a *Enfermeira Brisa*, assistente da *Planta y Raiz* — clínica digital de Cannabis Medicinal.

${ROTEIRO_ORIENTACAO_TECNICA}`,

  cadastrado: `Ótimo! Você já pode agendar sua Orientação Técnica com o Dr. Edilson Bezerra:

${ROTEIRO_ORIENTACAO_TECNICA}`,

  orientacao_tecnica: ROTEIRO_ORIENTACAO_TECNICA,

  cannabis_info: `*Cannabis Medicinal no Brasil* 🌿

100% legal com prescrição e orientação técnica especializada! +870 mil pacientes ativos no país.

${ROTEIRO_ORIENTACAO_TECNICA}`,

  medico: `Olá, Doutor(a)! 👨‍⚕️ Bem-vindo(a) à *Planta y Raiz*!

Conheça nossa estrutura de Mentoria, Orientação Técnica e Consultório Virtual:
👉 https://plantayraiz.com.br/profissionais 🌿`,

  lojista: `Olá! 🏪 Interesse em parceria com a *Planta y Raiz*?

Afiliados (até 30%), marketplace ANVISA e co-marketing:
🔗 *https://plantayraiz.com.br* 🌿`,

  generica: ROTEIRO_ORIENTACAO_TECNICA,
};

function norm(t: string) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

function intent(text: string): keyof typeof MSGS {
  const t = norm(text);
  if (/orientacao|tecnica|mentoria|edilson|bezerra|passo a passo|como funciona|atendimento/.test(t)) return 'orientacao_tecnica';
  if (/ja (tenho|fiz|possuo) cadastro|ja sou cadastrad|ja me cadastrei/.test(t)) return 'cadastrado';
  if (/\bmedico\b|\bdoutor?a?\b|\bdr\.?\b|\bdra\.?\b|crm\b|prescri|especialista/.test(t)) return 'medico';
  if (/lojista|parceiro|parceria|afiliado|comissao|distribuid|revend/.test(t)) return 'lojista';
  if (/cannabis|canabis|cbd|thc|canabidiol|maconha|epileps|autismo|fibromialgi|parkinson|ansiedade|insonia/.test(t)) return 'cannabis_info';
  if (/^(ola|oi|hey|bom dia|boa tarde|boa noite|tudo bem|salve|brisa|alo|hello|hola)/.test(t.trim())) return 'boas_vindas';
  return 'orientacao_tecnica';
}

function instantReply(text: string, name: string | null): string {
  const k = intent(text);
  const saud = name ? `Olá, *${name}*! ` : '';
  const msg = MSGS[k];
  return (k === 'boas_vindas' || k === 'medico' || k === 'lojista') ? msg : saud + msg;
}

// ── PARSER WAHA universal ────────────────────────────────────────────────
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

// ── DEDUP via banco ──────────────────────────────────────────────────────
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

// ── GEMINI (Estágio 2 — background) ──────────────────────────────────────
async function tryGemini(text: string, name: string | null, phone: string): Promise<string | null> {
  const ctx  = name ? `[${name}|+${phone}]` : `[+${phone}]`;
  const user = `${ctx}\n${text}`;

  if (LOVABLE_KEY) {
    try {
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_KEY}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash', max_tokens: 450, temperature: 0.75,
          messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (r.ok) {
        const j = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
        const rep = j?.choices?.[0]?.message?.content?.trim();
        if (rep) { console.log('[brisa] ✅ Lovable/Gemini'); return rep; }
      }
    } catch {}
  }

  if (!GEMINI_KEY) return null;

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
      ok: true, version: '2026.8.08-DR-EDILSON-ORIENTACAO',
      responsavel: 'Enfermeira Brisa (Orientação Técnica Dr. Edilson Bezerra)',
      roteiro_ativo: true,
      instant_reply: '✅ ATIVO (com o roteiro completo 5 passos)',
    }, null, 2), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405, headers: cors });

  let raw: Record<string, unknown> = {};
  try { raw = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }

  const p = parseWAHA(raw);
  if (p.skip) return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  const { chatId, phone, fromMe, text, name, isGroup, isStatus, messageId } = p;

  if (fromMe || isGroup || isStatus || !chatId || !text) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  if (messageId) {
    if (await isDup(messageId)) return new Response(JSON.stringify({ ok: true, ignored: 'duplicate' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    await markDone(messageId, chatId);
  }

  // ── ESTÁGIO 1: resposta instantânea com o roteiro completo ──
  const instant = instantReply(text, name);
  const sent = await sendMsg(chatId, phone, instant);
  await log(phone, text, instant, sent ? 'waha_instant' : 'evo_instant');

  // ── ESTÁGIO 2: Gemini em background ──
  if (GEMINI_KEY || LOVABLE_KEY) {
    const bg = async () => {
      const gemRep = await tryGemini(text, name, phone);
      if (!gemRep || gemRep.length < 30) return;
      if (gemRep.includes('https://plantayraiz.com.br/profissionais')) return; // evita duplicar roteiro
      await sendMsg(chatId, phone, gemRep);
      await log(phone, text, gemRep, 'gemini_enriched');
    };
    const rt = (globalThis as unknown as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
    if (rt?.waitUntil) rt.waitUntil(bg()); else bg().catch(() => {});
  }

  return new Response(
    JSON.stringify({ ok: true, sent, phone, chatId }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  );
});
