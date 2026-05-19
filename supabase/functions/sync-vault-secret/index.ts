// One-shot: copia BRISA_CEO_SECRET_KEY do env para o vault (cron lê de lá).
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") || "";
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (auth !== `Bearer ${svc}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const secret = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";
  if (!secret) return new Response("BRISA_CEO_SECRET_KEY missing in env", { status: 500 });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, svc);

  // upsert via RPC executando SQL no vault
  const { data, error } = await sb.rpc("sync_brisa_vault_secret", { _value: secret });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true, result: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
