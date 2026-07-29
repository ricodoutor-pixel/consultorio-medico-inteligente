import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, fullName, email, country } = await req.json();

    console.log(`[Brisa] Welcome message to ${fullName} (${phone}) - Country: ${country}`);

    // Integração com API da ZAPI / Z-API ou similar
    // Exemplo genérico:
    const waToken = Deno.env.get('WHATSAPP_API_TOKEN');
    const waInstance = Deno.env.get('WHATSAPP_INSTANCE_ID');
    
    if (!waToken || !waInstance) {
      console.warn("WhatsApp credentials not configured.");
    } else {
      const message = country === 'BO' 
        ? `¡Hola Dr(a). ${fullName}! Soy la Enfª Brisa 🩺\n\nHemos recibido su solicitud de registro en Planta & Raíz. Sus documentos están en revisión (Colegio Médico / SEDES). ¡Le avisaremos en breve!`
        : `Olá Dr(a). ${fullName}! Eu sou a Enfª Brisa 🩺\n\nRecebemos seu cadastro na Planta & Raíz. Seus documentos estão em análise pelo nosso time. Avisaremos por aqui assim que o Card Online for liberado!`;

      // Chamada fictícia para ilustrar a API (ex: Z-API)
      /*
      await fetch(`https://api.z-api.io/instances/${waInstance}/token/${waToken}/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      */
    }

    return new Response(
      JSON.stringify({ success: true, message: "Welcome message dispatched" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
