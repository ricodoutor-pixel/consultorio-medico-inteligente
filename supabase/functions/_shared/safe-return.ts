// Exact-origin allowlist for payment return URLs (prevents lookalike/open redirects).
export const RETURN_ORIGINS = [
  "https://plantayraiz.com.br",
  "https://www.plantayraiz.com.br",
  "https://consultorio-medico-inteligente.lovable.app",
  "http://localhost:8080",
];
const PREVIEW = /^https:\/\/[a-z0-9-]+\.lovable\.app$/;
export function safeOrigin(o: string | null | undefined, fallback = "https://www.plantayraiz.com.br"): string {
  try {
    const u = new URL(String(o || ""));
    if (RETURN_ORIGINS.includes(u.origin) || PREVIEW.test(u.origin)) return u.origin;
  } catch { /* ignore */ }
  return fallback;
}
export function safeReturnUrl(url: unknown, fallback: string): string {
  if (typeof url !== "string") return fallback;
  try {
    const u = new URL(url);
    if (RETURN_ORIGINS.includes(u.origin) || PREVIEW.test(u.origin)) return u.toString();
  } catch { /* ignore */ }
  return fallback;
}
