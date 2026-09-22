// 🌿 Planta y Raiz — Convite de consulta com aceite em 1 minuto.
// Regra oficial (2026-09): paciente paga → triagem → consulta.
// O profissional recebe aviso da Enfª Brisa ("pode atender? SIM / NÃO").
// Se responder NÃO ou passar de 60 segundos, a consulta é repassada
// automaticamente ao próximo profissional online com KYC 100% verde.
//
// Ações:
//  - dispatch (service-role): cria o convite para o próximo profissional apto
//  - respond  (link do WhatsApp, autenticado por token): SIM / NÃO
//  - status   (JWT do paciente): estado atual do convite
//  - sweep    (cron/service-role): expira convites vencidos e repassa
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendWhatsAppAlert } from "../_shared/waha.ts";

const SITE = "https://www.plantayraiz.com.br";
const OFFER_SECONDS = 60;

type Pool = {
  doctor_id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_online: boolean;
  kyc_green: boolean;
  specialty: string | null;
};

function svcClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function htmlPage(title: string, body: string, extraHeaders: Record<string, string> = {}) {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#08140d;color:#eafaf0;font-family:system-ui,-apple-system,sans-serif;padding:24px}
.c{max-width:420px;text-align:center;background:#0f2418;border:1px solid #1e5c3a;border-radius:20px;padding:28px}
h1{font-size:20px;margin:0 0 12px}p{font-size:15px;line-height:1.5;color:#b9e6cd;margin:0 0 18px}
a{display:inline-block;background:#1B4332;color:#fff;text-decoration:none;font-weight:800;padding:14px 20px;border-radius:14px}</style>
</head><body><div class="c"><h1>${title}</h1>${body}</div></body></html>`,
    { status: 200, headers: { ...extraHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
}

/** Cria o convite para o próximo profissional apto (ou devolve motivo). */
async function dispatchOffer(
  svc: ReturnType<typeof svcClient>,
  appointmentId: string,
): Promise<{ ok: boolean; reason?: string; doctor?: string; offer_id?: string }> {
  const { data: appt } = await svc
    .from("appointments")
    .select("id, patient_id, doctor_id, type, amount, status, notes")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt) return { ok: false, reason: "appointment_not_found" };
  if (appt.status === "cancelled" || appt.status === "completed") {
    return { ok: false, reason: "appointment_closed" };
  }

  // Já existe convite aceito ou pendente válido?
  const { data: offers } = await svc
    .from("consultation_offers")
    .select("id, doctor_id, status, expires_at, attempt")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });

  const list = offers ?? [];
  if (list.some((o) => o.status === "accepted")) return { ok: false, reason: "already_accepted" };
  const live = list.find(
    (o) => o.status === "pending" && new Date(o.expires_at as string).getTime() > Date.now(),
  );
  if (live) return { ok: true, offer_id: live.id as string, reason: "offer_already_live" };

  const tried = new Set(list.map((o) => String(o.doctor_id)));

  const { data: pool, error: poolErr } = await svc.rpc("consultation_doctor_pool", {
    _specialty: null,
  });
  if (poolErr) {
    console.error("[consultation-offer] pool", poolErr.message);
    return { ok: false, reason: "pool_failed" };
  }

  const candidates = ((pool ?? []) as Pool[]).filter((d) => !tried.has(d.doctor_id));
  // Preferência: escolhido pelo paciente, se ainda não tentado
  const preferred = candidates.find((d) => d.doctor_id === appt.doctor_id);
  const next = preferred ?? candidates[0];
  if (!next) return { ok: false, reason: "no_doctor_available" };

  const token = crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + OFFER_SECONDS * 1000).toISOString();

  const { data: offer, error: offErr } = await svc
    .from("consultation_offers")
    .insert({
      patient_id: appt.patient_id,
      doctor_id: next.doctor_id,
      appointment_id: appt.id,
      consultation_type: String(appt.type ?? "video"),
      amount: Number(appt.amount ?? 0),
      status: "pending",
      expires_at: expiresAt,
      attempt: list.length + 1,
      response_token: token,
      payload: { doctor_user_id: next.user_id, kyc_green: next.kyc_green },
    })
    .select("id")
    .single();

  if (offErr || !offer) {
    console.error("[consultation-offer] insert", offErr?.message);
    return { ok: false, reason: "offer_insert_failed" };
  }

  const base = `${Deno.env.get("SUPABASE_URL")}/functions/v1/consultation-offer?action=respond&offer=${offer.id}&token=${token}`;
  const doctorName = next.full_name ? `Dr(a). ${next.full_name}` : "Doutor(a)";
  const { data: patient } = await svc
    .from("profiles")
    .select("full_name")
    .eq("id", appt.patient_id)
    .maybeSingle();

  const message =
    `🌱 *Planta y Raiz — consulta agora*\n\n` +
    `${doctorName}, você tem uma consulta agora na plataforma Planta y Raiz.\n\n` +
    `*Paciente:* ${patient?.full_name ?? "Paciente"}\n` +
    `*Modalidade:* ${String(appt.type ?? "video")}\n` +
    `*Pagamento:* confirmado\n\n` +
    `*Pode atender?* Você tem 1 minuto para responder:\n` +
    `✅ SIM → ${base}&reply=yes\n` +
    `❌ NÃO → ${base}&reply=no\n\n` +
    `Sem resposta em 1 minuto, a consulta passa automaticamente ao próximo profissional de plantão. — Enfª Brisa 💚`;

  if (next.phone) {
    try {
      await sendWhatsAppAlert(next.phone, message);
    } catch (e) {
      console.error("[consultation-offer] whatsapp", e);
    }
  }

  await svc.from("notifications").insert({
    user_id: next.user_id,
    title: "Consulta agora — pode atender?",
    message: `${patient?.full_name ?? "Paciente"} aguarda. Responda em 1 minuto.`,
    type: "consultation_offer",
    action_url: `/dashboard-medico?offer=${offer.id}`,
  });

  return { ok: true, offer_id: offer.id as string, doctor: next.full_name ?? next.doctor_id };
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const htmlPageCors = (title: string, body: string) => htmlPage(title, body, cors);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const url = new URL(req.url);
  const svc = svcClient();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const isService = bearer === serviceKey ||
    req.headers.get("x-cron-secret") === Deno.env.get("BRISA_CEO_SECRET_KEY");

  let body: Record<string, unknown> = {};
  if (req.method === "POST") body = await req.json().catch(() => ({}));
  const action = String(url.searchParams.get("action") ?? body.action ?? "");

  try {
    // ── Resposta do profissional (link do WhatsApp) ───────────────────────
    if (action === "respond") {
      const offerId = String(url.searchParams.get("offer") ?? body.offer ?? "");
      const token = String(url.searchParams.get("token") ?? body.token ?? "");
      const reply = String(url.searchParams.get("reply") ?? body.reply ?? "").toLowerCase();
      if (!offerId || !token) return htmlPageCors("Link inválido", "<p>Convite não encontrado.</p>");

      const { data: offer } = await svc
        .from("consultation_offers")
        .select("id, doctor_id, appointment_id, status, expires_at, response_token, payload")
        .eq("id", offerId)
        .maybeSingle();

      if (!offer || offer.response_token !== token) {
        return htmlPageCors("Link inválido", "<p>Este convite não é mais válido.</p>");
      }
      if (offer.status !== "pending") {
        return htmlPageCors(
          "Convite encerrado",
          `<p>Esta consulta já foi ${offer.status === "accepted" ? "aceita" : "repassada a outro profissional"}.</p>
           <a href="${SITE}/dashboard-medico">Abrir meu painel</a>`,
        );
      }
      const expired = new Date(offer.expires_at as string).getTime() < Date.now();

      if (reply === "no" || expired) {
        await svc
          .from("consultation_offers")
          .update({
            status: expired ? "expired" : "declined",
            declined_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", offer.id);
        const next = await dispatchOffer(svc, String(offer.appointment_id));
        return htmlPageCors(
          expired ? "Tempo esgotado" : "Consulta repassada",
          `<p>${expired ? "O prazo de 1 minuto expirou." : "Tudo bem, obrigado pela resposta."} ${
            next.ok ? "A consulta foi encaminhada ao próximo profissional de plantão." : "Nossa equipe foi avisada."
          }</p><a href="${SITE}/dashboard-medico">Abrir meu painel</a>`,
        );
      }

      // Aceite
      const { data: accepted } = await svc
        .from("consultation_offers")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", offer.id)
        .eq("status", "pending")
        .select("id, doctor_id, appointment_id")
        .maybeSingle();

      if (!accepted) return htmlPageCors("Convite encerrado", "<p>Esta consulta já foi atribuída.</p>");

      await svc
        .from("appointments")
        .update({ doctor_id: accepted.doctor_id, status: "in_progress" })
        .eq("id", accepted.appointment_id);

      const { data: appt } = await svc
        .from("appointments")
        .select("patient_id, type")
        .eq("id", accepted.appointment_id)
        .maybeSingle();

      if (appt?.patient_id) {
        const patientUrl = appt.type === "chat"
          ? `/consultorio?appointment=${accepted.appointment_id}`
          : `/orientacao-video?appointment=${accepted.appointment_id}`;
        await svc.from("notifications").insert({
          user_id: appt.patient_id,
          title: "Profissional confirmou seu atendimento",
          message: "Entre na sala agora — o profissional já está te aguardando.",
          type: "consultation",
          action_url: patientUrl,
        });
        const { data: pProfile } = await svc
          .from("profiles")
          .select("phone")
          .eq("id", appt.patient_id)
          .maybeSingle();
        if (pProfile?.phone) {
          try {
            await sendWhatsAppAlert(
              pProfile.phone,
              `🌱 *Planta y Raiz*\n\nSeu profissional confirmou o atendimento e já está na sala.\n\nEntre agora: ${SITE}${patientUrl}\n\n— Enfª Brisa 💚`,
            );
          } catch { /* best-effort */ }
        }
      }

      return htmlPageCors(
        "Consulta confirmada ✅",
        `<p>Obrigado! O paciente já foi avisado. Entre no consultório virtual para iniciar o atendimento.</p>
         <a href="${SITE}/consultorio?appointment=${accepted.appointment_id}">Entrar no consultório</a>`,
      );
    }

    // ── Estado do convite (paciente ou serviço) ───────────────────────────
    if (action === "status") {
      const appointmentId = String(url.searchParams.get("appointment") ?? body.appointment_id ?? "");
      if (!appointmentId) return json({ error: "appointment_id obrigatório" }, 400);
      const { data } = await svc
        .from("consultation_offers")
        .select("id, doctor_id, status, expires_at, attempt")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false })
        .limit(5);
      return json({ ok: true, offers: data ?? [] });
    }

    // ── Dispatch e sweep: apenas service-role / cron ──────────────────────
    if (!isService) return json({ error: "Unauthorized" }, 401);

    if (action === "dispatch") {
      const appointmentId = String(body.appointment_id ?? "");
      if (!appointmentId) return json({ error: "appointment_id obrigatório" }, 400);
      const res = await dispatchOffer(svc, appointmentId);
      return json(res);
    }

    if (action === "sweep") {
      const { data: stale } = await svc
        .from("consultation_offers")
        .select("id, appointment_id")
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString())
        .limit(50);

      let reassigned = 0;
      for (const offer of stale ?? []) {
        await svc
          .from("consultation_offers")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", offer.id)
          .eq("status", "pending");
        const next = await dispatchOffer(svc, String(offer.appointment_id));
        if (next.ok) reassigned++;
      }
      return json({ ok: true, expired: stale?.length ?? 0, reassigned });
    }

    return json({ error: "action inválida" }, 400);
  } catch (e) {
    console.error("[consultation-offer]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
