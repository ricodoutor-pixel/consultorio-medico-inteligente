const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { productName, category, productUrl } = await req.json();

    if (!productName || !category) {
      return new Response(JSON.stringify({ error: "productName and category required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all active subscribers for this category
    const { data: subscribers, error } = await supabase
      .from("product_alert_subscriptions")
      .select("*")
      .eq("is_active", true)
      .contains("categories", [category]);

    if (error) {
      console.error("Error fetching subscribers:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch subscribers" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscribers" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM") || "+14155238886";

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      console.warn("Missing Twilio keys, logging notifications instead");
      // Fallback: save as in-app notifications
      for (const sub of subscribers) {
        await supabase.from("notifications").insert({
          user_id: sub.user_id,
          title: "🛍️ Novo produto disponível!",
          message: `${productName} acabou de chegar no ${category === "shopping" ? "Shopping" : "Club"}!`,
          type: "new_product",
          action_url: productUrl || `/${category}`,
        });
      }
      return new Response(JSON.stringify({ sent: subscribers.length, channel: "in-app" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    const categoryLabel = category === "shopping" ? "Shopping Medicinal" : "Club Planta y Raiz";
    const message = `🔔 *NOVIDADE - PLANTA Y RAIZ*\n\n🛍️ Novo produto no ${categoryLabel}!\n\n📦 *${productName}*\n\n👉 Confira agora: ${productUrl || "https://plantayraiz.com.br/" + category}\n\n_Você recebeu este alerta porque ativou o sininho de notificações._`;

    for (const sub of subscribers) {
      try {
        const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: `whatsapp:${sub.phone}`,
            From: `whatsapp:${fromNumber}`,
            Body: message,
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          const errText = await response.text();
          console.error(`Failed to send to ${sub.phone}:`, errText);
        }
      } catch (err) {
        console.error(`Error sending to ${sub.phone}:`, err);
      }

      // Also create in-app notification
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        title: "🛍️ Novo produto disponível!",
        message: `${productName} acabou de chegar no ${categoryLabel}!`,
        type: "new_product",
        action_url: productUrl || `/${category}`,
      });
    }

    return new Response(JSON.stringify({ sent: sentCount, total: subscribers.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
