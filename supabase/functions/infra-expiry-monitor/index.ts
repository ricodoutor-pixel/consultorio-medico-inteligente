// ============================================================================
// INFRA EXPIRY MONITOR — Alerta 5 dias antes de vencimentos críticos.
// Lê public.infra_services e dispara Discord + WhatsApp para cada serviço
// com expires_at entre hoje e +5 dias (ou já vencido).
// Cron: diário às 09:00 BRT (12:00 UTC).
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const WARN_DAYS = 5;

async function sendWhatsAppAdmin(text: string) {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const inst = Deno.env.get("EVOLUTION_INSTANCE");
  const to = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";
  if (!url || !key || !inst) return false;
  const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
  if (shouldSilenceAdminAlert("infra-expiry-monitor")) return false;

  try {
    const r = await fetch(`${url}/message/sendText/${inst}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number: to.replace(/\D/g, ""), text }),
    });
    return r.ok;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() + WARN_DAYS * 86400_000).toISOString();

  const { data: services, error } = await supabase
    .from("infra_services")
    .select("*")
    .eq("is_active", true)
    .not("expires_at", "is", null)
    .lte("expires_at", cutoff)
    .order("expires_at", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!services || services.length === 0) {
    return new Response(JSON.stringify({ ok: true, expiring: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = Date.now();
  const lines: string[] = [];
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  for (const s of services) {
    const exp = new Date(s.expires_at).getTime();
    const days = Math.ceil((exp - now) / 86400_000);
    const status = days < 0 ? `❌ VENCIDO há ${-days}d` : days === 0 ? `⚠️ VENCE HOJE` : `⏰ Vence em ${days}d`;
    lines.push(`• *${s.name}* (${s.category}) — ${status}`);
    fields.push({ name: s.name, value: `${status} — ${new Date(s.expires_at).toLocaleDateString("pt-BR")}`, inline: false });

    // Marcar último alerta enviado
    await supabase.from("infra_services").update({ last_alert_at: new Date().toISOString() }).eq("id", s.id);
  }

  const title = `⏰ ${services.length} SERVIÇO(S) EXPIRANDO`;
  const desc = `Renovar antes do vencimento para evitar queda de sistema:\n\n${lines.join("\n")}`;

  try {
    await supabase.functions.invoke("sre-alert", {
      body: {
        level: services.some((s: any) => new Date(s.expires_at).getTime() <= now) ? "CRITICAL" : "WARNING",
        title, description: desc, fields,
      },
    });
  } catch (e) { console.error("[infra-expiry] sre-alert", e); }

  await sendWhatsAppAdmin(`🚨 *${title}*\n\n${desc}\n\n_Renovar em: Hostinger, VPS, Meta, Supabase, etc._`);

  await supabase.from("audit_log").insert({
    action: "infra_expiry_alert",
    table_name: "infra_services",
    new_data: { count: services.length, services: services.map((s: any) => ({ name: s.name, expires_at: s.expires_at })) },
  });

  return new Response(JSON.stringify({ ok: true, alerted: services.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
