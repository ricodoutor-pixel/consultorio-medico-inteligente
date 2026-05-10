import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")
const EVOLUTION_API_URL = "https://api.plantayraiz.com.br"

serve(async (req) => {
  // 1. Validar API Key no Header
  const apiKey = req.headers.get("apikey")
  if (apiKey !== EVOLUTION_API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const payload = await req.json()
    console.log("Receiving WhatsApp event:", payload)

    // 2. Encaminhar o payload para o agente de triagem clinical-IA
    // Nota: Aqui assumimos que existe uma função ou serviço 'clinical-ia'
    // Para este exemplo, simulamos a chamada ao agente de triagem
    const triageResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/brisa-triage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify(payload)
    })

    const triageData = await triageResponse.json()

    // 3. Retornar a resposta via POST para Evolution API
    if (triageData && triageData.reply) {
      const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_API_KEY!
        },
        body: JSON.stringify({
          number: payload.key.remoteJid,
          text: triageData.reply,
          delay: 1200,
          linkPreview: true
        })
      })
      
      const evolutionData = await evolutionResponse.json()
      console.log("Evolution API response:", evolutionData)
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
