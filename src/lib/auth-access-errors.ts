export type AccessPortal = "paciente" | "medico" | "farmacia" | "admin";
export type AccessErrorCode = "invalid_credentials" | "email_not_confirmed" | "rate_limited" | "unavailable" | "unknown";

export const ACCESS_UNAVAILABLE = "Estamos com instabilidade no acesso. Tente novamente em alguns minutos ou fale com a equipe pelo WhatsApp (11) 99136-3154.";
export const PASSWORD_RESET_REDIRECT = "https://plantayraiz.com.br/redefinir-senha";
export const PASSWORD_RESET_NOTICE = "Se o e-mail estiver cadastrado, enviamos o link de redefinição.";

export function classifyAccessError(error: unknown): { code: AccessErrorCode; status: number | null; message: string } {
  const e = error && typeof error === "object" ? error as { code?: string; status?: number; name?: string; message?: string } : {};
  const status = typeof e.status === "number" && e.status >= 0 && e.status <= 599 ? e.status : null;
  // Transport failure takes precedence over any misleading response body.
  if (status === 0 || (status !== null && status >= 500) || status === 402 || status === 408 || e.name === "AuthRetryableFetchError" || /fetch|network|connection|timeout|timed out|paused|inacessível/i.test(e.message ?? "")) {
    return { code: "unavailable", status, message: ACCESS_UNAVAILABLE };
  }
  if (e.code === "invalid_credentials" || (status === 400 && e.message === "Invalid login credentials")) {
    return { code: "invalid_credentials", status, message: "E-mail ou senha incorretos." };
  }
  if (e.code === "email_not_confirmed" || e.message === "Email not confirmed") {
    return { code: "email_not_confirmed", status, message: "Verifique seu e-mail antes de fazer login." };
  }
  if (status === 429 || e.code === "over_request_rate_limit" || e.code === "over_email_send_rate_limit") {
    return { code: "rate_limited", status, message: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." };
  }
  return { code: "unknown", status, message: ACCESS_UNAVAILABLE };
}

export async function withAccessTimeout<T>(request: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([request, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject({ name: "AuthRetryableFetchError", status: 408 }), milliseconds);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}