// Captura de lead do ebook + envio imediato via WhatsApp (Brisa)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EBOOK_PDF_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663065229674/fnbZJMGCJUpGmwzl.pdf";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0, 120);
    const whatsappRaw = String(body.whatsapp || "").replace(/\D/g, "");
    const email = body.email ? String(body.email).trim().toLowerCase().slice(0, 255) : null;
    const profession = body.profession ? String(body.profession).slice(0, 60) : null;

    if (!name || name.length < 2) {
      return json({ error: "Nome inválido" }, 400);
    }
    if (!/^\d{10,15}$/.test(whatsappRaw)) {
      return json({ error: "WhatsApp inválido" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // SECURITY: IP + phone rate limit to prevent WhatsApp spam abuse
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const { data: ipOk } = await supabase.rpc("check_edge_rate_limit", {
      p_bucket: "ebook_capture_ip", p_key: ip, p_max_hits: 3, p_window_seconds: 3600,
    });
    if (ipOk === false) return json({ error: "Muitas tentativas. Tente novamente em 1 hora." }, 429);

    const { data: phoneOk } = await supabase.rpc("check_edge_rate_limit", {
      p_bucket: "ebook_capture_phone", p_key: whatsappRaw, p_max_hits: 1, p_window_seconds: 86400,
    });
    if (phoneOk === false) return json({ error: "Este WhatsApp já recebeu o ebook nas últimas 24h." }, 429);

    // 1) Insert no funil (com upsert manual: se já existe nas últimas 24h, reusa)
    const { data: existing } = await supabase
      .from("ebook_funnel_log")
      .select("id, pdf_sent_at")
      .eq("whatsapp", whatsappRaw)
      .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let funnelId = existing?.id;
    if (!funnelId) {
      const { data: ins, error: insErr } = await supabase
        .from("ebook_funnel_log")
        .insert({
          whatsapp: whatsappRaw,
          name,
          email,
          profession,
          source: body.source || "landing",
          metadata: { user_agent: req.headers.get("user-agent") || null },
        })
        .select("id")
        .single();
      if (insErr) {
        console.error("[ebook-capture] insert error:", insErr);
        return json({ error: "Falha ao registrar" }, 500);
      }
      funnelId = ins.id;
    }

    // 2) Registra também em leads_contatos (para integrações de marketing existentes)
    await supabase.from("leads_contatos").insert({
      nome: name,
      telefone: whatsappRaw,
      email,
      origem: "landing",
      categoria: "ebook",
      tags: ["ebook", "cannabis-medicinal", profession || "geral"].filter(Boolean),
    }).then(() => {}).catch((e: any) => console.warn("[ebook-capture] leads_contatos:", e?.message));

    // 3) Dispara WhatsApp com o PDF e mensagem da Brisa
    const firstName = name.split(" ")[0];
    const msg =
      `Olá ${firstName}! 🌿 Aqui é a *Enfª Brisa* da Planta y Raiz.\n\n` +
      `Recebi sua solicitação do *Guia Completo de Cannabis Medicinal 2026*. ` +
      `Segue o PDF para download imediato:\n\n` +
      `📘 ${EBOOK_PDF_URL}\n\n` +
      `✨ Bônus: você desbloqueou *acesso prioritário* à Orientação Técnica do Dr. Edilson Bezerra (CRM-CE 10963). ` +
      `Em 24h eu te envio um cupom especial. 💚\n\n` +
      `Qualquer dúvida sobre dosagem, receita ANVISA ou indicação, é só responder aqui.`;

    try {
      const wa = await fetch(`${supabaseUrl}/functions/v1/evolution-api-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ phone: whatsappRaw, message: msg }),
      });
      const waOk = wa.ok;
      if (waOk) {
        await supabase
          .from("ebook_funnel_log")
          .update({ pdf_sent_at: new Date().toISOString() })
          .eq("id", funnelId);
      } else {
        console.error("[ebook-capture] WA dispatch failed:", await wa.text());
      }
    } catch (waErr) {
      console.error("[ebook-capture] WA error:", waErr);
    }

    return json({
      ok: true,
      funnel_id: funnelId,
      pdf_url: EBOOK_PDF_URL,
      message: "Pronto! Em instantes você recebe o PDF no WhatsApp.",
    });
  } catch (e: any) {
    console.error("[ebook-capture] fatal:", e);
    return json({ error: e?.message || "Erro" }, 500);
  }
});

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
