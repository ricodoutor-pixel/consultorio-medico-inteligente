import { corsHeaders as baseCors } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  ...baseCors,
  "Access-Control-Allow-Headers":
    (baseCors["Access-Control-Allow-Headers"] || "") + ", x-cron-secret",
};

const COLORS: Record<string, number> = {
  SUCCESS: 0x00ff00,
  WARNING: 0xffff00,
  CRITICAL: 0xff0000,
  AUDIT: 0xffff00,
  FINANCIAL: 0x00ff00,
};

const ALLOWED_LEVELS = new Set(Object.keys(COLORS));

// Simple in-memory rate limit (per isolate). Best-effort anti-spam.
const RATE: Map<string, { count: number; reset: number }> = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = RATE.get(key);
  if (!entry || entry.reset < now) {
    RATE.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;


  try {
    const webhookUrl = Deno.env.get("DISCORD_SRE_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anon";
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const level = String(body.level || "").toUpperCase();
    const description = typeof body.description === "string" ? body.description.slice(0, 1500) : "";
    const title = typeof body.title === "string" ? body.title.slice(0, 200) : `Log: ${level}`;
    const fieldsInput = Array.isArray(body.fields) ? body.fields.slice(0, 10) : [];

    if (!ALLOWED_LEVELS.has(level)) {
      return new Response(JSON.stringify({ error: "Invalid level" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!description) {
      return new Response(JSON.stringify({ error: "description required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fields = fieldsInput
      .filter((f: any) => f && typeof f.name === "string" && typeof f.value === "string")
      .map((f: any) => ({
        name: String(f.name).slice(0, 200),
        value: String(f.value).slice(0, 500),
        inline: Boolean(f.inline),
      }));

    const payload = {
      username: "Planta y Raiz",
      embeds: [
        {
          title,
          description,
          color: COLORS[level],
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "Torre de Controle - Planta y Raiz" },
        },
      ],
    };

    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      console.error("Discord webhook failed", r.status);
      return new Response(JSON.stringify({ error: "Upstream failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sre-alert error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
