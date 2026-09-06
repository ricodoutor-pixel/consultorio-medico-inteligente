// 🌿 Planta y Raiz — Single Source of Truth para Modelos Gemini AI nas Edge Functions (2026)
// CORRIGIDO: gemini-1.5-* e gemini-2.0-flash foram DESCONTINUADOS pelo Google
// (confirmado: toda chamada a eles retorna HTTP 404). Migrado para gemini-2.5-*,
// a geracao atual e estavel. Ver: supabase/functions/brisa-bot/index.ts para o
// historico completo desta correcao (identificada e aplicada em brisa-bot
// semanas antes de ser encontrada aqui tambem).

export const GEMINI_PRIMARY_MODEL = "gemini-2.5-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-2.5-pro";

export const GEMINI_MODELS_FALLBACK_CHAIN = [
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
] as const;

export function getGeminiEndpoint(modelName = GEMINI_PRIMARY_MODEL): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
}

/**
 * Executa chamada HTTP à API da Google Gemini com fallback automático em cascata
 * (gemini-2.5-flash -> gemini-2.5-pro) se retornar 404, 429 ou 5xx.
 */
export async function callGeminiApiWithFallback(
  apiKey: string,
  payload: unknown,
  preferredModel = GEMINI_PRIMARY_MODEL
): Promise<{ ok: boolean; status: number; data: any; usedModel: string }> {
  const modelsToTry = Array.from(new Set([preferredModel, ...GEMINI_MODELS_FALLBACK_CHAIN]));

  for (const model of modelsToTry) {
    try {
      const url = `${getGeminiEndpoint(model)}?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return { ok: true, status: res.status, data, usedModel: model };
      }

      console.warn(`⚠️ [Gemini AI] Modelo '${model}' respondeu com HTTP ${res.status}. Tentando modelo de fallback...`, data?.error?.message || '');
    } catch (err: any) {
      console.warn(`⚠️ [Gemini AI] Falha na requisição ao modelo '${model}': ${err.message}. Tentando fallback...`);
    }
  }

  return { ok: false, status: 500, data: null, usedModel: "none" };
}
