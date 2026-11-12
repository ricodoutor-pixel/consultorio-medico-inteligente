// doctor-flow-briefing — one-off operational briefing to showcase doctors (WhatsApp + email).
// Service-only. Sends at most once per doctor (rate-limit bucket), throttled.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { sendWhatsApp } from "../_shared/evolution.ts";

const SITE = "https://www.plantayraiz.com.br";
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
function htmlFor(name: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1B4332">` +
    esc(textFor(name)).replace(/\*([^*]+)\*/g, "<b>$1</b>").replace(/\n/g, "<br>") +
    `<p style="margin-top:24px"><a href="${SITE}/consultorio" style="background:#1B4332;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Abrir meu Consultório</a></p></div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let allowed = requireServiceAuth(req, corsHeaders) === null;
  if (!allowed && Deno.env.get("LOVABLE_CRON_SECRET")) allowed = authenticateCronRequest(req) === null;
  if (!allowed) return json({ error: "Unauthorized" }, 401);
  const { offset = 0, limit = 10, dry_run = false } = await req.json().catch(() => ({}));
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: list } = await admin.from("doctors_public").select("id,user_id,full_name,is_verified")
    .eq("is_verified", true).order("full_name");
  const docs = (list || []).filter((d) => !WITHDRAWN.includes(norm(d.full_name || "")));
  const slice = docs.slice(offset);
  const max = Math.min(limit, 12);
  let sentCount = 0;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const out: unknown[] = [];

  for (const d of slice) {
    if (sentCount >= max) break;
    const rawName = (d.full_name || "").trim();
    const name = /^dr/i.test(rawName) ? rawName : `Dr(a). ${rawName}`;
    if (dry_run) { out.push({ name }); if (++sentCount >= max) break; continue; }
    const { data: first } = await admin.rpc("check_edge_rate_limit", { p_bucket: "doctor-flow-briefing-v1", p_key: d.id, p_max_hits: 1, p_window_seconds: 7 * 86400 });
    if (first === false) continue;
    sentCount++;
    const { data: prof } = await admin.from("profiles").select("phone").eq("id", d.user_id).maybeSingle();
    const { data: au } = await admin.auth.admin.getUserById(d.user_id);
    const email = au?.user?.email || null;
    const wa = prof?.phone ? await sendWhatsApp(prof.phone, textFor(name)).catch((e) => ({ ok: false, error: String(e) })) : { ok: false, error: "no_phone" };
    let mail: { ok: boolean; status?: number; error?: string } = { ok: false, error: email ? "no_resend_key" : "no_email" };
    if (email && resendKey) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Planta y Raiz <contato@plantayraiz.com.br>", to: [email],
          subject: "Prontidão para consultas reais — como funciona o rodízio e o pagamento", html: htmlFor(name) }),
      });
      mail = { ok: r.ok, status: r.status, error: r.ok ? undefined : (await r.text()).slice(0, 160) };
    }
    await admin.from("notifications").insert({ user_id: d.user_id, title: "Prontidão para consultas reais",
      message: "Ligue o botão ON no Consultório quando estiver disponível. Assinantes online têm prioridade no rodízio.",
      type: "system", action_url: "/consultorio" }).then(() => null, () => null);
    out.push({ name, whatsapp: (wa as any).ok ?? false, wa_err: (wa as any).error, email: mail.ok, mail_err: mail.error });
    await new Promise((r) => setTimeout(r, 2500));
  }
  console.log("briefing batch", JSON.stringify((out as any[]).map((o) => ({ wa: o.whatsapp, wa_err: o.wa_err, email: o.email, mail_err: o.mail_err }))));
  return json({ total: docs.length, offset, sent: out });
});
