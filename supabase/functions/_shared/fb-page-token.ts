/**
 * Resolve the correct Facebook PAGE access token.
 *
 * The secret FACEBOOK_PAGE_ACCESS_TOKEN may have been saved as a USER token
 * by mistake. In that case posts to /{pageId}/feed will fail or land in the
 * user's personal feed instead of the Page. This helper transparently swaps
 * a USER token for the matching PAGE token via /me/accounts and caches it
 * in-memory for the lifetime of the isolate.
 *
 * Required permissions on the underlying user token for this to work:
 *   - pages_show_list
 *   - pages_manage_posts   (to publish on the Page feed)
 *   - pages_read_engagement
 *   - instagram_basic + instagram_content_publish (for IG publishing)
 */
const GRAPH = "https://graph.facebook.com/v19.0";

let cached: { pageId: string; token: string; ts: number } | null = null;

export async function getFacebookPageToken(pageId: string): Promise<string> {
  const rawToken =
    Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") ||
    Deno.env.get("FACEBOOK_GRAPH_API_TOKEN") ||
    "";
  if (!rawToken) throw new Error("FB token not configured");

  // Use cached page token for 30 minutes
  if (cached && cached.pageId === pageId && Date.now() - cached.ts < 30 * 60 * 1000) {
    return cached.token;
  }

  // 1) Inspect token type
  try {
    const dbg = await fetch(
      `${GRAPH}/debug_token?input_token=${rawToken}&access_token=${rawToken}`,
    ).then((r) => r.json());
    const type = dbg?.data?.type;
    // Already a PAGE token → return as-is
    if (type === "PAGE") {
      cached = { pageId, token: rawToken, ts: Date.now() };
      return rawToken;
    }
  } catch {
    // fall through and try /me/accounts anyway
  }

  // 2) USER token → fetch matching Page token from /me/accounts
  const accountsRes = await fetch(
    `${GRAPH}/me/accounts?access_token=${rawToken}`,
  ).then((r) => r.json());
  const page = accountsRes?.data?.find((p: { id: string }) => p.id === pageId);
  if (!page?.access_token) {
    throw new Error(
      `Could not derive Page token for ${pageId}. Token type is USER and either ` +
        `/me/accounts did not return this Page or pages_show_list is missing.`,
    );
  }
  cached = { pageId, token: page.access_token, ts: Date.now() };
  return page.access_token;
}
