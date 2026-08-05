// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED = ["new", "contacted", "qualified", "converted", "lost"] as const;
type Status = (typeof ALLOWED)[number];

const TEMPLATES: Partial<Record<Status, (name: string) => string>> = {
  contacted: (name) =>
    `Olá ${name}! 🌱 Aqui é a Enfermeira Brisa da Planta y Raiz. Recebi seus dados e estou entrando em contato para te orientar sobre o protocolo de cannabis medicinal. Pode falar agora?`,
  qualified: (name) =>
    `${name}, ótima notícia! ✅ Seu perfil foi qualificado pela nossa equipe. O Dr. Edilson Bezerra (CRM-CE 10963) já pode emitir sua orientação técnica. Quer agendar agora por R$ 30?`,
  converted: (name) =>
    `Parabéns, ${name}! 🎉 Sua orientação técnica foi confirmada. Em até 24h você recebe o PDF assinado digitalmente (ICP-Brasil) por aqui. Qualquer dúvida, é só responder.`,
  lost: (name) =>
    `${name}, sentiremos sua falta. 💚 Se mudar de ideia ou tiver qualquer dúvida sobre cannabis medicinal, a Enfª Brisa está aqui. Volte quando quiser.`,
};

function templateFor(status: Status, name: string): string | null {
  const t = TEMPLATES[status];
  return t ? t(name) : null;
}

async function sendWhatsApp(phone: string, text: string) {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
  if (!url || !key) throw new Error("Evolution API not configured");
  const clean = phone.replace(/\D/g, "");
  const res = await fetch(`${url}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ number: clean, text, delay: 1200, linkPreview: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Evolution ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const token = auth.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Admin role check
    const { data: isAdminRow } = await userClient.rpc("has_role", {
      _user_id: userId, _role: "admin",
    });
    if (!isAdminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const leadId = String(body.lead_id || "");
    const toStatus = String(body.to_status || "") as Status;
    const note = body.note ? String(body.note).slice(0, 500) : null;
    const sendWa = body.send_whatsapp !== false; // default true
    const customMessage = body.custom_message ? String(body.custom_message).slice(0, 1000) : null;

    if (!leadId || !ALLOWED.includes(toStatus)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client for privileged updates / inserts
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead, error: leadErr } = await admin
      .from("leads")
      .select("id, name, whatsapp, status")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromStatus = lead.status as string;

    // Update status
    const { error: upErr } = await admin
      .from("leads")
      .update({ status: toStatus })
      .eq("id", leadId);
    if (upErr) throw upErr;

    // Send WhatsApp if applicable
    let waSent = false;
    let waMessage: string | null = null;
    let waError: string | null = null;

    if (sendWa) {
      const msg = customMessage ?? templateFor(toStatus, lead.name);
      if (msg) {
        waMessage = msg;
        try {
          await sendWhatsApp(lead.whatsapp, msg);
          waSent = true;
        } catch (e: any) {
          waError = String(e?.message ?? e).slice(0, 300);
        }
      }
    }

    // History row
    await admin.from("lead_status_history").insert({
      lead_id: leadId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: userId,
      note,
      whatsapp_sent: waSent,
      whatsapp_message: waMessage,
      whatsapp_error: waError,
    });

    // Funnel event
    await admin.from("funnel_events").insert({
      funnel: "lead_status",
      event_name: `status_${toStatus}`,
      lead_id: leadId,
      metadata: { from: fromStatus, to: toStatus, whatsapp_sent: waSent, by: userId },
    });

    return new Response(
      JSON.stringify({ ok: true, whatsapp_sent: waSent, whatsapp_error: waError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("[admin-lead-status-update]", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
