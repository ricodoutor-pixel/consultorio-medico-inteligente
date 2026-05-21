// 🎛️ Lovable Remote Commander
// Recebe comandos remotos autenticados (Bearer REMOTE_COMMANDER_TOKEN)
// e atualiza dinamicamente public.system_settings — sem novo deploy.
//
// Endpoints (POST JSON):
//   { action: "get",  key: "brisa_system_prompt" }
//   { action: "set",  key: "brisa_system_prompt", value: { prompt: "..." } }
//   { action: "list" }
//   { action: "delete", key: "..." }
//
// Header:  Authorization: Bearer <REMOTE_COMMANDER_TOKEN>

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN = Deno.env.get("REMOTE_COMMANDER_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function audit(action: string, key: string | null, payload: unknown, success: boolean, error?: string, ip?: string) {
  try {
    await supabase.from("remote_command_log").insert({
      action, key, payload: payload as any, success, error: error ?? null, source_ip: ip ?? null,
    });
  } catch (e) {
    console.error("[commander] audit failed", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

  // 🔐 Bearer token guard (constant-time-ish)
  if (!TOKEN) return json({ error: "Server not configured (missing REMOTE_COMMANDER_TOKEN)" }, 500);
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (auth.length !== TOKEN.length || auth !== TOKEN) {
    await audit("auth_failed", null, null, false, "invalid_token", ip ?? undefined);
    return json({ error: "Unauthorized" }, 401);
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const action = String(body?.action || "").toLowerCase();
  const key = body?.key ? String(body.key).slice(0, 120) : null;

  try {
    if (action === "list") {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value, description, updated_at")
        .order("key");
      if (error) throw error;
      await audit(action, null, null, true, undefined, ip ?? undefined);
      return json({ ok: true, items: data });
    }

    if (action === "get") {
      if (!key) return json({ error: "key required" }, 400);
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value, description, updated_at")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      await audit(action, key, null, true, undefined, ip ?? undefined);
      return json({ ok: true, item: data });
    }

    if (action === "set") {
      if (!key) return json({ error: "key required" }, 400);
      if (typeof body.value === "undefined") return json({ error: "value required" }, 400);
      const description = body.description ? String(body.description).slice(0, 500) : null;
      const { data, error } = await supabase
        .from("system_settings")
        .upsert({ key, value: body.value, description }, { onConflict: "key" })
        .select()
        .maybeSingle();
      if (error) throw error;
      await audit(action, key, body.value, true, undefined, ip ?? undefined);
      return json({ ok: true, item: data });
    }

    if (action === "delete") {
      if (!key) return json({ error: "key required" }, 400);
      const { error } = await supabase.from("system_settings").delete().eq("key", key);
      if (error) throw error;
      await audit(action, key, null, true, undefined, ip ?? undefined);
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${action}. Use list|get|set|delete.` }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[commander] error", msg);
    await audit(action || "unknown", key, body, false, msg, ip ?? undefined);
    return json({ error: msg }, 500);
  }
});
