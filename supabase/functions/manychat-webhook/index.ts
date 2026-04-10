import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ManyChat Automation Webhook — Enhanced lead management
 * Handles: lead capture, qualification, follow-up scheduling, conversion tracking
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const action = payload.action || "capture";

    switch (action) {
      // ─── LEAD CAPTURE (default) ───
      case "capture": {
        const { subscriber, data } = payload;

        if (!subscriber?.phone || !subscriber?.name) {
          return new Response(JSON.stringify({ error: "nome e telefone são obrigatórios" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const phone = subscriber.phone.replace(/\D/g, "");
        const nome = subscriber.name.trim();
        const origem = data?.origem || "chat";
        const tags = data?.tags || [];

        // Check if lead already exists
        const { data: existingLead } = await supabase
          .from("leads_contatos")
          .select("id, tags")
          .eq("telefone", phone)
          .maybeSingle();

        if (existingLead) {
          // Update tags if new ones provided
          const mergedTags = [...new Set([...(existingLead.tags || []), ...tags])];
          await supabase
            .from("leads_contatos")
            .update({ tags: mergedTags })
            .eq("id", existingLead.id);

          return new Response(JSON.stringify({
            success: true,
            status: "existing_lead_updated",
            lead_id: existingLead.id,
            nome,
          }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // New lead
        const { data: newLead, error: dbError } = await supabase
          .from("leads_contatos")
          .insert({ nome, telefone: phone, origem, tags })
          .select("id")
          .single();

        if (dbError) {
          console.error("DB insert error:", dbError);
          return new Response(JSON.stringify({ error: "Erro ao salvar lead" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Send welcome via ManyChat if API key available
        const manychatKey = Deno.env.get("MANYCHAT_API_KEY");
        let manychatSent = false;

        if (manychatKey && phone) {
          try {
            // Try to find subscriber on ManyChat
            const searchRes = await fetch(
              `https://api.manychat.com/fb/subscriber/findBySystemField`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${manychatKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  field_name: "phone",
                  field_value: phone.startsWith("55") ? `+${phone}` : `+55${phone}`,
                }),
              }
            );

            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.status === "success" && searchData.data?.id) {
                // Tag the subscriber
                await fetch("https://api.manychat.com/fb/subscriber/addTag", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${manychatKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    subscriber_id: searchData.data.id,
                    tag_name: `lead_${origem}`,
                  }),
                });
                manychatSent = true;
              }
            }
          } catch (mcErr) {
            console.error("ManyChat API error:", mcErr);
          }
        }

        console.log(`📥 New lead captured: ${nome} (${phone}) from ${origem}${manychatSent ? " [ManyChat synced]" : ""}`);

        return new Response(JSON.stringify({
          success: true,
          status: "new_lead",
          lead_id: newLead?.id,
          nome,
          manychat_synced: manychatSent,
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── QUALIFICATION (from ManyChat flow) ───
      case "qualify": {
        const { phone, answers } = payload;
        if (!phone) {
          return new Response(JSON.stringify({ error: "phone obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const cleanPhone = phone.replace(/\D/g, "");
        const { data: lead } = await supabase
          .from("leads_contatos")
          .select("id, tags")
          .eq("telefone", cleanPhone)
          .maybeSingle();

        if (lead) {
          // Score the lead based on answers
          const qualTags = [...(lead.tags || [])];
          let score = 0;

          if (answers?.has_symptoms) { qualTags.push("tem_sintomas"); score += 30; }
          if (answers?.has_prescription) { qualTags.push("tem_receita"); score += 20; }
          if (answers?.interest_level === "high") { qualTags.push("interesse_alto"); score += 30; }
          if (answers?.budget_ok) { qualTags.push("budget_ok"); score += 20; }

          const qualLevel = score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";
          qualTags.push(`qual_${qualLevel}`);

          await supabase
            .from("leads_contatos")
            .update({ tags: [...new Set(qualTags)] })
            .eq("id", lead.id);

          return new Response(JSON.stringify({
            success: true,
            qualification: qualLevel,
            score,
            lead_id: lead.id,
          }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── CONVERSION TRACKING ───
      case "convert": {
        const { phone, conversion_type } = payload;
        if (!phone) {
          return new Response(JSON.stringify({ error: "phone obrigatório" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const cleanPhone = phone.replace(/\D/g, "");
        const { data: lead } = await supabase
          .from("leads_contatos")
          .select("id, tags")
          .eq("telefone", cleanPhone)
          .maybeSingle();

        if (lead) {
          const convTags = [...(lead.tags || []), `converted_${conversion_type || "signup"}`];
          await supabase
            .from("leads_contatos")
            .update({ tags: [...new Set(convTags)] })
            .eq("id", lead.id);

          return new Response(JSON.stringify({
            success: true,
            conversion: conversion_type || "signup",
            lead_id: lead.id,
          }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("ManyChat webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
