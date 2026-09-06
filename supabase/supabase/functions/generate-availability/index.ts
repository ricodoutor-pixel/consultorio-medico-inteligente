import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current + 30 <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += 30;
  }
  return slots;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const _unauth = requireServiceAuth(req, corsHeaders);
  if (_unauth) return _unauth;


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all verified doctors with available_hours
    const { data: doctors, error: docErr } = await supabase
      .from("doctors")
      .select("id, available_hours")
      .eq("is_verified", true);

    if (docErr) throw docErr;

    let totalCreated = 0;
    const today = new Date();

    for (const doc of doctors || []) {
      const hours = doc.available_hours as Record<string, string[]> | null;
      if (!hours) continue;

      // Generate slots for next 30 days
      for (let d = 0; d < 30; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        const dayOfWeek = date.getDay();
        const dateStr = date.toISOString().split("T")[0];

        // Find matching day key
        const dayKey = Object.keys(DAY_MAP).find((k) => DAY_MAP[k] === dayOfWeek);
        if (!dayKey || !hours[dayKey]) continue;

        const timeRanges = hours[dayKey];
        const allSlots: string[] = [];

        for (const range of timeRanges) {
          const [start, end] = range.split("-");
          allSlots.push(...generateSlots(start, end));
        }

        if (allSlots.length === 0) continue;

        // Check existing slots for this doctor+date
        const { data: existing } = await supabase
          .from("doctor_availability")
          .select("time_slot, status")
          .eq("doctor_id", doc.id)
          .eq("slot_date", dateStr);

        const existingMap = new Map(
          (existing || []).map((e) => [e.time_slot, e.status])
        );

        // Only insert slots that don't exist or are not booked/reserved
        const toInsert = allSlots
          .filter((slot) => {
            const status = existingMap.get(slot);
            return !status || (status !== "booked" && status !== "reserved");
          })
          .map((slot) => ({
            doctor_id: doc.id,
            slot_date: dateStr,
            time_slot: slot,
            status: "available",
          }));

        if (toInsert.length > 0) {
          // Upsert: if slot already exists as 'available', update it; skip booked/reserved
          const { error: insertErr } = await supabase
            .from("doctor_availability")
            .upsert(toInsert, {
              onConflict: "doctor_id,slot_date,time_slot",
              ignoreDuplicates: true,
            });

          if (!insertErr) totalCreated += toInsert.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, slots_created: totalCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate availability error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
