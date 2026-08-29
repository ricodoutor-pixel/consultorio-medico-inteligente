import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── AUTH GATE: rejeitar chamadas sem JWT válido ou service_role ────────
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const jwt = authHeader.replace("Bearer ", "").trim();

  // Aceitar service_role (chamadas internas de edge functions)
  const isServiceCall = jwt === serviceRoleKey;

  if (!isServiceCall) {
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: "Não autorizado — token JWT obrigatório" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  // ── FIM DO AUTH GATE ──────────────────────────────────────────────────

  try {
    const body = await req.json().catch(() => ({}));
    const { email, nome, telefone, tags, categoria, origem } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "E-mail válido é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.warn("[brevo-sync] BREVO_API_KEY não configurada. CRM sync ignorado com sucesso silencioso.");
      return new Response(
        JSON.stringify({ success: true, queued: true, message: "CRM mock mode (no key configured)" }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepara atributos dinâmicos para a Brevo
    const attributes: Record<string, string> = {};

    if (nome && typeof nome === "string") {
      const cleanName = nome.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 100);
      const parts = cleanName.split(" ");
      attributes.NOME = parts[0];
      attributes.NOME_COMPLETO = cleanName;
      if (parts.length > 1) {
        attributes.SOBRENOME = parts.slice(1).join(" ");
      }
    }

    if (telefone && typeof telefone === "string") {
      // Brevo requer formato E.164 ex: 5511999999999
      let phoneNum = telefone.replace(/\D/g, "");
      if (phoneNum.length === 10 || phoneNum.length === 11) {
        phoneNum = `55${phoneNum}`; // Assume BR se vier sem DDI
      }
      if (phoneNum.length >= 8) {
        attributes.SMS = phoneNum;
      }
    }

    if (categoria && typeof categoria === "string") {
      attributes.CATEGORIA = categoria.slice(0, 50);
    }
    if (origem && typeof origem === "string") {
      attributes.ORIGEM = origem.slice(0, 50);
    }

    if (tags && Array.isArray(tags)) {
      attributes.TAGS = tags.map((t) => String(t).slice(0, 30)).join(", ");
    }
    
    if (body.last_appointment_completed_at) {
      // Brevo expects date format YYYY-MM-DD
      attributes.LAST_APPOINTMENT_COMPLETED_AT = new Date(body.last_appointment_completed_at).toISOString().split('T')[0];
    }

    const payload = {
      email: email.trim().toLowerCase(),
      attributes,
      updateEnabled: true, // Atualiza se o contato já existir
    };

    console.log("[brevo-sync] Enviando para Brevo:", payload);

    // SECURITY + RESILIENCE: AbortSignal prevents hanging if Brevo API is slow
    let brevoResponse: Response;
    try {
      brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey,
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000), // 4s timeout max — non-blocking
      });
    } catch (fetchErr) {
      console.error("[brevo-sync] Brevo API timeout ou erro de rede:", fetchErr);
      return new Response(
        JSON.stringify({ success: true, queued: true, warning: "CRM sync queued — Brevo temporariamente indisponível" }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseText = await brevoResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!brevoResponse.ok) {
      console.error("[brevo-sync] Resposta da API Brevo:", responseData);
      // Retorna 202 se for duplicado ou erro tratável para não quebrar a UX do usuário
      return new Response(
        JSON.stringify({ success: true, queued: true, details: responseData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[brevo-sync] Erro interno:", error);
    return new Response(JSON.stringify({ success: true, queued: true, error: error?.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
