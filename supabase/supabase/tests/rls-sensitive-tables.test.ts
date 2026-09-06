/**
 * RLS Policy Validation Suite
 * ----------------------------------------------------------------------
 * Valida que:
 *  - Apenas admins acessam: social_interactions, whatsapp_conversations,
 *    whatsapp_routing_log, alert_history
 *  - Anônimos continuam podendo INSERT em: leads_contatos, app_downloads
 *
 * Como rodar (Deno):
 *   deno test --allow-env --allow-net supabase/tests/rls-sensitive-tables.test.ts
 *
 * Variáveis de ambiente esperadas:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY  (anon key)
 *   TEST_ADMIN_EMAIL  / TEST_ADMIN_PASSWORD       (usuário com role 'admin')
 *   TEST_USER_EMAIL   / TEST_USER_PASSWORD        (usuário sem role admin)
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const SENSITIVE_TABLES = [
  "social_interactions",
  "whatsapp_conversations",
  "whatsapp_routing_log",
  "alert_history",
] as const;

function newAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email?: string, password?: string): Promise<SupabaseClient | null> {
  if (!email || !password) return null;
  const c = newAnonClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn(`signIn failed for ${email}:`, error.message);
    return null;
  }
  return c;
}

// ─────────────────────────────────────────────────────────────────────
// 1. Tabelas sensíveis: anônimo NÃO pode ler
// ─────────────────────────────────────────────────────────────────────
for (const table of SENSITIVE_TABLES) {
  Deno.test(`[anon] cannot SELECT from ${table}`, async () => {
    const anon = newAnonClient();
    const { data, error } = await anon.from(table).select("*").limit(1);
    // Esperado: array vazio (RLS bloqueia silenciosamente) ou erro de permissão
    if (error) {
      assert(
        /permission|row-level security|denied/i.test(error.message),
        `Erro inesperado: ${error.message}`,
      );
    } else {
      assertEquals(data?.length ?? 0, 0, `Anon obteve ${data?.length} linhas de ${table}!`);
    }
  });

  Deno.test(`[anon] cannot INSERT into ${table}`, async () => {
    const anon = newAnonClient();
    const { error } = await anon.from(table).insert({ id: crypto.randomUUID() } as never);
    assert(error, `Anon conseguiu inserir em ${table} (deveria falhar)`);
  });
}

// ─────────────────────────────────────────────────────────────────────
// 2. Tabelas sensíveis: usuário autenticado SEM role admin NÃO pode ler
// ─────────────────────────────────────────────────────────────────────
Deno.test("[authenticated non-admin] cannot read sensitive tables", async () => {
  const user = await signIn(
    Deno.env.get("TEST_USER_EMAIL"),
    Deno.env.get("TEST_USER_PASSWORD"),
  );
  if (!user) {
    console.warn("Skipping: TEST_USER_EMAIL/PASSWORD not configured");
    return;
  }

  for (const table of SENSITIVE_TABLES) {
    const { data, error } = await user.from(table).select("*").limit(1);
    if (error) {
      assert(/permission|row-level/i.test(error.message), `${table}: ${error.message}`);
    } else {
      assertEquals(data?.length ?? 0, 0, `Non-admin leu ${data?.length} linhas de ${table}!`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────
// 3. Tabelas sensíveis: ADMIN pode ler
// ─────────────────────────────────────────────────────────────────────
Deno.test("[admin] can read sensitive tables", async () => {
  const admin = await signIn(
    Deno.env.get("TEST_ADMIN_EMAIL"),
    Deno.env.get("TEST_ADMIN_PASSWORD"),
  );
  if (!admin) {
    console.warn("Skipping: TEST_ADMIN_EMAIL/PASSWORD not configured");
    return;
  }

  for (const table of SENSITIVE_TABLES) {
    const { error } = await admin.from(table).select("id").limit(1);
    assertEquals(error, null, `Admin não conseguiu ler ${table}: ${error?.message}`);
  }
});

// ─────────────────────────────────────────────────────────────────────
// 4. leads_contatos: anon DEVE conseguir inserir (rate-limit por trigger)
// ─────────────────────────────────────────────────────────────────────
Deno.test("[anon] can INSERT into leads_contatos", async () => {
  const anon = newAnonClient();
  const phone = String(Math.floor(11900000000 + Math.random() * 99999999));
  const { error } = await anon.from("leads_contatos").insert({
    nome: "RLS Test Lead",
    telefone: phone,
    origem: "web",
    categoria: "TEST",
    tags: ["rls-test"],
  });
  assertEquals(error, null, `Anon não conseguiu inserir em leads_contatos: ${error?.message}`);
});

// ─────────────────────────────────────────────────────────────────────
// 5. app_downloads: anon DEVE conseguir inserir
// ─────────────────────────────────────────────────────────────────────
Deno.test("[anon] can INSERT into app_downloads", async () => {
  const anon = newAnonClient();
  const { error } = await anon.from("app_downloads").insert({
    platform: "android",
    user_agent: "rls-test/1.0",
  } as never);
  // Aceita sucesso OU erro de schema (campo opcional faltando) — mas NÃO erro de RLS
  if (error) {
    assert(
      !/row-level security|permission denied/i.test(error.message),
      `RLS bloqueou app_downloads para anon: ${error.message}`,
    );
  }
});

// ─────────────────────────────────────────────────────────────────────
// 6. Audit log: apenas admin pode ler rls_audit_log
// ─────────────────────────────────────────────────────────────────────
Deno.test("[anon] cannot read rls_audit_log", async () => {
  const anon = newAnonClient();
  const { data, error } = await anon.from("rls_audit_log").select("*").limit(1);
  if (error) {
    assert(/permission|row-level/i.test(error.message));
  } else {
    assertEquals(data?.length ?? 0, 0);
  }
});
