import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const HMAC_SECRET = Deno.env.get("MANYCHAT_HMAC_SECRET") || "";

async function verifyHMAC(body: string, signature: string): Promise<boolean> {
  if (!HMAC_SECRET) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(HMAC_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const bodyText = await req.text();
    const signature = req.headers.get("x-manychat-signature") || "";

    // Verify HMAC if secret is configured
    if (HMAC_SECRET && signature) {
      const valid = await verifyHMAC(bodyText, signature);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid HMAC signature" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    const payload = JSON.parse(bodyText);
    const { event, subscriber, data } = payload;

    // Log the webhook event
    await supabase.from("ai_events").insert({
      ai_name: "manychat",
      event_type: event || "webhook",
      input_data: payload,
      status: "success",
    });

    // Handle specific events
    switch (event) {
      case "subscriber.new":
        // New lead from ManyChat
        if (subscriber?.email) {
          await supabase.from("notifications").insert({
            user_id: "00000000-0000-0000-0000-000000000000", // Admin placeholder
            title: "🆕 Novo Lead ManyChat",
            message: `${subscriber.name || subscriber.email} entrou pelo ManyChat`,
            type: "marketing",
            metadata: { source: "manychat", subscriber_id: subscriber.id },
          });
        }
        break;

      case "flow.completed":
        // Track conversion
        break;

      case "subscriber.unsubscribed":
        break;

      default:
        break;
    }

    return new Response(JSON.stringify({ success: true, event }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
