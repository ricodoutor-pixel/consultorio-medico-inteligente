import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, nome, telefone, tags, categoria, origem } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "E-mail é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY não configurada");
    }

    // Prepara atributos dinâmicos para a Brevo
    const attributes: Record<string, string> = {};
    
    if (nome) {
      const parts = nome.split(" ");
      attributes.NOME = parts[0];
      attributes.NOME_COMPLETO = nome;
      if (parts.length > 1) {
        attributes.SOBRENOME = parts.slice(1).join(" ");
      }
    }
    
    if (telefone) {
      // Brevo requer formato DDI ex: 5511999999999
      let phoneNum = telefone.replace(/\D/g, "");
      if (phoneNum.length === 10 || phoneNum.length === 11) {
        phoneNum = `55${phoneNum}`; // Assume BR se vier sem DDI
      }
      attributes.SMS = phoneNum;
    }

    if (categoria) attributes.CATEGORIA = categoria;
    if (origem) attributes.ORIGEM = origem;

    // Converte array de tags (ex: ["Origem_Ebook", "novo_cadastro"]) numa string separada por vírgulas, se aplicável, ou atualiza lista na Brevo.
    // Brevo usa Listas, mas também suporta atributos customizados. 
    // Vamos adicionar como um atributo "TAGS" e habilitar update.
    if (tags && Array.isArray(tags)) {
      attributes.TAGS = tags.join(", ");
    }

    const payload = {
      email: email.trim(),
      attributes,
      updateEnabled: true, // Importante: atualiza se o contato já existir
    };

    console.log("Enviando para Brevo:", payload);

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await brevoResponse.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }

    if (!brevoResponse.ok) {
      console.error("Erro na API da Brevo:", responseData);
      return new Response(JSON.stringify({ error: "Erro ao sincronizar com Brevo", details: responseData }), {
        status: brevoResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro interno:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
