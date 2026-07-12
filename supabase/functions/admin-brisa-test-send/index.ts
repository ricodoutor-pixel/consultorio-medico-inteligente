// admin-brisa-test-send — admins can trigger a Brisa test message to any number.
// Verifies JWT + admin role, then POSTs to Evolution sendText and returns full diagnostics.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

let URL_BASE = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
if (URL_BASE && !/^https?:\/\//i.test(URL_BASE)) URL_BASE = `https://${URL_BASE}`;
const API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "";
const ADMIN_WA = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

async function withTimeout(url: string, init: RequestInit, ms = 10000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { ...init, signal: c.signal });
    return { status: r.status, body: (await r.text().catch(() => "")).slice(0, 1500) };
  } catch (e) {
    return { status: 0, body: "", error: String(e) };
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supa = createClient(SUPA_URL, SUPA_ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supa.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "invalid_session" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await supa.rpc("has_role", {
    _user_id: userData.user.id, _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "forbidden_admin_only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!URL_BASE || !API_KEY || !INSTANCE) {
    return new Response(JSON.stringify({
      error: "evolution_not_configured",
      missing: {
        EVOLUTION_API_URL: !URL_BASE,
        EVOLUTION_API_KEY: !API_KEY,
        EVOLUTION_INSTANCE: !INSTANCE,
      },
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const number = String(body.number || ADMIN_WA).replace(/\D/g, "");
  const text = String(body.text ||
    `✅ Teste Brisa 2.0 — Dr. Edilson, sistema Planta y Raiz online (${new Date().toLocaleString("pt-BR")}). Canal WhatsApp autônomo confirmado. 🌿`
  ).slice(0, 4096);

  const headers = { "Content-Type": "application/json", apikey: API_KEY };
  const inst = encodeURIComponent(INSTANCE);
  const [state, send] = await Promise.all([
    withTimeout(`${URL_BASE}/instance/connectionState/${inst}`, { method: "GET", headers }, 8000),
    withTimeout(`${URL_BASE}/message/sendText/${inst}`, {
      method: "POST", headers, body: JSON.stringify({ number, text }),
    }, 12000),
  ]);

  const ok = send.status >= 200 && send.status < 300;
  return new Response(JSON.stringify({
    ok, number, instance: INSTANCE,
    sendStatus: send.status, sendBody: send.body, sendError: (send as any).error,
    connectionState: { status: state.status, body: state.body, error: (state as any).error },
    hint: ok ? undefined :
      state.status === 0 ? "Evolution API inacessível — verifique EVOLUTION_API_URL/DNS." :
      state.body.includes("close") ? "Instância desconectada — escaneie o QR novamente." :
      "Falha no envio — veja sendBody para o motivo Evolution.",
  }), { status: ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
