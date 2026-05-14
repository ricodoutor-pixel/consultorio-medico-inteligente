import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const MANYCHAT_API = "https://api.manychat.com/fb";

async function mcPost(endpoint: string, body: Record<string, unknown>) {
  const key = Deno.env.get("MANYCHAT_API_KEY");
  if (!key) return null;
  return fetch(`${MANYCHAT_API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

async function findSub(phone: string) {
  const f = phone.startsWith("+") ? phone : phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
  return mcPost("/subscriber/findBySystemField", { field_name: "phone", field_value: f });
}
async function sendMsg(id: string, text: string) {
  return mcPost("/sending/sendContent", { subscriber_id: id, data: { version: "v2", content: { messages: [{ type: "text", text }] } } });
}
async function tagSub(id: string, tag: string) { return mcPost("/subscriber/addTag", { subscriber_id: id, tag_name: tag }); }
async function setField(id: string, f: string, v: string) { return mcPost("/subscriber/setCustomField", { subscriber_id: id, field_name: f, field_value: v }); }

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

/**
 * Doctor Onboarding Automation
 * Triggered by cron or webhook when a new doctor registers.
 * Manages the full onboarding pipeline:
 * 1. Welcome message
 * 2. Document verification notification
 * 3. Training reminder
 * 4. Account activation
 * 5. First patient notification
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const guard = requireServiceAuth(req, corsHeaders);
  if (guard) return guard;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date();
    const results = { welcome: 0, verified: 0, activated: 0, errors: 0 };

    // ── 1. New unverified doctors (registered in last 24h, not yet welcomed)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: newDocs } = await supabase
      .from("doctors")
      .select("id, user_id, crm, crm_state, specialty, is_verified, created_at")
      .eq("is_verified", false)
      .gte("created_at", oneDayAgo);

    for (const doc of newDocs || []) {
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", doc.user_id).single();
        if (!profile?.phone) continue;

        const mc = await findSub(profile.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSub(mc.data.id, "medico"),
            tagSub(mc.data.id, "onboarding_welcome"),
            setField(mc.data.id, "crm", `${doc.crm}/${doc.crm_state}`),
            setField(mc.data.id, "especialidade", doc.specialty),
            sendMsg(mc.data.id,
              `🎉 Bem-vindo(a) à Planta & Raiz, Dr(a). ${profile.full_name}!\n\nSeu CRM ${doc.crm}/${doc.crm_state} está sendo verificado. Em até 24h você estará atendendo!\n\nEnquanto isso, confira o material de treinamento que enviamos ao seu email. 📚`
            ),
          ]);
          results.welcome++;
        }

        // Create welcome notification
        await supabase.from("notifications").insert({
          user_id: doc.user_id,
          title: "Bem-vindo à Planta & Raiz!",
          message: "Seu cadastro está sendo verificado. Você será notificado quando sua conta for ativada.",
          type: "onboarding",
          action_url: "/dashboard-medico",
        });
      } catch (e) { console.error("Welcome error:", e); results.errors++; }
    }

    // ── 2. Recently verified doctors (notify activation)
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const { data: verifiedDocs } = await supabase
      .from("doctors")
      .select("id, user_id, crm, crm_state, is_verified, updated_at")
      .eq("is_verified", true)
      .gte("updated_at", thirtyMinAgo);

    for (const doc of verifiedDocs || []) {
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", doc.user_id).single();
        if (!profile?.phone) continue;

        // Check if already notified
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", doc.user_id)
          .eq("type", "onboarding_verified")
          .maybeSingle();
        if (existing) continue;

        const mc = await findSub(profile.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSub(mc.data.id, "onboarding_docs_approved"),
            tagSub(mc.data.id, "medico_verificado"),
            sendMsg(mc.data.id,
              `✅ Dr(a). ${profile.full_name}, seus documentos foram aprovados!\n\nSua conta está ATIVA. Você já pode receber pacientes!\n\n💡 Dica: Mantenha seu status "Online" para receber consultas automaticamente.\n\n🔗 Acesse: plantayraiz.com.br/dashboard-medico`
            ),
          ]);
          results.verified++;
        }

        await supabase.from("notifications").insert({
          user_id: doc.user_id,
          title: "Conta ativada! 🎉",
          message: "Seus documentos foram aprovados. Você já pode receber pacientes!",
          type: "onboarding_verified",
          action_url: "/dashboard-medico",
        });
      } catch (e) { console.error("Verification notify error:", e); results.errors++; }
    }

    // ── 3. Doctors with first consultation scheduled
    const { data: firstAppts } = await supabase
      .from("appointments")
      .select("doctor_id, id")
      .eq("status", "scheduled")
      .gte("created_at", oneDayAgo);

    const doctorFirstAppt = new Map<string, string>();
    for (const a of firstAppts || []) {
      if (!doctorFirstAppt.has(a.doctor_id)) doctorFirstAppt.set(a.doctor_id, a.id);
    }

    for (const [doctorId] of doctorFirstAppt) {
      try {
        // Check if doctor has previous completed consultations
        const { count } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("doctor_id", doctorId)
          .eq("status", "completed");

        if ((count || 0) > 0) continue; // Not first patient

        const { data: doc } = await supabase.from("doctors").select("user_id").eq("id", doctorId).single();
        if (!doc) continue;

        const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", doc.user_id).single();
        if (!profile?.phone) continue;

        const mc = await findSub(profile.phone);
        if (mc?.status === "success" && mc.data?.id) {
          await Promise.all([
            tagSub(mc.data.id, "primeiro_paciente"),
            sendMsg(mc.data.id,
              `🎊 Dr(a). ${profile.full_name}, seu primeiro paciente está agendado!\n\nPrepare-se para uma consulta incrível. Lembre-se: NPS alto = bônus maiores! 💰\n\n🔗 Acesse: plantayraiz.com.br/dashboard-medico`
            ),
          ]);
          results.activated++;
        }
      } catch (e) { console.error("First patient notify error:", e); results.errors++; }
    }

    console.log("👨‍⚕️ Doctor onboarding results:", results);
    return jsonRes({ success: true, ...results, timestamp: now.toISOString() });
  } catch (error) {
    console.error("Doctor onboarding error:", error);
    return jsonRes({ error: "Internal server error" }, 500);
  }
});
