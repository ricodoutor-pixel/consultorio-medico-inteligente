// One-shot idempotent: copies BRISA_CEO_SECRET_KEY from env to vault.
// Requires service-role / cron secret authentication.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const unauth = requireServiceAuth(req, cors);
  if (unauth) return unauth;

  const secret = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";
  if (!secret) {
    return new Response(JSON.stringify({ error: "env missing" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.rpc("sync_brisa_vault_secret", { _value: secret });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true, result: data }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
