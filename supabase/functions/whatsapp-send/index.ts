// whatsapp-send — Envia mensagem via Evolution API e registra na tabela whatsapp_messages.
// Requer JWT do admin (authenticated). Validação de role server-side via has_role.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

import { sendWhatsApp } from "../_shared/evolution.ts";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate caller
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roleData } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) return json({ error: "forbidden" }, 403);

  let payload: { remote_jid?: string; number?: string; text?: string } = {};
  try { payload = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const text = (payload.text || "").trim();
  const rawTarget = payload.number || payload.remote_jid || "";
  const number = String(rawTarget).split("@")[0].replace(/\D/g, "");
  if (!number || number.length < 10 || number.length > 15) return json({ error: "invalid_number" }, 400);
  if (!text || text.length > 4096) return json({ error: "invalid_text" }, 400);

  const res = await sendWhatsApp(number, text);
  let sent = { ok: res.ok, status: res.status, body: res.error || "" };

  await admin.from("whatsapp_messages").insert({
    remote_jid: `${number}@s.whatsapp.net`,
    sender_name: "Operador",
    message_text: text,
    message_type: "text",
    direction: "out",
    status: sent.ok ? "sent" : "failed",
  });

  if (!sent.ok) return json({ error: "evolution_error", status: sent.status, body: sent.body }, 502);
  return json({ ok: true, number });
});
