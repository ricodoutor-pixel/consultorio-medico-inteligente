// Edge function: send-nurse-brisa-alert
// Cria alerta na tabela public.nurse_brisa_alerts e (opcional) dispara WhatsApp
// via Evolution para o médico.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

import { sendWhatsApp } from "../_shared/evolution.ts";

interface AlertPayload {
  doctorId: string;
  appointmentId?: string;
  patientId?: string;
  alertType: "new_appointment" | "urgent" | "follow_up" | "document_ready";
  title: string;
  message: string;
  actionUrl?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const EVOLUTION_INSTANCE =
  Deno.env.get("EVOLUTION_INSTANCE") ?? "plantayraiz";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function notifyDoctorWhatsApp(doctorId: string, title: string, message: string, actionUrl?: string) {
  try {
    const { data: doctor } = await supabase
      .from("doctors")
      .select("whatsapp_number, phone, user_id")
      .eq("id", doctorId)
      .maybeSingle();

    let phone = doctor?.whatsapp_number || doctor?.phone;
    if (!phone && doctor?.user_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", doctor.user_id)
        .maybeSingle();
      phone = prof?.phone ?? null;
    }
    if (!phone) return { skipped: true, reason: "no_phone" };

    const digits = String(phone).replace(/\D/g, "");
    const jid = digits.startsWith("55") ? digits : `55${digits}`;

    const text = `🔔 *${title}*\n\n${message}${
      actionUrl ? `\n\n👉 Abrir consulta:\n${actionUrl}` : ""
    }`;

    const res = await sendWhatsApp(jid, text);
    
    // Opcionalmente podemos injetar no log do whatsapp_messages aqui se quisermos centralizar
    await supabase.from("whatsapp_messages").insert({
      remote_jid: `${jid}@s.whatsapp.net`,
      sender_name: "Brisa (Alerta Enfermeira)",
      message_text: text,
      message_type: "text",
      direction: "out",
      status: res.ok ? "sent" : "failed",
    });

    return { sent: res.ok, status: res.status, error: res.error };
  } catch (e) {
    console.error("[send-nurse-brisa-alert] whatsapp error", e);
    return { sent: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: allow service role / cron secret OR an authenticated admin/doctor.
  const serviceUnauth = requireServiceAuth(req, corsHeaders);
  let callerUserId: string | null = null;
  let callerIsAdmin = false;
  let callerDoctorId: string | null = null;

  if (serviceUnauth) {
    // Not service-role — try JWT
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const jwt = authHeader.slice(7).trim();
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await (userClient as any).auth.getClaims(jwt);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    callerUserId = claimsData.claims.sub as string;

    // Admin?
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .maybeSingle();
    callerIsAdmin = !!adminRow;

    // Doctor row?
    if (!callerIsAdmin) {
      const { data: docRow } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", callerUserId)
        .maybeSingle();
      callerDoctorId = (docRow as any)?.id ?? null;
    }
  }

  try {
    const payload = (await req.json()) as AlertPayload;

    if (!payload?.doctorId || !payload?.alertType || !payload?.title || !payload?.message) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization: service role & admin can target anyone; a doctor can only
    // create alerts targeting their own doctor row.
    if (serviceUnauth && !callerIsAdmin) {
      if (!callerDoctorId || callerDoctorId !== payload.doctorId) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate actionUrl (same-origin only)
    let safeActionUrl: string | null = null;
    if (payload.actionUrl) {
      try {
        const u = new URL(payload.actionUrl);
        const allowed = [
          "plantayraiz.com.br",
          "www.plantayraiz.com.br",
          "consultorio-medico-inteligente.lovable.app",
        ];
        if (
          allowed.includes(u.hostname) ||
          u.hostname.endsWith(".lovable.app") ||
          u.hostname.endsWith(".lovable.dev")
        ) {
          safeActionUrl = u.toString();
        }
      } catch {
        safeActionUrl = null;
      }
    }

    // Cap free-text lengths to reduce phishing surface
    const safeTitle = String(payload.title).slice(0, 160);
    const safeMessage = String(payload.message).slice(0, 800);


    const { data, error } = await supabase
      .from("nurse_brisa_alerts")
      .insert([
        {
          doctor_id: payload.doctorId,
          appointment_id: payload.appointmentId ?? null,
          patient_id: payload.patientId ?? null,
          alert_type: payload.alertType,
          title: safeTitle,
          message: safeMessage,
          action_url: safeActionUrl,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Notifica médico via WhatsApp (best-effort)
    const wa = await notifyDoctorWhatsApp(
      payload.doctorId,
      safeTitle,
      safeMessage,
      safeActionUrl ?? undefined,
    );

    return new Response(
      JSON.stringify({ success: true, alert: data, whatsapp: wa }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-nurse-brisa-alert] error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
