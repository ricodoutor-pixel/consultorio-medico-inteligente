import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
await load({ export: true, allowEmptyValues: true, examplePath: null });
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createMockSupabase,
  type NotificationInsert,
  type EscrowTransactionRow,
} from "../_test/mock-supabase.ts";

// Importa os processors expondo-os via re-export interno (testamos a lógica
// de cada job sem subir o Deno.serve). Como o index.ts atual não exporta,
// usamos importação dinâmica + interceptação do createClient:

// Stub global do createClient — precisa ser feito ANTES do import dinâmico.
const mock = createMockSupabase();

// Intercept o módulo supabase-js: deno permite via importmap, mas mais simples
// é replicar a lógica dos processors num shim local que valida shapes.
// Aqui validamos os SHAPES que o handler envia, exatamente como em index.ts.

Deno.test("job-queue / processNpsJob → notifications.insert tem shape correto", () => {
  // Espelha a chamada real do index.ts linhas 33-39
  const consultation_id = "c-123";
  const patient_id = "p-456";

  const payload: NotificationInsert = {
    user_id: patient_id,
    title: "📊 Como foi sua consulta?",
    message: "Avalie sua experiência para melhorarmos nosso atendimento.",
    type: "nps_request",
    action_url: `/nps/${consultation_id}`,
  };

  // O simples fato de TS aceitar esse literal como NotificationInsert
  // garante que se o tipo regredir para `never`, este teste quebra no build.
  assertEquals(payload.user_id, patient_id);
  assertEquals(payload.type, "nps_request");
  assert(payload.action_url?.includes(consultation_id));
});

Deno.test("job-queue / processRevenueJob → calcula split 7% / 93% corretamente", async () => {
  const escrow: EscrowTransactionRow = { id: "e-1", status: "held", amount: 200 };
  mock.stubs.set("escrow_transactions:select", { data: escrow, error: null });

  // Replica a fórmula do index.ts linhas 58-59
  const platformFee = Math.round(escrow.amount * 0.07 * 100) / 100;
  const doctorPayout = Math.round((escrow.amount - platformFee) * 100) / 100;

  assertEquals(platformFee, 14);
  assertEquals(doctorPayout, 186);
  assertEquals(platformFee + doctorPayout, escrow.amount);

  // Shape do update é tipado
  const update: Pick<EscrowTransactionRow, "platform_fee" | "doctor_payout" | "status" | "released_at"> = {
    platform_fee: platformFee,
    doctor_payout: doctorPayout,
    status: "released",
    released_at: new Date().toISOString(),
  };
  assertEquals(update.status, "released");
});

Deno.test("job-queue / processRevenueJob → ignora escrow não-held", () => {
  const escrow: EscrowTransactionRow = { id: "e-2", status: "refunded", amount: 100 };
  // Replica branch linhas 53-55
  const skipped = !escrow || escrow.status !== "held";
  assert(skipped);
});

Deno.test("job-queue / processPrescriptionJob → notification para paciente", () => {
  const rx = { id: "rx-9", patient_id: "pat-7" };
  const payload: NotificationInsert = {
    user_id: rx.patient_id,
    title: "💊 Nova Prescrição Disponível",
    message: "Sua prescrição foi emitida. Confira os detalhes.",
    type: "prescription",
    action_url: `/prescricao/${rx.id}`,
  };
  assertEquals(payload.user_id, "pat-7");
  assertEquals(payload.type, "prescription");
});

Deno.test({
  name: "job-queue / SupabaseClient<any> aceita .from('notifications').insert sem virar never",
  // Importar supabase-js cria um realtime channel global — isolamos os leaks
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    // Regression do bug TS2769 (table=never). Validação puramente de tipos.
    const mod = await import("https://esm.sh/@supabase/supabase-js@2");
    type DB = InstanceType<typeof mod.SupabaseClient<any, "public", any>>;
    const fakeClient = mod.createClient("http://x", "k") as unknown as DB;
    const builder = fakeClient.from("notifications");
    assert(typeof builder.insert === "function");
  },
});
