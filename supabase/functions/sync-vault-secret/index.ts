// One-shot idempotente: copia BRISA_CEO_SECRET_KEY do env para o vault.
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const secret = Deno.env.get("BRISA_CEO_SECRET_KEY") || "";
  if (!secret) return new Response("env missing", { status: 500 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.rpc("sync_brisa_vault_secret", { _value: secret });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true, result: data, env_len: secret.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
