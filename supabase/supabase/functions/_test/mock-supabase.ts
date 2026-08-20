/**
 * Strongly-typed mock factory for Supabase client used inside edge functions.
 *
 * Goal: garantir que payloads enviados às tabelas (notifications, nps_responses,
 * escrow_transactions, payout_history, revenue_distribution_pool, etc.) tenham
 * shapes corretos — se algum dia o type-check do `createClient` regredir e
 * voltar a tipar tabelas como `never`, este helper falha em compile-time porque
 * os tipos abaixo são checados pelo TS estritamente.
 */

// --- Schemas estritos das colunas que tocamos nos testes -------------------
export interface NotificationInsert {
  user_id: string;
  title: string;
  message: string;
  type: string;
  action_url?: string | null;
}

export interface NpsResponseInsert {
  consultation_id: string;
  patient_id: string;
  professional_id: string;
  score: number;
  category: "detractor" | "passive" | "promoter";
  feedback: string | null;
  sentiment: "positive" | "negative" | "neutral";
}

export interface EscrowTransactionRow {
  id: string;
  status: "held" | "released" | "refunded";
  amount: number;
  platform_fee?: number;
  doctor_payout?: number;
  released_at?: string;
}

export interface RevenuePoolRow {
  id: string;
  month: number;
  year: number;
  total_pool?: number;
  distributed_amount?: number;
  status?: string;
}

// --- Captura de operações --------------------------------------------------
export interface CapturedOp {
  table: string;
  op: "select" | "insert" | "update" | "upsert" | "delete";
  payload?: unknown;
  filters: Array<{ kind: string; col: string; val: unknown }>;
}

export interface MockSupabase {
  ops: CapturedOp[];
  /** Stub de respostas: `${table}:${op}` => data a retornar. */
  stubs: Map<string, { data: unknown; error: unknown | null }>;
  client: SupabaseLike;
}

// Interface mínima do client realmente usada pelas functions
export interface SupabaseLike {
  // deno-lint-ignore no-explicit-any
  from(table: string): any;
  // deno-lint-ignore no-explicit-any
  rpc(name: string, args: Record<string, unknown>): any;
}

function makeBuilder(table: string, ctx: MockSupabase) {
  const op: CapturedOp = { table, op: "select", filters: [] };

  const builder = {
    select(_cols?: string, _opts?: unknown) {
      op.op = op.op === "select" ? "select" : op.op;
      return builder;
    },
    insert(payload: unknown) {
      op.op = "insert";
      op.payload = payload;
      ctx.ops.push(op);
      return builder;
    },
    update(payload: unknown) {
      op.op = "update";
      op.payload = payload;
      return builder;
    },
    upsert(payload: unknown, _opts?: unknown) {
      op.op = "upsert";
      op.payload = payload;
      ctx.ops.push(op);
      return builder;
    },
    delete() {
      op.op = "delete";
      return builder;
    },
    eq(col: string, val: unknown) {
      op.filters.push({ kind: "eq", col, val });
      return builder;
    },
    neq(col: string, val: unknown) { op.filters.push({ kind: "neq", col, val }); return builder; },
    gte(col: string, val: unknown) { op.filters.push({ kind: "gte", col, val }); return builder; },
    lte(col: string, val: unknown) { op.filters.push({ kind: "lte", col, val }); return builder; },
    lt(col: string, val: unknown)  { op.filters.push({ kind: "lt",  col, val }); return builder; },
    in(col: string, val: unknown)  { op.filters.push({ kind: "in",  col, val }); return builder; },
    order() { return builder; },
    limit() { return builder; },
    single() {
      // Push read ops (select/update) at terminal points
      if (op.op === "select" || op.op === "update") ctx.ops.push(op);
      const stub = ctx.stubs.get(`${table}:${op.op}`);
      return Promise.resolve({ data: stub?.data ?? null, error: stub?.error ?? null });
    },
    maybeSingle() {
      if (op.op === "select" || op.op === "update") ctx.ops.push(op);
      const stub = ctx.stubs.get(`${table}:${op.op}`);
      return Promise.resolve({ data: stub?.data ?? null, error: stub?.error ?? null });
    },
    // Awaited directly (sem .single)
    then(resolve: (v: unknown) => void) {
      if (!ctx.ops.includes(op)) ctx.ops.push(op);
      const stub = ctx.stubs.get(`${table}:${op.op}`);
      resolve({ data: stub?.data ?? [], error: stub?.error ?? null });
    },
  };
  return builder;
}

export function createMockSupabase(): MockSupabase {
  const ctx = {
    ops: [] as CapturedOp[],
    stubs: new Map<string, { data: unknown; error: unknown | null }>(),
  } as MockSupabase;

  ctx.client = {
    from(table: string) {
      return makeBuilder(table, ctx);
    },
    rpc(name: string, args: Record<string, unknown>) {
      ctx.ops.push({ table: `rpc:${name}`, op: "insert", payload: args, filters: [] });
      const stub = ctx.stubs.get(`rpc:${name}:insert`);
      return Promise.resolve({ data: stub?.data ?? null, error: stub?.error ?? null });
    },
  };
  return ctx;
}

// Helpers tipados para escrita de stubs (force compile-time check)
export function stubInsert<T>(
  ctx: MockSupabase,
  table: string,
  _shape: T,
  result: { data?: unknown; error?: unknown } = {},
) {
  // _shape exists só para amarrar o T no call site (documentação tipada)
  ctx.stubs.set(`${table}:insert`, { data: result.data ?? null, error: result.error ?? null });
}

export function stubSelectSingle<T>(ctx: MockSupabase, table: string, data: T) {
  ctx.stubs.set(`${table}:select`, { data, error: null });
}
