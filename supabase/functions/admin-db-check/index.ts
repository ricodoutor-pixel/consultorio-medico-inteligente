import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const envKeys = Object.keys(Deno.env.toObject());
  const dbUrl = Deno.env.get("SUPABASE_DB_URL") ? "EXISTS" : "MISSING";
  return new Response(JSON.stringify({ envKeys, dbUrl }), {
    headers: { "Content-Type": "application/json" },
  });
});
