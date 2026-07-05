// Daily cron: alerta clientes do Cartão Saúde Verde 3 dias antes de expirar.
// Envia WhatsApp via Evolution e marca expiry_reminded_at para evitar duplicidade.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;


  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Subs ativas que expiram nos próximos 3 dias e ainda não foram lembradas
    const { data: subs, error } = await supabase
      .from("saude_verde_subscriptions")
      .select("id, user_id, card_number, expires_at, auto_renew, plan_id, saude_verde_plans(name, price_brl)")
      .eq("status", "active")
      .lte("expires_at", inThreeDays)
      .gte("expires_at", now)
      .is("expiry_reminded_at", null);

    if (error) throw error;

    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";

    let sent = 0;
    for (const sub of subs ?? []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, whatsapp")
        .eq("id", sub.user_id)
        .maybeSingle();

      const planName = (sub.saude_verde_plans as { name?: string; price_brl?: number } | null)?.name || "Cartão Saúde Verde";
      const expFmt = new Date(sub.expires_at!).toLocaleDateString("pt-BR");
      const autoMsg = sub.auto_renew
        ? `🔁 *Renovação automática ATIVA* — você não precisa fazer nada, vamos cobrar e renovar.`
        : `⚠️ Renovação manual — acesse para renovar antes do vencimento.`;

      if (profile?.whatsapp && evolutionUrl && evolutionKey) {
        await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evolutionKey },
          body: JSON.stringify({
            number: profile.whatsapp,
            text: `🌿 *Atenção, ${profile.full_name?.split(" ")[0] || "amigo(a)"}!*\n\nSeu *${planName}* (cartão *${sub.card_number}*) vence em *${expFmt}*.\n\n${autoMsg}\n\n👉 https://plantayraiz.com.br/saude-verde/cartao`,
          }),
        }).catch((e) => console.error("[expiry-check] WA dispatch:", e));
        sent++;
      }

      await supabase
        .from("saude_verde_subscriptions")
        .update({ expiry_reminded_at: new Date().toISOString() })
        .eq("id", sub.id);
    }

    // Marcar expiradas como expired
    const { count: expiredCount } = await supabase
      .from("saude_verde_subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() }, { count: "exact" })
      .eq("status", "active")
      .lt("expires_at", now);

    return new Response(
      JSON.stringify({ ok: true, alerts_sent: sent, expired: expiredCount ?? 0, candidates: subs?.length ?? 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[saude-verde-expiry-check]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
