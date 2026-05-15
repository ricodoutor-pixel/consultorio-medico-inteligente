import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { sendWhatsApp, RECOVERY_MESSAGES } from "../_shared/evolution.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecoveryTrigger {
  type: string;
  hoursThreshold: number;
  couponCode: string | null;
  discountAmount: number;
  message: string;
  affiliateMessage: string;
}

const TRIGGERS: RecoveryTrigger[] = [
  {
    type: "lead_frio_24h",
    hoursThreshold: 24,
    couponCode: null,
    discountAmount: 0,
    message: "⚠️ Não ignore sua saúde: Dr. Edilson preparou sua prescrição, mas ela expira em breve. Vai adiar sua saúde até quando?",
    affiliateMessage: "🔔 Seu lead {NOME} esfriou! Mande este áudio/texto para ele agora para garantir sua comissão!",
  },
  {
    type: "carrinho_48h",
    hoursThreshold: 48,
    couponCode: "RAIZ200",
    discountAmount: 200,
    message: "💚 Vi que você parou no meio do caminho. Vamos facilitar seu acesso? Use o cupom RAIZ200 e ganhe R$ 200 de desconto! Eu ia sendo demitida por liberar esse desconto pra você 😅",
    affiliateMessage: "⏰ Seu lead {NOME} abandonou o carrinho há 48h. Envie o cupom RAIZ200 para ele fechar agora!",
  },
  {
    type: "escassez_72h",
    hoursThreshold: 72,
    couponCode: "RAIZ300",
    discountAmount: 300,
    message: "🔥 Liberamos mais 50 cupons RAIZ300 para hoje. A demanda está alta e as vagas para acompanhamento clínico este mês estão acabando. Não ignore a sugestão do seu médico!",
    affiliateMessage: "🚨 URGENTE: Seu lead {NOME} está prestes a ser perdido! Envie o cupom RAIZ300 agora. Última chance de comissão!",
  },
  {
    type: "renovacao_10d",
    hoursThreshold: 0, // handled separately
    couponCode: null,
    discountAmount: 0,
    message: "📋 Sua qualidade de vida não pode parar. Renovação automática da receita disponível com bônus para membros ativos! Agende com 1 clique.",
    affiliateMessage: "💰 Seu indicado {NOME} precisa renovar a receita. Se ele renovar, sua comissão continua!",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authError = requireServiceAuth(req, corsHeaders);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const results = {
      lead_frio_24h: 0,
      carrinho_48h: 0,
      escassez_72h: 0,
      renovacao_10d: 0,
      affiliate_notifications: 0,
    };

    // ============ 1. LEAD FRIO 24H ============
    // Patients who completed triage but never created an appointment/subscription
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const { data: coldTriages } = await supabase
      .from("brisa_triages")
      .select("patient_id, created_at")
      .eq("status", "completed")
      .lt("created_at", twentyFourHoursAgo)
      .gt("created_at", fortyEightHoursAgo)
      .limit(100);

    for (const triage of coldTriages || []) {
      // Check if already has an appointment
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", triage.patient_id);

      if ((count || 0) > 0) continue;

      // Check if already sent this campaign
      const { count: campaignCount } = await supabase
        .from("recovery_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", triage.patient_id)
        .eq("trigger_type", "lead_frio_24h")
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if ((campaignCount || 0) > 0) continue;

      const trigger = TRIGGERS[0];
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", triage.patient_id)
        .single();

      if (!profile) continue;

      // Insert recovery campaign
      await supabase.from("recovery_campaigns").insert({
        user_id: triage.patient_id,
        trigger_type: trigger.type,
        status: "sent",
        message_sent_via: "whatsapp",
        metadata: { patient_name: profile.full_name, message: trigger.message },
      });

      // Send notification
      await supabase.from("notifications").insert({
        user_id: triage.patient_id,
        title: "⚕️ Sua prescrição está esperando",
        message: trigger.message,
        type: "recovery",
        action_url: "/oferta-especial",
      });

      if (profile.phone) {
        await sendWhatsApp(profile.phone, RECOVERY_MESSAGES["recovery_lead_frio_24h"]).catch((e) => console.error("Evolution recovery_lead_frio_24h:", e));
      }

      // Notify affiliate
      await notifyAffiliate(supabase, triage.patient_id, profile.full_name, trigger.affiliateMessage);
      results.lead_frio_24h++;
    }

    // ============ 2. CARRINHO ABANDONADO 48H ============
    const { data: abandonedCarts } = await supabase
      .from("escrow_transactions")
      .select("id, patient_id, amount, created_at")
      .eq("status", "held")
      .lt("created_at", fortyEightHoursAgo)
      .limit(100);

    for (const tx of abandonedCarts || []) {
      const { count: campaignCount } = await supabase
        .from("recovery_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", tx.patient_id)
        .eq("trigger_type", "carrinho_48h")
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if ((campaignCount || 0) > 0) continue;

      const trigger = TRIGGERS[1];
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", tx.patient_id)
        .single();

      if (!profile) continue;

      await supabase.from("recovery_campaigns").insert({
        user_id: tx.patient_id,
        trigger_type: trigger.type,
        status: "sent",
        coupon_code: trigger.couponCode,
        discount_amount: trigger.discountAmount,
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        message_sent_via: "whatsapp",
        metadata: { patient_name: profile.full_name, transaction_id: tx.id, amount: tx.amount },
      });

      await supabase.from("notifications").insert({
        user_id: tx.patient_id,
        title: "🎁 Cupom exclusivo RAIZ200",
        message: trigger.message,
        type: "recovery",
        action_url: "/oferta-especial?cupom=RAIZ200",
      });

      if (profile.phone) {
        await sendWhatsApp(profile.phone, RECOVERY_MESSAGES["recovery_carrinho_48h"]).catch((e) => console.error("Evolution recovery_carrinho_48h:", e));
      }

      await notifyAffiliate(supabase, tx.patient_id, profile.full_name, trigger.affiliateMessage);
      results.carrinho_48h++;
    }

    // ============ 3. ESCASSEZ 72H ============
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

    const { data: scarcityLeads } = await supabase
      .from("escrow_transactions")
      .select("id, patient_id, amount")
      .eq("status", "held")
      .lt("created_at", seventyTwoHoursAgo)
      .limit(50);

    for (const tx of scarcityLeads || []) {
      const { count: campaignCount } = await supabase
        .from("recovery_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", tx.patient_id)
        .eq("trigger_type", "escassez_72h")
        .gte("created_at", new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString());

      if ((campaignCount || 0) > 0) continue;

      const trigger = TRIGGERS[2];
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", tx.patient_id)
        .single();

      if (!profile) continue;

      await supabase.from("recovery_campaigns").insert({
        user_id: tx.patient_id,
        trigger_type: trigger.type,
        status: "sent",
        coupon_code: trigger.couponCode,
        discount_amount: trigger.discountAmount,
        expires_at: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        message_sent_via: "whatsapp",
        metadata: { patient_name: profile.full_name, scarcity: true },
      });

      await supabase.from("notifications").insert({
        user_id: tx.patient_id,
        title: "🔥 Últimas vagas + Cupom RAIZ300",
        message: trigger.message,
        type: "recovery",
        action_url: "/oferta-especial?cupom=RAIZ300",
      });

      if (profile.phone) {
        await sendWhatsApp(profile.phone, RECOVERY_MESSAGES["recovery_escassez_72h"]).catch((e) => console.error("Evolution recovery_escassez_72h:", e));
      }

      await notifyAffiliate(supabase, tx.patient_id, profile.full_name, trigger.affiliateMessage);
      results.escassez_72h++;
    }

    // ============ 4. RENOVAÇÃO 10 DIAS ============
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringRx } = await supabase
      .from("prescriptions")
      .select("id, patient_id, valid_until, doctor_id")
      .eq("status", "active")
      .gt("valid_until", sevenDaysFromNow)
      .lt("valid_until", tenDaysFromNow)
      .limit(100);

    for (const rx of expiringRx || []) {
      const { count: campaignCount } = await supabase
        .from("recovery_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", rx.patient_id)
        .eq("trigger_type", "renovacao_10d")
        .gte("created_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if ((campaignCount || 0) > 0) continue;

      const trigger = TRIGGERS[3];
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", rx.patient_id)
        .single();

      if (!profile) continue;

      await supabase.from("recovery_campaigns").insert({
        user_id: rx.patient_id,
        trigger_type: trigger.type,
        status: "sent",
        message_sent_via: "whatsapp",
        metadata: { patient_name: profile.full_name, prescription_id: rx.id, valid_until: rx.valid_until },
      });

      await supabase.from("notifications").insert({
        user_id: rx.patient_id,
        title: "📋 Renovação da sua receita",
        message: trigger.message,
        type: "prescription_renewal",
        action_url: "/consulta-rapida",
      });

      if (profile.phone) {
        await sendWhatsApp(profile.phone, RECOVERY_MESSAGES["recovery_renovacao_10d"]).catch((e) => console.error("Evolution recovery_renovacao_10d:", e));
      }

      await notifyAffiliate(supabase, rx.patient_id, profile.full_name, trigger.affiliateMessage);
      results.renovacao_10d++;
    }

    return new Response(
      JSON.stringify({ success: true, ...results, timestamp: now.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Recovery engine error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Helper: notify the affiliate who referred this patient
async function notifyAffiliate(
  supabase: any,
  patientId: string,
  patientName: string,
  messageTemplate: string,
) {
  const { data: referral } = await supabase
    .from("referral_links")
    .select("referred_by")
    .eq("user_id", patientId)
    .single();

  if (!referral?.referred_by) return;

  const message = messageTemplate.replace("{NOME}", patientName);

  await supabase.from("notifications").insert({
    user_id: referral.referred_by,
    title: "🔔 Ação necessária: Lead esfriando!",
    message,
    type: "affiliate_recovery",
    action_url: "/afiliados",
  });

  // Notify affiliate via WhatsApp (Evolution API)
  const { data: affiliateProfile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", referral.referred_by)
    .single();
  if (affiliateProfile?.phone) {
    await sendWhatsApp(affiliateProfile.phone, RECOVERY_MESSAGES["affiliate_lead_cold_alert"])
      .catch((e) => console.error("Evolution affiliate notify:", e));
  }
}
