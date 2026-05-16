// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendWhatsApp(phone: string, text: string) {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE") || "Brisa_CEO";
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
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const historyId = String(body.history_id || "");
    const customMessage = body.custom_message ? String(body.custom_message).slice(0, 1000) : null;
    if (!historyId) {
      return new Response(JSON.stringify({ error: "history_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: hist, error: hErr } = await admin
      .from("lead_status_history")
      .select("id, lead_id, to_status, whatsapp_message, whatsapp_sent")
      .eq("id", historyId)
      .maybeSingle();
    if (hErr || !hist) {
      return new Response(JSON.stringify({ error: "History not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = customMessage ?? (hist.whatsapp_message as string | null);
    if (!message) {
      return new Response(JSON.stringify({ error: "No message to resend" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lead } = await admin
      .from("leads").select("whatsapp").eq("id", hist.lead_id).maybeSingle();
    if (!lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = false;
    let error: string | null = null;
    try {
      await sendWhatsApp(lead.whatsapp as string, message);
      sent = true;
    } catch (e: any) {
      error = String(e?.message ?? e).slice(0, 300);
    }

    // Update original history row
    await admin.from("lead_status_history").update({
      whatsapp_sent: sent || hist.whatsapp_sent,
      whatsapp_message: message,
      whatsapp_error: sent ? null : error,
    }).eq("id", historyId);

    // Funnel event for the retry
    await admin.from("funnel_events").insert({
      funnel: "lead_status",
      event_name: sent ? "whatsapp_resent_success" : "whatsapp_resent_failed",
      lead_id: hist.lead_id,
      metadata: { history_id: historyId, to_status: hist.to_status, error, by: userId },
    });

    return new Response(JSON.stringify({ ok: true, sent, error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[admin-lead-resend-whatsapp]", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
