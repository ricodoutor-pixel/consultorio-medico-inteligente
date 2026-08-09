// 🌿 Brisa AI — Camada unificada de triagem cross-channel
// Fonte ÚNICA de verdade para chamadas de IA, fallback, circuit breaker e logging.
// Usada por: whatsapp-brisa-bot, meta-messenger-bot e qualquer futuro canal (web widget, etc).
import { createClient } from "npm:@supabase/supabase-js@2";
import { BRISA_PERSONA } from "./brisa-persona.ts";

import { GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL } from "./gemini.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_API_KEY =
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
  Deno.env.get("GEMINI_API_KEY") ||
  "";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = GEMINI_PRIMARY_MODEL;
const FALLBACK_MODEL = GEMINI_FALLBACK_MODEL;
const stripPrefix = (m: string) => m.replace(/^google\//, "");

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

// CTA universal — sempre direciona para os novos fluxos
export const BRISA_CTA_SUFFIX = `

// === CTA UNIFICADO (todos os canais) ===
- Após qualquer triagem concluída, direcione para uma destas rotas (mantendo UTMs/tracking):
  • Orientação rápida (chat): https://plantayraiz.com.br/orientacao-rapida
  • Orientação por vídeo: https://plantayraiz.com.br/orientacao-video
- Use sempre essas URLs canônicas ao convidar o paciente para concluir a Orientação Técnica.`;

export const BRISA_SYSTEM_PROMPT = BRISA_PERSONA + BRISA_CTA_SUFFIX;

// 🛡️ Circuit Breaker — 3 erros consecutivos abrem o circuito por 60s
type BreakerState = { failures: number; openedAt: number };
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60_000;
const _breaker: Record<string, BreakerState> = {
  lovable: { failures: 0, openedAt: 0 },
  gemini: { failures: 0, openedAt: 0 },
};
function isOpen(provider: string): boolean {
  const s = _breaker[provider];
  if (!s) return false;
  if (s.openedAt && Date.now() - s.openedAt < BREAKER_COOLDOWN_MS) return true;
  if (s.openedAt && Date.now() - s.openedAt >= BREAKER_COOLDOWN_MS) {
    s.failures = 0; s.openedAt = 0;
  }
  return false;
}
function recordSuccess(provider: string) {
  const s = _breaker[provider]; if (!s) return;
  s.failures = 0; s.openedAt = 0;
}
function recordFailure(provider: string) {
  const s = _breaker[provider]; if (!s) return;
  s.failures += 1;
  if (s.failures >= BREAKER_THRESHOLD) s.openedAt = Date.now();
}
export function breakerSnapshot() {
  return Object.fromEntries(Object.entries(_breaker).map(([k, v]) => [k, {
    failures: v.failures,
    open: isOpen(k),
    cooldown_remaining_ms: v.openedAt ? Math.max(0, BREAKER_COOLDOWN_MS - (Date.now() - v.openedAt)) : 0,
  }]));
}

// Mensagem ao usuário NUNCA expõe instabilidade — apenas prioridade
export const BRISA_BREAKER_FALLBACK_MESSAGE =
  "Recebi sua mensagem e estamos processando sua solicitação com prioridade. Em instantes te retorno por aqui 🌿";

const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

function normalizePhone(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

function isQuotaOrBillingFailure(status: number, detail: string): boolean {
  return status === 402 || status === 429 || /quota|rate limit|payment required|billing/i.test(detail);
}

async function alertEdilson(errorId: string, context: string, detail: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return;
  // Guard signup-only (política Dr. Edilson)
  const { shouldSilenceAdminAlert } = await import("./admin-alert-guard.ts");
  if (shouldSilenceAdminAlert("brisa-ai-heartbeat")) return;
  const text = `[ALERTA BRISA] Falha de IA. Log: ${errorId}\nCtx: ${context}\n${detail.slice(0, 400)}`;
  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
      body: JSON.stringify({ number: ADMIN_WHATSAPP, text, delay: 800 }),
    });
  } catch (e) { console.error("[brisa-ai] alertEdilson failed", e); }
}


// Heartbeat de erro crítico (Stripe, Supabase, etc.) — exportado p/ outras edge fns
export async function brisaHeartbeatAlert(endpoint: string, log: string) {
  const id = crypto.randomUUID().slice(0, 8);
  await alertEdilson(id, `endpoint=${endpoint}`, log);
  return id;
}


export type BrisaCallResult = {
  ok: boolean;
  reply: string;
  provider: "lovable" | "gemini" | "breaker" | "none";
  http_status?: number;
  error?: string;
  latency_ms: number;
};

async function callProvider(provider: "lovable" | "gemini", body: Record<string, unknown>): Promise<Response> {
  if (provider === "lovable") {
    return fetch(LOVABLE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        model: String((body as any).model || DEFAULT_MODEL).startsWith("google/")
          ? String((body as any).model || DEFAULT_MODEL)
          : `google/${stripPrefix(String((body as any).model || DEFAULT_MODEL))}`,
      }),
    });
  }

  return fetch(GEMINI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, model: stripPrefix(String((body as any).model || DEFAULT_MODEL)) }),
  });
}

// 🎯 Função principal — UNIFICA todas as chamadas IA da Brisa
export async function processar_triagem_brisa(
  mensagem: string,
  usuario_id: string,
  canal: string,
  options?: {
    history?: Array<{ role: string; content: string }>;
    model?: string;
    systemPrompt?: string;       // override (raro). Padrão = BRISA_SYSTEM_PROMPT
    response_format?: any;
    extra_messages?: any[];      // p/ áudios, multimodal
    log?: boolean;               // default true
  },
): Promise<BrisaCallResult> {
  const t0 = Date.now();
  const model = options?.model || DEFAULT_MODEL;
  const systemPrompt = options?.systemPrompt || BRISA_SYSTEM_PROMPT;
  const messages =
    options?.extra_messages ?? [
      { role: "system", content: systemPrompt },
      // 🧠 Memória RAG estendida: 14 últimas mensagens (≈ 7 turnos) — evita "amnésia" robótica
      ...((options?.history || []).slice(-14).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content,
      }))),
      { role: "user", content: mensagem },
    ];
  // 🌡️ Temperature 0.8 + top_p 0.95 → variabilidade humana
  // OBS: Gemini (OpenAI-compat) NÃO aceita presence_penalty/frequency_penalty → causa HTTP 400
  const body: Record<string, unknown> = {
    model, messages,
    temperature: 0.8,
    top_p: 0.95,
  };
  if (options?.response_format) body.response_format = options.response_format;

  const order: Array<"lovable" | "gemini"> = [];
  if (LOVABLE_API_KEY) order.push("lovable");
  if (GEMINI_API_KEY) order.push("gemini");

  let lastErr = "no_provider";
  let lastStatus = 0;

  // 🔁 RETRY EXPONENCIAL — 3 tentativas por provedor com backoff 400ms/800ms/1600ms
  const MAX_ATTEMPTS = 3;
  for (const provider of order) {
    if (isOpen(provider)) {
      lastErr = `${provider}_circuit_open`;
      continue;
    }
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const r = await callProvider(provider, body);
        if (r.ok) {
          const data = await r.json();
          const reply = (data?.choices?.[0]?.message?.content || "").trim();
          if (!reply) {
            lastErr = `${provider}_empty_reply`;
            if (attempt < MAX_ATTEMPTS) { await new Promise((res) => setTimeout(res, 200 * 2 ** attempt)); continue; }
            recordFailure(provider); break;
          }
          recordSuccess(provider);
          const result: BrisaCallResult = {
            ok: true, reply, provider, http_status: r.status, latency_ms: Date.now() - t0,
          };
          if (options?.log !== false) {
            logInteraction({
              channel: canal, user_ref: usuario_id, message_in: mensagem, message_out: reply,
              provider, model, status: "ok", http_status: r.status, latency_ms: result.latency_ms,
              meta: { attempt },
            }).catch(() => {});
          }
          return result;
        }
        const errText = await r.text().catch(() => "");
        lastErr = errText.slice(0, 400);
        lastStatus = r.status;
        console.error(`[brisa-ai] ${provider} attempt ${attempt}/${MAX_ATTEMPTS} HTTP ${r.status}`, errText.slice(0, 200));
        if (provider === "lovable" && isQuotaOrBillingFailure(r.status, errText)) {
          recordFailure(provider);
          break;
        }
        // 401/403 = chave inválida — não adianta repetir
        if (r.status === 401 || r.status === 403) { recordFailure(provider); break; }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((res) => setTimeout(res, 200 * 2 ** attempt));
          continue;
        }
        if ([400, 402, 429, 500, 502, 503].includes(r.status)) recordFailure(provider);
      } catch (e) {
        lastErr = String(e).slice(0, 400);
        console.error(`[brisa-ai] ${provider} attempt ${attempt}/${MAX_ATTEMPTS} exception`, e);
        if (attempt < MAX_ATTEMPTS) { await new Promise((res) => setTimeout(res, 200 * 2 ** attempt)); continue; }
        recordFailure(provider);
      }
    }
  }

  // 🛟 ÚLTIMO RECURSO: tenta modelo mais barato/leve (gemini-2.5-flash-lite) via Gemini direto
  // Cobre cenário: Lovable sem créditos (402) + flash sobrecarregado (503)
  if (GEMINI_API_KEY) {
    const fallbackModels = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
    for (const fm of fallbackModels) {
      try {
        const r = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, model: fm }),
        });
        if (r.ok) {
          const data = await r.json();
          const reply = (data?.choices?.[0]?.message?.content || "").trim();
          if (reply) {
            const result: BrisaCallResult = {
              ok: true, reply, provider: "gemini", http_status: r.status, latency_ms: Date.now() - t0,
            };
            if (options?.log !== false) {
              logInteraction({
                channel: canal, user_ref: usuario_id, message_in: mensagem, message_out: reply,
                provider: "gemini", model: fm, status: "ok", http_status: r.status,
                latency_ms: result.latency_ms, meta: { fallback_model: true },
              }).catch(() => {});
            }
            return result;
          }
        } else {
          const errText = await r.text().catch(() => "");
          console.error(`[brisa-ai] fallback ${fm} HTTP ${r.status}`, errText.slice(0, 200));
          lastStatus = r.status; lastErr = errText.slice(0, 400);
        }
      } catch (e) {
        console.error(`[brisa-ai] fallback ${fm} exception`, e);
        lastErr = String(e).slice(0, 400);
      }
    }
  }

  // ❌ Todos os provedores + retries + fallback falharam
  const errorId = crypto.randomUUID().slice(0, 8);
  const reply = BRISA_BREAKER_FALLBACK_MESSAGE;
  const sameAsAdmin = normalizePhone(usuario_id) && normalizePhone(usuario_id) === normalizePhone(ADMIN_WHATSAPP);
  const quotaLikeFailure = isQuotaOrBillingFailure(lastStatus, lastErr);
  // Dispara alerta INTERNO ao Dr. Edilson apenas quando fizer sentido e sem poluir o próprio chat de teste.
  if (!sameAsAdmin && !quotaLikeFailure) {
    alertEdilson(errorId, `canal=${canal} usuario=${usuario_id}`, `${lastStatus} ${lastErr}`).catch(() => {});
  }
  const result: BrisaCallResult = {
    ok: false, reply, provider: "breaker",
    http_status: lastStatus || undefined, error: `${errorId}:${lastErr}`, latency_ms: Date.now() - t0,
  };
  if (options?.log !== false) {
    logInteraction({
      channel: canal, user_ref: usuario_id, message_in: mensagem, message_out: reply,
      provider: result.provider, model, status: "error_alerted",
      http_status: result.http_status, latency_ms: result.latency_ms, error: lastErr,
      meta: { error_id: errorId, alerted_admin: true },
    }).catch(() => {});
  }
  return result;

}

export async function logInteraction(row: {
  channel: string;
  user_ref?: string | null;
  message_in?: string | null;
  message_out?: string | null;
  provider?: string | null;
  model?: string | null;
  status?: string;
  http_status?: number | null;
  latency_ms?: number | null;
  error?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await sb.from("brisa_interaction_logs").insert({
      channel: row.channel,
      user_ref: row.user_ref ?? null,
      message_in: (row.message_in || "").slice(0, 4000),
      message_out: (row.message_out || "").slice(0, 4000),
      provider: row.provider ?? null,
      model: row.model ?? null,
      status: row.status ?? "ok",
      http_status: row.http_status ?? null,
      latency_ms: row.latency_ms ?? null,
      error: row.error ?? null,
      meta: row.meta ?? {},
    });
  } catch (e) {
    console.error("[brisa-ai] logInteraction failed", e);
  }
}
