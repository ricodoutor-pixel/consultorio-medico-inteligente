import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://tkxxoghzhvhjzdoomgss.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY") || "";

interface RawLeadInput {
  text?: string;
  nome?: string;
  crm?: string;
  uf?: string;
  especialidade?: string;
  email?: string;
  telefone?: string;
  origem?: "instagram_dm" | "instagram_comment" | "facebook" | "linkedin_search" | "b2b_discovery" | "manual";
  canal_username?: string;
  batch?: any[];
}

function sanitizePhone(rawPhone?: string): string {
  if (!rawPhone) return "";
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 || digits.length === 11) {
    digits = "55" + digits;
  }
  if (!digits.startsWith("+")) {
    digits = "+" + digits;
  }
  return digits;
}

function sanitizeUf(rawUf?: string): string {
  if (!rawUf) return "SP";
  const cleaned = rawUf.trim().toUpperCase().replace(/[^A-Z]/g, "");
  return cleaned.slice(0, 2) || "SP";
}

async function extractDoctorWithGemini(rawText: string): Promise<Partial<RawLeadInput>> {
  if (!GEMINI_API_KEY || !rawText) return {};

  const prompt = `Você é o extrator de dados de médicos prescritores da Planta y Raíz.
Analise a mensagem ou dados abaixo e extraia com máxima precisão os dados cadastrais do médico.

Texto:
"${rawText}"

Retorne APENAS um JSON válido (sem blocos de markdown, sem explicações extras) com o seguinte formato:
{
  "nome": "Nome completo do médico (ou Doutor(a) se não informado)",
  "crm": "Apenas dígitos do CRM (ou vazio)",
  "uf": "UF do CRM com 2 letras (ex: SP, PR, RJ)",
  "especialidade": "Especialidade médica detectada ou Medicina Geral / Canabinoide",
  "email": "Email do médico (ou vazio)",
  "telefone": "Telefone com DDD (ou vazio)"
}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    });

    if (!res.ok) return {};
    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = candidateText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.warn("[brisa-lead-hunter] Erro Gemini:", err);
    return {};
  }
}

async function syncWithBrevo(lead: {
  email?: string;
  nome?: string;
  crm?: string;
  uf?: string;
  telefone?: string;
  especialidade?: string;
  origem?: string;
}): Promise<{ ok: boolean; contactId?: string; error?: string }> {
  if (!BREVO_API_KEY || !lead.email || !lead.email.includes("@")) {
    return { ok: false, error: "Sem chave Brevo ou e-mail inválido" };
  }

  try {
    const payload = {
      email: lead.email.trim().toLowerCase(),
      attributes: {
        NOME: lead.nome || "Médico Prescritor",
        CRM: lead.crm || "",
        UF: lead.uf || "SP",
        SMS: sanitizePhone(lead.telefone),
        ESPECIALIDADE: lead.especialidade || "Medicina Canabinoide",
        ORIGEM: lead.origem || "lead_hunter_engine",
      },
      listIds: [4], // ID da Lista de Médicos Prescritores
      updateEnabled: true,
    };

    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 201 || res.status === 204) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, contactId: data.id ? String(data.id) : "brevo_synced" };
    }

    // Se já existir (status 400 com Duplicate), atualizamos
    if (res.status === 400) {
      const errText = await res.text();
      return { ok: true, contactId: "existing_updated" };
    }

    const err = await res.text();
    return { ok: false, error: err };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const body: RawLeadInput = await req.json().catch(() => ({}));
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Suporte a processamento em lote
    const itemsToProcess = Array.isArray(body.batch) && body.batch.length > 0
      ? body.batch
      : [body];

    const results: any[] = [];

    for (const item of itemsToProcess) {
      let nome = item.nome;
      let crm = item.crm;
      let uf = sanitizeUf(item.uf);
      let especialidade = item.especialidade || "Medicina Geral / Canabinoide";
      let email = item.email ? item.email.trim().toLowerCase() : undefined;
      let telefone = sanitizePhone(item.telefone);
      const origem = item.origem || "instagram_dm";
      const canal_username = item.canal_username || "";

      // Se houver texto livre (ex: DM do Instagram), enriquece com Gemini
      if (item.text && (!nome || !crm || !email)) {
        const aiExtracted = await extractDoctorWithGemini(item.text);
        if (aiExtracted.nome && !nome) nome = aiExtracted.nome;
        if (aiExtracted.crm && !crm) crm = aiExtracted.crm;
        if (aiExtracted.uf && (!uf || uf === "SP")) uf = sanitizeUf(aiExtracted.uf);
        if (aiExtracted.especialidade) especialidade = aiExtracted.especialidade;
        if (aiExtracted.email && !email) email = aiExtracted.email.trim().toLowerCase();
        if (aiExtracted.telefone && !telefone) telefone = sanitizePhone(aiExtracted.telefone);
      }

      if (!nome) {
        nome = canal_username ? `Dr(a). @${canal_username}` : "Dr(a). Prescritor(a)";
      }

      // Sincronização com Brevo API v3
      let brevoSynced = false;
      let brevoContactId: string | undefined = undefined;

      if (email && email.includes("@")) {
        const brevoRes = await syncWithBrevo({
          email,
          nome,
          crm,
          uf,
          telefone,
          especialidade,
          origem,
        });
        brevoSynced = brevoRes.ok;
        brevoContactId = brevoRes.contactId;
      }

      // Ingestão no Supabase com proteção contra duplicatas
      const leadRecord = {
        nome,
        crm: crm || null,
        uf: uf || "SP",
        especialidade,
        email: email || null,
        telefone: telefone || null,
        origem,
        canal_username: canal_username || null,
        status_qualificacao: "qualificado",
        brevo_synced: brevoSynced,
        brevo_contact_id: brevoContactId || null,
        raw_payload: item,
      };

      const { data: dbData, error: dbErr } = await supabase
        .from("doctor_leads_hunt")
        .insert(leadRecord)
        .select()
        .single();

      results.push({
        success: !dbErr,
        lead: dbData || leadRecord,
        brevo_synced: brevoSynced,
        error: dbErr?.message,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: results.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[brisa-lead-hunter] Erro geral:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || String(err) }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
