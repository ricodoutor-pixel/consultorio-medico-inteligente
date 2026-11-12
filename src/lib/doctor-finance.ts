/** Linha mensal devolvida por public.doctor_finance_monthly (migração 0039), mais recente primeiro. */
export interface FinanceMonth {
  month: string;
  released_count: number;
  released_amount: number;
  withdrawn_net: number;
  withdrawn_fee: number;
  withdrawals_pending: number;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-11-01" → "nov/26" (sem fuso: a data já vem no mês de Brasília). */
export function monthLabel(isoDate: string): string {
  const [y, m] = isoDate.slice(0, 7).split("-").map(Number);
  if (!y || !m) return isoDate;
  return `${MONTHS[m - 1]}/${String(y).slice(2)}`;
}

export function financeTotals(rows: FinanceMonth[]) {
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    currentMonth: round(rows[0]?.released_amount ?? 0),
    year: round(rows.reduce((s, r) => s + r.released_amount, 0)),
    consultations: rows.reduce((s, r) => s + r.released_count, 0),
    withdrawn: round(rows.reduce((s, r) => s + r.withdrawn_net, 0)),
  };
}
