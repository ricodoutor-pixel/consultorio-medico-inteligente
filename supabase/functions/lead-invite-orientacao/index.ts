// supabase/functions/lead-invite-orientacao/index.ts
// Disparado quando um novo lead é capturado em qualquer modal de retenção da plataforma.
// Envia WhatsApp (via Evolution API — Enfª Brisa) com convite imediato para Orientação Técnica R$30.
// Marca o lead com tag "Convite_R30_Enviado" para evitar duplicação.
//
// verify_jwt = false (chamado tanto por sessão anônima quanto por usuários logados).

import { createClient } from "npm:@supabase/supabase-js@2";
import { OT_DESCRIPTION, PATIENT_PAY_LINK } from "../_shared/brisa-templates.mjs";
import {
  formatDoctorAddressing,
  isCompanyOrNonDoctorContact,
} from "../_shared/whatsapp-outreach-guard.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_BASE = "https://www.plantayraiz.com.br";

function inviteMessage(nome: string, categoria: string | null, crm = "", crmState = "") {
  const addressing = formatDoctorAddressing({ name: nome, crm, crmState });
  if (!addressing.allowed) return "";
  const first = (addressing.cleanName || "").split(/\s+/)[0] || "";

  if (categoria === "medico") {
    const salutation = addressing.salutation || first;
    const greeting = salutation ? `Olá, ${salutation}!` : "Olá!";
    return (
      `${greeting} 🌿\n\nAqui é a Enfª Brisa, assistente virtual da Planta y Raiz.\n` +
      `Cadastro gratuito para médicos com CRM ativo (repasse de 93% via PIX, taxa fixa de 7%):\n` +
      `👉 ${SITE_BASE}/cadastro-profissional\n` +
      `Se não quiser mais mensagens, responda SAIR.`
    );
  }
  if (categoria === "lojista") {
    const greeting = first ? `Olá, ${first}!` : "Olá!";
    return (
      `${greeting} 🌿\n\nAqui é a Enfª Brisa, assistente virtual da Planta y Raiz.\n` +
      `Vi que demonstrou interesse em vender no nosso Shopping. Vamos conversar sobre parceria?\n` +
      `👉 ${SITE_BASE}/shopping\n` +
      `Se não quiser mais mensagens, responda SAIR.`
    );
  }
  const greeting = first ? `Olá, ${first}!` : "Olá!";
  return (
    `${greeting} 🌿\n\nAqui é a Enfª Brisa, assistente virtual da Planta y Raiz (a equipe humana acompanha).\n\n` +
    `${OT_DESCRIPTION}\n\n` +
    `Para começar: ${PATIENT_PAY_LINK}\n\n` +
    `Se não quiser mais mensagens, responda SAIR.`
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
    const { nome, telefone, email, categoria, origem, crm, crm_state } = await req.json();
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

    // Bloqueia PJ/empresas/clínicas/não-médicos antes de qualquer disparo (exceto lojista explícito)
    if (categoria !== "lojista" && isCompanyOrNonDoctorContact({ name: nome, email }).blocked) {
      return new Response(JSON.stringify({ ok: true, skipped: "blocked_pj_or_non_doctor" }), {
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
      .select("id,tags,nome,created_at")
      .eq("telefone", phoneDigits)
      .order("created_at", { ascending: false })
      .limit(1);

    // Only invite a number that was just submitted through the lead form (opt-in) with the same name.
    const fresh = existing?.[0];
    if (!fresh || Date.now() - new Date(fresh.created_at).getTime() > 15 * 60 * 1000 ||
        String(fresh.nome || "").trim().toLowerCase() !== String(nome).trim().toLowerCase()) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_recent_optin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadRow = existing?.[0];
    if (leadRow?.tags?.includes("Convite_R30_Enviado")) {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: phoneOk } = await supabase.rpc("check_edge_rate_limit", {
      p_bucket: "lead-invite-phone", p_key: phoneDigits, p_max_hits: 1, p_window_seconds: 30 * 86400,
    });
    if (phoneOk === false) {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msg = inviteMessage(nome, categoria ?? null, String(crm || ""), String(crm_state || ""));
    if (!msg) {
      return new Response(JSON.stringify({ ok: true, skipped: "blocked_pj_or_non_doctor" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const wa = await sendWhatsApp(phoneDigits, msg);

    // Marca o lead como já contatado pelo convite (idempotência).
    // Lead tags are no longer changed by this public endpoint (dedup is per phone above).

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
