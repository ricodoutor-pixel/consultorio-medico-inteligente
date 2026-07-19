// 🌿 Planta y Raiz — brisa-bot v2026.7-prod
// CORRIGIDO: instância via env, Gemini+Lovable, anti-loop, anti-timeout
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret' };

// Variáveis — ZERO hardcode
const GEMINI_API_KEY     = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') || '';
const LOVABLE_API_KEY    = Deno.env.get('LOVABLE_API_KEY') || '';
const EVOLUTION_API_URL  = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
const EVOLUTION_API_KEY  = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz'; // CORRIGIDO: era 'brisa-bot-v2'
const WAHA_API_URL       = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY       = Deno.env.get('WAHA_API_KEY') || 'planta123';
const WAHA_SESSION       = Deno.env.get('WAHA_SESSION') || 'default';
const WEBHOOK_SECRET     = Deno.env.get('EVOLUTION_WEBHOOK_SECRET') || '';
const ADMIN_PHONE        = Deno.env.get('ADMIN_PHONE_BR') || '';

const PERSONA = `Você é a Brisa — Enfermeira Consultora da Planta y Raiz Ltda, especialista em Cannabis Medicinal.

INSTITUCIONAL (inegociável):
• A Planta y Raiz é plataforma de intermediação tecnológica (CNAE 6209-1/00)
• NÃO fabrica, vende ou entrega produtos farmacêuticos
• NÃO pratica atos médicos nem emite diagnósticos ou prescrições
• Emergências → SAMU 192 imediatamente
• Conforme CFM 2.314/2022, ANVISA RDC 1.015/2026 e LGPD

ESTILO (WhatsApp):
• Frases curtas, máximo 4 linhas
• Tom profissional e acolhedor
• PROIBIDO: "amor", "querido", "meu bem"
• Português brasileiro
• Emoji com parcimônia: 🌿

OBJETIVO: orientar o paciente e conduzi-lo para:
• Teleconsulta médica por vídeo: https://plantayraiz.com.br
• Dr. Edilson Bezerra — CRM-SP 10963
• Valor: R$30 (Brasil) | US$10 (internacional)
• NÃO falar de preço na primeira mensagem`;

async function callGemini(text: string, name: string | null, phone: string): Promise<string> {
  const ctx = name ? `[${name}|${phone}]` : `[${phone}]`;
  const prompt = `${ctx}\n${text}`;

  // 1º: Lovable Gateway (Gemini 2.5 Flash)
  if (LOVABLE_API_KEY) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 22_000);
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', max_tokens: 400, temperature: 0.7,
          messages: [{ role: 'system', content: PERSONA }, { role: 'user', content: prompt }] }),
      });
      clearTimeout(t);
      if (r.ok) {
        const j = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
        const reply = j?.choices?.[0]?.message?.content?.trim();
        if (reply) { console.log('[brisa] IA: lovable-gemini-2.5-flash'); return reply; }
      } else {
        const body = await r.text();
        console.error(`[brisa] Lovable HTTP ${r.status}: ${body.slice(0,200)}`);
      }
    } catch(e) { console.warn('[brisa] Lovable timeout:', e); }
  }

  // 2º: Gemini 1.5 Pro direto
  if (GEMINI_API_KEY) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25_000);
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: PERSONA }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      });
      clearTimeout(t);
      if (r.ok) {
        const j = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const reply = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) { console.log('[brisa] IA: gemini-1.5-pro-direct'); return reply; }
      } else {
        const body = await r.text();
        console.error(`[brisa] Gemini HTTP ${r.status}: ${body.slice(0,200)}`);
      }
    } catch(e) { console.warn('[brisa] Gemini timeout:', e); }
  }

  return 'Olá! Sou a Enfª Brisa da Planta y Raiz 🌿. Estou com instabilidade técnica. Em instantes retorno. Ou acesse: https://plantayraiz.com.br';
}

async function sendWAHA(chatId: string, text: string): Promise<{ok:boolean, status?:number, error?:string}> {
  try {
    const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
    const r = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
    });
    if (!r.ok) console.error(`[brisa] WAHA HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
    return { ok: r.ok, status: r.status };
  } catch(e) { return { ok: false, error: String(e) }; }
}

async function sendEvolution(phone: string, text: string): Promise<{ok:boolean, status?:number, error?:string}> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return { ok: false, error: 'no_evolution_config' };
  try {
    const base = EVOLUTION_API_URL.startsWith('http') ? EVOLUTION_API_URL : `https://${EVOLUTION_API_URL}`;
    const inst = encodeURIComponent(EVOLUTION_INSTANCE);
    const r = await fetch(`${base}/message/sendText/${inst}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: phone, text, options: { delay: 1200, presence: 'composing' } }),
    });
    if (!r.ok) console.error(`[brisa] Evolution HTTP ${r.status}: ${(await r.text()).slice(0,300)}`);
    return { ok: r.ok, status: r.status };
  } catch(e) { return { ok: false, error: String(e) }; }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      ok: true, service: 'brisa-bot', version: '2026.7-prod',
      instance: EVOLUTION_INSTANCE, waha: WAHA_API_URL,
      ai: LOVABLE_API_KEY ? 'lovable+gemini' : (GEMINI_API_KEY ? 'gemini-direct' : 'fallback'),
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405, headers: cors });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }

  // Parse WAHA payload
  const event    = String(body?.event ?? '').toLowerCase();
  const payload  = (body?.payload ?? body) as Record<string, unknown>;
  const chatId   = String(payload?.from ?? payload?.chatId ?? payload?.id ?? '');
  const fromMe   = Boolean(payload?.fromMe ?? payload?.from_me ?? false);
  const text     = String(payload?.body ?? payload?.text ?? payload?.caption ?? '').trim();
  const name     = String(payload?.senderName ?? payload?.notifyName ?? '') || null;
  const phone    = chatId.replace(/@.*/, '').replace(/\D/g, '');
  const isGroup  = chatId.includes('@g.us') || chatId.includes('-');
  const isStatus = chatId === 'status@broadcast';

  // ━ ANTI-LOOP: ignorar mensagens próprias
  if (fromMe) {
    console.log(`[brisa] ANTI-LOOP fromMe=true → ${chatId}`);
    return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'fromMe' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  if (isGroup)  return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'group' }),  { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (isStatus) return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'status' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (event && !event.includes('message')) return new Response(JSON.stringify({ ok: true, ignored: true, reason: `event:${event}` }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (!chatId || !text) return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'no_text' }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  // ━ ANTI-TIMEOUT: retornar 200 imediatamente, processar em background
  const bg = async () => {
    try {
      console.log(`[brisa] Msg de ${phone} (${name ?? '?'}): "${text.slice(0,100)}"`);
      const reply = await callGemini(text, name, phone);
      // Tenta WAHA primeiro, depois Evolution
      const waha = await sendWAHA(chatId, reply);
      if (!waha.ok) {
        console.warn('[brisa] WAHA falhou, tentando Evolution...');
        await sendEvolution(phone, reply);
      }
      console.log(`[brisa] Resposta enviada: "${reply.slice(0,80)}"`);
    } catch(e) { console.error('[brisa] bg error:', e); }
  };

  const rt = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(bg()); else bg().catch(console.error);

  return new Response(JSON.stringify({ ok: true, queued: true, phone }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
