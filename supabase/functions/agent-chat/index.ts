// 🤖 Agent Chat — gateway de conversa com qualquer agente do registry
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY =
  Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
  Deno.env.get("GEMINI_API_KEY") ||
  "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: userRes } = await supa.auth.getUser(jwt);
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: roleRow } = await supa.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });

    const { slug, messages } = await req.json();
    if (!slug || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "slug and messages required" }), { status: 400, headers: corsHeaders });
    }

    const { data: agent } = await supa.from("agent_registry").select("name, system_prompt").eq("slug", slug).maybeSingle();
    if (!agent) return new Response(JSON.stringify({ error: "agent not found" }), { status: 404, headers: corsHeaders });

    let reply = "";
    for (const modelToTry of ["gemini-3.8-flash", "gemini-2.5-flash"]) {
      try {
        const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modelToTry,
            messages: [
              { role: "system", content: agent.system_prompt + "\n\nContexto: você está conversando com o admin (Dr. Edilson) via painel ADM. Responda objetivo, em PT-BR, com sugestões acionáveis." },
              ...messages.slice(-10).map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content ?? "").slice(0, 8000) })),
            ],
          }),
        });

        if (aiRes.ok) {
          const data = await aiRes.json();
          reply = data.choices?.[0]?.message?.content || "";
          if (reply) break;
        } else if (aiRes.status === 429) {
          console.warn(`[agent-chat] Rate limit em ${modelToTry}, tentando fallback...`);
        }
      } catch (err: any) {
        console.warn(`[agent-chat] Erro ao chamar ${modelToTry}:`, err?.message);
      }
    }

    if (!reply) {
      return new Response(JSON.stringify({ error: "ai_generation_failed" }), { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ reply, agent: agent.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
