/**
 * 🔄 FUNNEL RECOVERY ENGINE
 * Recuperação de abandono, qualificação de leads e agendamento 24/7
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

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
      // 1. RECUPERAÇÃO DE ABANDONO DE FUNIL (24h)
      // ═══════════════════════════════════════════════════
      case "ebook_abandonment_recovery": {
        console.log("🔄 [Funnel Recovery] Verificando leads que baixaram e-book mas não cadastraram...");

        // Buscar leads criados há mais de 24h com tag 'ebook_download' 
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: leads } = await supabase
          .from("leads_contatos")
          .select("*")
          .contains("tags", ["ebook_download"])
          .lt("created_at", cutoff);

        let recovered = 0;
        for (const lead of leads || []) {
          // Verificar se já tem perfil (cadastro completo)
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", lead.telefone)
            .maybeSingle();

          if (profile) continue; // Já cadastrou, pular

          // Verificar se já foi tagado como recuperado
          if (lead.tags?.includes("recovery_sent")) continue;

          // Enviar mensagem de recuperação via ManyChat
          const sub = await findSubscriber(lead.telefone);
          if (sub?.status === "success" && sub?.data?.id) {
            const subscriberId = sub.data.id;

            await sendContent(subscriberId, [{
              type: "text",
              text: `Dr. ${lead.nome}, notei que você iniciou sua jornada na Planta y Raiz mas ainda não garantiu sua Taxa Zero! 🌿\n\nFicou alguma dúvida sobre o bônus de 10% sobre lucros? Estou aqui para ajudar!\n\n👉 Complete seu cadastro agora e comece a faturar: https://consultorio-medico-inteligente.lovable.app/cadastro-profissional`
            }]);

            await tagSubscriber(subscriberId, "recovery_24h");
            recovered++;
          }

          // Marcar lead como recuperação enviada
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
      // 2. QUALIFICAÇÃO AUTOMÁTICA DE LEADS
      // ═══════════════════════════════════════════════════
      case "qualify_lead": {
        console.log("🎯 [Lead Qualification] Qualificando leads pendentes...");

        const { data: leads } = await supabase
          .from("leads_contatos")
          .select("*")
          .not("tags", "cs", '{"qualified"}')
          .order("created_at", { ascending: false })
          .limit(50);

        let qualified = { medico: 0, paciente: 0, curioso: 0 };

        for (const lead of leads || []) {
          const sub = await findSubscriber(lead.telefone);
          if (sub?.status !== "success" || !sub?.data?.id) continue;

          const subscriberId = sub.data.id;
          let leadType = "curioso";
          let tags: string[] = [...(lead.tags || []), "qualified"];

          // Verificar se é médico (existe na tabela doctors com CRM)
          const { data: doctor } = await supabase
            .from("doctors")
            .select("id, crm, is_verified")
            .eq("pix_key", lead.telefone)
            .maybeSingle();

          // Verificar nome com prefixo "Dr." ou "Dra."
          const isDoctorName = /^(dr\.?|dra\.?)\s/i.test(lead.nome);

          if (doctor || isDoctorName) {
            leadType = "medico";
            tags.push("medico", "fast_track");

            // Fast Track: Notificar para aprovação imediata
            await tagSubscriber(subscriberId, "FastTrack_Medico");
            await setCustomField(subscriberId, "lead_type", "MEDICO");

            await sendContent(subscriberId, [{
              type: "text",
              text: `Dr. ${lead.nome}, identificamos seu perfil médico! 🩺\n\nVocê foi movido para o Fast Track de aprovação imediata.\n\n✅ Taxa Zero no primeiro mês\n✅ Bônus de 10% sobre lucros\n✅ Aprovação em menos de 24h\n\n👉 Complete seu cadastro: https://consultorio-medico-inteligente.lovable.app/cadastro-profissional`
            }]);

            qualified.medico++;
          } else {
            // Verificar se é paciente (já tem perfil ou tags de interesse médico)
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, user_type")
              .eq("phone", lead.telefone)
              .maybeSingle();

            if (profile?.user_type === "patient" || lead.tags?.includes("interesse_consulta")) {
              leadType = "paciente";
              tags.push("paciente");

              await tagSubscriber(subscriberId, "Paciente_Qualificado");
              await setCustomField(subscriberId, "lead_type", "PACIENTE");

              await sendContent(subscriberId, [{
                type: "text",
                text: `Olá ${lead.nome}! 🌿\n\nVi que você tem interesse em cannabis medicinal. Nossos especialistas podem te ajudar!\n\n📅 Agende sua consulta online agora (a partir de R$30):\nhttps://consultorio-medico-inteligente.lovable.app/agendamento`
              }]);

              qualified.paciente++;
            } else {
              tags.push("curioso");
              await tagSubscriber(subscriberId, "Lead_Curioso");
              await setCustomField(subscriberId, "lead_type", "CURIOSO");

              await sendContent(subscriberId, [{
                type: "text",
                text: `Oi ${lead.nome}! 😊\n\nQuer saber mais sobre cannabis medicinal? Baixe nosso e-book gratuito:\nhttps://consultorio-medico-inteligente.lovable.app/ebook-medicina-canabinoide\n\nOu fale com nosso assistente Verdinho! 🐸`
              }]);

              qualified.curioso++;
            }
          }

          // Atualizar tags do lead
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
              text: `No momento não temos médicos disponíveis para sua especialidade. 😔\n\nVamos notificá-lo assim que um especialista estiver online!\n\n📞 Enquanto isso, fale com a Enfermeira Brisa: wa.me/5511991363154`
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
            text: `🩺 Encontramos um especialista para você!\n\n👨‍⚕️ ${profile?.full_name || "Especialista"}\n📋 ${doctor.specialty}\n⭐ Avaliação: ${doctor.rating}/5\n💰 Consulta: R$ ${doctor.consultation_price}\n\n📅 Clique para agendar e pagar:\nhttps://consultorio-medico-inteligente.lovable.app/agendamento?doctor=${doctor.id}\n\n✅ 100% online | Receita digital | Sigilo total`
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
