// Consulta o nome da conta recebedora no provedor de pagamento (Mercado Pago /users/me).
// Uso administrativo: saber em nome de quem o pagador vê o recebimento do Pix.
// Nunca expõe tokens; retorna apenas nome, e-mail e tipo de cadastro.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");

  const internal = token === service || requireServiceAuth(req, corsHeaders) === null;
  if (!internal) {
    const admin = createClient(url, service);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "unauthorized" }, 401);
    const { data: role } = await admin.from("user_roles").select("role")
      .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "forbidden" }, 403);
  }

  const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!mpToken) return json({ error: "mp_not_configured" }, 500);

  try {
    const r = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${mpToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      await r.text();
      return json({ error: "mp_api_error", http: r.status }, 502);
    }
    const me = await r.json();
    return json({
      receiver_name: [me.first_name, me.last_name].filter(Boolean).join(" ").trim() || null,
      nickname: me.nickname ?? null,
      email: me.email ?? null,
      site_id: me.site_id ?? null,
      user_type: me.user_type ?? null,
      identification: me.identification ? { type: me.identification.type ?? null } : null,
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    return json({ error: "mp_unreachable", detail: (e as Error).message.slice(0, 200) }, 502);
  }
});
