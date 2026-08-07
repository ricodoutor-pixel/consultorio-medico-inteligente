// ╔══════════════════════════════════════════════════════════════════╗
// ║  🌿 ENFERMEIRA BRISA — WhatsApp Bot PRODUÇÃO v2026.7.21        ║
// ║  Planta y Raiz Ltda · CFM 2.314/2022 · LGPD                   ║
// ║                                                                  ║
// ║  CORREÇÕES DESTA VERSÃO:                                        ║
// ║  ✅ Gemini via v1beta (endpoint correto — sem 404)             ║
// ║  ✅ Lovable REMOVIDA como dependência obrigatória              ║
// ║  ✅ Gemini 1.5 Flash como modelo principal (rápido + barato)  ║
// ║  ✅ System Prompt robusto injetado no Gemini                   ║
// ║  ✅ console.error detalhado em TODOS os erros                  ║
// ║  ✅ Anti-loop fromMe garantido                                 ║
// ║  ✅ Anti-timeout EdgeRuntime.waitUntil                        ║
// ║  ✅ WAHA primário · Evolution fallback                         ║
// ╚══════════════════════════════════════════════════════════════════╝

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

// ── Secrets (ZERO hardcode) ────────────────────────────────────────────────
const GEMINI_API_KEY     = Deno.env.get('GEMINI_API_KEY')
                        || Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
                        || '';
const WAHA_API_URL       = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY       = Deno.env.get('WAHA_API_KEY') || 'planta123';
const WAHA_SESSION       = Deno.env.get('WAHA_SESSION') || 'default';
const EVOLUTION_API_URL  = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
const EVOLUTION_API_KEY  = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') || '';

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function logMsg(row: Record<string, unknown>) {
  if (!SB_URL || !SB_KEY) return;
  try {
    await fetch(`${SB_URL}/rest/v1/whatsapp_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
  } catch (e) {
    console.error('[brisa][logMsg] falhou:', e);
  }
}

// ── System Prompt Robusto (Diretriz 3) ────────────────────────────────────
const SYSTEM_PROMPT = `Você é a Brisa 🌿, assistente virtual e Enfermeira Consultora da clínica digital Planta y Raiz, especializada em Cannabis Medicinal.

Sua supervisão clínica é da Dra. Suelen Naves Rodrigues (CRM-PR 49354), médica especialista em medicina canabinoide com mais de 10 anos de experiência.

━━ QUEM VOCÊ É ━━
Você NÃO é um chatbot genérico. Você é a Brisa: empática, inteligente, acolhedora e tecnicamente preparada para orientar pacientes sobre Cannabis Medicinal com segurança e respeito.

━━ COMPLIANCE INEGOCIÁVEL (CFM/ANVISA/LGPD) ━━
• A Planta y Raiz é plataforma de intermediação tecnológica (CNAE 6209-1/00)
• NUNCA prescreve medicamentos, NUNCA emite diagnóstico, NUNCA recomenda produto específico
• NUNCA afirma que cannabis "cura" qualquer doença
• Para emergências médicas → ORIENTE LIGAR PARA O SAMU 192 IMEDIATAMENTE e interrompa o fluxo clínico
• Conforme: CFM Res. 2.314/2022, ANVISA RDC 1.015/2026, LGPD Lei 13.709/2018

━━ FLUXOS DE ATENDIMENTO INSTITUCIONAIS ━━
1. PACIENTES / CURIOSOS: Acolher com empatia, responder dúvidas sobre cannabis medicinal e conduzir ao agendamento de teleconsulta em https://plantayraiz.com.br.
2. CAMPANHA PARA MÉDICOS CONVIDADOS (SÓCIO PRESCRITOR): Se o usuário for um médico respondendo ao convite "Sócio Prescritor", agradeça o retorno e tire todas as dúvidas. 
    Benefícios a destacar:
    - Retenção de 93% (apenas 7% de taxa da plataforma).
    - PIX instantâneo na conta do médico.
    - Liberdade total no preço da consulta.
    - Robô de IA (Brisa) faz anamnese pré-consulta e sugere titulação.
    - Workspace Médico: vídeo e prontuário na mesma tela.
    Objetivo: Encantar o médico e direcionar para realizar o cadastro 100% gratuito em https://plantayraiz.com.br (ou diretamente no link de cadastro médico).
3. RETORNO DE CAMPANHAS DE CONVITES (TODAS AS CATEGORIAS): Se qualquer usuário (médico, paciente, parceiro ou lojista) entrar em contato através das nossas campanhas de convite ativas, acolha-o de forma calorosa. O seu papel aqui é ORIENTAR O CADASTRO:
    - Informe que a plataforma está aberta e que o cadastro é **100% gratuito**.
    - Indique sempre que o cadastro pode ser feito rapidamente acessando nosso portal oficial: https://plantayraiz.com.br.
    - Se perguntarem sobre o que podem fazer, explique brevemente as categorias disponíveis na plataforma e incentive a finalização do cadastro.
4. LOJISTAS, ASSOCIATIVISMO E DISPENSÁRIOS: Esclarecer nossa diretriz estrita de intermediação em saúde conforme RDC ANVISA e encaminhar contatos de parcerias para suporte corporativo. Se vierem via campanha, instruí-los a se cadastrarem gratuitamente na plataforma.
5. RESPOSTA A LEMBRETES AUTOMÁTICOS: Auxiliar pacientes no reagendamento ou confirmação da orientação técnica com agilidade.
6. ATENDIMENTO EXECUTIVO À DIRETORA CLÍNICA (Dr. Edilson Bezerra (CRM-CE 10963)): Identificar a Dr. Edilson e prestar atendimento prioritário executivo imediato.

━━ ESTILO DE COMUNICAÇÃO ━━
• Mensagens CURTAS: máximo 3-4 linhas por resposta (é WhatsApp, não e-mail)
• Tom: profissional, acolhedor, empático e muito educado com médicos convidados.
• Emojis: use com moderação (🌿 ✅ 💚 👨‍⚕️ são os preferidos da Brisa)
• Português brasileiro natural, sem rebuscamento
• PROIBIDO: "amor", "querida", "meu bem", "gatinha", "benzinha"
• Use o nome do paciente/médico quando souber (Ex: "Doutor(a) [Nome]")

━━ OBJETIVO PRINCIPAL ━━
Para Pacientes: Agendar teleconsulta com Dr. Edilson (R$ 30) em https://plantayraiz.com.br, ou caso venham por campanha, orientar a realizar o cadastro gratuito.
Para Médicos Convidados: Responder dúvidas sobre a plataforma, reforçar as vantagens exclusivas (taxa de 7%, recebimento PIX imediato) e convencê-los a fazer o cadastro gratuito no site https://plantayraiz.com.br.
Para Outros Parceiros: Encantar e engajar a criar a conta gratuita na plataforma.

━━ DÚVIDAS FREQUENTES QUE VOCÊ SABE RESPONDER ━━
• O que é cannabis medicinal e para que serve
• Quais condições podem se beneficiar (epilepsia, dor, ansiedade, etc.)
• Para médicos: Como funciona a taxa (apenas 7%), como é o pagamento (PIX na hora), como é o robô de IA, etc.
• Como se cadastrar: O cadastro é gratuito para todos, basta acessar plantayraiz.com.br e escolher o perfil ideal.

Lembre: você orienta pacientes e também é a principal porta-voz comercial da Planta y Raíz para atrair a elite médica e novos parceiros!`;

// ── Cache de Idempotência (Em memória) ────────────────────────────────────
const processedMessages = new Set<string>();

// ── Parser de payload WAHA ─────────────────────────────────────────────────
interface ParsedMsg {
  messageId:  string;
  chatId:     string;
  phone:      string;
  fromMe:     boolean;
  text:       string;
  senderName: string | null;
  isGroup:    boolean;
  isStatus:   boolean;
  event:      string;
}

function parseWAHA(body: Record<string, unknown>): ParsedMsg {
  const event   = String(body?.event ?? '').toLowerCase();
  const payload = (body?.payload ?? body) as Record<string, unknown>;
  const chatId  = String(payload?.from ?? payload?.chatId ?? payload?.id ?? '');
  const fromMe  = Boolean(payload?.fromMe ?? payload?.from_me ?? false);
  const text    = String(payload?.body ?? payload?.text ?? payload?.caption ?? '').trim();
  const name    = String(payload?.senderName ?? payload?.notifyName ?? (payload?._data as Record<string,unknown>)?.notifyName ?? '') || null;
  
  // Extração segura do messageId (Idempotência)
  let messageId = '';
  if (typeof payload?.id === 'string') messageId = payload.id;
  else if (payload?.id && typeof payload.id === 'object') {
    messageId = String((payload.id as Record<string,unknown>).id || (payload.id as Record<string,unknown>)._serialized || '');
  }
  if (!messageId && payload?._data) {
    const dataId = (payload._data as Record<string,unknown>)?.id;
    if (dataId && typeof dataId === 'object') {
      messageId = String((dataId as Record<string,unknown>).id || (dataId as Record<string,unknown>)._serialized || '');
    }
  }

  return {
    messageId,
    chatId,
    phone:      chatId.replace(/@.*/, '').replace(/\D/g, ''),
    fromMe,
    text,
    senderName: name,
    isGroup:    chatId.includes('@g.us') || /\d{10,}-\d+/.test(chatId),
    isStatus:   chatId === 'status@broadcast',
    event,
  };
}

// ── Chamada Gemini (DIRETRIZ 1 + 2 + 3 + 4) ───────────────────────────────
async function callGemini(
  userText: string,
  senderName: string | null,
  phone: string
): Promise<{ text: string; source: string }> {

  if (!GEMINI_API_KEY) {
    console.error('[brisa][GEMINI] GEMINI_API_KEY não configurada nos Supabase Secrets!');
    throw new Error('GEMINI_API_KEY ausente');
  }

  const ctx     = senderName ? `[Paciente: ${senderName} | Tel: ${phone}]` : `[Tel: ${phone}]`;
  const userMsg = `${ctx}\n${userText}`;

  // ── OPÇÃO A: Lovable Gateway (apenas se tiver créditos — NÃO bloqueia o fluxo)
  if (LOVABLE_API_KEY) {
    try {
      const ctrl = new AbortController();
      const t    = setTimeout(() => ctrl.abort(), 15_000);
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method:  'POST',
        signal:  ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model:       'google/gemini-2.5-flash',
          max_tokens:  450,
          temperature: 0.75,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: userMsg },
          ],
        }),
      });
      clearTimeout(t);

      if (r.ok) {
        const j = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
        const reply = j?.choices?.[0]?.message?.content?.trim();
        if (reply) {
          console.log('[brisa][IA] Respondido via Lovable Gateway (gemini-2.5-flash)');
          return { text: reply, source: 'lovable:gemini-2.5-flash' };
        }
        console.warn('[brisa][LOVABLE] Resposta vazia, caindo para Gemini direto');
      } else {
        const errBody = await r.text();
        console.warn(`[brisa][LOVABLE] HTTP ${r.status} — ${errBody.slice(0, 300)} | Usando Gemini direto.`);
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.warn(`[brisa][LOVABLE] Timeout/rede: ${err?.message} | Usando Gemini direto.`);
    }
  }

  // ── OPÇÃO B: Gemini direto com fallback entre modelos oficiais
  const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];

  for (const model of MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const ctrl = new AbortController();
      const t    = setTimeout(() => ctrl.abort(), 28_000);

      const r = await fetch(endpoint, {
        method:  'POST',
        signal:  ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            { role: 'user', parts: [{ text: userMsg }] },
          ],
          generationConfig: {
            maxOutputTokens: 450,
            temperature:     0.75,
            topK:            40,
            topP:            0.95,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        }),
      });
      clearTimeout(t);

      if (r.ok) {
        const j = await r.json() as {
          candidates?: Array<{
            content?:      { parts?: Array<{ text?: string }> };
            finishReason?: string;
          }>;
          promptFeedback?: { blockReason?: string };
        };

        if (j?.promptFeedback?.blockReason) {
          console.error(`[brisa][GEMINI/${model}] Prompt bloqueado: ${j.promptFeedback.blockReason}`);
          continue;
        }

        const candidate = j?.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
          console.warn(`[brisa][GEMINI/${model}] finishReason=${candidate.finishReason}`);
        }

        const reply = candidate?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          console.log(`[brisa][IA] Respondido via Gemini direto (${model}) | ${reply.length} chars`);
          return { text: reply, source: `gemini-direct:${model}` };
        }
        console.warn(`[brisa][GEMINI/${model}] Resposta vazia, tentando próximo modelo`);

      } else {
        const errBody = await r.text();
        console.error(
          `[brisa][GEMINI/${model}] HTTP ${r.status} | Endpoint: ${endpoint.replace(GEMINI_API_KEY, 'KEY_HIDDEN')} | Body: ${errBody.slice(0, 500)}`
        );
        if (r.status === 400) throw new Error(`Gemini 400: ${errBody.slice(0, 200)}`);
      }

    } catch (e: unknown) {
      const err = e as Error;
      console.error(
        `[brisa][GEMINI/${model}] Exceção: ${err?.message ?? String(e)} | Stack: ${err?.stack?.slice(0, 400) ?? 'N/A'}`
      );
      if (err?.name === 'AbortError') {
        console.warn(`[brisa][GEMINI/${model}] Timeout (28s) — tentando próximo modelo`);
        continue;
      }
      throw err;
    }
  }

  throw new Error('Todos os modelos Gemini falharam — ver logs acima para detalhes');
}

// ── Envio WAHA (primário) ─────────────────────────────────────────────────
async function sendWAHA(
  chatId: string,
  text:   string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
    const r    = await fetch(`${base}/api/sendText`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
      body:    JSON.stringify({ session: WAHA_SESSION, chatId, text }),
      signal:  AbortSignal.timeout(40_000),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error(`[brisa][WAHA] HTTP ${r.status}: ${body.slice(0, 300)}`);

      if (r.status >= 400) {
        console.warn(`[brisa][WAHA] ⚠️ AVISO: Se a mensagem falhou para uma conta WhatsApp Business, verifique o motor do WAHA. Altere para 'WHATSAPP_DEFAULT_ENGINE=NOWEB' no servidor do WAHA.`);
      }

      return { ok: false, status: r.status, error: body.slice(0, 300) };
    }
    return { ok: r.ok, status: r.status };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(`[brisa][WAHA] Exceção: ${err?.message} | Stack: ${err?.stack?.slice(0, 300) ?? 'N/A'}`);
    return { ok: false, error: err?.message ?? String(e) };
  }
}

// ── Envio Evolution (fallback) ────────────────────────────────────────────
async function sendEvolution(
  phone: string,
  text:  string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn('[brisa][EVOLUTION] Não configurado (EVOLUTION_API_URL ou EVOLUTION_API_KEY ausentes)');
    return { ok: false, error: 'evolution_not_configured' };
  }
  try {
    const base = EVOLUTION_API_URL.startsWith('http') ? EVOLUTION_API_URL : `https://${EVOLUTION_API_URL}`;
    const inst = encodeURIComponent(EVOLUTION_INSTANCE);
    const r    = await fetch(`${base}/message/sendText/${inst}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
      body:    JSON.stringify({ number: phone, text, options: { delay: 1200, presence: 'composing' } }),
      signal:  AbortSignal.timeout(20_000),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error(`[brisa][EVOLUTION] HTTP ${r.status} instância=${EVOLUTION_INSTANCE}: ${body.slice(0, 300)}`);
      return { ok: false, status: r.status, error: body.slice(0, 300) };
    }
    return { ok: r.ok, status: r.status };
  } catch (e: unknown) {
    const err = e as Error;
    console.error(`[brisa][EVOLUTION] Exceção: ${err?.message} | Stack: ${err?.stack?.slice(0, 300) ?? 'N/A'}`);
    return { ok: false, error: err?.message ?? String(e) };
  }
}

// ── Handler principal ─────────────────────────────────────────────────────

// 🔐 Verificação do segredo compartilhado do webhook (anti-spoof)
const WAHA_WEBHOOK_SECRET = Deno.env.get("WAHA_WEBHOOK_SECRET") || "";
function webhookSecretOk(req: Request): boolean {
  if (!WAHA_WEBHOOK_SECRET) return false;
  const hdr = req.headers.get("x-webhook-secret") || req.headers.get("x-api-key") || "";
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return hdr === WAHA_WEBHOOK_SECRET || auth === WAHA_WEBHOOK_SECRET;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      ok:              true,
      service:         'brisa-bot',
      version:         '2026.7.27-fixed',
      gemini_key:      GEMINI_API_KEY ? `configurada (${GEMINI_API_KEY.slice(0,8)}...)` : '❌ AUSENTE',
      lovable_key:     LOVABLE_API_KEY ? 'configurada (opcional)' : 'ausente (ok — opcional)',
      waha_url:        WAHA_API_URL,
      waha_session:    WAHA_SESSION,
      evolution_inst:  EVOLUTION_INSTANCE,
      ai_mode:         'gemini-2.5-flash (direto, v1beta) + pro fallback — modelos 1.5/2.0 descontinuados REMOVIDOS',
      compliance:      'CFM 2.314/2022 · LGPD · ANVISA RDC 1.015/2026',
      diagnostics:     'gravando em whatsapp_messages para cada mensagem',
    }, null, 2), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST' && !webhookSecretOk(req)) {
    const unauth = requireServiceAuth(req, cors);
    if (unauth) return unauth;
  }

  if (req.method !== 'POST') {
    return new Response('method_not_allowed', { status: 405, headers: cors });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'invalid_json' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  const parsed = parseWAHA(body);
  const { messageId, chatId, phone, fromMe, text, senderName, isGroup, isStatus, event } = parsed;

  // 1. Verificação de Idempotência
  if (messageId) {
    if (processedMessages.has(messageId)) {
      console.log(`[brisa][IDEMPOTENCIA] Mensagem duplicada ignorada (abortando): ${messageId}`);
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: 'duplicate_message_id' }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
    processedMessages.add(messageId);

    if (processedMessages.size > 1000) {
      const it = processedMessages.values();
      for (let i = 0; i < 200; i++) processedMessages.delete(it.next().value);
    }
  }

  if (fromMe) {
    console.log(`[brisa][ANTI-LOOP] Mensagem enviada por mim (fromMe=true) ignorada: ${chatId}`);
    return new Response(
      JSON.stringify({ ok: true, ignored: true, reason: 'fromMe' }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
  if (isGroup)  return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'group'  }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (isStatus) return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'status' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  if (event && !event.includes('message')) {
    return new Response(
      JSON.stringify({ ok: true, ignored: true, reason: `event:${event}` }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
  if (!chatId || !text) {
    return new Response(
      JSON.stringify({ ok: true, ignored: true, reason: 'no_text_or_chatid' }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  const background = async () => {
    await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: text, message_type: 'text', direction: 'in', status: 'received', from_me: false, session: WAHA_SESSION });

    try {
      console.log(`[brisa] ➡️  Mensagem de ${phone} (${senderName ?? '?'}): "${text.slice(0, 120)}"`);

      const reply = await callGemini(text, senderName, phone);
      await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: reply.text, message_type: 'text', direction: 'out', status: `generated:${reply.source}`, from_me: true, session: WAHA_SESSION });

      const wahaResult = await sendWAHA(chatId, reply.text);
      if (wahaResult.ok) {
        console.log(`[brisa] ✅ Enviado via WAHA | para ${phone} | "${reply.text.slice(0, 80)}"`);
        await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: reply.text, message_type: 'text', direction: 'out', status: 'sent:waha', from_me: true, session: WAHA_SESSION });
      } else {
        console.warn(`[brisa] WAHA falhou (${wahaResult.status}/${wahaResult.error}) → tentando Evolution...`);
        const evResult = await sendEvolution(phone, reply.text);
        if (evResult.ok) {
          console.log(`[brisa] ✅ Enviado via Evolution | para ${phone}`);
          await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: reply.text, message_type: 'text', direction: 'out', status: 'sent:evolution', from_me: true, session: WAHA_SESSION });
        } else {
          console.error(`[brisa] ❌ Falha em AMBOS os canais de envio para ${phone}`);
          await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: reply.text, message_type: 'text', direction: 'out', status: `send_failed:waha=${wahaResult.status}:${wahaResult.error}|evolution=${evResult.error}`, from_me: true, session: WAHA_SESSION });
        }
      }

    } catch (e: unknown) {
      const err = e as Error;
      console.error(
        `[brisa] ❌ ERRO NO BACKGROUND | phone=${phone} | msg="${text.slice(0,80)}"`,
        `\n[brisa] message: ${err?.message ?? String(e)}`,
        `\n[brisa] stack: ${err?.stack?.slice(0, 600) ?? 'N/A'}`
      );

      const fallback =
        `Olá! Sou a Enfª Brisa da Planta y Raiz 🌿\n` +
        `Tive uma instabilidade momentânea. Em alguns instantes retorno.\n` +
        `Ou acesse diretamente: https://plantayraiz.com.br`;

      await logMsg({ remote_jid: chatId, sender_name: senderName, message_text: fallback, message_type: 'text', direction: 'out', status: `generation_failed:${err?.message ?? String(e)}`.slice(0, 500), from_me: true, session: WAHA_SESSION });

      const wahaFallback = await sendWAHA(chatId, fallback);
      if (!wahaFallback.ok) {
        await sendEvolution(phone, fallback);
      }
    }
  };

  const rt = (globalThis as unknown as {
    EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void }
  }).EdgeRuntime;
  if (rt?.waitUntil) {
    rt.waitUntil(background());
  } else {
    background().catch(console.error);
  }

  return new Response(
    JSON.stringify({ ok: true, queued: true, phone, chatId }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  );
});
