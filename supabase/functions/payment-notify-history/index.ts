import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async req => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return json({ error: "Serviço indisponível" }, 503);
  const auth = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return json({ error: "Acesso restrito" }, 401);
  const sb = createClient(url, service);
  const { data: admin } = await sb.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!admin) return json({ error: "Acesso restrito" }, 403);
  const { data: notices, error } = await sb.from("payment_notify_log").select("id,provider_message_id,sent_at,delivered_at,recipient").not("provider_message_id", "is", null).is("delivered_at", null).order("created_at", { ascending: false }).limit(10);
  if (error) return json({ error: "Não foi possível conferir os recibos" }, 500);
  const base = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
  if (!base || !key) return json({ checked: 0, message: "Conexão de recibos indisponível" });
  let checked = 0;
  for (const notice of notices || []) {
    try {
      const response = await fetch(`${base}/chat/findStatusMessage/${encodeURIComponent(instance)}`, {
        method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({ where: { id: notice.provider_message_id, remoteJid: `${notice.recipient}@s.whatsapp.net`, fromMe: true }, page: 1, offset: 0 }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : [payload];
      const delivered = rows.some(row => row?.key?.id === notice.provider_message_id && row?.MessageUpdate?.some((u: { status?: string }) => ["DELIVERY_ACK", "READ", "PLAYED"].includes(u.status || "")));
      await sb.from("payment_notify_log").update({ receipt_checked_at: new Date().toISOString(), ...(delivered ? { delivered_at: new Date().toISOString(), delivery_status: "delivered" } : {}) }).eq("id", notice.id);
      checked++;
    } catch { /* Acceptance remains acceptance when no independently confirmed receipt exists. */ }
  }
  return json({ checked });
});