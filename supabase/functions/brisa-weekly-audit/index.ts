// Brisa Weekly Audit — relatório semanal de performance enviado ao Dr. Edilson via WhatsApp
// Cron sugerido: domingo 09:00 BRT = 12:00 UTC
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { processar_triagem_brisa } from "../_shared/brisa-ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "plantayraiz";
const ADMIN_WHATSAPP = Deno.env.get("ADMIN_WHATSAPP") || "5511987131241";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

async function sendWhatsApp(number: string, text: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return null;
  const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
  if (shouldSilenceAdminAlert("brisa-weekly-audit")) return null;
  return fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
    body: JSON.stringify({ number, text, delay: 800 }),
  });
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const __unauth = requireServiceAuth(req, corsHeaders);
  if (__unauth) return __unauth;
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: inbound } = await sb.from("whatsapp_brisa_log")
      .select("phone, message, sentiment_score, is_negative, created_at")
      .eq("direction", "inbound").gte("created_at", since).limit(2000);
    const { data: outbound } = await sb.from("whatsapp_brisa_log")
      .select("phone, message, raw, created_at")
      .eq("direction", "outbound").gte("created_at", since).limit(2000);

    const totalIn = inbound?.length || 0;
    const totalOut = outbound?.length || 0;
    const uniquePatients = new Set((inbound || []).map((r: any) => r.phone)).size;
    const avgSentiment = totalIn
      ? (inbound!.reduce((s: number, r: any) => s + (Number(r.sentiment_score) || 0.5), 0) / totalIn)
      : 0;
    const negativeCount = (inbound || []).filter((r: any) => r.is_negative).length;
    const linksSent = (outbound || []).filter((r: any) =>
      /plantayraiz\.com\.br|mercadopago|mpago|stripe/i.test(r.message || "")).length;
    const convRate = uniquePatients ? Math.round((linksSent / uniquePatients) * 100) : 0;

    // Top 5 perguntas frequentes via amostragem de texto
    const sampleMessages = (inbound || [])
      .slice(0, 200)
      .map((r: any) => (r.message || "").slice(0, 200))
      .join("\n- ");

    const prompt = `Analise estas mensagens de pacientes da última semana e gere:
1) Top 5 dúvidas/temas mais frequentes (1 linha cada)
2) Nível de satisfação geral (1-10) baseado em tom
3) 3 recomendações práticas para o Dr. Edilson

Mensagens:
- ${sampleMessages}`;

    let aiSummary = "(sem amostras suficientes)";
    if (sampleMessages) {
      const r = await processar_triagem_brisa(prompt, "weekly-audit", "audit", {
        systemPrompt: "Você é um analista clínico-comercial. Seja objetivo, bullet points, max 600 chars.",
        log: false,
      });
      aiSummary = r.reply || aiSummary;
    }

    const report = `📊 *RELATÓRIO BRISA — Últimos 7 dias*

👥 Pacientes únicos: *${uniquePatients}*
💬 Mensagens recebidas: ${totalIn} | enviadas: ${totalOut}
🔗 Links de pagamento enviados: ${linksSent}
📈 Taxa de conversão (links/pacientes): *${convRate}%*
😊 Sentimento médio: *${(avgSentiment * 10).toFixed(1)}/10*
⚠️ Mensagens negativas: ${negativeCount}

🧠 *Análise IA*
${aiSummary}

— Brisa CEO • Planta y Raiz`;

    await sendWhatsApp(ADMIN_WHATSAPP, report);

    await sb.from("audit_log").insert({
      action: "brisa_weekly_audit_sent",
      table_name: "whatsapp_brisa_log",
      record_id: crypto.randomUUID(),
      new_data: { uniquePatients, totalIn, totalOut, linksSent, convRate, avgSentiment, negativeCount },
    });

    return new Response(JSON.stringify({ ok: true, uniquePatients, totalIn, linksSent, convRate }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[brisa-weekly-audit] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
