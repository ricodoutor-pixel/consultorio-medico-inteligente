// SECURITY: Restrict CORS to known origins only
// Wildcard (*) allows any site to call our financial endpoints — this fixes that.
const ALLOWED_ORIGINS = [
  "https://plantayraiz.com.br",
  "https://www.plantayraiz.com.br",
  "https://consultorio-medico-inteligente.lovable.app",
];

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get("Origin") ?? req?.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}

// Backward-compat export — funções que já usam corsHeaders como objeto estático
// continuam funcionando, mas agora retornam a origem correta baseada no Origin header.
// ATENÇÃO: este export estático é apenas para OPTIONS preflight sem Request object.
// Para handlers POST, use getCorsHeaders(req) passando o Request.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://plantayraiz.com.br",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Vary": "Origin",
};
