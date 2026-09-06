import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, corsHeaders } from "../_shared/cors.ts";

/**
 * TABELA DE PREÇOS OFICIAIS SERVER-SIDE (IMUTÁVEL)
 * O cliente JAMAIS define preços. Valores são validados exclusivamente no backend.
 */
const OFFICIAL_PRICES: Record<string, { title: string; amount: number }> = {
  // Consultas e Orientações Técnicas
  orientacao: { title: "Orientação Técnica Canabinoide (Planta y Raíz)", amount: 30.00 },
  orientacao_tecnica: { title: "Orientação Técnica Canabinoide (Planta y Raíz)", amount: 30.00 },
  consulta_canabinoide: { title: "Consulta Canabinoide Especializada", amount: 250.00 },
  consulta_chat: { title: "Consulta Médica por Chat Clínico", amount: 100.00 },
  consulta_video: { title: "Consulta Médica por Vídeo Telemedicina", amount: 150.00 },
  consulta_premium: { title: "Consulta Premium (Vídeo + Chat)", amount: 180.00 },
  retorno_30d: { title: "Retorno de Consulta (30 dias)", amount: 0.00 },
  retorno_consulta: { title: "Retorno com o Profissional", amount: 90.00 },

  // Planos de Assinatura
  plano_basic: { title: "Plano Individual Básico", amount: 49.90 },
  saude_verde_individual: { title: "Plano Individual Saúde Verde", amount: 35.00 },
  plano_paciente: { title: "Plano Paciente VIP (Mensal)", amount: 99.00 },
  plano_professional: { title: "Plano Médico VIP (Mensal)", amount: 99.90 },
  plano_medico: { title: "Plano Médico VIP (Mensal)", amount: 99.00 },
  medico_vip: { title: "Plano Médico VIP (Mensal)", amount: 99.00 },
  plano_lojista: { title: "Plano Lojista VIP (Mensal)", amount: 99.00 },
  lojista_pro: { title: "Plano Lojista Pro (Mensal)", amount: 49.00 },
  plano_premium: { title: "Plano Saúde Verde Família", amount: 199.90 },
  saude_verde_familia: { title: "Plano Saúde Verde Família", amount: 49.00 },
  plano_enterprise: { title: "Plano Empresa & Parceiros", amount: 499.90 },
  empresa: { title: "Plano Empresa & Parceiros", amount: 149.00 },
  familia: { title: "Plano Clínica da Família", amount: 195.00 },
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // --- JWT Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } = await anonClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Token Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { appointmentId, doctorName, patientEmail, description, service_id, sku, planSlug } = body;

    let title: string = description || "Atendimento Planta y Raíz";
    let amount: number;

    // 1) Se for consulta agendada, recupera preço autoritativo da consulta no banco
    if (appointmentId) {
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .select("amount, patient_id, appointment_type, doctor_id")
        .eq("id", appointmentId)
        .single();

      if (apptError || !appt) {
        return new Response(JSON.stringify({ error: "Consulta não encontrada" }), {
          status: 404,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // Garante que o chamador é o paciente da consulta
      if (appt.patient_id !== userId) {
        return new Response(JSON.stringify({ error: "Forbidden - Acesso não autorizado a esta consulta" }), {
          status: 403,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      amount = Number(appt.amount);
      if (!amount || isNaN(amount) || amount <= 0) {
        // Fallback para preço padrão de consulta por vídeo se amount estiver zerado no agendamento
        amount = 150.00;
      }
      title = description || `Consulta com ${doctorName || "Especialista Prescritor"}`;
    } else {
      // 2) Se for contratação de serviço/plano avulso, valida ESTRITAMENTE contra OFFICIAL_PRICES
      const targetSlug = (service_id || sku || planSlug || "").toLowerCase().trim();
      const officialItem = OFFICIAL_PRICES[targetSlug];

      if (!officialItem) {
        return new Response(
          JSON.stringify({
            error: "Identificador de serviço ou plano inválido. Preços definidos exclusivamente no servidor.",
          }),
          {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          }
        );
      }

      amount = officialItem.amount;
      title = officialItem.title;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const siteUrl = "https://plantayraiz.com.br";

    const preference = {
      items: [
        {
          title,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: patientEmail || authData.user.email || "paciente@plantayraiz.com.br",
      },
      back_urls: {
        success: `${siteUrl}/dashboard?payment=success`,
        failure: `${siteUrl}/pagamento?status=failure`,
        pending: `${siteUrl}/pagamento?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: appointmentId || `pyr-srv-${Date.now()}`,
      statement_descriptor: "PLANTA Y RAIZ",
      metadata: {
        type: appointmentId ? "consultation" : "service_subscription",
        patient_id: userId,
        appointment_id: appointmentId || null,
        service_id: service_id || sku || planSlug || null,
        verified_amount: amount,
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      console.error("Mercado Pago error:", mpResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao criar pagamento no Mercado Pago" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpResponse.json();

    if (appointmentId) {
      await supabase
        .from("appointments")
        .update({
          payment_status: "awaiting_payment",
          payment_id: mpData.id,
        })
        .eq("id", appointmentId);
    }

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        preference_id: mpData.id,
        amount,
      }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("create-payment error:", e);
    return new Response(JSON.stringify({ error: "Erro interno no processamento de pagamento" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
