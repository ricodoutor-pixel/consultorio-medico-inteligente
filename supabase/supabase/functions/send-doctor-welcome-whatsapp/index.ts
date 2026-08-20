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
      const message = `Prezado(a) Dr(a). ${fullName},

Seja muito bem-vindo(a) à Planta y Raíz! É uma imensa satisfação ter você conosco como nosso médico(a) sócio(a) prescritor(a). A plataforma foi projetada para eliminar sobrecargas administrativas, garantir segurança jurídica e valorizar o seu tempo clínico.

O Fluxo de Atendimento na Plataforma
• Recepção Acolhedora: O paciente inicia o contato diretamente pelo WhatsApp com a Enfermeira Brisa, sendo recebido de forma humanizada e ágil.
• Triagem Automatizada: Coletamos o histórico de saúde preliminar para que você receba o caso clínico já organizado antes da teleconsulta.
• Pagamento Seguro: O processamento financeiro é transparente e pré-pago.
• Atendimento Clínico Completo: A teleconsulta ocorre em ambiente criptografado, integrado ao prontuário eletrônico e às ferramentas de receituários digitais.

Total Autonomia e Benefícios para Você
• Liberdade de Honorários: Você define o valor da sua consulta de forma 100% autônoma.
• Flexibilidade de Tempo: Você determina o tempo necessário para uma escuta qualificada.
• Seu Link Exclusivo: Você conta com um link direto e personalizado de agendamento para divulgar em suas redes sociais.
• Programa de Indicação: Nosso ecossistema bonifica a sua participação ativa na expansão da rede.

Próximos Passos
Para explorar a plataforma e iniciar seus atendimentos, acesse o botão "Passo a Passo / Manual do Médico" diretamente no menu do seu Consultório Virtual.

Estamos prontos para caminhar juntos!
Enfª Brisa | Marketing Médico & Suporte Clínico
🌿 Planta y Raíz — Inovação, Autonomia e Cuidado Integral`;

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
