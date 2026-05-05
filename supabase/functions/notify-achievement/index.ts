import { createClient } from "npm:@supabase/supabase-js@2.42.0@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2.42.0@2.95.0/cors";

/**
 * Notify Achievement - Sends notifications via ManyChat/internal when
 * a professional unlocks a badge or earns a bonus
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { professionalId, type, data } = await req.json();

    if (!professionalId || !type) {
      return new Response(JSON.stringify({ error: "professionalId and type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get professional profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", professionalId)
      .maybeSingle();

    const name = profile?.full_name || "Profissional";
    const phone = profile?.phone;

    // Build notification message
    let title = "";
    let message = "";
    switch (type) {
      case "badge_earned":
        title = "🏆 Nova Conquista Desbloqueada!";
        message = `Parabéns ${name}! Você desbloqueou o badge "${data?.badge_name}" (${data?.badge_rarity}). Continue assim!`;
        break;
      case "meta_completed":
        title = "🎯 Meta Atingida!";
        message = `${name}, sua meta de NPS foi atingida! Bônus de R$ ${((data?.bonusAmount || 0) / 100).toFixed(2)} foi creditado.`;
        break;
      case "bonus_awarded":
        title = "💰 Bônus Creditado!";
        message = `${name}, um bônus de R$ ${((data?.amount || 0) / 100).toFixed(2)} foi adicionado ao seu saldo.`;
        break;
      case "streak_milestone":
        title = "🔥 Streak Incrível!";
        message = `${name}, você atingiu ${data?.streak} dias consecutivos! Mantenha o ritmo.`;
        break;
      default:
        title = "🎉 Notificação Gamificação";
        message = `${name}, algo incrível aconteceu no seu perfil!`;
    }

    // 1. Internal notification
    await supabase.from("notifications").insert({
      user_id: professionalId,
      title,
      message,
      type: "gamification",
      metadata: { achievement_type: type, ...data },
    });

    // 2. Notify admin
    const adminNotification = await supabase.from("notifications").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      title: `📊 ${type === "badge_earned" ? "Badge Desbloqueado" : "Meta/Bônus"}`,
      message: `${name}: ${message}`,
      type: "admin_gamification",
      metadata: { professional_id: professionalId, type, ...data },
    });

    // 3. ManyChat notification (if configured and phone available)
    const manychatApiKey = Deno.env.get("MANYCHAT_API_KEY");
    if (manychatApiKey && phone) {
      try {
        // Send via ManyChat API
        const mcResponse = await fetch("https://api.manychat.com/fb/sending/sendContent", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${manychatApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriber_id: phone,
            data: {
              version: "v2",
              content: {
                messages: [
                  {
                    type: "text",
                    text: `${title}\n\n${message}\n\n🌿 Planta & Raiz - Sua plataforma de saúde digital`,
                  },
                ],
              },
            },
          }),
        });
        await mcResponse.text(); // consume body
        console.log(`ManyChat notification sent to ${phone}`);
      } catch (mcErr) {
        console.error("ManyChat notification failed:", mcErr);
        // Non-blocking: internal notification already sent
      }
    }

    // 4. Twilio WhatsApp (if configured)
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (twilioSid && twilioAuth && phone) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const formBody = new URLSearchParams({
          From: "whatsapp:+14155238886",
          To: `whatsapp:+55${phone.replace(/\D/g, "")}`,
          Body: `${title}\n\n${message}`,
        });

        await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formBody.toString(),
        });
        console.log(`Twilio WhatsApp sent to ${phone}`);
      } catch (twErr) {
        console.error("Twilio notification failed:", twErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, title, message, channels: { internal: true, manychat: !!manychatApiKey, twilio: !!twilioSid } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notify achievement error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
