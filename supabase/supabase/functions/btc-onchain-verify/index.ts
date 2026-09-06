// Verifica pagamentos Bitcoin on-chain via mempool.space.
// Roda em cron 10 min: pega verificações pendentes, checa endereço,
// marca confirmed quando >=1 confirmação e valor bate.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MEMPOOL = "https://mempool.space/api";
const SATS_PER_BTC = 100_000_000;

async function getReceivedAtAddress(addr: string): Promise<Array<{ txid: string; amount_btc: number; confirmations: number }>> {
  try {
    const [statsR, txsR, tipR] = await Promise.all([
      fetch(`${MEMPOOL}/address/${addr}`),
      fetch(`${MEMPOOL}/address/${addr}/txs`),
      fetch(`${MEMPOOL}/blocks/tip/height`),
    ]);
    if (!txsR.ok || !tipR.ok) return [];
    const txs = await txsR.json();
    const tip = Number(await tipR.text());
    const out: Array<{ txid: string; amount_btc: number; confirmations: number }> = [];
    for (const tx of txs) {
      const received = (tx.vout || [])
        .filter((v: any) => v.scriptpubkey_address === addr)
        .reduce((s: number, v: any) => s + (v.value || 0), 0);
      if (received > 0) {
        const confs = tx.status?.confirmed ? tip - tx.status.block_height + 1 : 0;
        out.push({ txid: tx.txid, amount_btc: received / SATS_PER_BTC, confirmations: confs });
      }
    }
    return out;
  } catch (e) {
    console.error("[btc-verify] mempool err", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: pending } = await supabase
    .from("btc_payment_verifications")
    .select("id, order_id, btc_address, expected_amount_btc, created_at")
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(30);

  const summary: Array<Record<string, unknown>> = [];
  for (const p of pending || []) {
    const txs = await getReceivedAtAddress(p.btc_address);
    const match = txs.find((t) =>
      Math.abs(t.amount_btc - Number(p.expected_amount_btc)) <= Number(p.expected_amount_btc) * 0.02 // 2% tolerância
    );
    if (match && match.confirmations >= 1) {
      await supabase.from("btc_payment_verifications").update({
        tx_hash: match.txid,
        confirmations: match.confirmations,
        confirmed_at: new Date().toISOString(),
        status: "confirmed",
        updated_at: new Date().toISOString(),
      }).eq("id", p.id);
      // Marca order como pago (se houver order_id no orientacao_tecnica_orders)
      if (p.order_id) {
        await supabase.from("orientacao_tecnica_orders")
          .update({ payment_status: "paid", status: "paid" })
          .eq("id", p.order_id);
      }
      summary.push({ id: p.id, status: "confirmed", tx: match.txid });
    } else if (txs.length > 0) {
      await supabase.from("btc_payment_verifications").update({
        status: "mismatch",
        updated_at: new Date().toISOString(),
      }).eq("id", p.id);
      summary.push({ id: p.id, status: "mismatch" });
    } else {
      // expira após 7d
      const ageMs = Date.now() - new Date(p.created_at).getTime();
      if (ageMs > 7 * 24 * 60 * 60 * 1000) {
        await supabase.from("btc_payment_verifications").update({ status: "expired" }).eq("id", p.id);
        summary.push({ id: p.id, status: "expired" });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, checked: pending?.length ?? 0, summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
