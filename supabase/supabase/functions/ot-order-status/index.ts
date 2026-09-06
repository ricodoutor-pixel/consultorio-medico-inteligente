// Edge function: returns safe OT order status for an anonymous buyer who holds a valid session_token
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeContact(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\D/g, "").replace(/^/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_token, order_id, external_reference } = await req
      .json()
      .catch(() => ({}));

    if (!session_token || typeof session_token !== "string" || session_token.length < 16) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!order_id && !external_reference) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: token } = await supabase
      .from("ot_access_tokens")
      .select("contact, contact_type, verified_at, session_expires_at")
      .eq("session_token", session_token)
      .maybeSingle();

    if (
      !token ||
      !token.verified_at ||
      !token.session_expires_at ||
      new Date(token.session_expires_at) < new Date()
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let q = supabase
      .from("orientacao_tecnica_orders")
      .select(
        "id, external_reference, status, amount, currency, payment_method, pdf_url, ticket_url, qr_code, qr_code_base64, dispatched_at, created_at, patient_whatsapp, patient_email",
      );
    if (order_id) q = q.eq("id", order_id);
    else q = q.eq("external_reference", external_reference);

    const { data: order } = await q.maybeSingle();
    if (!order) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the token contact matches order owner contact
    const tokenContact = (token.contact || "").trim().toLowerCase();
    const orderContact =
      token.contact_type === "email"
        ? (order.patient_email || "").trim().toLowerCase()
        : normalizeContact(order.patient_whatsapp || "");
    const expected =
      token.contact_type === "email" ? tokenContact : normalizeContact(tokenContact);

    if (!orderContact || orderContact !== expected) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return only safe fields (omit PII)
    return new Response(
      JSON.stringify({
        id: order.id,
        external_reference: order.external_reference,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        payment_method: order.payment_method,
        pdf_url: order.pdf_url,
        ticket_url: order.ticket_url,
        qr_code: order.qr_code,
        qr_code_base64: order.qr_code_base64,
        dispatched_at: order.dispatched_at,
        created_at: order.created_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
