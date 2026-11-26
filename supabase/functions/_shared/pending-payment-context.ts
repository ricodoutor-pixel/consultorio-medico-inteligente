// Server-side verification of real pending payment/order context for a specific WhatsApp contact.
// Fail-closed: returns false whenever phone is missing/invalid, contact has no recent pending charge,
// or database queries fail. Prevents false payment classification for unrelated contacts/companies.

const PENDING_ORDER_STATUSES = ['pending', 'awaiting_payment', 'in_process'];
const DEFAULT_LOOKBACK_HOURS = 72;

export function buildPhoneVariants(rawPhone = ''): string[] {
  const digits = String(rawPhone || '').split('@')[0].replace(/\D/g, '');
  if (digits.length < 10) return [];

  const variants = new Set<string>();
  const addVariant = (v: string) => {
    if (v && v.length >= 10) variants.add(v);
  };

  addVariant(digits);
  if (digits.startsWith('55')) {
    const local = digits.slice(2);
    addVariant(local);
    if (local.length === 11 && local[2] === '9') {
      const noNine = local.slice(0, 2) + local.slice(3);
      addVariant(noNine);
      addVariant('55' + noNine);
    } else if (local.length === 10) {
      const withNine = local.slice(0, 2) + '9' + local.slice(2);
      addVariant(withNine);
      addVariant('55' + withNine);
    }
  } else {
    addVariant('55' + digits);
    if (digits.length === 11 && digits[2] === '9') {
      const noNine = digits.slice(0, 2) + digits.slice(3);
      addVariant(noNine);
      addVariant('55' + noNine);
    } else if (digits.length === 10) {
      const withNine = digits.slice(0, 2) + '9' + digits.slice(2);
      addVariant(withNine);
      addVariant('55' + withNine);
    }
  }

  return Array.from(variants);
}

/**
 * Checks if this exact WhatsApp phone has an active pending payment/charge in the last 72h across:
 * 1. orientacao_tecnica_orders (pending/awaiting_payment/in_process or flow_status='aguardando_pagamento', paid_at is null)
 * 2. brisa_orientacao_payments (pending/awaiting_payment/in_process)
 * 3. appointments (via profiles.phone -> patient_id, payment_status pending/awaiting_payment/in_process)
 */
export async function hasPendingPaymentForPhone(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  rawPhone: string,
  lookbackHours = DEFAULT_LOOKBACK_HOURS,
): Promise<{ hasPendingPayment: boolean; source: string | null }> {
  try {
    if (!supabase || !rawPhone) return { hasPendingPayment: false, source: null };
    const variants = buildPhoneVariants(rawPhone);
    if (variants.length === 0) return { hasPendingPayment: false, source: null };

    const cutoffIso = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

    // 1. Check orientacao_tecnica_orders directly by patient_whatsapp
    try {
      const { data: otOrders } = await supabase
        .from('orientacao_tecnica_orders')
        .select('id, status, flow_status, paid_at')
        .in('patient_whatsapp', variants)
        .is('paid_at', null)
        .gte('created_at', cutoffIso)
        .limit(5);

      if (
        Array.isArray(otOrders) &&
        otOrders.some(
          (row: { status?: string; flow_status?: string; paid_at?: string | null }) =>
            !row.paid_at &&
            (PENDING_ORDER_STATUSES.includes(String(row.status || '').toLowerCase()) ||
              String(row.flow_status || '').toLowerCase() === 'aguardando_pagamento'),
        )
      ) {
        return { hasPendingPayment: true, source: 'orientacao_tecnica_orders' };
      }
    } catch {
      // Fail-closed: continue checking other tables
    }

    // 2. Check brisa_orientacao_payments directly by patient_phone
    try {
      const { data: brisaPayments } = await supabase
        .from('brisa_orientacao_payments')
        .select('id, status')
        .in('patient_phone', variants)
        .in('status', PENDING_ORDER_STATUSES)
        .gte('created_at', cutoffIso)
        .limit(3);

      if (Array.isArray(brisaPayments) && brisaPayments.length > 0) {
        return { hasPendingPayment: true, source: 'brisa_orientacao_payments' };
      }
    } catch {
      // Fail-closed
    }

    // 3. Resolve profile(s) matching exact phone digits (tail 8-digit filter + strict variant verification)
    try {
      const tail8 = variants[0].slice(-8);
      if (tail8.length === 8) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, phone')
          .ilike('phone', `%${tail8}%`)
          .limit(10);

        const variantSet = new Set(variants);
        const matchedProfileIds = (profiles || [])
          .filter((p: { id?: string; phone?: string | null }) => {
            const pDigits = String(p.phone || '').replace(/\D/g, '');
            return pDigits.length >= 10 && variantSet.has(pDigits);
          })
          .map((p: { id: string }) => p.id);

        if (matchedProfileIds.length > 0) {
          // 3a. Pending orientacao_tecnica_orders by user_id
          const { data: userOtOrders } = await supabase
            .from('orientacao_tecnica_orders')
            .select('id, status, flow_status, paid_at')
            .in('user_id', matchedProfileIds)
            .is('paid_at', null)
            .gte('created_at', cutoffIso)
            .limit(5);

          if (
            Array.isArray(userOtOrders) &&
            userOtOrders.some(
              (row: { status?: string; flow_status?: string; paid_at?: string | null }) =>
                !row.paid_at &&
                (PENDING_ORDER_STATUSES.includes(String(row.status || '').toLowerCase()) ||
                  String(row.flow_status || '').toLowerCase() === 'aguardando_pagamento'),
            )
          ) {
            return { hasPendingPayment: true, source: 'orientacao_tecnica_orders_user' };
          }

          // 3b. Pending appointments by patient_id
          const { data: pendingAppts } = await supabase
            .from('appointments')
            .select('id, status, payment_status')
            .in('patient_id', matchedProfileIds)
            .in('payment_status', PENDING_ORDER_STATUSES)
            .gte('created_at', cutoffIso)
            .limit(5);

          if (
            Array.isArray(pendingAppts) &&
            pendingAppts.some(
              (a: { status?: string }) =>
                !['cancelled', 'canceled', 'completed'].includes(String(a.status || '').toLowerCase()),
            )
          ) {
            return { hasPendingPayment: true, source: 'appointments' };
          }
        }
      }
    } catch {
      // Fail-closed
    }

    return { hasPendingPayment: false, source: null };
  } catch {
    return { hasPendingPayment: false, source: null };
  }
}
