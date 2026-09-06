// SECURITY: Restrict CORS to authorized origins only with dynamic whitelist and preview regex
const ALLOWED_ORIGINS = [
  "https://plantayraiz.com.br",
  "https://www.plantayraiz.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://consultorio-medico-inteligente.lovable.app",
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/.*\.lovable\.app$/,
];

export function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get("Origin") ?? req?.headers.get("origin") ?? "";
  const allowed = isOriginAllowed(origin);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };

  if (allowed) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

// Backward-compat export para preflight estático padrão de produção
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://plantayraiz.com.br",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Vary": "Origin",
};
