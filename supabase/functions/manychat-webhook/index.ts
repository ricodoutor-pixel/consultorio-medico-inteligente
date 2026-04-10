import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const MANYCHAT_API_KEY = Deno.env.get("MANYCHAT_API_KEY") || "";
const MANYCHAT_API_URL = "https://api.manychat.com/fb";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const { subscriber, data } = payload;

    if (!subscriber?.phone || !subscriber?.name) {
      return new Response(JSON.stringify({ error: "nome e telefone são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const phone = subscriber.phone.replace(/\D/g, "");
    const nome = subscriber.name.trim();
    const origem = data?.origem || "chat";
    const tags = data?.tags || [];

    // 1. Save lead to database (service role bypasses RLS)
    const { error: dbError } = await supabase.from("leads_contatos").insert({
      nome,
      telefone: phone,
      origem,
      tags,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    // 2. Send subscriber to ManyChat API
    let manychatSuccess = false;
    if (MANYCHAT_API_KEY) {
      try {
        // Create or find subscriber by phone
        const whatsappPhone = phone.startsWith("55") ? phone : `55${phone}`;

        const createRes = await fetch(`${MANYCHAT_API_URL}/subscriber/createSubscriber`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: nome.split(" ")[0],
            last_name: nome.split(" ").slice(1).join(" ") || "",
            phone: `+${whatsappPhone}`,
            wa_id: whatsappPhone,
            whatsapp_phone: `+${whatsappPhone}`,
            has_opt_in_sms: true,
            consent_phrase: "Lead Gate Planta & Raiz",
          }),
        });

        const createData = await createRes.json();
        const subscriberId = createData?.data?.id;

        if (subscriberId && tags.length > 0) {
          // Add tags to subscriber
          await fetch(`${MANYCHAT_API_URL}/subscriber/addTag`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscriber_id: subscriberId,
              tag_name: tags[0],
            }),
          }).then(r => r.text());
        }

        manychatSuccess = createRes.ok;
        console.log("ManyChat response:", createRes.status, JSON.stringify(createData));
      } catch (e) {
        console.error("ManyChat API error:", e);
      }
    } else {
      console.warn("MANYCHAT_API_KEY not configured");
    }

    return new Response(JSON.stringify({
      success: true,
      db_saved: !dbError,
      manychat_sent: manychatSuccess,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});