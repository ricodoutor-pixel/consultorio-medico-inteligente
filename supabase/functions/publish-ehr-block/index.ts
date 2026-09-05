// 🔗 publish-ehr-block — registra um bloco clínico imutável no ledger e devolve link verificável
// Body: { patient_id: string, record_type: string, payload: object, reference_id?: string, share_ttl_hours?: number }
// Requer JWT de médico (ou admin). Resposta: { block_id, block_index, block_hash, prev_hash, share_url, expires_at }
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const sha512Hex = async (input: string) => {
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401, cors);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: auth, error: authErr } = await anon.auth.getUser();
    if (authErr || !auth?.user) return json({ error: "Unauthorized" }, 401, cors);
    const uid = auth.user.id;

    const body = await req.json().catch(() => ({}));
    const patientId = typeof body.patient_id === "string" ? body.patient_id : "";
    const recordType = typeof body.record_type === "string" ? body.record_type.trim() : "";
    const payload = body.payload && typeof body.payload === "object" ? body.payload : null;
    const referenceId = typeof body.reference_id === "string" ? body.reference_id : null;
    const ttlHours = Math.min(720, Math.max(1, Number(body.share_ttl_hours ?? 72) || 72));

    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(patientId)) return json({ error: "patient_id inválido." }, 400, cors);
    if (!recordType || recordType.length > 60) return json({ error: "record_type inválido." }, 400, cors);
    if (!payload) return json({ error: "payload obrigatório." }, 400, cors);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Autoriza: médico credenciado OU admin
    const [{ data: doctor }, { data: roles }] = await Promise.all([
      admin.from("doctors").select("id").eq("user_id", uid).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
    ]);

    if (!doctor?.id && !roles) {
      return json({ error: "Apenas médicos credenciados ou administradores podem publicar blocos." }, 403, cors);
    }

    // Encadeamento: hash do último bloco publicado
    const { data: last } = await admin
      .from("clinical_ehr_blocks")
      .select("block_hash, block_index")
      .order("block_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const prevHash = (last as any)?.block_hash ?? "GENESIS";
    const createdAt = new Date().toISOString();
    const canonical = JSON.stringify({
      patient_id: patientId,
      doctor_id: doctor?.id ?? null,
      record_type: recordType,
      reference_id: referenceId,
      payload,
      prev_hash: prevHash,
      created_at: createdAt,
    });
    const blockHash = await sha512Hex(canonical);
    const shareToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().slice(0, 8);
    const expiresAt = new Date(Date.now() + ttlHours * 3600_000).toISOString();

    const { data: inserted, error: insErr } = await admin
      .from("clinical_ehr_blocks")
      .insert({
        patient_id: patientId,
        doctor_id: doctor?.id ?? null,
        record_type: recordType,
        reference_id: referenceId,
        payload,
        prev_hash: prevHash,
        block_hash: blockHash,
        share_token: shareToken,
        share_expires_at: expiresAt,
        created_at: createdAt,
      })
      .select("id, block_index, block_hash, prev_hash, created_at")
      .single();

    if (insErr) {
      console.error("[publish-ehr-block] insert", insErr);
      return json({ error: "Falha ao registrar o bloco clínico." }, 500, cors);
    }

    const origin = req.headers.get("origin") || "https://www.plantayraiz.com.br";

    return json(
      {
        block_id: inserted.id,
        block_index: inserted.block_index,
        block_hash: inserted.block_hash,
        prev_hash: inserted.prev_hash,
        created_at: inserted.created_at,
        share_url: `${origin}/prontuario/bloco/${shareToken}`,
        expires_at: expiresAt,
      },
      200,
      cors,
    );
  } catch (err) {
    console.error("[publish-ehr-block]", err);
    return json({ error: "Erro interno no ledger clínico." }, 500, cors);
  }
});
