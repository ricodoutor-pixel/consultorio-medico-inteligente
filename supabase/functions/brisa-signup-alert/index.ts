// ============================================================================
// BRISA SIGNUP/LOGIN ALERT — Modo Cadastro Ativado
// Envia WhatsApp ao Dr. Edilson sempre que houver:
//   - "signup": novo cadastro de usuário (paciente/médico/lojista/etc.)
//   - "login":  usuário (novo ou antigo) loga na plataforma
// A mensagem é diferenciada por user_type e inclui o total de cadastros do dia.
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_WA = (Deno.env.get("ADMIN_WHATSAPP") || "5511987131241").replace(/\D/g, "");

type Event = "signup" | "login";

function roleLabel(t: string): { label: string; emoji: string } {
  switch ((t || "patient").toLowerCase()) {
    case "doctor":       return { label: "Médico",     emoji: "🩺" };
    case "professional": return { label: "Profissional de Saúde", emoji: "👩‍⚕️" };
    case "pharmacy":     return { label: "Lojista / Farmácia",    emoji: "🏪" };
    case "producer":     return { label: "Produtor",   emoji: "🌱" };
    case "admin":        return { label: "Administrador", emoji: "👑" };
    default:             return { label: "Paciente",   emoji: "🌿" };
  }
}

function nowBRT(): string {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit", minute: "2-digit",
  });
  return fmt.format(new Date());
}

async function sendWhatsApp(text: string): Promise<boolean> {
  const url  = Deno.env.get("EVOLUTION_API_URL");
  const key  = Deno.env.get("EVOLUTION_API_KEY");
  const inst = Deno.env.get("EVOLUTION_INSTANCE");
  if (!url || !key || !inst) {
    console.warn("[brisa-signup-alert] Evolution env ausente");
    return false;
  }
  try {
    const r = await fetch(`${url}/message/sendText/${inst}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number: ADMIN_WA, text }),
    });
    if (!r.ok) console.error("[brisa-signup-alert] evolution", r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error("[brisa-signup-alert] err", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const user_id: string | undefined = body.user_id;
    const event: Event = body.event === "signup" ? "signup" : "login";
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await sb
      .from("profiles")
      .select("full_name, user_type, phone, created_at")
      .eq("id", user_id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ ok: false, reason: "profile_not_found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { label, emoji } = roleLabel(profile.user_type);
    const name  = profile.full_name?.trim() || "(sem nome)";
    const phone = profile.phone ? ` · 📱 ${profile.phone}` : "";
    const hora  = nowBRT();

    // Contagem de cadastros do dia (BRT)
    const startBRT = new Date();
    startBRT.setUTCHours(3, 0, 0, 0); // 00:00 BRT = 03:00 UTC
    if (Date.now() < startBRT.getTime()) startBRT.setUTCDate(startBRT.getUTCDate() - 1);
    const { count: todaySignups } = await sb
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startBRT.toISOString());

    let text: string;
    if (event === "signup") {
      text =
`${emoji} *NOVO CADASTRO — ${label.toUpperCase()}*

👤 ${name}${phone}
🕒 ${hora} (BRT)

📊 Hoje já temos *${todaySignups ?? 1} cadastro(s)* novos.
Parabéns, Doutor! 🌿

— Enf. Brisa · Planta y Raiz`;
    } else {
      text =
`${emoji} *USUÁRIO LOGADO — ${label}*

👤 ${name}${phone}
🕒 ${hora} (BRT)

📊 Cadastros novos hoje: *${todaySignups ?? 0}*

— Enf. Brisa · Planta y Raiz`;
    }

    const sent = await sendWhatsApp(text);

    return new Response(JSON.stringify({ ok: true, sent, event, user_type: profile.user_type }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[brisa-signup-alert] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
