/**
 * 🔄 FUNNEL RECOVERY ENGINE
 * Recuperação de abandono, qualificação de leads e agendamento 24/7
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import {
  formatDoctorAddressing,
  hasConfirmedCrm,
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

async function tagSubscriber(subscriberId: string, tagName: string) {
  return manychatRequest("/subscriber/addTag", { subscriber_id: subscriberId, tag_name: tagName });
}

async function sendContent(subscriberId: string, messages: Array<{ type: string; text?: string; url?: string }>) {
  return manychatRequest("/sending/sendContent", { subscriber_id: subscriberId, data: { version: "v2", content: { messages } } });
}

async function setCustomField(subscriberId: string, fieldName: string, value: string) {
  return manychatRequest("/subscriber/setCustomField", { subscriber_id: subscriberId, field_name: fieldName, field_value: value });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authError = requireServiceAuth(req, corsHeaders);
  if (authError) return authError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action } = await req.json().catch(() => ({ action: "health" }));

    switch (action) {
      // ═══════════════════════════════════════════════════
      // 1. RECUPERAÇÃO DE ABANDONO DE FUNIL (24h — somente Seg–Sáb 9h–19h BRT)
      // ═══════════════════════════════════════════════════
      case "ebook_abandonment_recovery": {
        if (!isBusinessHoursBRT()) {
          return new Response(JSON.stringify({ success: true, skipped: "outside_business_hours_brt", recovered: 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("🔄 [Funnel Recovery] Verificando leads que baixaram e-book mas não cadastraram...");

        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: leads } = await supabase
          .from("leads_contatos")
          .select("*")
          .contains("tags", ["ebook_download"])
          .lt("created_at", cutoff);

        let recovered = 0;
        for (const lead of leads || []) {
          if (isCompanyOrNonDoctorContact({ name: lead.nome, email: lead.email }).blocked) continue;

          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", lead.telefone)
            .maybeSingle();

          if (profile) continue;
          if (lead.tags?.includes("recovery_sent")) continue;

          const sub = await findSubscriber(lead.telefone);
          if (sub?.status === "success" && sub?.data?.id) {
            const subscriberId = sub.data.id;
            const addressing = formatDoctorAddressing({ name: lead.nome, email: lead.email });
            const greeting = addressing.cleanName ? `Olá, ${addressing.cleanName}!` : "Olá!";

            await sendContent(subscriberId, [{
              type: "text",
              text: `${greeting} Sou a Enfª Brisa, assistente virtual da Planta y Raiz. 🌿\n\nSe ainda tiver interesse em conhecer a plataforma (cadastro gratuito, repasse de 93% via PIX com taxa fixa de 7%), acesse: https://www.plantayraiz.com.br/cadastro-profissional\n\nSe não quiser mais mensagens, responda SAIR.`
            }]);

            await tagSubscriber(subscriberId, "recovery_24h");
            recovered++;
          }

          await supabase
            .from("leads_contatos")
            .update({ tags: [...(lead.tags || []), "recovery_sent"] })
            .eq("id", lead.id);
        }

        console.log(`🔄 [Funnel Recovery] ${recovered} leads recuperados de ${(leads || []).length} abandonos`);
        return new Response(JSON.stringify({ success: true, recovered, total: (leads || []).length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════════
      // 2. QUALIFICAÇÃO AUTOMÁTICA DE LEADS (somente Seg–Sáb 9h–19h BRT)
      // ═══════════════════════════════════════════════════
      case "qualify_lead": {
        if (!isBusinessHoursBRT()) {
          return new Response(JSON.stringify({ success: true, skipped: "outside_business_hours_brt" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("🎯 [Lead Qualification] Qualificando leads pendentes...");

        const { data: leads } = await supabase
          .from("leads_contatos")
          .select("*")
          .not("tags", "cs", '{"qualified"}')
          .order("created_at", { ascending: false })
          .limit(50);

        let qualified = { medico: 0, paciente: 0, curioso: 0, blockedPj: 0 };

        for (const lead of leads || []) {
          // Jamais tratar empresas/PJ/não-médicos como médico nem oferecer OT de paciente
          if (isCompanyOrNonDoctorContact({ name: lead.nome, email: lead.email }).blocked) {
            qualified.blockedPj++;
            await supabase
              .from("leads_contatos")
              .update({ tags: [...(lead.tags || []), "qualified", "blocked_pj"] })
              .eq("id", lead.id);
            continue;
          }

          const sub = await findSubscriber(lead.telefone);
          if (sub?.status !== "success" || !sub?.data?.id) continue;

          const subscriberId = sub.data.id;
          let tags: string[] = [...(lead.tags || []), "qualified"];

          // Verificar se é médico com CRM confirmado na tabela doctors
          const { data: doctor } = await supabase
            .from("doctors")
            .select("id, crm, crm_state, council_type, is_verified")
            .eq("pix_key", lead.telefone)
            .maybeSingle();

          const crmOk = Boolean(doctor && hasConfirmedCrm(doctor.crm, doctor.crm_state, doctor.council_type));

          if (crmOk) {
            tags.push("medico", "fast_track");
            await tagSubscriber(subscriberId, "FastTrack_Medico");
            await setCustomField(subscriberId, "lead_type", "MEDICO");

            const addressing = formatDoctorAddressing({
              name: lead.nome,
              crm: doctor.crm,
              crmState: doctor.crm_state,
              councilType: doctor.council_type,
              email: lead.email,
            });
            const greeting = addressing.salutation ? `Olá, ${addressing.salutation}!` : "Olá!";

            await sendContent(subscriberId, [{
              type: "text",
              text: `${greeting} Sou a Enfª Brisa, assistente virtual da Planta y Raiz. 🩺\n\nCadastro gratuito, repasse de 93% via PIX (taxa fixa de 7%) e análise cadastral humana em 24 a 48h úteis.\n\n👉 Complete seu cadastro: https://www.plantayraiz.com.br/cadastro-profissional\nSe não quiser mais mensagens, responda SAIR.`
            }]);

            qualified.medico++;
          } else {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, user_type")
              .eq("phone", lead.telefone)
              .maybeSingle();

            if (profile?.user_type === "patient" || lead.tags?.includes("interesse_consulta")) {
              tags.push("paciente");
              await tagSubscriber(subscriberId, "Paciente_Qualificado");
              await setCustomField(subscriberId, "lead_type", "PACIENTE");

              await sendContent(subscriberId, [{
                type: "text",
                text: `Olá, ${lead.nome}! 🌿 Sou a Enfª Brisa, assistente virtual da Planta y Raiz.\n\nVocê pode começar pela Orientação Técnica educativa (R$ 30) ou escolher um médico na vitrine:\nhttps://www.plantayraiz.com.br/profissionais\n\nSe não quiser mais mensagens, responda SAIR.`
              }]);

              qualified.paciente++;
            } else {
              tags.push("curioso");
              await tagSubscriber(subscriberId, "Lead_Curioso");
              await setCustomField(subscriberId, "lead_type", "CURIOSO");
              qualified.curioso++;
            }
          }

          await supabase.from("leads_contatos").update({ tags }).eq("id", lead.id);
        }

        console.log(`🎯 [Lead Qualification] Resultado: ${JSON.stringify(qualified)}`);
        return new Response(JSON.stringify({ success: true, qualified }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════════
      // 3. AGENDAMENTO 24/7 VIA WHATSAPP
      // ═══════════════════════════════════════════════════
      case "schedule_appointment": {
        const body = await req.json().catch(() => ({}));
        const { phone, specialty, preferred_date } = body;

        if (!phone) {
          return new Response(JSON.stringify({ error: "Telefone obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Buscar médico disponível
        const { data: doctors } = await supabase
          .from("doctors")
          .select("id, user_id, specialty, consultation_price, rating")
          .eq("is_verified", true)
          .eq("is_online", true)
          .ilike("specialty", `%${specialty || "Cannabis"}%`)
          .order("rating", { ascending: false })
          .limit(3);

        if (!doctors?.length) {
          const sub = await findSubscriber(phone);
          if (sub?.data?.id) {
            await sendContent(sub.data.id, [{
              type: "text",
              text: `No momento não temos médicos disponíveis para sua especialidade. 😔\n\nVamos notificá-lo assim que um especialista estiver online!\n\n📞 Enquanto isso, fale com a Enfª Brisa: wa.me/5511991363154`
            }]);
          }
          return new Response(JSON.stringify({ success: false, message: "Sem médicos disponíveis" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const doctor = doctors[0];
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", doctor.user_id).maybeSingle();

        const sub = await findSubscriber(phone);
        if (sub?.data?.id) {
          await sendContent(sub.data.id, [{
            type: "text",
            text: `🩺 Encontramos um especialista para você!\n\n👨‍⚕️ ${profile?.full_name || "Especialista"}\n📋 ${doctor.specialty}\n⭐ Avaliação: ${doctor.rating}/5\n💰 Consulta: R$ ${doctor.consultation_price}\n\n📅 Clique para agendar e pagar:\nhttps://plantayraiz.com.br/agendamento?doctor=${doctor.id}\n\n✅ 100% online | Receita digital | Sigilo total`
          }]);
          await tagSubscriber(sub.data.id, "Agendamento_Iniciado");
        }

        return new Response(JSON.stringify({ success: true, doctor: { id: doctor.id, specialty: doctor.specialty, price: doctor.consultation_price } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "health":
        return new Response(JSON.stringify({ status: "ok", service: "funnel-recovery", automations: ["ebook_abandonment_recovery", "qualify_lead", "schedule_appointment"] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("❌ [Funnel Recovery] Erro:", e);
    return new Response(JSON.stringify({ error: "Erro interno", details: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
