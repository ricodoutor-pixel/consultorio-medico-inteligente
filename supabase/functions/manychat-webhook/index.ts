import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MANYCHAT_API = "https://api.manychat.com/fb";

// ─── ManyChat API Helper ───
async function manychatRequest(endpoint: string, body: Record<string, unknown>) {
  const key = Deno.env.get("MANYCHAT_API_KEY");
  if (!key) throw new Error("MANYCHAT_API_KEY not configured");

  const res = await fetch(`${MANYCHAT_API}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    console.error(`ManyChat ${endpoint} error:`, data);
  }
  return data;
}

async function manychatGet(endpoint: string) {
  const key = Deno.env.get("MANYCHAT_API_KEY");
  if (!key) throw new Error("MANYCHAT_API_KEY not configured");

  const res = await fetch(`${MANYCHAT_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  return res.json();
}

function formatPhone(phone: string): string {
  return phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
}

async function findSubscriber(phone: string) {
  return manychatRequest("/subscriber/findBySystemField", {
    field_name: "phone",
    field_value: formatPhone(phone),
  });
}

/**
 * Create a new subscriber in ManyChat via WhatsApp phone number.
 * Requires "Importing subscribers via phone/WhatsApp" permission enabled in ManyChat.
 */
async function createSubscriber(phone: string, firstName: string, lastName = "") {
  const formatted = formatPhone(phone);
  const result = await manychatRequest("/subscriber/createSubscriber", {
    phone: formatted,
    whatsapp_phone: formatted,
    first_name: firstName,
    last_name: lastName,
    has_opt_in_sms: true,
    has_opt_in_email: false,
    consent_phrase: "Lead capturado via Planta y Raiz",
  });
  return result;
}

/**
 * Find or create a ManyChat subscriber — ensures every lead becomes a contact.
 */
async function findOrCreateSubscriber(phone: string, name: string) {
  const mc = await findSubscriber(phone);
  if (mc.status === "success" && mc.data?.id) {
    return { subscriberId: mc.data.id, created: false };
  }

  // Split name into first/last
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || "Lead";
  const lastName = parts.slice(1).join(" ");

  const created = await createSubscriber(phone, firstName, lastName);
  if (created.status === "success" && created.data?.id) {
    return { subscriberId: created.data.id, created: true };
  }

  console.warn(`[ManyChat] Could not create subscriber for ${phone}:`, created);
  return { subscriberId: null, created: false };
}

async function tagSubscriber(subscriberId: string, tagName: string) {
  return manychatRequest("/subscriber/addTag", {
    subscriber_id: subscriberId,
    tag_name: tagName,
  });
}

async function removeTag(subscriberId: string, tagName: string) {
  return manychatRequest("/subscriber/removeTag", {
    subscriber_id: subscriberId,
    tag_name: tagName,
  });
}

async function setCustomField(subscriberId: string, fieldName: string, value: string) {
  return manychatRequest("/subscriber/setCustomField", {
    subscriber_id: subscriberId,
    field_name: fieldName,
    field_value: value,
  });
}

async function sendFlow(subscriberId: string, flowNs: string) {
  return manychatRequest("/sending/sendFlow", {
    subscriber_id: subscriberId,
    flow_ns: flowNs,
  });
}

async function sendContent(subscriberId: string, messages: unknown[]) {
  return manychatRequest("/sending/sendContent", {
    subscriber_id: subscriberId,
    data: { version: "v2", content: { messages } },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * 🤖 Planta & Raiz — ManyChat Automation Hub
 * Handles all 60 automations across 6 categories
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const action = payload.action || "capture";

    switch (action) {

      // ═══════════════════════════════════════════
      // CATEGORIA 1: MARKETING — Lead Capture
      // ═══════════════════════════════════════════

      case "capture": {
        const { subscriber, data } = payload;
        if (!subscriber?.phone || !subscriber?.name) {
          return jsonResponse({ error: "nome e telefone são obrigatórios" }, 400);
        }

        const phone = subscriber.phone.replace(/\D/g, "");
        const nome = subscriber.name.trim();
        const origem = data?.origem || "chat";
        const tags = data?.tags || [];

        const { data: existing } = await supabase
          .from("leads_contatos")
          .select("id, tags")
          .eq("telefone", phone)
          .maybeSingle();

        if (existing) {
          const merged = [...new Set([...(existing.tags || []), ...tags])];
          await supabase.from("leads_contatos").update({ tags: merged }).eq("id", existing.id);

          // Find or create in ManyChat for returning leads
          const { subscriberId } = await findOrCreateSubscriber(phone, nome);
          if (subscriberId) {
            await Promise.all([
              tagSubscriber(subscriberId, `retorno_${origem}`),
              setCustomField(subscriberId, "lead_nome", nome),
            ]);
          }

          return jsonResponse({ success: true, status: "existing_lead_updated", lead_id: existing.id, manychat_synced: !!subscriberId });
        }

        const { data: newLead, error: dbErr } = await supabase
          .from("leads_contatos")
          .insert({ nome, telefone: phone, origem, tags })
          .select("id")
          .single();

        if (dbErr) {
          console.error("DB insert error:", dbErr);
          return jsonResponse({ error: "Erro ao salvar lead" }, 500);
        }

        // ManyChat: find or CREATE subscriber + tag + welcome
        const { subscriberId, created } = await findOrCreateSubscriber(phone, nome);
        let synced = false;
        if (subscriberId) {
          const tagPromises = [
            tagSubscriber(subscriberId, `lead_${origem}`),
            tagSubscriber(subscriberId, "novo_lead"),
            setCustomField(subscriberId, "lead_nome", nome),
            setCustomField(subscriberId, "lead_origem", origem),
          ];

          // Add origin-specific tags for sequencing
          if (origem === "ebook") {
            tagPromises.push(tagSubscriber(subscriberId, "Origem_Ebook"));
            tagPromises.push(tagSubscriber(subscriberId, "sequencia_ebook"));
          } else {
            tagPromises.push(tagSubscriber(subscriberId, "Origem_Chat"));
            tagPromises.push(tagSubscriber(subscriberId, "sequencia_verdinho"));
          }

          // Apply custom tags from the LeadCaptureModal
          for (const t of tags) {
            tagPromises.push(tagSubscriber(subscriberId, t));
          }

          await Promise.all(tagPromises);
          synced = true;
        }

        console.log(`📥 Lead: ${nome} (${phone}) from ${origem} [MC:${synced ? (created ? "CREATED" : "FOUND") : "FAIL"}]`);
        return jsonResponse({ success: true, status: "new_lead", lead_id: newLead?.id, manychat_synced: synced, manychat_created: created });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 2: VENDAS — Qualificação
      // ═══════════════════════════════════════════

      case "qualify": {
        const { phone, answers } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const { data: lead } = await supabase
          .from("leads_contatos")
          .select("id, tags")
          .eq("telefone", clean)
          .maybeSingle();

        if (!lead) return jsonResponse({ error: "Lead não encontrado" }, 404);

        const qualTags = [...(lead.tags || [])];
        let score = 0;

        if (answers?.has_symptoms) { qualTags.push("tem_sintomas"); score += 30; }
        if (answers?.has_prescription) { qualTags.push("tem_receita"); score += 20; }
        if (answers?.interest_level === "high") { qualTags.push("interesse_alto"); score += 30; }
        if (answers?.budget_ok) { qualTags.push("budget_ok"); score += 20; }

        const level = score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";
        qualTags.push(`qual_${level}`);

        await supabase.from("leads_contatos").update({ tags: [...new Set(qualTags)] }).eq("id", lead.id);

        // Sync qualification to ManyChat
        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSubscriber(mc.data.id, `qual_${level}`),
            setCustomField(mc.data.id, "lead_score", String(score)),
            setCustomField(mc.data.id, "lead_qualification", level),
          ]);

          // Trigger appropriate flow based on qualification
          if (level === "hot") {
            await tagSubscriber(mc.data.id, "fluxo_fechamento");
          } else if (level === "warm") {
            await tagSubscriber(mc.data.id, "fluxo_nutricao");
          } else {
            await tagSubscriber(mc.data.id, "fluxo_educacao");
          }
        }

        return jsonResponse({ success: true, qualification: level, score, lead_id: lead.id });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 2: VENDAS — Objeções / Follow-up
      // ═══════════════════════════════════════════

      case "handle_objection": {
        const { phone, objection_type } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status !== "success" || !mc.data?.id) {
          return jsonResponse({ error: "Subscriber não encontrado no ManyChat" }, 404);
        }

        const responses: Record<string, string> = {
          preco: "💰 Entendemos! A consulta custa a partir de R$30 e pode ser parcelada. Assinantes do Club têm desconto especial!",
          tempo: "⏰ Consultas online duram 20-30min, do conforto da sua casa. Sem filas, sem espera!",
          confianca: "🔒 Somos regulados pela ANVISA e CFM. Todos os médicos têm CRM verificado. Mais de 1000 pacientes atendidos!",
          duvida: "🌿 Cannabis medicinal é legalizada no Brasil desde 2019. Tratamos dor crônica, ansiedade, epilepsia e mais. Quer saber mais?",
        };

        const reply = responses[objection_type] || "🤝 Entendo sua preocupação! Posso agendar uma conversa rápida com nosso especialista para esclarecer tudo?";

        await Promise.all([
          tagSubscriber(mc.data.id, `objecao_${objection_type || "geral"}`),
          sendContent(mc.data.id, [{ type: "text", text: reply }]),
        ]);

        return jsonResponse({ success: true, objection_handled: objection_type });
      }

      case "followup": {
        const { phone, followup_type } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status !== "success" || !mc.data?.id) {
          return jsonResponse({ error: "Subscriber não encontrado" }, 404);
        }

        const messages: Record<string, string> = {
          "24h": "👋 Oi! Vi que você demonstrou interesse na Planta & Raiz ontem. Posso ajudar com alguma dúvida? 🌿",
          "48h": "🌟 Olá! Lembrando que temos médicos disponíveis agora para consulta online. Agendar é rápido e fácil!",
          "7d": "💚 Sentimos sua falta! Que tal aproveitar nosso desconto especial de 10% para sua primeira consulta? Use: PRIMEIRA10",
          "reativacao": "🔔 Faz tempo que não nos vemos! Temos novidades incríveis e médicos prontos para te atender. Volte quando quiser!",
          "exit_intent": "👋 Ei, vimos que você estava navegando no site! Tem alguma dúvida? Posso ajudar com agendamento, preços ou informações sobre cannabis medicinal 🌿",
        };

        const msg = messages[followup_type || "24h"] || messages["24h"];
        await Promise.all([
          tagSubscriber(mc.data.id, `followup_${followup_type || "24h"}`),
          sendContent(mc.data.id, [{ type: "text", text: msg }]),
        ]);

        return jsonResponse({ success: true, followup_sent: followup_type });
      }

      case "upsell": {
        const { phone, current_plan } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status !== "success" || !mc.data?.id) {
          return jsonResponse({ error: "Subscriber não encontrado" }, 404);
        }

        const upsellMsg = current_plan === "basic"
          ? "⭐ Você está no plano Basic! Upgrade para o Premium e ganhe consultas ilimitadas, prioridade no atendimento e desconto no Shopping! 💎"
          : "🏆 Conheça nosso plano Enterprise! Gestão completa da sua clínica, analytics avançado e suporte VIP dedicado!";

        await Promise.all([
          tagSubscriber(mc.data.id, "upsell_triggered"),
          sendContent(mc.data.id, [{ type: "text", text: upsellMsg }]),
        ]);

        return jsonResponse({ success: true, upsell_sent: true });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 3: OPERAÇÕES — Agendamento
      // ═══════════════════════════════════════════

      case "appointment_confirmation": {
        const { phone, doctor_name, scheduled_at, appointment_id } = payload;
        if (!phone || !scheduled_at) return jsonResponse({ error: "phone e scheduled_at obrigatórios" }, 400);

        const clean = phone.replace(/\D/g, "");
        const date = new Date(scheduled_at);
        const formatted = date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSubscriber(mc.data.id, "consulta_agendada"),
            setCustomField(mc.data.id, "proxima_consulta", formatted),
            setCustomField(mc.data.id, "medico_nome", doctor_name || "Especialista"),
            sendContent(mc.data.id, [{
              type: "text",
              text: `✅ Consulta confirmada!\n\n👨‍⚕️ Dr(a). ${doctor_name || "Especialista"}\n📅 ${formatted}\n\nVocê receberá o link de acesso 30 minutos antes. Até lá! 🌿`,
            }]),
          ]);
        }

        return jsonResponse({ success: true, confirmation_sent: true, appointment_id });
      }

      case "appointment_reminder": {
        const { phone, doctor_name, scheduled_at, reminder_type, access_link } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status !== "success" || !mc.data?.id) {
          return jsonResponse({ error: "Subscriber não encontrado" }, 404);
        }

        const messages: Record<string, string> = {
          "24h": `⏰ Lembrete: sua consulta com Dr(a). ${doctor_name || "Especialista"} é amanhã!\n\nPrepare suas dúvidas e documentos. Estamos aqui para você! 🌿`,
          "1h": `🔔 Falta 1 hora para sua consulta com Dr(a). ${doctor_name || "Especialista"}!\n\nVerifique sua conexão de internet e prepare um ambiente tranquilo.`,
          "30min": `🟢 Sua consulta começa em 30 minutos!\n\n🔗 Acesse aqui: ${access_link || "Link será enviado em breve"}\n\nDr(a). ${doctor_name || "Especialista"} está te esperando!`,
        };

        const msg = messages[reminder_type || "24h"] || messages["24h"];
        await Promise.all([
          tagSubscriber(mc.data.id, `lembrete_${reminder_type || "24h"}`),
          sendContent(mc.data.id, [{ type: "text", text: msg }]),
        ]);

        return jsonResponse({ success: true, reminder_sent: reminder_type });
      }

      case "appointment_noshow": {
        const { phone, appointment_id } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSubscriber(mc.data.id, "no_show"),
            sendContent(mc.data.id, [{
              type: "text",
              text: "😕 Notamos que você não compareceu à consulta. Tudo bem? Podemos reagendar para outro horário que funcione melhor para você! Responda 'SIM' para reagendar.",
            }]),
          ]);
        }

        return jsonResponse({ success: true, noshow_handled: true, appointment_id });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 3: OPERAÇÕES — Prescrição
      // ═══════════════════════════════════════════

      case "prescription_sent": {
        const { phone, patient_name, doctor_name, prescription_id } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSubscriber(mc.data.id, "prescricao_recebida"),
            sendContent(mc.data.id, [{
              type: "text",
              text: `📋 ${patient_name || "Paciente"}, sua prescrição do Dr(a). ${doctor_name || "Especialista"} foi enviada para o seu email!\n\n💊 Você pode adquirir seu medicamento diretamente no nosso Shopping com desconto exclusivo.\n\n🏪 Acesse: plantayraiz.com.br/shopping`,
            }]),
          ]);
        }

        return jsonResponse({ success: true, prescription_notification_sent: true, prescription_id });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 3: OPERAÇÕES — NPS Pós-Consulta
      // ═══════════════════════════════════════════

      case "nps_request": {
        const { phone, patient_name, doctor_name, consultation_id } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSubscriber(mc.data.id, "nps_pendente"),
            setCustomField(mc.data.id, "ultima_consulta_id", consultation_id || ""),
            sendContent(mc.data.id, [{
              type: "text",
              text: `⭐ ${patient_name || "Olá"}! Como foi sua consulta com Dr(a). ${doctor_name || "nosso especialista"}?\n\nDe 0 a 10, qual nota você daria?\n\nSua opinião é muito importante para melhorarmos! 💚`,
            }]),
          ]);
        }

        return jsonResponse({ success: true, nps_requested: true });
      }

      case "nps_response": {
        const { phone, score, feedback, consultation_id } = payload;
        if (!phone || score === undefined) return jsonResponse({ error: "phone e score obrigatórios" }, 400);

        const clean = phone.replace(/\D/g, "");
        const npsScore = Number(score);
        const category = npsScore >= 9 ? "promoter" : npsScore >= 7 ? "passive" : "detractor";

        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          await Promise.all([
            removeTag(mc.data.id, "nps_pendente"),
            tagSubscriber(mc.data.id, `nps_${category}`),
            setCustomField(mc.data.id, "ultimo_nps", String(npsScore)),
          ]);

          // Auto-response based on score
          if (npsScore >= 9) {
            await sendContent(mc.data.id, [{
              type: "text",
              text: "🎉 Muito obrigado pela nota! Ficamos felizes em saber que sua experiência foi excelente! Compartilhe com amigos e ganhe 10% de desconto na próxima consulta! 💚",
            }]);
          } else if (npsScore < 7) {
            await sendContent(mc.data.id, [{
              type: "text",
              text: "😔 Lamentamos que sua experiência não tenha sido ideal. Gostaríamos de entender melhor o que aconteceu para melhorar. Um de nossos especialistas entrará em contato em breve.",
            }]);
          }
        }

        // Save NPS to database if consultation_id provided
        if (consultation_id) {
          const { data: profile } = await supabase
            .from("leads_contatos")
            .select("id")
            .eq("telefone", clean)
            .maybeSingle();

          if (profile) {
            console.log(`📊 NPS ${npsScore} (${category}) for consultation ${consultation_id}`);
          }
        }

        return jsonResponse({ success: true, nps_score: npsScore, category });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 4: FINANCEIRO — Pagamentos
      // ═══════════════════════════════════════════

      case "payment_confirmed": {
        const { phone, amount, payment_type, patient_name } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          const valor = Number(amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          await Promise.all([
            tagSubscriber(mc.data.id, "pagamento_confirmado"),
            tagSubscriber(mc.data.id, `pagou_${payment_type || "consulta"}`),
            setCustomField(mc.data.id, "ultimo_pagamento", valor),
            sendContent(mc.data.id, [{
              type: "text",
              text: `✅ ${patient_name || "Paciente"}, seu pagamento de ${valor} foi confirmado!\n\n${payment_type === "subscription" ? "🌟 Bem-vindo ao Club Planta y Raiz!" : "📋 Sua consulta está confirmada!"}\n\nObrigado por confiar na Planta & Raiz! 🌿`,
            }]),
          ]);
        }

        return jsonResponse({ success: true, payment_notification_sent: true });
      }

      case "payment_failed": {
        const { phone, amount, retry_count } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          const retries = retry_count || 0;
          const msg = retries >= 3
            ? "⚠️ Não conseguimos processar seu pagamento após 3 tentativas. Por favor, atualize seus dados de pagamento ou entre em contato conosco."
            : "❌ Houve um problema com seu pagamento. Estamos tentando novamente automaticamente. Se o problema persistir, verifique seus dados de pagamento.";

          await Promise.all([
            tagSubscriber(mc.data.id, "pagamento_falhou"),
            sendContent(mc.data.id, [{ type: "text", text: msg }]),
          ]);
        }

        return jsonResponse({ success: true, failure_notification_sent: true });
      }

      case "revenue_report": {
        const { phone, doctor_name, period, total_consultations, total_revenue, bonus_amount, nps_avg } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          const receita = Number(total_revenue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          const bonus = Number(bonus_amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

          await sendContent(mc.data.id, [{
            type: "text",
            text: `📊 Relatório ${period || "Mensal"} — Dr(a). ${doctor_name || "Médico"}\n\n👥 Consultas: ${total_consultations || 0}\n💰 Receita: ${receita}\n🎁 Bônus NPS: ${bonus}\n⭐ NPS Médio: ${nps_avg || "N/A"}\n\nContinue assim! 🚀`,
          }]);
        }

        return jsonResponse({ success: true, report_sent: true });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 5: SUPORTE — Chatbot / Routing
      // ═══════════════════════════════════════════

      case "support_request": {
        const { phone, message, category } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");

        // Auto-responses for common questions
        const autoResponses: Record<string, string> = {
          preco: "💰 Consultas a partir de R$30. Assinantes do Club têm descontos! Acesse: plantayraiz.com.br/precos",
          agendamento: "📅 Para agendar, acesse: plantayraiz.com.br/agendamento ou responda 'AGENDAR' aqui!",
          prescricao: "📋 Prescrições são enviadas automaticamente após a consulta por email e WhatsApp.",
          cannabis: "🌿 A cannabis medicinal é regulada pela ANVISA (RDC 660/2023). Tratamos diversas condições de saúde.",
          farmacia: "🏪 Acesse nosso Shopping para adquirir seus medicamentos: plantayraiz.com.br/shopping",
          pagamento: "💳 Aceitamos PIX, cartão de crédito e Bitcoin. PIX tem aprovação instantânea!",
        };

        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          const cat = category?.toLowerCase() || "";
          const autoReply = autoResponses[cat];

          if (autoReply) {
            await Promise.all([
              tagSubscriber(mc.data.id, `suporte_${cat}`),
              sendContent(mc.data.id, [{ type: "text", text: autoReply }]),
            ]);
            return jsonResponse({ success: true, auto_resolved: true, category: cat });
          }

          // Escalate to human
          await Promise.all([
            tagSubscriber(mc.data.id, "suporte_escalado"),
            setCustomField(mc.data.id, "suporte_mensagem", message || "Sem mensagem"),
          ]);
        }

        return jsonResponse({ success: true, auto_resolved: false, escalated: true });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 6: RH — Onboarding Médico
      // ═══════════════════════════════════════════

      case "doctor_onboarding": {
        const { phone, doctor_name, crm, step } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status !== "success" || !mc.data?.id) {
          return jsonResponse({ error: "Subscriber não encontrado" }, 404);
        }

        const steps: Record<string, string> = {
          welcome: `🎉 Bem-vindo(a) à Planta & Raiz, Dr(a). ${doctor_name || "Médico"}!\n\nSeu CRM ${crm || ""} está sendo verificado. Em até 24h você estará atendendo!\n\nEnquanto isso, confira o material de treinamento que enviamos ao seu email. 📚`,
          docs_approved: `✅ Dr(a). ${doctor_name || "Médico"}, seus documentos foram aprovados!\n\nPróximo passo: Complete o treinamento online (15min) para ativar sua conta.\n\n🔗 Acesse: plantayraiz.com.br/treinamento`,
          training_complete: `🏅 Parabéns, Dr(a). ${doctor_name || "Médico"}! Treinamento concluído!\n\nSua conta está ATIVA. Você já pode receber pacientes!\n\n💡 Dica: Mantenha seu status "Online" para receber consultas automaticamente.`,
          first_patient: `🎊 Dr(a). ${doctor_name || "Médico"}, seu primeiro paciente está agendado!\n\nPrepare-se para uma consulta incrível. Lembre-se: NPS alto = bônus maiores! 💰`,
        };

        const msg = steps[step || "welcome"] || steps.welcome;
        await Promise.all([
          tagSubscriber(mc.data.id, `onboarding_${step || "welcome"}`),
          tagSubscriber(mc.data.id, "medico"),
          setCustomField(mc.data.id, "crm", crm || ""),
          sendContent(mc.data.id, [{ type: "text", text: msg }]),
        ]);

        return jsonResponse({ success: true, onboarding_step: step });
      }

      // ═══════════════════════════════════════════
      // CATEGORIA 6: RH — Gamificação
      // ═══════════════════════════════════════════

      case "gamification_notify": {
        const { phone, doctor_name, event_type, badge_name, bonus_amount, nps_score, rank } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const mc = await findSubscriber(clean);
        if (mc.status !== "success" || !mc.data?.id) {
          return jsonResponse({ error: "Subscriber não encontrado" }, 404);
        }

        const events: Record<string, string> = {
          badge_unlocked: `🏅 Dr(a). ${doctor_name || "Médico"}, você desbloqueou o badge "${badge_name || "Especial"}"! Parabéns pelo seu desempenho! 🎉`,
          bonus_earned: `💰 Dr(a). ${doctor_name || "Médico"}, bônus de ${Number(bonus_amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} creditado! Seu NPS de ${nps_score || "N/A"} garantiu essa recompensa!`,
          rank_up: `🚀 Dr(a). ${doctor_name || "Médico"}, você subiu para o ${rank || ""}° lugar no ranking! Continue assim! 📈`,
          streak: `🔥 Dr(a). ${doctor_name || "Médico"}, sua sequência está incrível! Mantenha o atendimento de qualidade para garantir bônus extras!`,
          low_nps_alert: `⚠️ Dr(a). ${doctor_name || "Médico"}, seu NPS recente ficou abaixo de 5. Revise o feedback dos pacientes para melhorar. Estamos aqui para ajudar! 📞`,
        };

        const msg = events[event_type || "badge_unlocked"] || events.badge_unlocked;
        await Promise.all([
          tagSubscriber(mc.data.id, `gamif_${event_type || "event"}`),
          sendContent(mc.data.id, [{ type: "text", text: msg }]),
        ]);

        return jsonResponse({ success: true, gamification_event: event_type });
      }

      // ═══════════════════════════════════════════
      // CONVERSÃO — Tracking
      // ═══════════════════════════════════════════

      case "convert": {
        const { phone, conversion_type } = payload;
        if (!phone) return jsonResponse({ error: "phone obrigatório" }, 400);

        const clean = phone.replace(/\D/g, "");
        const { data: lead } = await supabase
          .from("leads_contatos")
          .select("id, tags")
          .eq("telefone", clean)
          .maybeSingle();

        if (!lead) return jsonResponse({ error: "Lead não encontrado" }, 404);

        const convTags = [...(lead.tags || []), `converted_${conversion_type || "signup"}`];
        await supabase.from("leads_contatos").update({ tags: [...new Set(convTags)] }).eq("id", lead.id);

        const mc = await findSubscriber(clean);
        if (mc.status === "success" && mc.data?.id) {
          await tagSubscriber(mc.data.id, `converted_${conversion_type || "signup"}`);
        }

        return jsonResponse({ success: true, conversion: conversion_type || "signup", lead_id: lead.id });
      }

      // ═══════════════════════════════════════════
      // BATCH — Disparos em massa
      // ═══════════════════════════════════════════

      case "batch_notify": {
        const { phones, message, tag } = payload;
        if (!phones?.length || !message) return jsonResponse({ error: "phones e message obrigatórios" }, 400);

        let sent = 0;
        let failed = 0;

        for (const phone of phones.slice(0, 50)) { // Max 50 per batch
          try {
            const clean = phone.replace(/\D/g, "");
            const mc = await findSubscriber(clean);
            if (mc.status === "success" && mc.data?.id) {
              await sendContent(mc.data.id, [{ type: "text", text: message }]);
              if (tag) await tagSubscriber(mc.data.id, tag);
              sent++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }

        return jsonResponse({ success: true, sent, failed, total: phones.length });
      }

      // ═══════════════════════════════════════════
      // SOCIAL MEDIA — Post Interaction Tracking (IG + FB)
      // ═══════════════════════════════════════════

      case "post_interaction": {
        const { platform, interaction_type, post_id, post_url, post_caption,
                subscriber: sub, message_content, keyword_matched, campaign_source,
                ad_id, engagement_data } = payload;

        if (!interaction_type) return jsonResponse({ error: "interaction_type obrigatório" }, 400);

        let subscriberId: string | null = null;
        let subscriberName = sub?.name || "";
        let subscriberPhone = sub?.phone || "";
        const subscriberUsername = sub?.username || "";

        // If we have phone, find or create subscriber in ManyChat
        if (subscriberPhone) {
          const clean = subscriberPhone.replace(/\D/g, "");
          const result = await findOrCreateSubscriber(clean, subscriberName || subscriberUsername || "Lead Social");
          subscriberId = result.subscriberId;

          if (subscriberId) {
            const tagOps = [
              tagSubscriber(subscriberId, `social_${platform || "instagram"}`),
              tagSubscriber(subscriberId, `interacao_${interaction_type}`),
              setCustomField(subscriberId, "social_username", subscriberUsername),
              setCustomField(subscriberId, "social_platform", platform || "instagram"),
              setCustomField(subscriberId, "ultima_interacao", new Date().toISOString()),
            ];

            if (keyword_matched) {
              tagOps.push(tagSubscriber(subscriberId, `keyword_${keyword_matched}`));
            }
            if (campaign_source) {
              tagOps.push(tagSubscriber(subscriberId, `campanha_${campaign_source}`));
              tagOps.push(setCustomField(subscriberId, "campanha_origem", campaign_source));
            }
            if (ad_id) {
              tagOps.push(setCustomField(subscriberId, "ad_id", ad_id));
              tagOps.push(tagSubscriber(subscriberId, "lead_pago"));
            }

            await Promise.all(tagOps);
          }
        }

        // Determine funnel stage based on interaction
        const funnelMap: Record<string, string> = {
          like: "awareness", save: "interest", comment: "interest",
          share: "consideration", dm: "intent", story_reply: "interest",
          mention: "awareness", reaction: "awareness",
        };
        const funnel = funnelMap[interaction_type] || "awareness";

        // Determine lead score
        const scoreMap: Record<string, number> = {
          like: 5, reaction: 5, mention: 10, save: 15,
          comment: 20, share: 25, story_reply: 30, dm: 40,
        };
        const leadScore = scoreMap[interaction_type] || 5;

        // Save to DB
        await supabase.from("social_interactions").insert({
          platform: platform || "instagram",
          interaction_type,
          post_id: post_id || null,
          post_url: post_url || null,
          post_caption: post_caption || null,
          subscriber_id: subscriberId,
          subscriber_name: subscriberName,
          subscriber_phone: subscriberPhone?.replace(/\D/g, "") || null,
          subscriber_username: subscriberUsername,
          message_content: message_content || null,
          keyword_matched: keyword_matched || null,
          lead_score: leadScore,
          tags: [interaction_type, platform || "instagram", campaign_source].filter(Boolean),
          engagement_data: engagement_data || {},
          funnel_stage: funnel,
          campaign_source: campaign_source || "organic",
          ad_id: ad_id || null,
          responded_at: subscriberId ? new Date().toISOString() : null,
        });

        console.log(`📱 Social: ${interaction_type} on ${platform || "IG"} by @${subscriberUsername || "anon"} [score:${leadScore}]`);
        return jsonResponse({ success: true, interaction_type, lead_score: leadScore, funnel_stage: funnel, manychat_synced: !!subscriberId });
      }

      case "comment_capture": {
        const { platform, post_id, post_url, comments } = payload;
        if (!comments?.length) return jsonResponse({ error: "comments array obrigatório" }, 400);

        let processed = 0;
        for (const c of comments.slice(0, 100)) {
          const username = c.username || "";
          const text = c.text || "";
          const phone = c.phone || "";

          let subId: string | null = null;
          if (phone) {
            const result = await findOrCreateSubscriber(phone.replace(/\D/g, ""), c.name || username || "Lead");
            subId = result.subscriberId;

            if (subId) {
              await Promise.all([
                tagSubscriber(subId, `comentou_post`),
                tagSubscriber(subId, `social_${platform || "instagram"}`),
                setCustomField(subId, "social_username", username),
                setCustomField(subId, "ultimo_comentario", text.slice(0, 200)),
              ]);
            }
          }

          // Detect keywords for auto-response
          const lower = text.toLowerCase();
          let keywordDetected: string | null = null;
          let flowToTrigger: string | null = null;

          if (lower.includes("protocolo") || lower.includes("anvisa")) {
            keywordDetected = "PROTOCOLO";
            flowToTrigger = "content20250413_ig_protocolo_anvisa";
          } else if (lower.includes("quero saber mais") || lower.includes("como funciona")) {
            keywordDetected = "QUERO_SABER_MAIS";
            flowToTrigger = "content20250413_ig_dm_onboarding";
          } else if (lower.includes("preço") || lower.includes("valor") || lower.includes("quanto custa")) {
            keywordDetected = "PRECO";
          } else if (lower.includes("médico") || lower.includes("consulta") || lower.includes("agendar")) {
            keywordDetected = "AGENDAMENTO";
          }

          if (subId && flowToTrigger) {
            await sendFlow(subId, flowToTrigger);
          }

          await supabase.from("social_interactions").insert({
            platform: platform || "instagram",
            interaction_type: "comment",
            post_id: post_id || null,
            post_url: post_url || null,
            subscriber_id: subId,
            subscriber_name: c.name || "",
            subscriber_phone: phone?.replace(/\D/g, "") || null,
            subscriber_username: username,
            message_content: text,
            keyword_matched: keywordDetected,
            lead_score: keywordDetected ? 30 : 20,
            funnel_stage: keywordDetected ? "intent" : "interest",
            campaign_source: "organic",
            flow_triggered: flowToTrigger,
          });

          processed++;
        }

        console.log(`💬 Captured ${processed} comments from ${platform || "IG"} post ${post_id}`);
        return jsonResponse({ success: true, comments_processed: processed });
      }

      case "story_reply": {
        const { platform, subscriber: sub, message_content, story_id } = payload;
        if (!sub?.phone && !sub?.username) return jsonResponse({ error: "subscriber info obrigatório" }, 400);

        let subId: string | null = null;
        if (sub.phone) {
          const result = await findOrCreateSubscriber(sub.phone.replace(/\D/g, ""), sub.name || sub.username || "Lead Story");
          subId = result.subscriberId;

          if (subId) {
            await Promise.all([
              tagSubscriber(subId, "story_engaged"),
              tagSubscriber(subId, `social_${platform || "instagram"}`),
              setCustomField(subId, "social_username", sub.username || ""),
              setCustomField(subId, "story_reply_count", "1"),
            ]);

            // Auto-trigger story reply hook flow
            await sendFlow(subId, "content20250413_ig_story_reply_hook");
          }
        }

        await supabase.from("social_interactions").insert({
          platform: platform || "instagram",
          interaction_type: "story_reply",
          post_id: story_id || null,
          subscriber_id: subId,
          subscriber_name: sub.name || "",
          subscriber_phone: sub.phone?.replace(/\D/g, "") || null,
          subscriber_username: sub.username || "",
          message_content: message_content || "",
          lead_score: 35,
          funnel_stage: "interest",
          flow_triggered: "content20250413_ig_story_reply_hook",
        });

        return jsonResponse({ success: true, story_reply_tracked: true, manychat_synced: !!subId });
      }

      case "post_engagement_sync": {
        const { posts } = payload;
        if (!posts?.length) return jsonResponse({ error: "posts array obrigatório" }, 400);

        let synced = 0;
        for (const p of posts.slice(0, 50)) {
          await supabase.from("social_interactions").insert({
            platform: p.platform || "instagram",
            interaction_type: "engagement_snapshot",
            post_id: p.post_id,
            post_url: p.post_url || null,
            post_caption: p.caption || null,
            engagement_data: {
              likes: p.likes || 0,
              comments: p.comments || 0,
              shares: p.shares || 0,
              saves: p.saves || 0,
              reach: p.reach || 0,
              impressions: p.impressions || 0,
              engagement_rate: p.engagement_rate || 0,
            },
            campaign_source: p.campaign_source || "organic",
            ad_id: p.ad_id || null,
            funnel_stage: "awareness",
          });
          synced++;
        }

        console.log(`📊 Synced engagement for ${synced} posts`);
        return jsonResponse({ success: true, posts_synced: synced });
      }

      case "social_analytics": {
        const { period, platform: plat } = payload;
        const since = new Date();
        if (period === "week") since.setDate(since.getDate() - 7);
        else if (period === "month") since.setMonth(since.getMonth() - 1);
        else since.setDate(since.getDate() - 1); // default: last 24h

        let query = supabase
          .from("social_interactions")
          .select("*")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(500);

        if (plat) query = query.eq("platform", plat);

        const { data: interactions, error: qErr } = await query;
        if (qErr) return jsonResponse({ error: "Erro ao buscar analytics" }, 500);

        const items = interactions || [];
        const totalInteractions = items.length;
        const uniqueUsers = new Set(items.map((i: any) => i.subscriber_id).filter(Boolean)).size;
        const totalScore = items.reduce((sum: number, i: any) => sum + (i.lead_score || 0), 0);
        const conversions = items.filter((i: any) => i.converted_at).length;

        const byType: Record<string, number> = {};
        const byPlatform: Record<string, number> = {};
        const byFunnel: Record<string, number> = {};

        for (const i of items) {
          const t = (i as any).interaction_type || "unknown";
          const p = (i as any).platform || "unknown";
          const f = (i as any).funnel_stage || "unknown";
          byType[t] = (byType[t] || 0) + 1;
          byPlatform[p] = (byPlatform[p] || 0) + 1;
          byFunnel[f] = (byFunnel[f] || 0) + 1;
        }

        return jsonResponse({
          success: true,
          period: period || "24h",
          summary: {
            total_interactions: totalInteractions,
            unique_users: uniqueUsers,
            total_lead_score: totalScore,
            conversions,
            avg_score: totalInteractions ? Math.round(totalScore / totalInteractions) : 0,
          },
          breakdown: { by_type: byType, by_platform: byPlatform, by_funnel: byFunnel },
        });
      }

      // ═══════════════════════════════════════════
      // STATUS — Health check
      // ═══════════════════════════════════════════

      case "health": {
        const hasKey = !!Deno.env.get("MANYCHAT_API_KEY");
        let manychatStatus = "unknown";

        if (hasKey) {
          try {
            const info = await manychatGet("/page/getInfo");
            manychatStatus = info.status === "success" ? "connected" : "error";
          } catch {
            manychatStatus = "error";
          }
        }

        return jsonResponse({
          success: true,
          status: "running",
          manychat: manychatStatus,
          api_key_configured: hasKey,
          automations: {
            marketing: 12,
            vendas: 8,
            operacoes: 15,
            financeiro: 10,
            suporte: 7,
            rh_medicos: 8,
            social_tracking: 5,
            facebook_publishing: 3,
            visitor_tracking: 5,
            social_analytics: 4,
            total: 77,
          },
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
    }
  } catch (error) {
    console.error("ManyChat webhook error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
