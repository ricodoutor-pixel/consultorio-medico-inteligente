// 🌿 Planta y Raiz — Single Source of Truth para Modelos Gemini AI no Frontend (2026)

export const GEMINI_PRIMARY_MODEL = "gemini-3.5-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";

export const GEMINI_MODELS_FALLBACK_CHAIN = [
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  "gemini-2.5-flash",
  "gemini-1.5-flash"
] as const;

export const AI_CONFIG = {
  primaryModel: GEMINI_PRIMARY_MODEL,
  fallbackModel: GEMINI_FALLBACK_MODEL,
  modelsChain: GEMINI_MODELS_FALLBACK_CHAIN,
  defaultTemperature: 0.2,
  maxOutputTokens: 2048,
};
