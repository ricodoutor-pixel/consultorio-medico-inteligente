// doctor-call-now — chamada imediata de um médico (WhatsApp + e-mail + aviso no painel).
// Somente chamadas internas (service role / cron secret). Dados do médico lidos no servidor.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";
import { sendWhatsApp } from "../_shared/evolution.ts";

const SITE = "https://www.plantayraiz.com.br";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  let body: { doctor_id?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const doctorId = String(body.doctor_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(doctorId)) return json({ error: "invalid doctor_id" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service);

  const { data: doc } = await admin.from("doctors").select("id,user_id").eq("id", doctorId).maybeSingle();
  if (!doc?.user_id) return json({ error: "doctor_not_found" }, 404);
  const { data: prof } = await admin.from("profiles").select("full_name,phone").eq("id", doc.user_id).maybeSingle();
  const { data: authUser } = await admin.auth.admin.getUserById(doc.user_id);
  const email = authUser?.user?.email || null;

  const rawName = (prof?.full_name || "").trim();
  const name = /^dr/i.test(rawName) ? rawName : `Dr(a). ${rawName}`;
  const deadline = new Date(Date.now() + 5 * 60_000).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit",
  });
  const link = `${SITE}/consultorio?medico=${doctorId}`;
  const text =
    `${name}, o senhor tem uma consulta agora na plataforma Planta y Raiz.\n\n` +
    `⏱️ Prazo: 5 minutos — até ${deadline} (horário de Brasília).\n` +
    `O paciente está passando pela triagem agora.\n\n` +
    `Por favor, entre no seu Consultório Médico e vire o botão ON para atender:\n${link}\n\n` +
    `Responda OK para confirmar. Se não houver resposta até ${deadline}, o atendimento passa para o próximo médico. 🌿`;

  const wa = prof?.phone ? await sendWhatsApp(prof.phone, text) : { ok: false, error: "no_phone" };

  let mail: { ok: boolean; status?: number; error?: string } = { ok: false, error: "no_email" };
  if (email) {
    try {
      const r = await fetch(`${url}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${service}` },
        body: JSON.stringify({
          templateName: "nova-consulta-medico",
          recipientEmail: email,
          idempotencyKey: `doctor-call-now-${doctorId}-${Math.floor(Date.now() / 300000)}`,
          templateData: {
            doctorName: name,
            modality: `Consulta por vídeo — atender até ${deadline} (5 minutos)`,
            consultorioUrl: link,
          },
        }),
      });
      mail = { ok: r.ok, status: r.status, error: r.ok ? undefined : (await r.text()).slice(0, 200) };
    } catch (e) {
      mail = { ok: false, error: String(e) };
    }
  }

  await admin.from("notifications").insert({
    user_id: doc.user_id,
    title: "Consulta agora — prazo de 5 minutos",
    message: `Entre no Consultório e vire o botão ON até ${deadline}.`,
    type: "consultation",
    action_url: "/consultorio",
  }).then(() => null, () => null);

  return json({ doctor_id: doctorId, name, deadline, whatsapp: wa, email: mail });
});
