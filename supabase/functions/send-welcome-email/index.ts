import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-cron-secret, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    
    // Webhook payload from auth.users or profiles
    const record = body.record;
    if (!record) {
      return new Response(JSON.stringify({ error: "No record found" }), { status: 400, headers: corsHeaders });
    }

    // Attempt to get email and name from auth.users payload (or profiles if extended)
    const email = record.email || (record.raw_user_meta_data && record.raw_user_meta_data.email);
    const name = record.raw_user_meta_data?.full_name || record.full_name || "Usuário";
    const role = record.raw_user_meta_data?.role || record.user_type || "paciente";

    if (!email) {
      return new Response(JSON.stringify({ error: "No email to send to" }), { status: 400, headers: corsHeaders });
    }

    // Decide which template to use based on role
    const isDoctor = role === "doctor" || role === "medico";
    
    let htmlContent = "";
    
    if (isDoctor) {
      htmlContent = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">PLANTA Y RAÍZ LTDA</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; font-weight: bold;">MEGA CLÍNICA DIGITAL</p>
          </div>
          <div style="padding: 30px;">
            <p>Olá <strong>Dr(a). ${name}</strong>,</p>
            <p>Seu cadastro como Médico Prescritor na <strong>Planta y Raíz</strong> foi recebido com sucesso!</p>
            <p>Para garantir a segurança da sua conta, realizamos esta verificação em duas etapas. Seu painel já está disponível para uso.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://plantayraiz.com.br/login" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">Acessar Meu Consultório Digital</a>
            </div>
            <p>Se você não realizou este cadastro, por favor ignore este e-mail.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #475569;">
            <p style="margin: 0;">Atenciosamente,<br><strong>Enf. Brisa</strong><br>Depto. de Marketing Médico</p>
          </div>
        </div>
      `;
    } else {
      htmlContent = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">PLANTA Y RAÍZ LTDA</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; font-weight: bold;">MEGA CLÍNICA DIGITAL</p>
          </div>
          <div style="padding: 30px;">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Seja muito bem-vindo(a) à <strong>Planta y Raíz</strong>!</p>
            <p>Sua conta foi criada com sucesso. Esta é uma mensagem de verificação em duas etapas para garantir a segurança dos seus dados de saúde.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://plantayraiz.com.br/login" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">Acessar Minha Conta</a>
            </div>
            <p>Se você não realizou este cadastro, por favor ignore este e-mail.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #475569;">
            <p style="margin: 0;">Atenciosamente,<br><strong>Equipe Planta y Raíz</strong></p>
          </div>
        </div>
      `;
    }

    const payload = {
      sender: { name: "Planta y Raiz", email: "contato@plantayraiz.com.br" },
      to: [{ email: email, name: name }],
      subject: "Bem-vindo(a) à Planta y Raíz - Verificação de Conta",
      htmlContent: htmlContent,
      tags: ["welcome-email", isDoctor ? "welcome-doctor" : "welcome-patient"]
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Brevo error:", errText);
      return new Response(JSON.stringify({ error: "Email provider rejected the request" }), { status: 502, headers: corsHeaders });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ success: true, messageId: data.messageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Internal Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
