// CFM Validator — valida CRM via portal público do CFM (gratuito).
// Retorna {valid, name, specialty, status, uf, source}.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function digits(s: string) { return (s || "").replace(/\D/g, ""); }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require an authenticated user — prevents anonymous abuse of the CFM portal proxy.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: u, error: ue } = await userClient.auth.getUser();
  if (ue || !u?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const crm = digits(body.crm ?? url.searchParams.get("crm") ?? "");
    const uf = String(body.uf ?? url.searchParams.get("uf") ?? "").toUpperCase().slice(0, 2);

    if (!crm || !uf || crm.length < 3 || uf.length !== 2) {
      return new Response(JSON.stringify({ error: "crm and uf required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Brasil API (gratuita, sem chave) — endpoint CFM
    const brasilApi = `https://brasilapi.com.br/api/cptec/v1/cidade`; // sentinela; CFM endpoint abaixo
    // CFM oficial via portal (consulta JSON pública)
    const cfmUrl = `https://portal.cfm.org.br/api_rest_php/api/v1/medicos/buscar_medicos`;
    const form = new URLSearchParams({
      crm,
      uf,
      nome: "",
      municipio: "",
      tipoInscricao: "",
      situacao: "",
      especialidade: "",
      areaAtuacao: "",
    });

    let valid = false, name = "", specialty = "", status = "unknown", source = "cfm_portal";
    try {
      const resp = await fetch(cfmUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "PlantaYRaiz/1.0" },
        body: form.toString(),
      });
      if (resp.ok) {
        const j = await resp.json().catch(() => null) as any;
        const med = j?.dados?.[0] ?? j?.[0] ?? null;
        if (med) {
          valid = true;
          name = med.NM_MEDICO || med.nome || "";
          specialty = med.ESPECIALIDADE || med.especialidade || "";
          status = (med.SITUACAO || med.situacao || "").toString();
        }
      }
    } catch (_) { /* fallthrough */ }

    return new Response(JSON.stringify({ valid, crm, uf, name, specialty, status, source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[cfm-validate]", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
