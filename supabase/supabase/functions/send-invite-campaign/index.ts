import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";

const INVITE_SUBJECT = "Convite Exclusivo: Seja Médico Sócio Prescritor de Cannabis Medicinal na Planta y Raíz Ltda | A Revolução da Medicina Canabinoide";

function buildInviteHTML(doctorName: string): string {
  const firstName = doctorName.split(" ")[0] || "Doutor(a)";
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:680px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
    
    <!-- Header Executivo -->
    <div style="background:linear-gradient(135deg,#0f4c35 0%,#10b981 100%);padding:40px 30px;text-align:center;">
      <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">PLANTA Y RAÍZ LTDA</h1>
      <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:3px;font-weight:600;">MEGA CLÍNICA DIGITAL · TELEMEDICINA CANABINOIDE</p>
      <div style="width:60px;height:3px;background:rgba(255,255,255,0.4);margin:18px auto 0;border-radius:2px;"></div>
    </div>

    <!-- Corpo do E-mail -->
    <div style="padding:35px 30px;line-height:1.7;color:#1e293b;font-size:15px;">
      <p style="font-size:16px;">Prezado(a) <strong>Dr(a). ${firstName}</strong>,</p>
      
      <p>A medicina canabinoide no Brasil vive uma expansão sem precedentes, com empresas faturando na casa dos <strong>30 milhões por ano</strong>. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.</p>
      
      <p>É com grande honra que convidamos você para se tornar <strong style="color:#059669;">Médico Sócio Prescritor</strong> na Planta y Raíz — oficialmente desenvolvida por médicos para ser a melhor, mais rentável e mais completa plataforma de telemedicina canabinoide do planeta.</p>

      <!-- Tabela Comparativa -->
      <h3 style="color:#0f4c35;font-size:17px;margin:25px 0 10px;border-bottom:2px solid #10b981;padding-bottom:8px;">🏆 Planta y Raíz vs. Mercado Tradicional</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <thead>
          <tr style="background:#0f4c35;color:#fff;">
            <th style="padding:10px 8px;text-align:left;border:1px solid #1a6b4a;">Diferencial</th>
            <th style="padding:10px 8px;text-align:center;border:1px solid #1a6b4a;">Plataformas Tradicionais</th>
            <th style="padding:10px 8px;text-align:center;border:1px solid #1a6b4a;background:#059669;">Planta y Raíz</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Taxa da Plataforma</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">20% a 45%</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Apenas 7%</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Repasse Financeiro</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">30 a 60 dias</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">PIX Instantâneo</td></tr>
          <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Preço da Consulta</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Tabela fixa</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Total Liberdade</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Modelo de Parceria</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">Prestador de serviço</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Sócio Prescritor</td></tr>
          <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Plano de Indicação</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Inexistente</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Rede 3ª Geração</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Suporte Diagnóstico</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">Prontuários genéricos</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">Robô IA Auxiliar</td></tr>
          <tr style="background:#f8fafb;"><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Custo de Adesão</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#dc2626;">Mensalidades</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#059669;font-weight:bold;">100% Gratuito</td></tr>
        </tbody>
      </table>

      <h3 style="color:#0f4c35;margin:25px 0 10px;">🚀 O que torna a Planta y Raíz Irresistível?</h3>

      <p><strong>💰 Potencial Financeiro de Elite (Ganhe até R$ 45.000/mês)</strong><br>
      Atenda 10 pacientes/dia a R$ 150 cada com retenção de 93%. PIX em tempo real ao término de cada consulta. Distribuição de lucros por desempenho e Plano de Indicação em 3 Gerações.</p>

      <p><strong>🧠 Tecnologia de Ponta & Robô IA</strong><br>
      IA integrada para triagem, prescritor canábico inteligente com calculadora de dosagem CBD/THC, workspace split-pane com vídeo HD + prontuário lado a lado, e perfil de visibilidade global.</p>

      <p><strong>🛡️ Compliance, Segurança e Assistência Jurídica</strong><br>
      100% conforme CFM, ANVISA e LGPD. Suporte e assistência jurídica especializada em medicina canabinoide.</p>

      <blockquote style="border-left:4px solid #10b981;padding:12px 16px;margin:20px 0;background:#f0fdf4;font-style:italic;color:#065f46;font-size:14px;">
        "Não seja apenas mais um médico cadastrado em plataformas que valorizam apenas a própria margem. Seja sócio da plataforma que valoriza o seu conhecimento e a sua liberdade."
      </blockquote>

      <h3 style="color:#0f4c35;margin:25px 0 10px;">🌿 Faça Parte Desta Revolução!</h3>
      <p>Cadastro <strong>totalmente gratuito</strong> nesta campanha para os primeiros 100 médicos. Leva menos de 2 minutos.</p>

      <!-- CTA -->
      <div style="text-align:center;margin:30px 0;">
        <a href="https://plantayraiz.com.br/cadastro-profissional" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:16px 40px;font-size:17px;font-weight:800;text-decoration:none;border-radius:8px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(16,185,129,0.4);">
          👉 CADASTRO GRATUITO AQUI
        </a>
      </div>
      <p style="text-align:center;font-size:13px;color:#64748b;">ou entre em contato: <strong>WhatsApp (55) 11 99136-3154</strong></p>
    </div>

    <!-- Rodapé Executivo -->
    <div style="background:#f1f5f9;border-top:1px solid #e2e8f0;padding:25px 30px;">
      <p style="margin:0 0 5px;font-size:14px;color:#334155;">Atenciosamente,</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#0f4c35;">Enf. Brisa</p>
      <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Departamento de Marketing Médico</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:15px 0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">Planta y Raíz Ltda · CNPJ: XX.XXX.XXX/XXXX-XX · A Plataforma nº 1 de Telemedicina Canabinoide</p>
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

  try {
    const { contacts, batchSize = 10, dryRun = false } = await req.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return new Response(JSON.stringify({ error: "No contacts provided" }), {
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
    const batch = contacts.slice(0, batchSize);

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
            console.error(`Import error for ${email}:`, errBody);
          }
        }

        // 2. Send invite email via Brevo transactional
        if (!dryRun) {
          const emailPayload = {
            sender: { name: "Planta y Raíz · Enf. Brisa", email: "contato@plantayraiz.com.br" },
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
            console.error(`Send error for ${email}:`, sendErr);
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
