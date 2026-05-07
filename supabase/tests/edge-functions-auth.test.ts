/**
 * Edge Function Auth Validation Suite
 * ----------------------------------------------------------------------
 * Valida JWT/service-role guards em:
 *   - scientific-rag           (auth: user JWT OU service-role)
 *   - funnel-recovery          (auth: service-role apenas)
 *   - recovery-engine          (auth: service-role apenas)
 *   - visitor-tracking         (analytics: admin/service ; journey: own phone)
 *
 * Como rodar:
 *   deno test --allow-env --allow-net --allow-read \
 *     supabase/tests/edge-functions-auth.test.ts
 *
 * Variáveis de ambiente esperadas (em .env):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY        (anon)
 *   SUPABASE_SERVICE_ROLE_KEY            (service-role)
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 *   TEST_USER_EMAIL  / TEST_USER_PASSWORD   (não-admin, com phone no profile)
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const FN_BASE = `${SUPABASE_URL}/functions/v1`;

async function call(
  fn: string,
  opts: { token?: string; body?: unknown; method?: string } = {},
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(`${FN_BASE}/${fn}`, {
    method: opts.method ?? "POST",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : "{}",
  });
  let body: any = null;
  try { body = await res.json(); } catch { body = await res.text().catch(() => null); }
  return { status: res.status, body };
}

async function signInToken(email?: string, password?: string): Promise<string | null> {
  if (!email || !password) return null;
  const c = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;
  return data.session.access_token;
}

const ADMIN_EMAIL = Deno.env.get("TEST_ADMIN_EMAIL");
const ADMIN_PASS = Deno.env.get("TEST_ADMIN_PASSWORD");
const USER_EMAIL = Deno.env.get("TEST_USER_EMAIL");
const USER_PASS = Deno.env.get("TEST_USER_PASSWORD");

// ───────────────────── scientific-rag ─────────────────────

Deno.test("scientific-rag: rejects request without Authorization header", async () => {
  const r = await call("scientific-rag", { body: { condition: "anxiety" } });
  assertEquals(r.status, 401);
});

Deno.test("scientific-rag: rejects bogus bearer token", async () => {
  const r = await call("scientific-rag", { token: "not-a-real-jwt", body: { condition: "anxiety" } });
  assertEquals(r.status, 401);
});

Deno.test("scientific-rag: accepts valid user JWT (status != 401)", async () => {
  const token = await signInToken(USER_EMAIL, USER_PASS);
  if (!token) { console.warn("skipped: no TEST_USER credentials"); return; }
  const r = await call("scientific-rag", { token, body: { condition: "anxiety" } });
  assert(r.status !== 401, `expected non-401, got ${r.status}`);
});

Deno.test("scientific-rag: accepts service-role bearer (status != 401)", async () => {
  if (!SERVICE_KEY) { console.warn("skipped: no SUPABASE_SERVICE_ROLE_KEY"); return; }
  const r = await call("scientific-rag", { token: SERVICE_KEY, body: { condition: "anxiety" } });
  assert(r.status !== 401, `expected non-401, got ${r.status}`);
});

// ───────────────────── funnel-recovery ─────────────────────

Deno.test("funnel-recovery: rejects request without Authorization", async () => {
  const r = await call("funnel-recovery", { body: {} });
  assertEquals(r.status, 401);
});

Deno.test("funnel-recovery: rejects authenticated non-service user", async () => {
  const token = await signInToken(USER_EMAIL, USER_PASS);
  if (!token) { console.warn("skipped: no TEST_USER credentials"); return; }
  const r = await call("funnel-recovery", { token, body: {} });
  assertEquals(r.status, 401);
});

Deno.test("funnel-recovery: accepts service-role bearer", async () => {
  if (!SERVICE_KEY) { console.warn("skipped"); return; }
  const r = await call("funnel-recovery", { token: SERVICE_KEY, body: {} });
  assert(r.status !== 401, `expected non-401, got ${r.status}`);
});

// ───────────────────── recovery-engine ─────────────────────

Deno.test("recovery-engine: rejects request without Authorization", async () => {
  const r = await call("recovery-engine", { body: {} });
  assertEquals(r.status, 401);
});

Deno.test("recovery-engine: rejects authenticated non-service user", async () => {
  const token = await signInToken(USER_EMAIL, USER_PASS);
  if (!token) { console.warn("skipped"); return; }
  const r = await call("recovery-engine", { token, body: {} });
  assertEquals(r.status, 401);
});

Deno.test("recovery-engine: accepts service-role bearer", async () => {
  if (!SERVICE_KEY) { console.warn("skipped"); return; }
  const r = await call("recovery-engine", { token: SERVICE_KEY, body: {} });
  assert(r.status !== 401, `expected non-401, got ${r.status}`);
});

// ───────────────────── visitor-tracking analytics ─────────────────────

Deno.test("visitor-tracking analytics: anon is rejected (401)", async () => {
  const r = await call("visitor-tracking", { body: { request_action: "analytics" } });
  assertEquals(r.status, 401);
});

Deno.test("visitor-tracking analytics: authenticated non-admin gets 403", async () => {
  const token = await signInToken(USER_EMAIL, USER_PASS);
  if (!token) { console.warn("skipped"); return; }
  const r = await call("visitor-tracking", {
    token,
    body: { request_action: "analytics", period: "day" },
  });
  assertEquals(r.status, 403);
});

Deno.test("visitor-tracking analytics: admin user is allowed (200)", async () => {
  const token = await signInToken(ADMIN_EMAIL, ADMIN_PASS);
  if (!token) { console.warn("skipped: no TEST_ADMIN credentials"); return; }
  const r = await call("visitor-tracking", {
    token,
    body: { request_action: "analytics", period: "day" },
  });
  assertEquals(r.status, 200);
  assert(r.body?.success === true);
});

Deno.test("visitor-tracking analytics: service-role is allowed (200)", async () => {
  if (!SERVICE_KEY) { console.warn("skipped"); return; }
  const r = await call("visitor-tracking", {
    token: SERVICE_KEY,
    body: { request_action: "analytics", period: "day" },
  });
  assertEquals(r.status, 200);
});

// ───────────────────── visitor-tracking journey ─────────────────────

Deno.test("visitor-tracking journey: anon is rejected (401)", async () => {
  const r = await call("visitor-tracking", {
    body: { request_action: "journey", phone: "5511999999999" },
  });
  assertEquals(r.status, 401);
});

Deno.test("visitor-tracking journey: non-admin querying foreign phone gets 403", async () => {
  const token = await signInToken(USER_EMAIL, USER_PASS);
  if (!token) { console.warn("skipped"); return; }
  const foreignPhone = "5511000000000"; // not the test user's phone
  const r = await call("visitor-tracking", {
    token,
    body: { request_action: "journey", phone: foreignPhone },
  });
  assertEquals(r.status, 403);
});

Deno.test("visitor-tracking journey: non-admin querying own phone is allowed", async () => {
  const token = await signInToken(USER_EMAIL, USER_PASS);
  if (!token) { console.warn("skipped"); return; }
  // Look up own phone via profiles using the user's session
  const c = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u } = await c.auth.getUser();
  if (!u?.user) { console.warn("skipped: cannot resolve user"); return; }
  const { data: prof } = await c.from("profiles").select("phone").eq("id", u.user.id).maybeSingle();
  const ownPhone = (prof as any)?.phone;
  if (!ownPhone) { console.warn("skipped: TEST_USER profile has no phone"); return; }
  const r = await call("visitor-tracking", {
    token,
    body: { request_action: "journey", phone: ownPhone },
  });
  assertEquals(r.status, 200);
  assert(Array.isArray(r.body?.journey));
});

Deno.test("visitor-tracking journey: admin can query any phone", async () => {
  const token = await signInToken(ADMIN_EMAIL, ADMIN_PASS);
  if (!token) { console.warn("skipped"); return; }
  const r = await call("visitor-tracking", {
    token,
    body: { request_action: "journey", phone: "5511000000000" },
  });
  assertEquals(r.status, 200);
});

Deno.test("visitor-tracking journey: service-role can query any phone", async () => {
  if (!SERVICE_KEY) { console.warn("skipped"); return; }
  const r = await call("visitor-tracking", {
    token: SERVICE_KEY,
    body: { request_action: "journey", phone: "5511000000000" },
  });
  assertEquals(r.status, 200);
});
