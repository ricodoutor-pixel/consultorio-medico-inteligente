// 🌿 Planta y Raiz — Single Source of Truth para Modelos Gemini AI nas Edge Functions (2026)

export const GEMINI_PRIMARY_MODEL = "gemini-3.5-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";

export const GEMINI_MODELS_FALLBACK_CHAIN = [
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  "gemini-2.5-flash",
  "gemini-1.5-flash"
] as const;

export function getGeminiEndpoint(modelName = GEMINI_PRIMARY_MODEL): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
}

/**
 * Executa chamada HTTP à API da Google Gemini com fallback automático em cascata
 * (gemini-3.5-flash -> gemini-3.1-flash-lite -> gemini-2.5-flash) se retornar 404, 429 ou 5xx.
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
