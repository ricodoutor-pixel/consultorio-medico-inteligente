// Proxy admin → brisa-fb-auto-post / brisa-ig-auto-post
// - Exige usuário autenticado com role 'admin'
// - Bloqueia execução antes de 18/06/2026 (restrição Meta)
// - Forwards { caption, image_url } com auth de service role
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UNLOCK_DATE = new Date("2026-06-18T00:00:00Z");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1) Validar JWT do usuário + role admin
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Missing auth" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes, error: uErr } = await userClient.auth.getUser();
  if (uErr || !userRes?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const admin = createClient(SUPABASE_URL, SERVICE);
  const { data: roleRow } = await admin.from("user_roles")
    .select("role").eq("user_id", userRes.user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2) Lock até 18/06/2026 (restrição Meta)
  if (new Date() < UNLOCK_DATE) {
    return new Response(JSON.stringify({
      error: "Posts manuais bloqueados até 18/06/2026 (restrição Meta ativa).",
      unlock_at: UNLOCK_DATE.toISOString(),
    }), { status: 423, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 3) Parse body
  const body = await req.json().catch(() => ({}));
  const platform = String(body?.platform || "").toLowerCase();
  const caption = String(body?.caption || "").trim();
  const image_url = String(body?.image_url || body?.media_url || "").trim();

  if (!["facebook", "instagram"].includes(platform)) {
    return new Response(JSON.stringify({ error: "platform must be 'facebook' or 'instagram'" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!caption || caption.length < 10) {
    return new Response(JSON.stringify({ error: "caption is required (min 10 chars)" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (platform === "instagram" && !image_url) {
    return new Response(JSON.stringify({ error: "Instagram exige image_url" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4) Forward com service auth
  const target = platform === "facebook" ? "brisa-fb-auto-post" : "brisa-ig-auto-post";
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${target}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE}`,
      apikey: SERVICE,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ caption, image_url }),
  });
  const result = await r.json().catch(() => ({}));

  // 5) Log audit
  await admin.from("ai_events").insert({
    ai_name: "admin_meta_post",
    event_type: `manual_${platform}_post`,
    status: r.ok ? "completed" : "error",
    output_data: { user_id: userRes.user.id, platform, caption_preview: caption.slice(0, 120), result },
  });

  return new Response(JSON.stringify({ ok: r.ok, platform, result }), {
    status: r.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
