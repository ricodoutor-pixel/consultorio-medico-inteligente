// Link temporário (10 min) para o PDF assinado da receita.
// Só o paciente da receita ou o médico que a emitiu recebem o link; o bucket `prescriptions` é privado.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getCallerUserId } from "../_shared/admin-auth.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const userId = await getCallerUserId(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const prescriptionId = String(body?.prescriptionId ?? "");
  if (!UUID.test(prescriptionId)) return json({ error: "prescriptionId inválido" }, 400);

  const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: rx } = await svc
    .from("prescriptions")
    .select("id, patient_id, doctor_id, status, signed_pdf_path")
    .eq("id", prescriptionId)
    .maybeSingle();
  if (!rx) return json({ error: "Receita não encontrada" }, 404);

  let allowed = rx.patient_id === userId;
  if (!allowed) {
    const { data: doc } = await svc.from("doctors").select("user_id").eq("id", rx.doctor_id).maybeSingle();
    allowed = doc?.user_id === userId;
  }
  if (!allowed) return json({ error: "Esta receita não pertence a você" }, 403);
  if (rx.status !== "signed" || !rx.signed_pdf_path) return json({ error: "Receita ainda não assinada" }, 409);

  const { data, error } = await svc.storage.from("prescriptions").createSignedUrl(rx.signed_pdf_path, 600, {
    download: `receita-planta-y-raiz-${rx.id.slice(0, 8)}.pdf`,
  });
  if (error || !data?.signedUrl) return json({ error: "Falha ao gerar o link" }, 500);
  return json({ ok: true, url: data.signedUrl, expiresIn: 600 });
});
