// check-medical-status — recheck CRM mensalmente via Brasil API.
// Suspende médicos com CRM Inativo/Cancelado e alerta no Discord.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL")
  ?? Deno.env.get("DISCORD_SRE_WEBHOOK_URL");

async function discord(content: string) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("[discord] webhook URL not configured, skipping alert");
    return;
  }
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (e) {
    console.error("[discord]", e);
  }
}

interface BrasilApiCFM {
  nome?: string;
  situacao?: string; // "Ativo", "Inativo", "Cancelado", etc
  especialidade?: string;
  uf?: string;
  crm?: string;
}

async function fetchCRM(crm: string, uf: string): Promise<BrasilApiCFM | null> {
  try {
    const url = `https://brasilapi.com.br/api/cfm/v1/${encodeURIComponent(crm)}/${encodeURIComponent(uf)}`;
    const r = await fetch(url, { headers: { "User-Agent": "PlantaYRaiz-CRM-Guardian/1.0" } });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    console.error("[brasilapi]", crm, uf, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: doctors, error } = await supabase
      .from("doctors")
      .select("id, user_id, crm, crm_state, kyc_status")
      .neq("kyc_status", "suspended");

    if (error) throw error;

    const results: any[] = [];
    let suspendedCount = 0;

    for (const d of doctors ?? []) {
      const info = await fetchCRM(d.crm, d.crm_state);
      const situacao = (info?.situacao ?? "").toLowerCase();
      // Only suspend when API responded AND status matches inactive pattern.
      // If info is null (API timeout/outage), skip to avoid mass-suspending all doctors.
      if (!info) {
        console.warn("[check-medical-status] Brasil API returned null for", d.crm, d.crm_state, "- skipping");
        results.push({ id: d.id, crm: d.crm, uf: d.crm_state, action: "skipped_api_unavailable" });
        continue;
      }
      const isInactive = /inativo|cancelad|suspens|falecid/i.test(situacao);

      if (isInactive) {
        suspendedCount++;
        await supabase
          .from("doctors")
          .update({
            kyc_status: "suspended",
            is_crm_valid: false,
            last_crm_check: new Date().toISOString(),
          })
          .eq("id", d.id);

        // Bloquear emissão de novas receitas: revoga role 'doctor' do user
        await supabase.from("user_roles").delete().eq("user_id", d.user_id).eq("role", "doctor");

        await supabase.from("audit_log").insert({
          user_id: d.user_id,
          action: "auto_suspend_doctor_crm",
          table_name: "doctors",
          record_id: d.id,
          new_data: { crm: d.crm, uf: d.crm_state, situacao: situacao || "not_found", source: "brasil_api" },
        });

        await discord(
          `🔴 **CRITICAL — CRM SUSPENSO**\n` +
          `Médico \`${info?.nome ?? d.user_id}\`\n` +
          `CRM: **${d.crm}/${d.crm_state}** — Situação: **${situacao || "NÃO ENCONTRADO"}**\n` +
          `Status alterado para \`suspended\`. Emissão de receitas BLOQUEADA.`
        );

        results.push({ id: d.id, crm: d.crm, uf: d.crm_state, action: "suspended", situacao });
      } else {
        await supabase
          .from("doctors")
          .update({ is_crm_valid: true, last_crm_check: new Date().toISOString() })
          .eq("id", d.id);
        results.push({ id: d.id, crm: d.crm, uf: d.crm_state, action: "ok", situacao });
      }
    }

    await discord(`🛡️ Guardião de CRM: ${doctors?.length ?? 0} médicos verificados · ${suspendedCount} suspensos.`);

    return new Response(JSON.stringify({ ok: true, checked: doctors?.length ?? 0, suspended: suspendedCount, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[check-medical-status]", e);
    await discord(`⚠️ Guardião de CRM falhou: ${(e as Error).message}`);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
