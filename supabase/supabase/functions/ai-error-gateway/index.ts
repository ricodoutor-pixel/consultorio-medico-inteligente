// AI Error Gateway — autocura: recebe erros, dedup por fingerprint, classifica via Gemini
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function classifyError(payload: {
  source: string; source_ref?: string; error_type?: string;
  error_message: string; stack?: string; context?: any;
}): Promise<{ severity: string; diagnosis: string; suggested_fix: string; confidence: number }> {
  try {
    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um SRE sênior da Planta y Raiz (telemedicina). Classifique o erro e sugira correção objetiva em pt-BR. severity: low (cosmético), medium (UX), high (funcionalidade quebrada), critical (perda de receita / dados / pagamento / prescrição)." },
          { role: "user", content: JSON.stringify(payload).slice(0, 4000) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "diagnose_error",
            parameters: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                diagnosis: { type: "string", description: "Causa provável em 1-2 frases" },
                suggested_fix: { type: "string", description: "Patch/ação recomendada" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["severity", "diagnosis", "suggested_fix", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "diagnose_error" } },
      }),
    });
    if (!resp.ok) throw new Error(`gateway ${resp.status}`);
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("no tool_call");
    return JSON.parse(args);
  } catch (e) {
    console.error("[ai-error-gateway] classify failed", e);
    return { severity: "medium", diagnosis: "Classificação indisponível.", suggested_fix: "Revisar manualmente.", confidence: 0 };
  }
}

// Per-IP rate limiter (in-memory, best-effort within an isolate)
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const ipHits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = ipHits.get(ip);
  if (!cur || cur.reset < now) {
    ipHits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  cur.count++;
  return cur.count > RATE_MAX;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Public error-reporting endpoint (telemetry only, no data returned).
  // A key/JWT must be presented, but we do not compare it against a specific key:
  // publishable/anon key rotation and legacy JWT-vs-opaque key formats would
  // otherwise cause spurious 401s. Abuse is bounded by the per-IP rate limit
  // plus fingerprint dedup below.
  const apikey = req.headers.get("apikey") || "";
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!apikey && !auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Per-IP rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      source = "frontend",
      source_ref = null,
      error_type = null,
      error_message = "",
      stack = null,
      context = {},
    } = body || {};

    if (!error_message || typeof error_message !== "string") {
      return new Response(JSON.stringify({ error: "error_message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fingerprint p/ deduplicação (source + tipo + 1ª linha do stack ou message)
    const stackHead = (stack || "").split("\n").slice(0, 2).join("|");
    const fingerprint = await sha256Hex(`${source}|${source_ref || ""}|${error_type || ""}|${stackHead || error_message.slice(0, 200)}`);

    // Tenta upsert por fingerprint
    const { data: existing } = await supabase
      .from("error_autohealing")
      .select("id, occurrences, status")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (existing) {
      await supabase.from("error_autohealing").update({
        occurrences: existing.occurrences + 1,
        last_seen_at: new Date().toISOString(),
        status: existing.status === "resolved" ? "open" : existing.status,
      }).eq("id", existing.id);

      return new Response(JSON.stringify({ ok: true, deduped: true, id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Novo erro → classifica via Gemini
    const ai = await classifyError({ source, source_ref, error_type, error_message, stack, context });

    const { data: inserted, error: insErr } = await supabase
      .from("error_autohealing")
      .insert({
        source, source_ref, error_type, error_message, stack,
        context, fingerprint,
        severity: ai.severity,
        ai_diagnosis: ai.diagnosis,
        ai_suggested_fix: ai.suggested_fix,
        ai_confidence: ai.confidence,
      })
      .select("id, severity")
      .single();

    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, id: inserted.id, severity: inserted.severity, diagnosis: ai.diagnosis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[ai-error-gateway] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
