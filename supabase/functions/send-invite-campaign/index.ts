import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";

const INVITE_SUBJECT = "Convite Profissional: Credencie seu Consultório Digital na Planta y Raiz (93% de Repasse via PIX)";

function buildInviteHTML(doctorName: string): string {
  const firstName = doctorName.split(" ")[0] || "Colega";
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:680px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
    
    <!-- Header Executivo -->
    <div style="background:linear-gradient(135deg,#0f4c35 0%,#10b981 100%);padding:40px 30px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">PLANTA Y RAIZ</h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:3px;font-weight:600;">TELEMEDICINA CFM · MEDICINA INTEGRATIVA</p>
      <div style="width:60px;height:3px;background:rgba(255,255,255,0.4);margin:18px auto 0;border-radius:2px;"></div>
    </div>

    <!-- Corpo do E-mail -->
    <div style="padding:35px 30px;line-height:1.7;color:#1e293b;font-size:15px;">
      <p style="font-size:16px;">Olá, <strong>${firstName}</strong>,</p>
      
      <p>Convidamos médicos com registro ativo no CRM para credenciar gratuitamente seu consultório digital na <strong>Planta y Raiz</strong>, plataforma de telemedicina desenvolvida para apoiar a autonomia clínica com prontuário CFM, emissão de receitas digitais e repasse transparente via PIX.</p>

      <!-- Tabela Comparativa -->
      <h3 style="color:#0f4c35;font-size:17px;margin:25px 0 10px;border-bottom:2px solid #10b981;padding-bottom:8px;">🏆 Planta y Raiz vs. Mercado Tradicional</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead>
          <tr style="background:#0f4c35;color:#fff;">
            <th style="padding:10px 8px;text-align:left;border:1px solid #1a6b4a;">Diferencial</th>
            <th style="padding:10px 8px;text-align:center;border:1px solid #1a6b4a;">Plataformas Tradicionais</th>
            <th style="padding:10px 8px;text-align:center;border:1px solid #1a6b4a;background:#059669;">Planta y Raiz</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Taxa da Plataforma</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">20% a 45%</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Apenas 7% (93% seu)</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Repasse Financeiro</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">30 a 60 dias</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">PIX</td></tr>
          <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Preço da Consulta</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Tabela fixa</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Autonomia na vitrine</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Plano Médico VIP (Opcional)</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">Sem prioridade</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">R$ 99/mês (prioridade + IA)</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Custo de Adesão</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Mensalidades obrigatórias</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Cadastro Gratuito</td></tr>
        </tbody>
      </table>

      <h3 style="color:#0f4c35;margin:25px 0 10px;">🚀 Recursos do Consultório Digital</h3>

      <p><strong>💰 Repasse Claro (93% via PIX)</strong><br>
      Taxa fixa de 7% da plataforma em todos os planos. Plano Médico VIP opcional por R$ 99/mês com prioridade na fila de pacientes e ferramentas de IA clínica.</p>

      <p><strong>🧠 Tecnologia & Compliance CFM / ANVISA</strong><br>
      Sala de vídeo integrada, prontuário eletrônico conforme CFM, Copiloto Clínico com PubMed, Escriba de rascunho SOAP e emissão de receitas digitais com assinatura ICP-Brasil / Gov.br.</p>

      <!-- CTA -->
      <div style="text-align:center;margin:30px 0;">
        <a href="https://www.plantayraiz.com.br/cadastro-profissional" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:16px 40px;font-size:17px;font-weight:800;text-decoration:none;border-radius:8px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(16,185,129,0.4);">
          👉 CADASTRO PROFISSIONAL GRATUITO
        </a>
      </div>
      <p style="text-align:center;font-size:13px;color:#64748b;">Dúvidas? WhatsApp oficial: <strong>(11) 99136-3154</strong></p>
    </div>

    <!-- Rodapé Executivo -->
    <div style="background:#f1f5f9;border-top:1px solid #e2e8f0;padding:25px 30px;">
      <p style="margin:0 0 5px;font-size:14px;color:#334155;">Atenciosamente,</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#0f4c35;">Enfª Brisa (Assistente Virtual) · Equipe Planta y Raiz</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:15px 0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">Bezerra Med Soluções Integradas Ltda. · CNPJ 30.740.319/0001-14 · Planta y Raiz</p>
    </div>
  </div>

  <!-- Pixel de marcação de leitura (Brevo tracking) -->
  <img src="https://plantayraiz.com.br/api/track/open?email={{params.EMAIL}}" width="1" height="1" style="display:none;" alt="" />
</body>
</html>`;
}

// Import contacts to Brevo and send invite emails
serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  try {
    const { contacts, batchSize = 10, dryRun = false } = await req.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return new Response(JSON.stringify({ error: "No contacts provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (contacts.length > 100) {
      return new Response(JSON.stringify({ error: "Too many contacts; maximum is 100" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = { sent: 0, failed: 0, imported: 0, errors: [] as string[] };
    const safeBatchSize = Math.max(1, Math.min(Number(batchSize) || 10, 25));
    const batch = contacts.slice(0, safeBatchSize);

    for (const contact of batch) {
      const { email, name, specialty, city, state, phone } = contact;

      if (!email) {
        results.failed++;
        results.errors.push(`Missing email for ${name}`);
        continue;
      }

      try {
        // 1. Import contact to Brevo CRM
        const contactPayload = {
          email,
          attributes: {
            FIRSTNAME: name?.split(" ")[0] || "",
            LASTNAME: name?.split(" ").slice(1).join(" ") || "",
            SPECIALTY: specialty || "",
            CITY: city || "",
            STATE: state || "",
            SMS: phone || "",
          },
          listIds: [2], // Default contact list
          updateEnabled: true,
        };

        const importRes = await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify(contactPayload),
        });

        if (importRes.ok || importRes.status === 204) {
          results.imported++;
        } else {
          const errBody = await importRes.text();
          // Contact may already exist (duplicate_parameter), that's OK
          if (errBody.includes("duplicate_parameter")) {
            results.imported++;
          } else {
            console.error(`Import error for recipient:`, errBody);
          }
        }

        // 2. Send invite email via Brevo transactional
        if (!dryRun) {
          const emailPayload = {
            sender: { name: "Planta y Raíz · Enfª Brisa", email: "contato@plantayraiz.com.br" },
            to: [{ email, name: name || "Doutor(a)" }],
            subject: INVITE_SUBJECT,
            htmlContent: buildInviteHTML(name || "Doutor(a)"),
            tags: ["invite-campaign", "abrace-prescritores"],
            headers: {
              "X-Mailin-Tag": "invite-prescritores-abrace",
              "Disposition-Notification-To": "contato@plantayraiz.com.br",
            },
          };

          const sendRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify(emailPayload),
          });

          if (sendRes.ok) {
            results.sent++;
          } else {
            const sendErr = await sendRes.text();
            results.failed++;
            results.errors.push(`Send failed for ${email}: ${sendErr}`);
            console.error(`Send error for recipient:`, sendErr);
          }

          // Rate limit: ~2 emails/sec to avoid Brevo throttling
          await new Promise((r) => setTimeout(r, 500));
        } else {
          results.sent++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing ${email}: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalContacts: contacts.length,
        batchProcessed: batch.length,
        ...results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
