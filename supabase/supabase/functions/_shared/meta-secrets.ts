/**
 * META SECRETS RESOLVER
 * --------------------------------------------------------------
 * Centraliza a leitura dos segredos da Meta (Facebook / Instagram)
 * a partir do Supabase Secrets, mantendo COMPATIBILIDADE com os
 * nomes legados que já estão configurados em produção.
 *
 * Nomes oficiais (produção 2026):
 *   - META_APP_SECRET           → assinatura HMAC X-Hub-Signature-256
 *   - FB_PAGE_ACCESS_TOKEN      → token da Página do Facebook (Messenger + Feed)
 *   - IG_PAGE_ACCESS_TOKEN      → token do Instagram Business (DM + Comments)
 *
 * Fallbacks legados (continuam funcionando até a virada de chave):
 *   - FACEBOOK_APP_SECRET
 *   - FACEBOOK_PAGE_ACCESS_TOKEN
 *   - FACEBOOK_GRAPH_API_TOKEN
 *
 * Para virar a chave em produção basta cadastrar os 3 nomes
 * oficiais em Supabase → Edge Functions → Manage Secrets.
 * Nenhuma alteração de código é necessária depois.
 */

function pick(...names: string[]): string {
  for (const n of names) {
    const v = Deno.env.get(n);
    if (v && v.length > 0) return v;
  }
  return "";
}

export const META_APP_SECRET = pick("META_APP_SECRET", "FACEBOOK_APP_SECRET");
export const FB_PAGE_ACCESS_TOKEN = pick(
  "FB_PAGE_ACCESS_TOKEN",
  "FACEBOOK_PAGE_ACCESS_TOKEN",
  "FACEBOOK_GRAPH_API_TOKEN",
);
export const IG_PAGE_ACCESS_TOKEN = pick(
  "IG_PAGE_ACCESS_TOKEN",
  "INSTAGRAM_PAGE_ACCESS_TOKEN",
  // IG geralmente usa o MESMO token da página vinculada — fallback final
  "FB_PAGE_ACCESS_TOKEN",
  "FACEBOOK_PAGE_ACCESS_TOKEN",
);

export function metaSecretsHealth() {
  return {
    META_APP_SECRET: Boolean(META_APP_SECRET),
    FB_PAGE_ACCESS_TOKEN: Boolean(FB_PAGE_ACCESS_TOKEN),
    IG_PAGE_ACCESS_TOKEN: Boolean(IG_PAGE_ACCESS_TOKEN),
  };
}
