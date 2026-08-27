import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

const SB_URL = Deno.env.get('SUPABASE_URL') || '';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WAHA_API_URL = (Deno.env.get('WAHA_API_URL') || 'waha-production-4e9c.up.railway.app').replace(/\/$/, '');
const WAHA_API_KEY = Deno.env.get('WAHA_API_KEY') || 'planta123';
const WAHA_SESSION = Deno.env.get('WAHA_SESSION') || 'default';
const EVOLUTION_API_URL = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'plantayraiz';

const INVITATION_MESSAGE = `Olá Doutor(a)!\n\nSou a Brisa 🌿, assistente virtual e Enfermeira Consultora da clínica digital Planta y Raiz. Estamos ampliando nossa infraestrutura de telemedicina focada em tratamentos com Cannabis Medicinal.\n\nGostaríamos de convidá-lo(a) para conhecer nossa plataforma. Somos uma clínica com infraestrutura completa e comissões automáticas (split).\n\nPara saber mais, acesse: https://plantayraiz.com.br/cadastro-profissional\n\nQualquer dúvida, estou à disposição!`;

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

  // Verifica admin (JWT com role admin) ou service-role key (cron)
  const isAdmin = await isAdminRequest(req);
  const authHeader = req.headers.get("Authorization");
  if (!isAdmin && !(SB_KEY && authHeader === `Bearer ${SB_KEY}`)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
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
      message: "Modo de teste ativo. Nenhuma mensagem em massa foi enviada.",
      systemStatus: "Sistema blindado e pronto para disparo.",
      invitationTemplate: INVITATION_MESSAGE
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // AQUI FICARIA O CÓDIGO DE DISPARO REAL
  // BUSCA MÉDICOS NO BANCO E ENVIA
  
  const supabase = createClient(SB_URL, SB_KEY);
  const { data: doctorsData, error } = await supabase
    .from('doctors')
    .select('user_id, personal_phone')
    .not('personal_phone', 'is', null);

  if (error) {
    console.error("DB Error:", error.message);
  }

  let doctorsList = doctorsData || [];
  
  // Garantir que a primeira mensagem vá para o número do usuário
  doctorsList.unshift({ user_id: 'admin-test', personal_phone: '5511987131241' });
  
  if (doctorsList.length === 1) { // Só tem o número do usuário
    const fallbackPhone = Deno.env.get('VITE_DOCTOR_WHATSAPP_NUMBER') || '5511999999999';
    if (fallbackPhone !== '5511987131241') {
      doctorsList.push({ user_id: 'test-fallback', personal_phone: fallbackPhone });
    }
  }

  let sentCount = 0;
  let errorCount = 0;
  const errors = [];

  // Envio sequencial para não estourar rate limit
  for (const doc of doctorsList) {
    if (!doc.personal_phone) continue;
    const phone = doc.personal_phone.replace(/\D/g, '');
    if (phone.length < 10) continue; // Número inválido
    
    const chatId = phone.includes("@") ? phone : `${phone}@c.us`;

    let result = await sendWAHA(chatId, INVITATION_MESSAGE);
    if (!result.ok) {
      result = await sendEvolution(phone, INVITATION_MESSAGE);
    }
    
    if (result.ok) {
      sentCount++;
    } else {
      errorCount++;
      errors.push({ phone: doc.personal_phone, error: result.error });
    }
    
    // Pequena pausa para evitar flood (Rate Limiting protection)
    await new Promise(r => setTimeout(r, 2000));
  }

  return new Response(JSON.stringify({
    ok: true,
    sentCount,
    errorCount,
    errors
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
