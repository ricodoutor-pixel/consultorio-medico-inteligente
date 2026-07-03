// send-doctor-welcome-whatsapp
// Envia mensagem de boas-vindas via Evolution API para o médico recém-cadastrado.
// Requer JWT válido (autenticado). Só envia para o próprio telefone do usuário logado.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const EVOLUTION_API_URL = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

  let payload: { phone?: string; fullName?: string; email?: string; country?: string } = {};
  try { payload = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const rawPhone = String(payload.phone || "");
  const number = rawPhone.replace(/\D/g, "");
  if (!number || number.length < 10 || number.length > 15) {
    return json({ error: "invalid_number" }, 400);
  }
  const fullName = (payload.fullName || "Dr(a).").slice(0, 100);
  const email = (payload.email || userData.user.email || "").slice(0, 200);
  const country = payload.country === "BO" ? "BO" : "BR";

  const loginUrl = "https://www.plantayraiz.com.br/login";
  const supportUrl = "https://wa.me/5511991363154";

  const textBR = `🌿 *Planta y Raiz — Bem-vindo(a), Dr(a). ${fullName}!*

Seu cadastro foi recebido e está em verificação KYC (até 24h).

🔐 *Credenciais de acesso*
Login: ${email}
Portal: ${loginUrl}

📎 *Próximos passos*
1. Anexamos os documentos que você enviou (frente/verso do CRM e RG) — nossa equipe validará em breve.
2. Ao ser aprovado(a), seu dashboard médico será liberado e você já poderá receber pacientes.
3. Suporte 24/7: ${supportUrl}

Enfª Brisa 💚`;

  const textBO = `🌿 *Planta y Raíz — ¡Bienvenido(a), Dr(a). ${fullName}!*

Su registro fue recibido y está en verificación KYC (hasta 24h).

🔐 *Credenciales de acceso*
Usuario: ${email}
Portal: ${loginUrl}

📎 *Próximos pasos*
1. Sus documentos (matrícula frente/dorso y CI) están en revisión.
2. Al ser aprobado(a), su dashboard médico se liberará y podrá atender pacientes.
3. Soporte 24/7: ${supportUrl}

Enf. Brisa 💚`;

  const text = country === "BO" ? textBO : textBR;

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return json({ error: "evolution_not_configured" }, 500);
  }

  try {
    const r = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({ number, text, delay: 300 }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const bodyText = await r.text();
    return json({ ok: r.ok, status: r.status, body: bodyText.slice(0, 500) }, r.ok ? 200 : 502);
  } catch (err) {
    return json({ error: "evolution_request_failed", detail: String(err) }, 502);
  }
});
