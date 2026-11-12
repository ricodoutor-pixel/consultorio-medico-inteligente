/** Lê a mensagem de erro devolvida por uma Edge Function (corpo JSON { error }) ou usa o texto padrão. */
export async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const ctx = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = (await ctx.json()) as { error?: unknown } | null;
      if (body && typeof body.error === "string" && body.error.trim()) return body.error;
    } catch {
      /* corpo não é JSON */
    }
  }
  return fallback;
}
