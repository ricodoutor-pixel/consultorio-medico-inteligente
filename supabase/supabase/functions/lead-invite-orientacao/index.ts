// supabase/functions/lead-invite-orientacao/index.ts
// Disparado quando um novo lead é capturado em qualquer modal de retenção da plataforma.
// Envia WhatsApp (via Evolution API — Enf. Brisa) com convite imediato para Orientação Técnica R$30.
// Marca o lead com tag "Convite_R30_Enviado" para evitar duplicação.
//
// verify_jwt = false (chamado tanto por sessão anônima quanto por usuários logados).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_BASE = "https://plantayraiz.com.br";
const WA_LINK = `https://wa.me/5511991363154?text=${encodeURIComponent(
  "Olá Enfª Brisa, quero garantir minha Orientação Técnica de R$30 com o Dr. Edilson Bezerra (CRM-CE 10963) On!"
)}`;

function inviteMessage(nome: string, categoria: string | null) {
  const first = (nome || "").trim().split(/\s+/)[0] || "tudo bem";
  if (categoria === "medico") {
    return (
      `Olá Dr(a). ${first}! 🌿\n\nAqui é a Enf. Brisa da Planta y Raiz.\n` +
      `Vi que demonstrou interesse na nossa rede médica. Vamos conversar sobre o credenciamento?\n` +
      `👉 ${SITE_BASE}/cadastro-profissional`
    );
  }
  if (categoria === "lojista") {
    return (
      `Olá ${first}! 🌿\n\nAqui é a Enf. Brisa da Planta y Raiz.\n` +
      `Vi que demonstrou interesse em vender no nosso Shopping. Vamos conversar sobre parceria?\n` +
      `👉 ${SITE_BASE}/shopping`
    );
  }
  // default: paciente / ebook
  return (
    `Olá ${first}! 🌿💚\n\nAqui é a Enf. Brisa da Planta y Raiz.\n\n` +
    `🎯 *Garanta agora sua Orientação Técnica em Cannabis Medicinal com o Dr. Edilson Bezerra (CRM-CE 10963) On por apenas R$30* — relatório em PDF com assinatura digital ICP-Brasil e selo gov.br.\n\n` +
    `Acesse rapidinho aqui: ${WA_LINK}\n\n` +
    `Qualquer dúvida, é só responder esta mensagem. Estou aqui para te ajudar! 🐸`
  );
}

async function sendWhatsApp(phoneDigits: string, message: string) {
  const EVO_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
  if (!EVO_URL || !EVO_KEY) return { ok: false, error: "EVOLUTION_API_URL/KEY missing" };

  const url = `${EVO_URL.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(EVO_INSTANCE)}`;
  const number = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    body: JSON.stringify({ number, text: message }),
  });
  const body = await resp.text().catch(() => "");
  return { ok: resp.ok, status: resp.status, body: body.slice(0, 400) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nome, telefone, email, categoria, origem } = await req.json();
    const phoneDigitsRaw = String(telefone || "").replace(/\D/g, "");
    // Strict BR E.164: 10–13 digits, must start with 55 or be a 10–11 digit local number
    const isValidBR =
      (phoneDigitsRaw.length >= 10 && phoneDigitsRaw.length <= 11) ||
      (phoneDigitsRaw.length >= 12 && phoneDigitsRaw.length <= 13 && phoneDigitsRaw.startsWith("55"));
    if (!nome || String(nome).trim().length < 2 || !isValidBR) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // IP-based rate limit: max 5 invites per hour per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    try {
      const { data: rl, error: rlErr } = await supabase.rpc("check_edge_rate_limit", {
        p_bucket: "lead-invite-ip",
        p_key: ip,
        p_max_hits: 5,
        p_window_seconds: 3600,
      });
      if (rlErr) {
        console.error("[lead-invite-orientacao] rate-limit RPC error:", rlErr);
        return new Response(JSON.stringify({ error: "rate_limit_unavailable" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (rl === false) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      console.error("[lead-invite-orientacao] rate-limit exception:", e);
      return new Response(JSON.stringify({ error: "rate_limit_unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneDigits = phoneDigitsRaw;


    // Anti-duplicação: se já existe tag de convite enviado, não dispara de novo.
    const { data: existing } = await supabase
      .from("leads_contatos")
      .select("id,tags")
      .eq("telefone", phoneDigits)
      .order("created_at", { ascending: false })
      .limit(1);

    const leadRow = existing?.[0];
    if (leadRow?.tags?.includes("Convite_R30_Enviado")) {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msg = inviteMessage(nome, categoria ?? null);
    const wa = await sendWhatsApp(phoneDigits, msg);

    // Marca o lead como já contatado pelo convite (idempotência).
    if (leadRow?.id) {
      const newTags = Array.from(new Set([...(leadRow.tags || []), "Convite_R30_Enviado"]));
      await supabase.from("leads_contatos").update({ tags: newTags }).eq("id", leadRow.id);
    }

    // Notifica Dr. Edilson sobre o novo lead (ver brisa-signup-alert).
    supabase.functions
      .invoke("brisa-signup-alert", {
        body: { nome, telefone: phoneDigits, email, categoria, origem, source: "lead_invite" },
      })
      .catch(() => {});

    return new Response(JSON.stringify({ ok: true, whatsapp: wa }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[lead-invite-orientacao] error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
