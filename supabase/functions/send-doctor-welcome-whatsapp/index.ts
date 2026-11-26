import { getCallerUserId, isAdmin } from "../_shared/admin-auth.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { doctorPlan, DOCTOR_PRO_TOOLS, proToolsForPlan } from "../_shared/doctor-plans.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EVO_URL = (Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_URL_VPS") || "https://whatsapp.plantayraiz.com.br").replace(/\/$/, "");
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY") || Deno.env.get("EVOLUTION_API_KEY_VPS") || "";
const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "plantayraiz";
const ADMIN_PHONE = Deno.env.get("ADMIN_WHATSAPP") || "5511991363154"; // Dr. Edilson / Adm

async function sendWhatsApp(to: string, message: string) {
  const cleanPhone = to.replace(/\D/g, "");
  if (!cleanPhone) return null;
  const endpoint = `${EVO_URL}/message/sendText/${EVO_INSTANCE}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVO_KEY,
    },
    body: JSON.stringify({
      number: cleanPhone,
      text: message,
    }),
  });
  const body = await res.text();
  console.log(`[sendWhatsApp] To: ${cleanPhone} | Status: ${res.status}`);
  return { status: res.status, body };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    let { phone, fullName, email, crm, planTier = "vip", actionType = "welcome_vip", renewalLink } = payload;
    // Only service/admin callers may choose recipient/action; a signed-in doctor gets only their own welcome.
    const managedCron = Boolean(Deno.env.get("LOVABLE_CRON_SECRET")) && authenticateCronRequest(req) === null;
    if (!managedCron && requireServiceAuth(req, corsHeaders) !== null) {
      const uid = await getCallerUserId(req);
      if (!uid) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!(await isAdmin(uid))) {
        const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: prof } = await svc.from("profiles").select("phone, full_name").eq("id", uid).maybeSingle();
        const { data: doc } = await svc.from("doctors").select("crm, plan_tier").eq("user_id", uid).maybeSingle();
        if (!doc || !prof?.phone) {
          return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: once } = await svc.rpc("check_edge_rate_limit", { p_bucket: "doctor-welcome", p_key: uid, p_max_hits: 1, p_window_seconds: 86400 });
        if (once === false) {
          return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        phone = prof.phone; fullName = prof.full_name || fullName; crm = doc.crm; email = undefined;
        actionType = "welcome_vip"; planTier = doc?.plan_tier || "vip"; renewalLink = undefined;
      }
    }

    // Service/admin may target a doctor by user id; phone is read server-side.
    if (payload.doctorUserId && !phone) {
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: prof } = await svc.from("profiles").select("phone, full_name").eq("id", payload.doctorUserId).maybeSingle();
      const { data: doc } = await svc.from("doctors").select("crm").eq("user_id", payload.doctorUserId).maybeSingle();
      phone = prof?.phone; fullName = prof?.full_name || fullName; crm = doc?.crm || crm;
      if (actionType === "welcome_standard") {
        const { data: once } = await svc.rpc("check_edge_rate_limit", { p_bucket: "doctor-welcome-standard", p_key: payload.doctorUserId, p_max_hits: 1, p_window_seconds: 604800 });
        if (once === false) {
          return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const { formatDoctorAddressing } = await import("../_shared/whatsapp-outreach-guard.mjs");
    const addressing = formatDoctorAddressing({
      name: String(fullName || ""),
      crm: String(crm || ""),
      crmState: String(payload.crmState || payload.crm_state || ""),
      councilType: String(payload.councilType || payload.council_type || ""),
      email: String(email || ""),
    });
    if (!addressing.allowed) {
      return new Response(JSON.stringify({ ok: true, skipped: `blocked_pj_or_non_doctor:${addressing.reason}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const doctorSalutation = addressing.salutation || addressing.cleanName || "Colega";

    console.log(`[VIP Lifecycle] action=${actionType} sent`);

    let doctorMsg = "";
    let adminMsg = "";

    if (actionType === "welcome_standard") {
      doctorMsg = `🌿 *Seja bem-vindo(a) à Planta y Raiz, ${doctorSalutation}!*

Agora você faz parte da nossa plataforma de telemedicina e medicina integrativa.

📋 *Para começar a atender, falta pouco:*
1. ✍️ Cadastrar sua *assinatura digital gov.br* (sem ela não é possível emitir receitas).
2. 📄 Assinar o *contrato da plataforma* no Consultório.
3. ✅ Aguardar a aprovação final do seu cadastro pela nossa equipe.

Assim que aprovado(a), é só ligar o botão *ON* no Consultório para receber pacientes:
👉 https://www.plantayraiz.com.br/consultorio

⭐ *Plano Médico VIP opcional (R$ 99/mês):*
• prioridade no rodízio de consultas (assinantes online têm prioridade);
• acesso ao Copiloto Clínico com PubMed, Assistente Jurídico e Escriba de consulta;
• repasse de 93% de cada consulta via PIX (taxa fixa de 7% em todos os planos).
👉 https://www.plantayraiz.com.br/precos

Qualquer dúvida, responda esta mensagem. Se não quiser mais avisos, responda SAIR. 💚

Enfª Brisa (assistente virtual) | Relacionamento Médico
Planta y Raiz`;
      adminMsg = `🩺 *Boas-vindas enviada*
Médico(a): ${doctorSalutation}
CRM: ${crm || "N/A"}
Plano: normal (sem VIP grátis). Pendências: assinatura gov.br, contrato, aprovação.`;
    } else if (actionType === "vip_expired") {
      doctorMsg = `Olá, ${doctorSalutation}!

Identificamos que a vigência do seu Plano Médico VIP na Planta y Raiz encerrou sua competência mensal.

Para manter sua prioridade no rodízio de pacientes, destaque na vitrine médica e acesso às ferramentas de IA (Copiloto Clínico, Assistente Jurídico e Escriba) — mantendo o repasse de 93% de cada consulta via PIX (taxa fixa de 7%) — renove quando desejar:
👉 ${renewalLink || "https://www.plantayraiz.com.br/precos"}

🛡️ *Seus Prontuários e Pacientes Estão Seguros:*
Conforme as normas do CFM e a política de segurança da Planta y Raiz (Bezerra Med Soluções Integradas Ltda.), o histórico de seus pacientes e prontuários permanece 100% íntegro e arquivado de forma confidencial.

Equipe de Gestão Médica | Planta y Raiz`;

      adminMsg = `🚨 *AVISO PLANO VENCIDO — PLANTA Y RAIZ*
Médico: ${doctorSalutation}
CRM: ${crm || "N/A"}
Telefone: ${phone}
Status: VIP expirado. Mensagem de regularização enviada via WhatsApp.`;

    } else {
      const plan = doctorPlan(planTier);
      const tools = proToolsForPlan(plan.key).map((t) => `   • ${DOCTOR_PRO_TOOLS[t].title}`).join("\n");
      doctorMsg = `🌟 *BEM-VINDO(A) AO PLANO MÉDICO ${plan.name.toUpperCase()}!*

Prezado(a) ${doctorSalutation}${crm ? ` (CRM ${crm})` : ""},

Sua assinatura do *Plano ${plan.name}* (R$ ${plan.priceBrl.toLocaleString("pt-BR")}/mês) está ativa na Planta y Raiz.

👑 *O QUE SEU PLANO LIBERA:*
1. 🚦 *Prioridade na fila de consultas:* nível ${plan.queueRank} de 6 — planos maiores recebem a oferta do paciente antes.
2. 🧠 *Copiloto Clínico (PubMed):* até ${plan.limits.copiloto} consultas por dia.
3. ⚖️ *Assistente Jurídico:* até ${plan.limits.juridico} perguntas por dia.
4. 🎙️ *Escriba de consulta:* até ${plan.limits.escriba} trechos de áudio/SOAP por dia.
${tools ? `5. 🧰 *Ferramentas exclusivas* (até ${plan.limits.pro} usos por dia):\n${tools}\n` : ""}
Além disso: prontuário com CID-10, receitas assinadas, lembretes automáticos, lista de espera, painel financeiro e vídeo HD (taxa fixa de 7% em todas as consultas).

Para acessar seu Consultório Virtual:
👉 https://www.plantayraiz.com.br/consultorio

Enfª Brisa (assistente virtual) | Gestão & Relacionamento Médico
🌿 Planta y Raiz`;

      adminMsg = `🩺 *Novo médico ativado — plano ${doctorPlan(planTier).name}*
Médico: ${doctorSalutation}
CRM: ${crm || "N/A"}
WhatsApp: ${phone}
Plano: ${doctorPlan(planTier).name} (R$ ${doctorPlan(planTier).priceBrl.toLocaleString("pt-BR")}/mês)
Prioridade na fila: nível ${doctorPlan(planTier).queueRank} de 6.`;
    }

    // 1. Envia WhatsApp para o médico (se informado telefone)
    let doctorDispatch = null;
    if (phone) {
      doctorDispatch = await sendWhatsApp(phone, doctorMsg);
    }

    // 2. Envia WhatsApp no celular do Dr. Edilson / Admin apenas se houver telefone real do médico notificado
    let adminDispatch = null;
    if (ADMIN_PHONE && phone && String(phone).trim().length >= 8) {
      adminDispatch = await sendWhatsApp(ADMIN_PHONE, adminMsg);
    }

    return new Response(
      JSON.stringify({
        success: true,
        actionType,
        doctorNotified: Boolean(doctorDispatch?.status === 200 || doctorDispatch?.status === 201),
        adminNotified: Boolean(adminDispatch?.status === 200 || adminDispatch?.status === 201),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("[send-doctor-welcome-whatsapp error]", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
