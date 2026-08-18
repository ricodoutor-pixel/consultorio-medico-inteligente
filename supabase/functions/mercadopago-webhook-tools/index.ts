import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const dataId = url.searchParams.get("data.id");

    const payload = await req.json();
    console.log("[webhook-tools] Received webhook:", payload);

    const paymentId = payload?.data?.id || dataId;
    const type = payload?.type || payload?.action;

    if (type !== "payment" && action !== "payment.created") {
      console.log("[webhook-tools] Ignored event type:", type || action);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (!paymentId) {
      console.error("[webhook-tools] No payment ID found");
      return new Response("No payment ID", { status: 400, headers: corsHeaders });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("Missing MP_ACCESS_TOKEN");

    const paymentResp = await fetch(https://api.mercadopago.com/v1/payments/\, {
      headers: { "Authorization": Bearer \ }
    });

    if (!paymentResp.ok) {
      console.error("[webhook-tools] Failed to fetch payment details:", await paymentResp.text());
      return new Response("Failed to fetch payment", { status: 500, headers: corsHeaders });
    }

    const paymentData = await paymentResp.json();
    const externalRef = paymentData.external_reference; // e.g. tool-cardiaco-USERID-12345
    const status = paymentData.status;

    if (!externalRef || !externalRef.startsWith("tool-")) {
      console.log("[webhook-tools] Not a tool payment. Ignored.");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (status !== "approved") {
      console.log("[webhook-tools] Payment not approved yet. Status:", status);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const parts = externalRef.split("-");
    if (parts.length < 3) {
      console.error("[webhook-tools] Invalid external_reference format:", externalRef);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const toolId = parts[1];
    const userId = parts[2];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("purchased_tools")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      console.error("[webhook-tools] Failed to fetch profile:", profileErr);
      return new Response("Failed to fetch profile", { status: 500, headers: corsHeaders });
    }

    let purchased = profile.purchased_tools || [];
    
    // Add tool if not already present
    if (!purchased.includes(toolId)) {
      if (toolId === 'combo_tools') {
        // Unlock all tools
        purchased = ["cardiaco", "fundoscopia", "oximetria", "dermatoscopia", "mobilidade", "estetoscopio", "pulmonar", "tremor", "urine", "acuity", "gps"];
      } else {
        purchased.push(toolId);
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ purchased_tools: purchased })
        .eq("id", userId);

      if (updateErr) {
        console.error("[webhook-tools] Failed to update purchased_tools:", updateErr);
        return new Response("Failed to update db", { status: 500, headers: corsHeaders });
      }

      console.log("[webhook-tools] Successfully unlocked tool", toolId, "for user", userId);
    } else {
      console.log("[webhook-tools] Tool already unlocked for user");
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("[webhook-tools] Uncaught error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
