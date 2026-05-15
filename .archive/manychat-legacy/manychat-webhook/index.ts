// 🚫 DEPRECATED — ManyChat integration removed.
// Replaced by Evolution API (WhatsApp). See:
//   - supabase/functions/_shared/evolution.ts
//   - supabase/functions/whatsapp-brisa-bot
//   - supabase/functions/recovery-engine
// This stub remains only to return a clean 410 to any legacy webhook caller.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      error: "deprecated",
      message:
        "ManyChat integration removed. Use Evolution API endpoints (whatsapp-brisa-bot / recovery-engine).",
    }),
    {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
