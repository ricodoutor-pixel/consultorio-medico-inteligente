import { supabase } from "@/integrations/supabase/client";

export interface TriageLead {
  nome: string;
  email?: string;
  whatsapp: string;
  cidade?: string;
  sintoma?: string;
  intensidade?: number;
  idade?: number;
  peso?: number;
  clinical_score?: number;
  payload?: Record<string, unknown>;
  source?: string;
}

/**
 * Persiste lead da triagem em `pacientes_leads` (RLS admin-only SELECT).
 * Usado pelo QuizTriagem.tsx ao final da Etapa 1.
 */
export async function captureTriageLead(lead: TriageLead) {
  const { error } = await supabase.from("pacientes_leads" as any).insert({
    nome: lead.nome,
    email: lead.email ?? null,
    whatsapp: lead.whatsapp,
    cidade: lead.cidade ?? null,
    sintoma: lead.sintoma ?? null,
    intensidade: lead.intensidade ?? null,
    idade: lead.idade ?? null,
    peso: lead.peso ?? null,
    clinical_score: lead.clinical_score ?? null,
    payload: lead.payload ?? {},
    source: lead.source ?? "quiz_triagem",
  });
  if (error) throw error;
  return { ok: true };
}

/**
 * Score clínico determinístico simples (0-100) usado quando a IA ainda não respondeu.
 * Fórmula: intensidade (0-10)*7 + duração>30d (15) + sintoma alvo (15).
 */
export function computeClinicalScore(opts: {
  intensidade?: number;
  diasSintoma?: number;
  sintomaAlvo?: boolean;
}): number {
  const i = Math.max(0, Math.min(10, opts.intensidade ?? 0));
  let score = i * 7;
  if ((opts.diasSintoma ?? 0) >= 30) score += 15;
  if (opts.sintomaAlvo) score += 15;
  return Math.max(0, Math.min(100, score));
}
