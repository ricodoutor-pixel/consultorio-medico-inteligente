import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

// Cliente sem amarração de schema — evita que tabelas virem `never` no type-check
// quando não existe um Database type gerado para edge functions.
type DB = SupabaseClient<any, "public", any>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// JOB QUEUE — Background Jobs via Supabase (substitui Bull/Redis)
// Planta & Raiz 3.0 — Processamento Assíncrono
// ============================================================================

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;

interface Job {
  id: string;
  queue: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_retries: number;
  error_log: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

async function processNpsJob(supabase: DB, job: Job) {
  const { consultation_id, patient_id } = job.payload as { consultation_id: string; patient_id: string };
  
  // Enviar notificação de NPS ao paciente
  await supabase.from("notifications").insert({
    user_id: patient_id,
    title: "📊 Como foi sua consulta?",
    message: "Avalie sua experiência para melhorarmos nosso atendimento.",
    type: "nps_request",
    action_url: `/nps/${consultation_id}`,
  });

  return { sent: true, consultation_id };
}

async function processRevenueJob(supabase: DB, job: Job) {
  const { escrow_id } = job.payload as { escrow_id: string };
  
  const { data: escrow } = await supabase
    .from("escrow_transactions")
    .select("*")
    .eq("id", escrow_id)
    .single();

  if (!escrow || escrow.status !== "held") {
    return { skipped: true, reason: "Not in held status" };
  }

  // Calcular split
  const platformFee = Math.round(escrow.amount * 0.07 * 100) / 100;
  const doctorPayout = Math.round((escrow.amount - platformFee) * 100) / 100;

  await supabase
    .from("escrow_transactions")
    .update({
      platform_fee: platformFee,
      doctor_payout: doctorPayout,
      status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("id", escrow_id);

  return { processed: true, platformFee, doctorPayout };
}

async function processNotificationJob(supabase: DB, job: Job) {
  const { user_id, title, message, type, action_url } = job.payload as {
    user_id: string; title: string; message: string; type: string; action_url?: string;
  };

  await supabase.from("notifications").insert({
    user_id, title, message, type, action_url: action_url || null,
  });

  return { sent: true };
}

async function processPrescriptionJob(supabase: DB, job: Job) {
  const { prescription_id } = job.payload as { prescription_id: string };

  const { data: rx } = await supabase
    .from("prescriptions")
    .select("*, doctors(*)")
    .eq("id", prescription_id)
    .single();

  if (!rx) return { skipped: true, reason: "Prescription not found" };

  // Notify patient
  await supabase.from("notifications").insert({
    user_id: rx.patient_id,
    title: "💊 Nova Prescrição Disponível",
    message: `Sua prescrição foi emitida. Confira os detalhes.`,
    type: "prescription",
    action_url: `/prescricao/${prescription_id}`,
  });

  return { notified: true, prescription_id };
}

const PROCESSORS: Record<string, (s: DB, j: Job) => Promise<unknown>> = {
  nps_dispatch: processNpsJob,
  revenue_calculator: processRevenueJob,
  notification_sender: processNotificationJob,
  prescription_generator: processPrescriptionJob,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const unauthorized = requireServiceAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  try {
    const supabase: DB = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const action = body.action || "process";

    // ENQUEUE — adicionar job à fila
    if (action === "enqueue") {
      const { queue, payload, delay_seconds } = body;
      
      if (!queue || !PROCESSORS[queue]) {
        return new Response(JSON.stringify({ 
          error: `Invalid queue. Valid: ${Object.keys(PROCESSORS).join(", ")}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const scheduledFor = delay_seconds
        ? new Date(Date.now() + delay_seconds * 1000).toISOString()
        : new Date().toISOString();

      const { data: job, error } = await supabase
        .from("job_queue")
        .insert({
          queue,
          payload,
          status: "pending",
          attempts: 0,
          max_retries: MAX_RETRIES,
          scheduled_for: scheduledFor,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, job_id: job.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PROCESS — processar jobs pendentes (chamado por pg_cron)
    if (action === "process") {
      const { data: pendingJobs } = await supabase
        .from("job_queue")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_for", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(BATCH_SIZE);

      if (!pendingJobs || pendingJobs.length === 0) {
        return new Response(JSON.stringify({ processed: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: Array<{ id: string; status: string; result?: unknown }> = [];

      for (const job of pendingJobs) {
        // Mark as processing
        await supabase
          .from("job_queue")
          .update({ status: "processing", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
          .eq("id", job.id);

        const processor = PROCESSORS[job.queue];
        if (!processor) {
          await supabase.from("job_queue").update({ 
            status: "failed", error_log: "No processor found" 
          }).eq("id", job.id);
          results.push({ id: job.id, status: "failed" });
          continue;
        }

        try {
          const result = await processor(supabase, job as Job);
          await supabase.from("job_queue").update({
            status: "completed",
            completed_at: new Date().toISOString(),
            error_log: null,
          }).eq("id", job.id);
          results.push({ id: job.id, status: "completed", result });
        } catch (err) {
          const attempts = job.attempts + 1;
          const newStatus = attempts >= (job.max_retries || MAX_RETRIES) ? "dead" : "pending";
          
          await supabase.from("job_queue").update({
            status: newStatus,
            error_log: String(err),
          }).eq("id", job.id);
          
          results.push({ id: job.id, status: newStatus });
        }
      }

      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STATS — estatísticas das filas
    if (action === "stats") {
      const statuses = ["pending", "processing", "completed", "failed", "dead"];
      const stats: Record<string, number> = {};

      for (const s of statuses) {
        const { count } = await supabase
          .from("job_queue")
          .select("*", { count: "exact", head: true })
          .eq("status", s);
        stats[s] = count || 0;
      }

      // Dead letter queue
      const { data: deadJobs } = await supabase
        .from("job_queue")
        .select("id, queue, error_log, created_at")
        .eq("status", "dead")
        .order("created_at", { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ stats, deadLetterQueue: deadJobs || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CLEANUP — limpar jobs antigos completados
    if (action === "cleanup") {
      const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { count } = await supabase
        .from("job_queue")
        .delete()
        .eq("status", "completed")
        .lt("completed_at", cutoff);

      return new Response(JSON.stringify({ cleaned: count || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Job queue error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
