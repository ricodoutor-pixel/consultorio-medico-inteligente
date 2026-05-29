/**
 * 💸 RETENTION & FINANCIAL ENGINE
 * VIP upgrade, reativação de pacientes, relatórios WhatsApp, auditoria ANVISA
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

async function sendContent(subscriberId: string, messages: Array<{ type: string; text?: string }>) {
  return manychatRequest("/sending/sendContent", { subscriber_id: subscriberId, data: { version: "v2", content: { messages } } });
}

async function tagSubscriber(subscriberId: string, tagName: string) {
  return manychatRequest("/subscriber/addTag", { subscriber_id: subscriberId, tag_name: tagName });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authErr = requireServiceAuth(req, corsHeaders);
  if (authErr) return authErr;


  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { action } = await req.json().catch(() => ({ action: "health" }));

    switch (action) {
      // ═══════════════════════════════════════════════════
      // 1. UPGRADE AUTOMÁTICO PARA VIP
      // ═══════════════════════════════════════════════════
      case "vip_upgrade_check": {
        console.log("💎 [Retention] Verificando médicos elegíveis para VIP...");

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const { data: metrics } = await supabase
          .from("doctor_performance_metrics")
          .select("*, doctors:doctor_id(user_id, consultation_price)")
          .eq("month", month)
          .eq("year", year)
          .gte("consultations_count", 15); // threshold

        let upgraded = 0;
        for (const m of metrics || []) {
          const doctor = (m as any).doctors;
          if (!doctor) continue;

          // Verificar se já é VIP
          const { data: sub } = await supabase
            .from("medical_subscriptions")
            .select("id, plan_tier")
            .eq("doctor_id", m.doctor_id)
            .eq("status", "active")
            .maybeSingle();

          if (sub?.plan_tier === "vip") continue;

          // Calcular quanto economizaria com VIP
          const revenue = m.consultations_count * (doctor.consultation_price || 150);
          const currentFee = revenue * 0.07; // 7% taxa
          const savings = currentFee; // VIP = 0% taxa

          // Buscar perfil para telefone
          const { data: profile } = await supabase.from("profiles").select("phone, full_name").eq("id", doctor.user_id).maybeSingle();
          if (!profile?.phone) continue;

          const subscriber = await findSubscriber(profile.phone);
          if (subscriber?.data?.id) {
            await sendContent(subscriber.data.id, [{
              type: "text",
              text: `💎 Dr. ${profile.full_name}, parabéns!\n\nVocê realizou ${m.consultations_count} consultas este mês e faturou R$ ${revenue.toFixed(0)}! 🎉\n\nSe fosse VIP, teria economizado R$ ${savings.toFixed(0)} em taxas! 💰\n\n🔥 Plano VIP (R$ 99/mês) = Taxa ZERO\n\n👉 Upgrade agora: https://consultorio-medico-inteligente.lovable.app/dashboard-medico\n\nO investimento se paga com apenas 1 consulta!`
            }]);
            await tagSubscriber(subscriber.data.id, "VIP_Upgrade_Offer");
            upgraded++;
          }
        }

        return new Response(JSON.stringify({ success: true, upgraded }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════════
      // 2. REATIVAÇÃO DE PACIENTES (6 meses sem consulta)
      // ═══════════════════════════════════════════════════
      case "patient_reactivation": {
        console.log("🔄 [Retention] Reativando pacientes inativos...");

        const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

        // Buscar pacientes com última consulta há 6+ meses
        const { data: oldAppointments } = await supabase
          .from("appointments")
          .select("patient_id, scheduled_at")
          .eq("status", "completed")
          .lt("scheduled_at", sixMonthsAgo)
          .order("scheduled_at", { ascending: false });

        // Agrupar por paciente e pegar apenas os que não têm consulta recente
        const patientLastVisit = new Map<string, string>();
        for (const apt of oldAppointments || []) {
          if (!patientLastVisit.has(apt.patient_id)) {
            patientLastVisit.set(apt.patient_id, apt.scheduled_at);
          }
        }

        // Filtrar: só pacientes sem consulta nos últimos 6 meses
        const { data: recentAppointments } = await supabase
          .from("appointments")
          .select("patient_id")
          .gte("scheduled_at", sixMonthsAgo)
          .in("patient_id", [...patientLastVisit.keys()]);

        const recentPatients = new Set((recentAppointments || []).map(a => a.patient_id));
        
        let reactivated = 0;
        for (const [patientId, lastVisit] of patientLastVisit) {
          if (recentPatients.has(patientId)) continue;
          if (reactivated >= 30) break; // Limitar por execução

          const { data: profile } = await supabase.from("profiles").select("phone, full_name").eq("id", patientId).maybeSingle();
          if (!profile?.phone) continue;

          const sub = await findSubscriber(profile.phone);
          if (sub?.data?.id) {
            const monthsAgo = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (30 * 24 * 60 * 60 * 1000));

            await sendContent(sub.data.id, [{
              type: "text",
              text: `Olá ${profile.full_name}! 🌿\n\nFaz ${monthsAgo} meses desde sua última consulta. Como está seu tratamento?\n\n🎁 Temos um cupom especial de 15% para seu retorno: RETORNO15\n\n📅 Agende agora: https://consultorio-medico-inteligente.lovable.app/agendamento\n\nSeu bem-estar é nossa prioridade! 💚`
            }]);
            await tagSubscriber(sub.data.id, "Reactivation_Sent");
            reactivated++;
          }
        }

        return new Response(JSON.stringify({ success: true, reactivated }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════════
      // 3. RELATÓRIO SEMANAL ADMIN (Domingo 22h)
      // ═══════════════════════════════════════════════════
      case "weekly_admin_report": {
        console.log("📊 [Retention] Gerando relatório semanal admin...");

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Dados da semana
        const [appointments, newDoctors, npsData, revenue] = await Promise.all([
          supabase.from("appointments").select("id, amount, status").gte("created_at", weekAgo),
          supabase.from("doctors").select("id").gte("created_at", weekAgo),
          supabase.from("nps_responses").select("score").gte("created_at", weekAgo),
          supabase.from("escrow_transactions").select("amount, platform_fee").gte("created_at", weekAgo).eq("status", "released"),
        ]);

        const totalConsultas = (appointments.data || []).length;
        const completedConsultas = (appointments.data || []).filter(a => a.status === "completed").length;
        const totalRevenue = (revenue.data || []).reduce((sum, r) => sum + Number(r.amount), 0);
        const platformRevenue = (revenue.data || []).reduce((sum, r) => sum + Number(r.platform_fee), 0);
        const avgNPS = (npsData.data || []).length > 0
          ? ((npsData.data || []).reduce((sum, n) => sum + n.score, 0) / (npsData.data || []).length).toFixed(1)
          : "N/A";
        const newDoctorsCount = (newDoctors.data || []).length;

        // Projeção próxima semana (média * 1.1)
        const projectedRevenue = (totalRevenue * 1.1).toFixed(0);

        const reportText = `📊 RELATÓRIO SEMANAL - PLANTA Y RAIZ\n${new Date().toLocaleDateString("pt-BR")}\n\n💰 FINANCEIRO\n• Faturamento Bruto: R$ ${totalRevenue.toFixed(0)}\n• Receita Plataforma (7%): R$ ${platformRevenue.toFixed(0)}\n• Projeção Próx. Semana: R$ ${projectedRevenue}\n\n📋 OPERACIONAL\n• Consultas Agendadas: ${totalConsultas}\n• Consultas Realizadas: ${completedConsultas}\n• Taxa de Conclusão: ${totalConsultas > 0 ? ((completedConsultas / totalConsultas) * 100).toFixed(0) : 0}%\n\n👨‍⚕️ EQUIPE\n• Novos Médicos: ${newDoctorsCount}\n• NPS Médio: ${avgNPS}\n\n🎯 AÇÕES RECOMENDADAS\n${Number(avgNPS) < 8 ? "⚠️ NPS abaixo de 8 - Revisar qualidade" : "✅ NPS saudável"}\n${completedConsultas < totalConsultas * 0.8 ? "⚠️ Alta taxa de cancelamento" : "✅ Taxa de conclusão OK"}\n${newDoctorsCount < 5 ? "⚠️ Captar mais médicos" : "✅ Captação saudável"}`;

        // Enviar para admin via WhatsApp (gated por admin-alert-guard)
        const { shouldSilenceAdminAlert } = await import("../_shared/admin-alert-guard.ts");
        if (!shouldSilenceAdminAlert("retention-engine-weekly-report")) {
          const adminPhone = Deno.env.get("ADMIN_WHATSAPP") || "+5511987131241";
          const sub = await findSubscriber(adminPhone);
          if (sub?.data?.id) {
            await sendContent(sub.data.id, [{ type: "text", text: reportText }]);
          }
        }


        // Salvar no banco
        await supabase.from("notifications").insert({
          user_id: "00000000-0000-0000-0000-000000000000", // sistema
          title: "Relatório Semanal",
          message: reportText,
          type: "report",
        }).then(() => {}).catch(() => {});

        return new Response(JSON.stringify({ success: true, report: reportText }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════════
      // 4. AUDITORIA DE PRESCRIÇÃO VIA IA (ANVISA)
      // ═══════════════════════════════════════════════════
      case "prescription_audit": {
        console.log("🛡️ [Retention] Auditoria automática de prescrições...");

        const { data: prescriptions } = await supabase
          .from("prescriptions")
          .select("*, doctors:doctor_id(user_id, crm, crm_state)")
          .eq("status", "active")
          .is("digital_signature", null)
          .order("created_at", { ascending: false })
          .limit(50);

        let alerts = 0;
        for (const rx of prescriptions || []) {
          const issues: string[] = [];

          if (!rx.digital_signature) issues.push("❌ Sem assinatura digital (RDC 660 Art. 5)");
          if (!rx.anvisa_code) issues.push("⚠️ Sem código ANVISA");
          if (rx.valid_until && new Date(rx.valid_until) < new Date()) issues.push("⏰ Receita expirada");
          if (!rx.medications || (Array.isArray(rx.medications) && (rx.medications as any[]).length === 0)) issues.push("💊 Sem medicamentos listados");
          if (!rx.diagnosis_cid) issues.push("📋 Sem diagnóstico CID");

          if (issues.length > 0) {
            const doctor = (rx as any).doctors;
            if (!doctor) continue;

            const { data: profile } = await supabase.from("profiles").select("phone, full_name").eq("id", doctor.user_id).maybeSingle();
            if (!profile?.phone) continue;

            const sub = await findSubscriber(profile.phone);
            if (sub?.data?.id) {
              await sendContent(sub.data.id, [{
                type: "text",
                text: `⚠️ ALERTA ANVISA - Prescrição #${rx.id.slice(0, 8)}\n\nDr. ${profile.full_name}, identificamos pendências:\n\n${issues.join("\n")}\n\n🔒 Corrija para manter compliance total.\n\n👉 Acesse: https://consultorio-medico-inteligente.lovable.app/prontuario`
              }]);
              await tagSubscriber(sub.data.id, "Prescription_Alert");
              alerts++;
            }
          }
        }

        return new Response(JSON.stringify({ success: true, alerts, audited: (prescriptions || []).length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "health":
        return new Response(JSON.stringify({ status: "ok", service: "retention-engine", automations: ["vip_upgrade_check", "patient_reactivation", "weekly_admin_report", "prescription_audit"] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("❌ [Retention Engine] Erro:", e);
    return new Response(JSON.stringify({ error: "Erro interno", details: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
