export function requireCheckoutUrl(data: unknown, error: unknown): string {
  if (error) throw new Error("Não foi possível abrir o pagamento. Tente novamente em instantes.");
  const url = data && typeof data === "object" && "init_point" in data ? data.init_point : null;
  if (typeof url !== "string" || !url.startsWith("https://")) throw new Error("Pagamento indisponível. Sua consulta ainda não foi confirmada.");
  return url;
}