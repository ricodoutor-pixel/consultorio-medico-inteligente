import { getCallerUserId, isAdmin } from "../_shared/admin-auth.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";
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
    if (requireServiceAuth(req, corsHeaders) !== null) {
      const uid = await getCallerUserId(req);
      if (!uid) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!(await isAdmin(uid))) {
        const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: prof } = await svc.from("profiles").select("phone, full_name").eq("id", uid).maybeSingle();
        const { data: doc } = await svc.from("doctors").select("crm").eq("user_id", uid).maybeSingle();
        if (!doc || !prof?.phone) {
          return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data: once } = await svc.rpc("check_edge_rate_limit", { p_bucket: "doctor-welcome", p_key: uid, p_max_hits: 1, p_window_seconds: 86400 });
        if (once === false) {
          return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        phone = prof.phone; fullName = prof.full_name || fullName; crm = doc.crm; email = undefined;
        actionType = "welcome_vip"; planTier = "vip"; renewalLink = undefined;
      }
    }

    console.log(`[VIP Lifecycle] action=${actionType} sent`);

    let doctorMsg = "";
    let adminMsg = "";

    if (actionType === "vip_expired") {
      // Regra de Vencimento e Renovação
      doctorMsg = `Olá, Dr(a). ${fullName}!

Identificamos que a vigência do seu Plano Médico VIP na Planta y Raíz encerrou sua competência mensal.

⚠️ *Atenda mais, não atrase seu plano!*

Para manter sua taxa de intermediação ZERO (0%), destaque ouro na vitrine médica, fila prioritária da Enfª Brisa e o Copiloto Clínico VIP de Consultas, renove agora de forma rápida:
👉 ${renewalLink || "https://plantayraiz.com.br/precos"}

🛡️ *Seus Prontuários e Pacientes Estão Seguros:*
Conforme as normas do CFM e a política de segurança da Planta y Raíz, o histórico de seus pacientes e prontuários permanece 100% íntegro e arquivado de forma confidencial.

Equipe de Gestão Médica | Planta y Raíz
Telemedicina & Cuidado Canabinoide`;

      adminMsg = `🚨 *AVISO PLANO VENCIDO — PLANTA Y RAÍZ*
Médico: Dr(a). ${fullName}
CRM: ${crm || "N/A"}
Telefone: ${phone}
Status: VIP expirado. Mensagem de regularização ("Atenda mais, não atrase seu plano!") enviada via WhatsApp.`;

    } else {
      // Boas-vindas VIP padrão e lista de vantagens
      doctorMsg = `🌟 *PARABÉNS E SEJA BEM-VINDO(A) AO PLANO MÉDICO VIP!*

Prezado(a) Dr(a). ${fullName}${crm ? ` (CRM ${crm})` : ""},

É uma honra confirmar a ativação do seu *Plano Médico VIP Assinante* na Planta y Raíz (plantayraiz.com.br)!

Seu perfil foi oficialmente reconhecido pelo sistema e todos os privilégios VIP de alta performance estão liberados para você:

👑 *SUAS VANTAGENS EXCLUSIVAS DE MÉDICO VIP:*
1. 💸 *Taxa de Intermediação ZERO (0%):* 100% do valor líquido das suas teleconsultas é repassado a você.
2. 🏆 *Destaque Ouro na Vitrine:* Posicionamento de topo prioritário na página inicial e na busca médica.
3. 🤖 *Prioridade na Triagem IA (Enfª Brisa):* Roteamento automático de pacientes pré-triados diretamente para o seu agendamento.
4. 📋 *Prontuário Eletrônico Inteligente:* Histórico longitudinal, anamnese digital e armazenamento seguro em conformidade com o CFM e LGPD.
5. 🧠 *Copiloto Clínico VIP de Consultas (IA):* Inteligência de apoio à decisão clínica treinada nas diretrizes ANVISA (RDC 660 e 327), literatura endocanabinoide e checagem de interações medicamentosas em tempo real.
6. 🎥 *Telemedicina HD Integrada:* Sala criptografada de videochamada sem limite de tempo com chat integrado.

Para acessar seu Consultório Virtual completo com o Copiloto IA e Prontuário, acesse agora:
👉 https://plantayraiz.com.br/consultorio

Conte sempre conosco para alavancar a sua prática clínica com tecnologia e humanização!

Enfª Brisa | Gestão & Relacionamento Médico
🌿 Planta y Raíz — Democratizando a Medicina e Cuidado Canabinoide`;

      adminMsg = `👑 *NOVO MÉDICO VIP ATIVADO NA PLATAFORMA!*
Médico: Dr(a). ${fullName}
CRM: ${crm || "N/A"}
WhatsApp: ${phone}
Plano: ${planTier.toUpperCase()} (R$ 99/mês)
Privilégios liberados: Taxa 0%, Vitrine Topo, Prontuário Eletrônico e Copiloto Clínico VIP.`;
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
