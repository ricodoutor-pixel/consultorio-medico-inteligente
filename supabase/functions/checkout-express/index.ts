// Checkout expresso (sem login): cria a conta provisória do paciente e devolve um token de
// sessão de uso único, para que o Pix seja gerado pelo mp-checkout de sempre (preço, pedido,
// webhook e liberação continuam iguais). Nunca abre sessão de uma conta que já existia:
// nesse caso o paciente entra com a própria senha ou recebe o link no e-mail dele.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { clientIp, rateLimit } from "../_shared/ai-guard.ts";
import { EXPRESS_TERMS_VERSION, validateExpressInput } from "../_shared/express-checkout.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SAFE_ATTR = /^[A-Za-z0-9_-]{1,64}$/;
function cleanAttribution(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 12)) {
      if (SAFE_ATTR.test(k) && typeof v === "string" && SAFE_ATTR.test(v)) out[k] = v;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const ip = clientIp(req);
  const byIp = await rateLimit({
    bucket: "checkout_express_ip", key: ip, maxHits: 8, windowSeconds: 600, cors,
    message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  });
  if (byIp) return byIp;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Dados inválidos." }, 400); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Paciente que já tinha conta e entrou: só registra o aceite dos termos para esta compra.
  if (body?.action === "consent") {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who } = await admin.auth.getUser(token);
    if (!who?.user) return json({ error: "Unauthorized" }, 401);
    const a = body?.accepted ?? {};
    if (a.terms !== true || a.privacy !== true || a.telemedicine !== true) return json({ error: "Aceite obrigatório." }, 400);
    const product = String(body?.product ?? "orientacao_tecnica").slice(0, 40);
    const { error } = await admin.from("checkout_consents").insert({
      user_id: who.user.id, product, terms_version: EXPRESS_TERMS_VERSION,
      accepted_terms: true, accepted_privacy: true, accepted_telemedicine: true,
      ip, user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300), attribution: cleanAttribution(body?.attribution),
    });
    if (error) { console.error("[checkout-express] consent", error.message); return json({ error: "Falha ao registrar o aceite." }, 500); }
    return json({ status: "consent_saved" });
  }

  const parsed = validateExpressInput(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);
  const input = parsed.value;

  const byCpf = await rateLimit({
    bucket: "checkout_express_cpf", key: input.cpf, maxHits: 5, windowSeconds: 3600, cors,
    message: "Muitas tentativas com este CPF. Aguarde e tente de novo.",
  });
  if (byCpf) return byCpf;

  // CPF já cadastrado: não revela o e-mail da conta, só pede para entrar.
  const { data: cpfOwner } = await admin.from("profiles").select("id").eq("cpf", input.cpf).limit(1).maybeSingle();
  if (cpfOwner) return json({ status: "existing_account" });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      phone: input.whatsapp,
      role: "paciente",
      signup_role: "paciente",
      cadastro_incompleto: true,
      origem_cadastro: "checkout_expresso",
    },
  });
  if (createErr || !created?.user) {
    const msg = String(createErr?.message ?? "");
    if (/already|registered|exists/i.test(msg)) return json({ status: "existing_account" });
    console.error("[checkout-express] createUser", msg);
    return json({ error: "Não foi possível iniciar agora. Tente de novo em instantes." }, 500);
  }
  const userId = created.user.id;

  await admin.from("profiles").update({ cpf: input.cpf, phone: input.whatsapp, full_name: input.full_name }).eq("id", userId);

  const { error: consentErr } = await admin.from("checkout_consents").insert({
    user_id: userId,
    product: input.product,
    terms_version: EXPRESS_TERMS_VERSION,
    accepted_terms: true,
    accepted_privacy: true,
    accepted_telemedicine: true,
    ip,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    attribution: cleanAttribution(body?.attribution),
  });
  if (consentErr) console.error("[checkout-express] consent", consentErr.message);

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: input.email });
  const tokenHash = link?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    console.error("[checkout-express] generateLink", linkErr?.message);
    return json({ error: "Conta criada, mas não foi possível entrar agora. Use Entrar com seu e-mail." }, 500);
  }

  return json({ status: "created", token_hash: tokenHash });
});
