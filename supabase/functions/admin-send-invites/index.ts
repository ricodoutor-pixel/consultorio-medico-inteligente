import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { T } from "../_shared/brisa-templates.mjs";
import {
  hasConfirmedCrm,
  isBusinessHoursBRT,
  isCompanyOrNonDoctorContact,
} from "../_shared/whatsapp-outreach-guard.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WAHA_API_URL = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = Deno.env.get('WAHA_API_KEY') || '';
const WAHA_SESSION = Deno.env.get('WAHA_SESSION') || 'default';
const EVOLUTION_API_URL = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz';

async function isAdminRequest(req: Request): Promise<boolean> {
  if (!SB_URL || !SB_KEY) return false;
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token === SB_KEY) return false;

  try {
    const supabase = createClient(SB_URL, SB_KEY);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userError || !userId) return false;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    return !error && data?.role === "admin";
  } catch (e) {
    console.error("[admin-send-invites] admin auth check failed:", e);
    return false;
  }
}

async function sendWAHA(chatId: string, text: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const base = WAHA_API_URL.startsWith('http') ? WAHA_API_URL : `https://${WAHA_API_URL}`;
    const r = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
      body: JSON.stringify({ session: WAHA_SESSION, chatId, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      const body = await r.text();
      return { ok: false, status: r.status, error: body.slice(0, 300) };
    }
    return { ok: r.ok, status: r.status };
  } catch (e: unknown) {
    const err = e as Error;
    return { ok: false, error: err?.message ?? String(e) };
  }
}

async function sendEvolution(phone: string, text: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return { ok: false, error: 'evolution_not_configured' };
  }
  try {
    const base = EVOLUTION_API_URL.startsWith('http') ? EVOLUTION_API_URL : `https://${EVOLUTION_API_URL}`;
    const inst = encodeURIComponent(EVOLUTION_INSTANCE);
    const r = await fetch(`${base}/message/sendText/${inst}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: phone, text, options: { delay: 1200, presence: 'composing' } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      const body = await r.text();
      return { ok: false, status: r.status, error: body.slice(0, 300) };
    }
    return { ok: r.ok, status: r.status };
  } catch (e: unknown) {
    const err = e as Error;
    return { ok: false, error: err?.message ?? String(e) };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Convite a médicos: SOMENTE disparo manual autenticado de administrador
  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'unauthorized_admin_manual_only' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const testOnly = Boolean(body?.testOnly ?? true);

  if (testOnly) {
    return new Response(JSON.stringify({
      ok: true,
      message: "Modo de teste ativo. Nenhuma mensagem foi enviada.",
      businessHoursBRT: isBusinessHoursBRT(),
      invitationTemplate: T.doctorInvite("Exemplo", { crmConfirmed: true }),
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Trava estrita de horário comercial: Seg–Sáb, 09h–19h BRT
  if (!isBusinessHoursBRT()) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'outside_business_hours_brt',
      message: 'Envio bloqueado fora do horário comercial (Seg–Sáb, 09h–19h BRT).',
    }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(SB_URL, SB_KEY);
  const { data: doctorsData, error } = await supabase
    .from('doctors')
    .select('user_id, personal_phone, crm, crm_state, council_type, specialty, profiles:user_id(full_name, email)')
    .not('personal_phone', 'is', null);

  if (error) {
    console.error("DB Error:", error.message);
  }

  const doctorsList = doctorsData || [];

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors: Array<{ phone: string; error?: string }> = [];

  for (const doc of doctorsList) {
    if (!isBusinessHoursBRT()) break;
    if (!doc.personal_phone) continue;

    const prof = (doc as { profiles?: { full_name?: string; email?: string } | null }).profiles;
    const fullName = String(prof?.full_name || '').trim();
    const email = String(prof?.email || '').trim();

    // Bloqueia PJ/empresas/não-médicos e exige CRM confirmado
    if (
      isCompanyOrNonDoctorContact({
        name: fullName,
        email,
        specialty: doc.specialty || '',
        crm: doc.crm || '',
        councilType: doc.council_type || '',
      }).blocked ||
      !hasConfirmedCrm(doc.crm || '', doc.crm_state || '', doc.council_type || '')
    ) {
      skippedCount++;
      continue;
    }

    const message = T.doctorInvite(fullName, {
      crm: doc.crm || '',
      crmState: doc.crm_state || '',
      councilType: doc.council_type || '',
      email,
      specialty: doc.specialty || '',
    });
    if (!message) {
      skippedCount++;
      continue;
    }

    const phone = String(doc.personal_phone).replace(/\D/g, '');
    if (phone.length < 10) continue;

    const chatId = phone.includes("@") ? phone : `${phone}@c.us`;
    let result = await sendWAHA(chatId, message);
    if (!result.ok) {
      result = await sendEvolution(phone, message);
    }

    if (result.ok) {
      sentCount++;
    } else {
      errorCount++;
      errors.push({ phone: doc.personal_phone, error: result.error });
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return new Response(JSON.stringify({
    ok: true,
    sentCount,
    skippedCount,
    errorCount,
    errors,
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
