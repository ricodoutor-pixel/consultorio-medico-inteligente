// doctor-flow-briefing — operational briefing to showcase doctors (WhatsApp + Brevo email + panel notice).
// Service/cron only. Idempotent per channel (panel notification, Brevo email, WhatsApp).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { sendWhatsApp } from "../_shared/evolution.ts";

const SITE = "https://www.plantayraiz.com.br";
const BRISA_GENERIC_PHONE = "5511991363154";
const WITHDRAWN = ["leuma leao netta", "ana paula ferreira lima", "edilson bezerra", "edilson bezerra da silva", "olivia zimeri"];
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/^(?:(?:dra|dr|profa|prof)\.?\s+)+/, "").trim().replace(/\s+/g, " ");
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function textFor(name: string) {
  return `${name}, aqui é a equipe Planta y Raiz. 🌿 Estamos de prontidão para consultas reais e queremos que o senhor(a) saiba exatamente como funciona:\n\n` +
`*1. Como a consulta chega ao senhor(a)*\n` +
`• O paciente escolhe o médico na vitrine, paga por Pix ANTES e faz a triagem.\n` +
`• O médico escolhido tem 5 minutos para aceitar.\n` +
`• Se não aceitar, entra o RODÍZIO: primeiro os *médicos assinantes que estão online*; depois os *demais médicos online com o botão ON ligado no Consultório*. Cada um tem 5 minutos.\n` +
`• ⚠️ MUITO IMPORTANTE: só recebe consulta quem está com o Consultório aberto e o *botão ON ligado*. Médico OFF não entra no rodízio.\n\n` +
`*2. Atendimento*\n` +
`• Chat e vídeo dentro da plataforma, só depois do pagamento confirmado.\n` +
`• Receita, atestado ou pedido de exame emitidos no Consultório e assinados digitalmente no gov.br (assinador.iti.br); depois o senhor(a) envia o PDF assinado.\n\n` +
`*3. Pagamento*\n` +
`• Valores da tabela: Retorno R$90 · Chat R$100 · Vídeo R$150.\n` +
`• 93% do valor vai para o seu saldo assim que o paciente avalia a consulta; o saque é feito por Pix na sua chave cadastrada.\n\n` +
`👉 Para atender: entre em ${SITE}/consultorio, faça login e ligue o botão ON sempre que estiver disponível. Desligue quando sair.\n\n` +
`Fique de prontidão: uma consulta real pode chegar a qualquer momento enquanto o senhor(a) estiver ON. Responda OK para confirmar que recebeu. 🌿`;
}

function htmlFor(name: string, missingPhone = false) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const phoneBanner = missingPhone
    ? `<div style="margin-top:20px;padding:14px 16px;background:#FEF3C7;border-left:4px solid #D97706;border-radius:6px;color:#92400E;font-size:14px">` +
      `<b>📱 Cadastre seu WhatsApp no Consultório:</b> identificamos que seu perfil ainda está sem telefone de WhatsApp cadastrado. ` +
      `Ao acessar <a href="${SITE}/consultorio" style="color:#92400E;font-weight:bold">${SITE}/consultorio</a>, atualize seu número para receber os avisos imediatos de consulta no celular.</div>`
    : "";
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1B4332;line-height:1.5">` +
    esc(textFor(name)).replace(/\*([^*]+)\*/g, "<b>$1</b>").replace(/\n/g, "<br>") +
    phoneBanner +
    `<p style="margin-top:24px"><a href="${SITE}/consultorio" style="background:#1B4332;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">Abrir meu Consultório</a></p></div>`;
}

async function sendBriefingEmail(opts: { email: string; name: string; missingPhone: boolean; brevoKey?: string; resendKey?: string }) {
  const subject = "Prontidão para consultas reais — como funciona o rodízio e o pagamento";
  const html = htmlFor(opts.name, opts.missingPhone);
  if (opts.brevoKey) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "api-key": opts.brevoKey },
      body: JSON.stringify({
        sender: { name: "Planta y Raiz", email: "contato@plantayraiz.com.br" },
        to: [{ email: opts.email, name: opts.name }],
        subject,
        htmlContent: html,
        tags: ["doctor-flow-briefing"],
      }),
    });
    if (r.ok) return { ok: true, provider: "brevo", status: r.status };
    const errText = (await r.text().catch(() => "")).slice(0, 160);
    if (!opts.resendKey) return { ok: false, provider: "brevo", status: r.status, error: errText };
  }
  if (opts.resendKey) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Planta y Raiz <contato@plantayraiz.com.br>", to: [opts.email], subject, html }),
    });
    return { ok: r.ok, provider: "resend", status: r.status, error: r.ok ? undefined : (await r.text().catch(() => "")).slice(0, 160) };
  }
  return { ok: false, error: "no_brevo_or_resend_key" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let allowed = requireServiceAuth(req, corsHeaders) === null;
  if (!allowed && Deno.env.get("LOVABLE_CRON_SECRET")) allowed = authenticateCronRequest(req) === null;
  if (!allowed) return json({ error: "Unauthorized" }, 401);
  const { offset = 0, limit = 12, dry_run = false, resend_wa = false, force_email = false } = await req.json().catch(() => ({}));
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: list } = await admin.from("doctors_public").select("id,user_id,full_name,is_verified")
    .eq("is_verified", true).order("full_name");
  const docs = (list || []).filter((d) => !WITHDRAWN.includes(norm(d.full_name || "")));
  const slice = docs.slice(offset);
  const max = Math.min(limit, 15);
  let processedCount = 0;
  const brevoKey = Deno.env.get("BREVO_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const out: unknown[] = [];

  for (const d of slice) {
    if (processedCount >= max) break;
    const rawName = (d.full_name || "").trim();
    const name = /^dr/i.test(rawName) ? rawName : `Dr(a). ${rawName}`;
    if (dry_run) { out.push({ name }); if (++processedCount >= max) break; continue; }

    const [{ data: prof }, { data: au }, { data: existingNotif }, { data: emailAudit }] = await Promise.all([
      admin.from("profiles").select("phone").eq("id", d.user_id).maybeSingle(),
      admin.auth.admin.getUserById(d.user_id),
      admin.from("notifications").select("id").eq("user_id", d.user_id).eq("title", "Prontidão para consultas reais").limit(1).maybeSingle(),
      admin.from("audit_log").select("id").eq("action", "doctor_flow_briefing_email_sent").eq("record_id", d.id).limit(1).maybeSingle(),
    ]);

    const email = au?.user?.email || null;
    const rawProfilePhone = (prof?.phone || "").replace(/\D/g, "");
    const phone = rawProfilePhone && !rawProfilePhone.endsWith(BRISA_GENERIC_PHONE.slice(-9)) ? rawProfilePhone : null;

    // 1. WhatsApp: send if never sent in v1 bucket, or if resend_wa=true
    const { data: firstWa } = await admin.rpc("check_edge_rate_limit", {
      p_bucket: "doctor-flow-briefing-v1",
      p_key: d.id,
      p_max_hits: 1,
      p_window_seconds: 7 * 86400,
    });
    const shouldSendWa = Boolean(phone) && (firstWa !== false || resend_wa);
    const wa = !phone
      ? { ok: false, error: "no_phone" }
      : shouldSendWa
      ? await sendWhatsApp(phone, textFor(name)).catch((e) => ({ ok: false, error: String(e) }))
      : { ok: true, skipped: "already_sent" };

    // 2. Email via Brevo (primary) / Resend (fallback): send if not yet recorded in audit_log
    const shouldSendEmail = Boolean(email) && (!emailAudit || force_email);
    let mail: { ok: boolean; provider?: string; status?: number; error?: string; skipped?: string } =
      !email ? { ok: false, error: "no_email" } : !shouldSendEmail ? { ok: true, skipped: "already_sent" } : { ok: false, error: "not_attempted" };
    if (email && shouldSendEmail) {
      mail = await sendBriefingEmail({ email, name, missingPhone: !phone, brevoKey, resendKey });
      if (mail.ok) {
        await admin.from("audit_log").insert({
          user_id: d.user_id,
          action: "doctor_flow_briefing_email_sent",
          table_name: "doctors",
          record_id: d.id,
          new_data: { provider: mail.provider, missing_phone: !phone },
        }).then(() => null, () => null);
      }
    }

    // 3. Panel notification: insert only if missing (fixes the 17 doctors where type='system' failed)
    let panelInserted = false;
    if (!existingNotif) {
      const { error: notifErr } = await admin.from("notifications").insert({
        user_id: d.user_id,
        title: "Prontidão para consultas reais",
        message: "Ligue o botão ON no Consultório quando estiver disponível. Assinantes online têm prioridade no rodízio.",
        type: "info",
        action_url: "/consultorio",
      });
      panelInserted = !notifErr;
    }

    const didExternalCall = (shouldSendWa && Boolean(phone)) || (shouldSendEmail && Boolean(email));
    if (didExternalCall || panelInserted) processedCount++;

    out.push({
      name,
      has_phone: Boolean(phone),
      whatsapp: (wa as any).ok ?? false,
      wa_skipped: (wa as any).skipped,
      wa_err: (wa as any).error,
      email: mail.ok,
      email_provider: mail.provider,
      email_skipped: mail.skipped,
      mail_err: mail.error,
      panel_notice: existingNotif ? "already_present" : panelInserted ? "inserted" : "failed",
    });

    if (didExternalCall) await new Promise((r) => setTimeout(r, 2500));
  }
  console.log("briefing batch", JSON.stringify(out));
  return json({ total: docs.length, offset, processed: processedCount, sent: out });
});

