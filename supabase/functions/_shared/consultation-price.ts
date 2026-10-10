/** Fixed clinical prices are enforced on the server, never from request amounts. */
export function fixedConsultationPrice(type: string | null): number | null {
  if (type === "video") return 150;
  if (type === "chat") return 100;
  return null;
}