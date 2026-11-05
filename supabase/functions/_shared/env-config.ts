/**
 * ENV CONFIG — Centralized credentials resolver for Edge Functions
 * --------------------------------------------------------------
 * Single typed entry point for every environment credential the
 * platform's agents and daemons need. Reads only from Deno.env
 * (Supabase Secrets) — NEVER hardcode values here.
 *
 * Each field supports aliases so legacy secret names already
 * configured in production keep working until the official name
 * is registered. No code change is needed when rotating keys:
 * just add the official name in Supabase → Edge Functions →
 * Manage Secrets.
 *
 * Boot validation: call `envConfigHealth()` (or `assertEnv`) at
 * function start. Missing essentials are logged as structured
 * warnings — values are NEVER printed, only boolean presence.
 */

function pick(...names: string[]): string {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && v.length > 0) return v;
  }
  return "";
}

export const config = {
  // 1. Official database (Supabase Cloud — sole operational source)
  supabaseUrl: pick("SUPABASE_URL"),
  supabaseAnonKey: pick("SUPABASE_ANON_KEY"),
  supabaseServiceKey: pick("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseDbUrl: pick("SUPABASE_DB_URL"),

  // 2. Messaging gateway (Evolution API / official WhatsApp)
  evolutionUrl: pick("EVOLUTION_API_URL"),
  evolutionKey: pick("EVOLUTION_API_KEY"),
  evolutionInstance: pick("EVOLUTION_INSTANCE_NAME", "EVOLUTION_INSTANCE") || "plantayraiz",
  evolutionWebhookSecret: pick("EVOLUTION_WEBHOOK_SECRET"),

  // 3. CRM & transactional email (Brevo)
  brevoKey: pick("BREVO_API_KEY"),
  brevoDoctorsListId: pick("BREVO_DOCTORS_LIST_ID"),
  brevoWebhookSecret: pick("BREVO_WEBHOOK_SECRET"),

  // 4. AI models
  geminiKey: pick("GEMINI_API_KEY"),
  openaiKey: pick("OPENAI_API_KEY"),
  lovableKey: pick("LOVABLE_API_KEY"),

  // 5. Meta Graph API (Instagram & Facebook)
  metaToken: pick("META_ACCESS_TOKEN", "FACEBOOK_GRAPH_API_TOKEN", "FACEBOOK_PAGE_ACCESS_TOKEN"),
  instagramBusinessAccountId: pick("INSTAGRAM_BUSINESS_ACCOUNT_ID"),
  facebookPageId: pick("FACEBOOK_PAGE_ID"),
  metaAppSecret: pick("META_APP_SECRET", "FACEBOOK_APP_SECRET"),
  metaVerifyToken: pick("META_VERIFY_TOKEN", "META_WEBHOOK_VERIFY_TOKEN"),

  // 6. Payments (Mercado Pago — canonical name first)
  mercadoPagoAccessToken: pick("MERCADO_PAGO_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN"),
  mercadoPagoPublicKey: pick("MERCADO_PAGO_PUBLIC_KEY"),
  mercadoPagoWebhookSecret: pick("MERCADO_PAGO_WEBHOOK_SECRET", "MERCADOPAGO_WEBHOOK_SECRET"),

  // 7. Crawlers & data enrichment
  apifyToken: pick("APIFY_API_TOKEN"),
} as const;

export type EnvConfigKey = keyof typeof config;

/** Structured presence report — booleans only, never values. */
export function envConfigHealth(): Record<EnvConfigKey, boolean> {
  const out = {} as Record<EnvConfigKey, boolean>;
  for (const k of Object.keys(config) as EnvConfigKey[]) {
    out[k] = Boolean(config[k]);
  }
  return out;
}

/**
 * Boot validation for a function's essential keys.
 * Logs a structured warning and returns the missing keys;
 * throws only when `strict` is true.
 */
export function assertEnv(required: EnvConfigKey[], opts?: { strict?: boolean; context?: string }): EnvConfigKey[] {
  const missing = required.filter((k) => !config[k]);
  if (missing.length > 0) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "env_config_missing",
        context: opts?.context ?? "edge-function",
        missing,
      }),
    );
    if (opts?.strict) {
      throw new Error(`Missing required env config: ${missing.join(", ")}`);
    }
  }
  return missing;
}
