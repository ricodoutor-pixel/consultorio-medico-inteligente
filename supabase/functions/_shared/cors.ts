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

export const getCorsHeaders = (req?: Request | null) => {
  const origin = req?.headers?.get("origin") || req?.headers?.get("Origin") || "";
  const isAllowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://plantayraiz.com.br",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
    "Vary": "Origin",
  };
};

// Backward-compat export para preflight estático padrão de produção
export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://plantayraiz.com.br",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  "Vary": "Origin",
};
