// 🌿 Brisa AI — Camada unificada de triagem cross-channel
// Fonte ÚNICA de verdade para chamadas de IA, fallback, circuit breaker e logging.
// Usada por: whatsapp-brisa-bot, meta-messenger-bot e qualquer futuro canal (web widget, etc).
import { createClient } from "npm:@supabase/supabase-js@2";
import { BRISA_PERSONA } from "./brisa-persona.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";
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
  gemini: { failures: 0, openedAt: 0 },
  lovable: { failures: 0, openedAt: 0 },
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

export const BRISA_BREAKER_FALLBACK_MESSAGE =
  "Olá! A Brisa está com uma atualização técnica rápida, mas nossa equipe já está sendo notificada. O que você gostaria de tratar hoje? 🌿";

export type BrisaCallResult = {
  ok: boolean;
  reply: string;
  provider: "gemini" | "lovable" | "breaker" | "none";
  http_status?: number;
  error?: string;
  latency_ms: number;
};

async function callProvider(provider: "gemini" | "lovable", body: Record<string, unknown>): Promise<Response> {
  if (provider === "gemini") {
    return fetch(GEMINI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model: stripPrefix(String((body as any).model || DEFAULT_MODEL)) }),
    });
  }
  return fetch(LOVABLE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
      ...((options?.history || []).slice(-6).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content,
      }))),
      { role: "user", content: mensagem },
    ];
  const body: Record<string, unknown> = { model, messages };
  if (options?.response_format) body.response_format = options.response_format;

  const order: Array<"gemini" | "lovable"> = [];
  if (GEMINI_API_KEY) order.push("gemini");
  if (LOVABLE_API_KEY) order.push("lovable");

  let lastErr = "no_provider";
  let lastStatus = 0;

  for (const provider of order) {
    if (isOpen(provider)) {
      lastErr = `${provider}_circuit_open`;
      continue;
    }
    try {
      const r = await callProvider(provider, body);
      if (r.ok) {
        const data = await r.json();
        const reply = (data?.choices?.[0]?.message?.content || "").trim();
        if (!reply) {
          recordFailure(provider);
          lastErr = `${provider}_empty_reply`;
          continue;
        }
        recordSuccess(provider);
        const result: BrisaCallResult = {
          ok: true, reply, provider, http_status: r.status, latency_ms: Date.now() - t0,
        };
        if (options?.log !== false) {
          logInteraction({
            channel: canal, user_ref: usuario_id, message_in: mensagem, message_out: reply,
            provider, model, status: "ok", http_status: r.status, latency_ms: result.latency_ms,
          }).catch(() => {});
        }
        return result;
      }
      // not ok
      const errText = await r.text().catch(() => "");
      lastErr = errText.slice(0, 400);
      lastStatus = r.status;
      // 400/402/500/429/503 contam pra abrir o breaker
      if ([400, 402, 429, 500, 502, 503].includes(r.status)) recordFailure(provider);
      console.error(`[brisa-ai] ${provider} HTTP ${r.status}`, errText.slice(0, 200));
    } catch (e) {
      lastErr = String(e).slice(0, 400);
      recordFailure(provider);
      console.error(`[brisa-ai] ${provider} exception`, e);
    }
  }

  // Todos os provedores falharam OU circuito aberto
  const breakerOpen = order.length > 0 && order.every(isOpen);
  const reply = breakerOpen
    ? BRISA_BREAKER_FALLBACK_MESSAGE
    : "Tive uma instabilidade técnica momentânea. Pode me chamar novamente em alguns minutos? 🌿";
  const result: BrisaCallResult = {
    ok: false, reply, provider: breakerOpen ? "breaker" : "none",
    http_status: lastStatus || undefined, error: lastErr, latency_ms: Date.now() - t0,
  };
  if (options?.log !== false) {
    logInteraction({
      channel: canal, user_ref: usuario_id, message_in: mensagem, message_out: reply,
      provider: result.provider, model, status: breakerOpen ? "breaker_open" : "error",
      http_status: result.http_status, latency_ms: result.latency_ms, error: lastErr,
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
