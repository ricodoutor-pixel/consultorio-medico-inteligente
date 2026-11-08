import { formatPaymentName } from "./payment-catalog.ts";

/** Names from an ownership-checked persisted basket; no medical notes or payer data. */
export function paymentOrderName(items: unknown, fallback: string): string {
  if (!Array.isArray(items)) return formatPaymentName(fallback);
  const names = items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item.product_name ?? item.name ?? item.title ?? item.product?.title;
    return typeof value === "string" && value.trim() ? [value.trim()] : [];
  });
  return formatPaymentName(names.length ? [...new Set(names)].join(" + ") : fallback);
}