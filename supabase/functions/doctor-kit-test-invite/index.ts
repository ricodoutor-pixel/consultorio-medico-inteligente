// doctor-kit-test-invite — convite aos médicos verificados da vitrine para testarem o Consultório Virtual (Kit do Assinante).
// Service/cron only. Envia no máximo 1 vez por médico por canal (WhatsApp, e-mail Brevo/Resend e aviso no painel).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { sendWhatsApp } from "../_shared/evolution.ts";

const SITE = "https://plantayraiz.com.br";
const BRISA_GENERIC_PHONE = "5511991363154";
const WITHDRAWN = [
  "leuma leao netta",
  "ana paula ferreira lima",
  "edilson bezerra",
  "edilson bezerra da silva",
  "olivia zimeri",
];
const PANEL_TITLE = "Teste o seu Consultório Virtual";
const PANEL_MESSAGE = "Novas ferramentas no seu Kit do Assinante. Abra o Consultório e teste.";
const EMAIL_SUBJECT = "Novidades no seu Consultório Virtual — teste e nos conte";
const EMAIL_AUDIT_ACTION = "doctor_kit_test_invite_email_sent";
const WA_RATE_BUCKET = "doctor-kit-test-invite-v1";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(?:(?:dra|dr|profa|prof)\.?\s+)+/, "")
    .trim()
    .replace(/\s+/g, " ");

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function textFor(name: string): string {
  return (
    `${name}, aqui é a equipe Planta y Raiz. 🌿 Seu Consultório Virtual ganhou ferramentas novas e queremos que o(a) senhor(a) seja um dos primeiros a testar:\n\n` +
    `• *Meu Kit do Assinante*: tudo o que o seu plano inclui, num só lugar.\n` +
    `• *Copiloto de Evidências*: perguntas clínicas com estudos do PubMed conferidos pelo PMID.\n` +
    `• *Assistente Jurídico*: dúvidas sobre CFM, telemedicina, publicidade, LGPD e Anvisa (planos pagos).\n` +
    `• *Escriba de IA*: dite o resumo ou grave a consulta (com autorização do paciente) e receba o rascunho do SOAP.\n` +
    `• *Prontuário*: CID-10 oficial, modelos de anamnese, alergias no topo, linha do tempo e gráfico de evolução.\n` +
    `• *Financeiro*: repasses do mês, saques e relatório para o contador.\n` +
    `• Vídeo próprio da Planta y Raiz em tela cheia, lembretes automáticos ao paciente e lista de espera.\n\n` +
    `👉 Como testar (10 minutos): entre em ${SITE}/consultorio, abra a aba *🧰 Meu Kit do Assinante* e experimente o Copiloto e o Assistente Jurídico. No Workspace de uma consulta, teste o *Escriba de IA* com "Ditar resumo".\n\n` +
    `Responda esta mensagem com o que funcionou, o que achou difícil e o que sentiu falta. Sua opinião define as próximas melhorias. Se preferir não receber estes avisos, responda SAIR.`
  );
}

export function htmlFor(name: string, missingPhone = false): string {
  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const phoneBanner = missingPhone
    ? `<div style="margin-top:20px;padding:14px 16px;background:#FEF3C7;border-left:4px solid #D97706;border-radius:6px;color:#92400E;font-size:14px">` +
      `<b>📱 Cadastre seu WhatsApp no Consultório:</b> identificamos que seu perfil ainda está sem telefone cadastrado. ` +
      `Ao acessar <a href="${SITE}/consultorio" style="color:#92400E;font-weight:bold">${SITE}/consultorio</a>, cadastre seu WhatsApp para receber nossos avisos e chamadas de consulta no celular.</div>`
    : "";
  return (
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1B4332;line-height:1.5">` +
    esc(textFor(name))
      .replace(/\*([^*]+)\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>") +
    phoneBanner +
    `<p style="margin-top:24px"><a href="${SITE}/consultorio" style="background:#1B4332;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">Abrir meu Consultório</a></p></div>`
  );
}

async function sendInviteEmail(opts: {
  email: string;
  name: string;
  missingPhone: boolean;
  brevoKey?: string;
  resendKey?: string;
}): Promise<{ ok: boolean; provider?: string; status?: number; error?: string }> {
  const html = htmlFor(opts.name, opts.missingPhone);
  if (opts.brevoKey) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": opts.brevoKey,
      },
      body: JSON.stringify({
        sender: { name: "Planta y Raiz", email: "contato@plantayraiz.com.br" },
        to: [{ email: opts.email, name: opts.name }],
        subject: EMAIL_SUBJECT,
        htmlContent: html,
        tags: ["doctor-kit-test-invite"],
      }),
    });
    if (r.ok) return { ok: true, provider: "brevo", status: r.status };
    const errText = (await r.text().catch(() => "")).slice(0, 160);
    if (!opts.resendKey) return { ok: false, provider: "brevo", status: r.status, error: errText };
  }
  if (opts.resendKey) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Planta y Raiz <contato@plantayraiz.com.br>",
        to: [opts.email],
        subject: EMAIL_SUBJECT,
        html,
      }),
    });
    return {
      ok: r.ok,
      provider: "resend",
      status: r.status,
      error: r.ok ? undefined : (await r.text().catch(() => "")).slice(0, 160),
    };
  }
  return { ok: false, error: "no_brevo_or_resend_key" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let allowed = requireServiceAuth(req, corsHeaders) === null;
  if (!allowed && Deno.env.get("LOVABLE_CRON_SECRET")) {
    allowed = authenticateCronRequest(req) === null;
  }
  if (!allowed) return json({ error: "Unauthorized" }, 401);

  const { offset = 0, limit = 15, dry_run = true } = await req.json().catch(() => ({}));
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: list } = await admin
    .from("doctors_public")
    .select("id,user_id,full_name,is_verified")
    .eq("is_verified", true)
    .order("full_name");

  const docs = (list || []).filter((d) => !WITHDRAWN.includes(norm(d.full_name || "")));
  const slice = docs.slice(offset);
  const max = dry_run ? Math.min(limit, 60) : Math.min(limit, 15);
  let processedCount = 0;
  const brevoKey = Deno.env.get("BREVO_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const out: unknown[] = [];

  for (const d of slice) {
    if (processedCount >= max) break;
    const rawName = (d.full_name || "").trim();
    const name = /^dr/i.test(rawName) ? rawName : `Dr(a). ${rawName}`;

    const [{ data: prof }, { data: au }] = await Promise.all([
      admin.from("profiles").select("phone").eq("id", d.user_id).maybeSingle(),
      admin.auth.admin.getUserById(d.user_id),
    ]);

    const email = au?.user?.email || null;
    const rawPhone = (prof?.phone || "").replace(/\D/g, "");
    const phone =
      rawPhone.length >= 10 && !rawPhone.endsWith(BRISA_GENERIC_PHONE.slice(-9))
        ? rawPhone
        : null;
    const phoneLast4 = phone ? phone.slice(-4) : null;

    if (dry_run) {
      out.push({
        name,
        has_phone: Boolean(phone),
        phone_last4: phoneLast4,
        has_email: Boolean(email),
      });
      processedCount++;
      continue;
    }

    const [{ data: existingNotif }, { data: emailAudit }] = await Promise.all([
      admin
        .from("notifications")
        .select("id")
        .eq("user_id", d.user_id)
        .eq("title", PANEL_TITLE)
        .limit(1)
        .maybeSingle(),
      admin
        .from("audit_log")
        .select("id")
        .eq("action", EMAIL_AUDIT_ACTION)
        .eq("record_id", d.id)
        .limit(1)
        .maybeSingle(),
    ]);

    // 1. WhatsApp: 1 envio em 30 dias por médico (somente se tiver telefone no perfil)
    let wa: { ok: boolean; status?: number; error?: string; skipped?: string } = {
      ok: false,
      error: "no_phone",
    };
    let shouldSendWa = false;
    if (phone) {
      const { data: firstWa } = await admin.rpc("check_edge_rate_limit", {
        p_bucket: WA_RATE_BUCKET,
        p_key: d.id,
        p_max_hits: 1,
        p_window_seconds: 30 * 86400,
      });
      shouldSendWa = firstWa !== false;
      wa = shouldSendWa
        ? await sendWhatsApp(phone, textFor(name)).catch((e) => ({ ok: false, error: String(e) }))
        : { ok: true, skipped: "already_sent" };
    }

    // 2. E-mail via Brevo (com Resend como reserva): 1 envio registrado em audit_log
    const shouldSendEmail = Boolean(email) && !emailAudit;
    let mail: { ok: boolean; provider?: string; status?: number; error?: string; skipped?: string } =
      !email
        ? { ok: false, error: "no_email" }
        : !shouldSendEmail
        ? { ok: true, skipped: "already_sent" }
        : { ok: false, error: "not_attempted" };

    if (email && shouldSendEmail) {
      mail = await sendInviteEmail({
        email,
        name,
        missingPhone: !phone,
        brevoKey,
        resendKey,
      });
      if (mail.ok) {
        await admin
          .from("audit_log")
          .insert({
            user_id: d.user_id,
            action: EMAIL_AUDIT_ACTION,
            table_name: "doctors",
            record_id: d.id,
            new_data: { provider: mail.provider, missing_phone: !phone },
          })
          .then(
            () => null,
            () => null,
          );
      }
    }

    // 3. Aviso no painel: insere somente se ainda não existir com o mesmo título
    let panelInserted = false;
    if (!existingNotif) {
      const { error: notifErr } = await admin.from("notifications").insert({
        user_id: d.user_id,
        title: PANEL_TITLE,
        message: PANEL_MESSAGE,
        type: "info",
        action_url: "/consultorio",
      });
      panelInserted = !notifErr;
    }

    processedCount++;
    out.push({
      name,
      has_phone: Boolean(phone),
      phone_last4: phoneLast4,
      whatsapp: wa.ok,
      wa_skipped: wa.skipped,
      wa_err: wa.error,
      email: mail.ok,
      email_provider: mail.provider,
      email_skipped: mail.skipped,
      mail_err: mail.error,
      panel_notice: existingNotif ? "already_present" : panelInserted ? "inserted" : "failed",
    });

    await new Promise((r) => setTimeout(r, 2500));
  }

  const summary = {
    total_eligible: docs.length,
    offset,
    processed: processedCount,
    dry_run,
    with_phone: (out as Array<{ has_phone?: boolean }>).filter((o) => o.has_phone).length,
    without_phone: (out as Array<{ has_phone?: boolean }>).filter((o) => !o.has_phone).length,
    with_email: dry_run
      ? (out as Array<{ has_email?: boolean }>).filter((o) => o.has_email).length
      : undefined,
  };

  return json({ ...summary, results: out });
});
