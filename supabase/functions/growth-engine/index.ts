/**
 * 📈 GROWTH & VIRALITY ENGINE
 * Indicação premiada, prova social automática, conteúdo evergreen
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import {
  isBusinessHoursBRT,
  isCompanyOrNonDoctorContact,
} from "../_shared/whatsapp-outreach-guard.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MANYCHAT_API = "https://api.manychat.com/fb";

async function manychatRequest(endpoint: string, body: Record<string, unknown>) {
  const key = Deno.env.get("MANYCHAT_API_KEY");
  if (!key) throw new Error("MANYCHAT_API_KEY not configured");
  const res = await fetch(`${MANYCHAT_API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function findSubscriber(phone: string) {
  const formatted = phone.startsWith("+") ? phone : phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
  return manychatRequest("/subscriber/findBySystemField", { field_name: "phone", field_value: formatted });
}

async function sendContent(subscriberId: string, messages: Array<{ type: string; text?: string }>) {
  return manychatRequest("/sending/sendContent", { subscriber_id: subscriberId, data: { version: "v2", content: { messages } } });
}

async function tagSubscriber(subscriberId: string, tagName: string) {
  return manychatRequest("/subscriber/addTag", { subscriber_id: subscriberId, tag_name: tagName });
}

// Conteúdo educativo semanal (sem promessa de renda, sem distribuição de lucros, sem taxa zero)
const EVERGREEN_CONTENT = [
  "🌿 Sabia que o sistema endocanabinoide foi descoberto em 1988? Ele regula dor, sono, humor e apetite! Saiba mais na nossa Biblioteca Científica.",
  "💡 CBD vs THC: O CBD não causa efeitos psicoativos e é estudado para ansiedade, epilepsia e dor crônica.",
  "📊 Literatura científica: Revise evidências atualizadas sobre dor crônica na nossa Biblioteca Científica integrada ao PubMed.",
  "🧠 Saúde Mental: Acompanhe estudos revisados por pares sobre ansiedade e distúrbios do sono na plataforma.",
  "⚖️ Legislação: A RDC 660 orienta a importação de derivados de cannabis com prescrição médica individualizada.",
  "🏥 Telemedicina CFM: Prontuário eletrônico integrado e sala de vídeo segura diretamente no consultório virtual.",
  "📋 Organização clínica: O Escriba gera rascunho SOAP como apoio à decisão clínica — sempre sob revisão médica.",
  "🎓 Educação continuada: Consulte artigos selecionados e ferramentas de apoio científico no painel médico.",
  "🌱 Titulação gradual: A conduta clínica individualizada é sempre definida pelo médico prescritor em consulta.",
  "📱 Receita digital: Emita o documento no consultório e assine com certificado ICP-Brasil / Gov.br.",
  "🔬 Pesquisa científica: Utilize o Copiloto Clínico com busca em tempo real no PubMed para consultas rápidas.",
  "💊 Interações medicamentosas: CBD pode interagir com vias CYP3A4 e CYP2D6. Sempre avalie o histórico do paciente.",
  "📋 Checklist ANVISA: Diagnóstico CID-10 + Justificativa + Posologia + Via de administração sob avaliação médica.",
  "💸 Repasse transparente: 93% de cada consulta paga vai para o médico via PIX (taxa fixa de 7% em todos os planos).",
  "🔒 LGPD: Prontuários e documentos protegidos com controle de acesso rigoroso.",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { action } = await req.json().catch(() => ({ action: "health" }));

    if (action !== "health" && !isBusinessHoursBRT()) {
      return new Response(JSON.stringify({ success: true, skipped: "outside_business_hours_brt" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      case "referral_boost": {
        console.log("🔗 [Growth] Verificando indicações recentes...");

        const { data: referrals } = await supabase
          .from("referral_links")
          .select("*, profiles:user_id(full_name, phone)")
          .gt("total_referrals", 0)
          .order("total_referrals", { ascending: false })
          .limit(50);

        let boosted = 0;
        for (const ref of referrals || []) {
          const { data: recentCommissions } = await supabase
            .from("affiliate_commissions")
            .select("id, created_at")
            .eq("referrer_id", ref.user_id)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (recentCommissions?.length) {
            const prof = (ref as { profiles?: { full_name?: string; phone?: string } | null }).profiles;
            if (!prof?.phone) continue;
            if (isCompanyOrNonDoctorContact({ name: prof.full_name || "" }).blocked) continue;

            const sub = await findSubscriber(prof.phone);
            if (sub?.data?.id) {
              await sendContent(sub.data.id, [{
                type: "text",
                text: `🌿 Obrigado por compartilhar a Planta y Raiz! Acompanhe suas indicações no painel: https://www.plantayraiz.com.br/indicacoes\n\nSe não quiser mais avisos, responda SAIR.`
              }]);
              await tagSubscriber(sub.data.id, "Referral_Notified");
              boosted++;
            }
          }
        }

        return new Response(JSON.stringify({ success: true, boosted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "social_proof": {
        console.log("⭐ [Growth] Buscando promotores NPS 9-10 para feedback...");

        const { data: promoters } = await supabase
          .from("nps_responses")
          .select("*, profiles:patient_id(full_name, phone)")
          .gte("score", 9)
          .eq("category", "promoter")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(20);

        let requested = 0;
        for (const nps of promoters || []) {
          const prof = (nps as { profiles?: { full_name?: string; phone?: string } | null }).profiles;
          if (!prof?.phone) continue;
          if (isCompanyOrNonDoctorContact({ name: prof.full_name || "" }).blocked) continue;

          const sub = await findSubscriber(prof.phone);
          if (sub?.data?.id) {
            await sendContent(sub.data.id, [{
              type: "text",
              text: `😊 Obrigado pela sua avaliação nota ${nps.score} na Planta y Raiz! 🌿 Se quiser deixar um feedback público: https://g.page/plantayraiz/review\n\nSe não quiser mais avisos, responda SAIR.`
            }]);
            await tagSubscriber(sub.data.id, "Social_Proof_Requested");
            requested++;
          }
        }

        return new Response(JSON.stringify({ success: true, requested }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "evergreen_content": {
        console.log("📚 [Growth] Distribuindo conteúdo educativo semanal...");

        const now = new Date();
        const weekOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const contentIndex = weekOfYear % EVERGREEN_CONTENT.length;
        const content = EVERGREEN_CONTENT[contentIndex];

        const { data: doctors } = await supabase
          .from("doctors")
          .select("user_id, crm, crm_state, council_type, profiles:user_id(full_name, phone)")
          .eq("is_verified", true);

        let sent = 0;
        for (const doc of doctors || []) {
          const prof = (doc as { profiles?: { full_name?: string; phone?: string } | null }).profiles;
          if (!prof?.phone) continue;
          if (isCompanyOrNonDoctorContact({ name: prof.full_name || "", crm: doc.crm, councilType: doc.council_type }).blocked) continue;

          const sub = await findSubscriber(prof.phone);
          if (sub?.data?.id) {
            await sendContent(sub.data.id, [{
              type: "text",
              text: `📬 Conteúdo da Semana - Planta y Raiz\n\n${content}\n\n📖 Biblioteca: https://www.plantayraiz.com.br/biblioteca\nSe não quiser mais avisos, responda SAIR.`
            }]);
            sent++;
          }
        }

        console.log(`📚 [Growth] Conteúdo semana ${weekOfYear} enviado para ${sent} médicos`);
        return new Response(JSON.stringify({ success: true, sent, week: weekOfYear, contentIndex }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "health":
        return new Response(JSON.stringify({ status: "ok", service: "growth-engine", automations: ["referral_boost", "social_proof", "evergreen_content"] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("❌ [Growth Engine] Erro:", e);
    return new Response(JSON.stringify({ error: "Erro interno", details: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
