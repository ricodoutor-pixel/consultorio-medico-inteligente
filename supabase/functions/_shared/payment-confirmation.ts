export function ownsProviderPayment(payment: Record<string, unknown>, userId: string): boolean {
  const metadata = payment.metadata && typeof payment.metadata === "object"
    ? payment.metadata as Record<string, unknown> : {};
  return [metadata.user_id, metadata.patient_id, metadata.buyer_id].some(id => id === userId);
}

export function confirmedProviderPayment(payment: Record<string, unknown>, userId: string, reference?: string): boolean {
  return ownsProviderPayment(payment, userId) && payment.status === "approved" &&
    (!reference || payment.external_reference === reference);
}