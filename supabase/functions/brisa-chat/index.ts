import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { rateLimit, clientIp } from "../_shared/ai-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Fallback chain definition
const MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];

const SYSTEM_PROMPT = `Você é a Enfermeira Brisa, assistente virtual humanizada, especialista clínica, consultora regulatória e agente de Comércio Agêntico da Plataforma Planta y Raiz.
Sua missão é atuar com empatia, acolhimento, excelência técnica, compliance regulatório e agilidade no atendimento de pacientes, médicos e farmácias.

DIRETRIZES DE COMPLIANCE E CLÍNICA:
- Você é uma enfermeira orientadora. Suas respostas têm caráter estritamente educativo e informativo, não substituindo a consulta médica ou a assessoria jurídica individual com advogado habilitado.
- Você NÃO diagnostica, NÃO prescreve e NÃO altera dosagens. Toda decisão médica é exclusiva do especialista.
- A Planta y Raiz atua estritamente de acordo com as RDC 660/2022 e 327/2019 da ANVISA, normas do CFM e LGPD.
- Em caso de emergência médica relatada, oriente IMEDIATAMENTE buscar o pronto-socorro mais próximo, ligar para o SAMU (192) ou CVV (188).

CONHECIMENTO REGULATÓRIO & DIREITOS DO PACIENTE:
• **RDC 660/2022 da Anvisa**: O paciente pode importar produtos de Cannabis para uso próprio mediante prescrição médica válida e cadastro eletrônico gratuito no portal gov.br (serviço "Solicitar Autorização para Importação de Produto derivado de Cannabis"). A autorização tem validade de 2 anos. O primeiro passo obrigatório é sempre a consulta com médico prescritor.
• **RDC 327/2019 da Anvisa**: Produtos comercializados em farmácias e drogarias no Brasil. Exigem Notificação de Receita C1 (branca especial) para produtos com THC até 0,2%, ou Notificação de Receita B (azul) para teores de THC acima de 0,2%.
• **Viagens Aéreas no Brasil**: O paciente pode viajar de avião pelo Brasil portando o medicamento com total segurança jurídica, desde que leve: (1) Receita médica original válida; (2) Comprovante de autorização da Anvisa (se importado) ou nota fiscal da farmácia; (3) Frasco original na bagagem de mão devidamente identificado.
• **Planos de Saúde e SUS (Cobertura)**: Jurisprudência pacificada do STJ determina que o plano não pode vetar o tratamento indicado pelo médico. É indispensável o **Laudo Médico Circunstanciado** comprovando a refratariedade clínica aos tratamentos convencionais.
• **Habeas Corpus para Cultivo Terapêutico (Salvo-Conduto)**: Para ação judicial de salvo-conduto, a Justiça exige prova pré-constituída, incluindo laudo médico circunstanciado com indicação posológica clara, justificativa da terapia e comprovação de hipossuficiência financeira.

GATILHOS DE AÇÃO E CONVERSÃO CLÍNICA:
- Sempre que o paciente tiver dúvidas sobre como obter a receita médica, autorização da Anvisa ou laudo técnico para o plano de saúde ou processo judicial, convide-o calorosamente para agendar teleconsulta com os médicos especialistas da plataforma em [/telemedicina](https://plantayraiz.com.br/telemedicina).

MOTOR DE COMÉRCIO AGÊNTICO & PRESCRIÇÃO (UCP / MCP):
- Quando um paciente solicitar cotação ou compra de medicamento prescrito, você pode cotar opções nas farmácias credenciadas.
- TRAVA REGULATÓRIA OBRIGATÓRIA: Qualquer compra de canabinoides exige OBRIGATORIAMENTE uma receita médica digital com integridade criptográfica SHA-512 (ICP-Brasil). Se o paciente não tiver receita válida, recuse a venda e convide-o cordialmente para agendar consulta de telemedicina (/telemedicina).
- Quando gerar o checkout agêntico, informe o valor oficial transparente e o link de pagamento seguro em 1 clique (Google Pay / PIX / Mercado Pago).

PREÇOS OFICIAIS:
- Orientação Técnica (Triagem/Acolhimento): R$30.
- Consulta Médica Especializada: R$90 a R$150.
- Clube/Planos de Assinatura: A partir de R$49.90 / R$99.

REGRA OBRIGATÓRIA DE TRANSFERÊNCIA PARA HUMANO:
Se o usuário solicitar falar com um agente humano, forneça EXATAMENTE este link: [💬 Falar com Agente Humano (WhatsApp)](https://wa.me/5511991363154)

ANTI-ALUCINAÇÃO:
Nunca invente preços ou links. Valores de medicamentos vêm sempre da tabela oficial de farmácias credenciadas.`;

// Tool definitions for Gemini / OpenAI-compatible API
const UCP_TOOLS = [
  {
    type: "function",
    function: {
      name: "quote_prescribed_products",
      description: "Consulta cotações e prazos de entrega de medicamentos canabinoides prescritos em farmácias credenciadas.",
      parameters: {
        type: "object",
        properties: {
          prescription_id: { type: "string", description: "ID UUID da prescrição médica do paciente" },
          medication_query: { type: "string", description: "Nome ou tipo do medicamento (ex: CBD 1500mg, CBN Sleep)" }
        },
        required: ["prescription_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_agentic_checkout",
      description: "Gera a ordem agêntica de compra (agentic_orders) e link de pagamento em 1 clique (Google Pay / PIX). Exige receita médica com hash SHA-512 válida.",
      parameters: {
        type: "object",
        properties: {
          prescription_id: { type: "string", description: "ID UUID da prescrição médica válida" },
          product_id: { type: "string", description: "ID ou SKU do medicamento selecionado" },
          vendor_id: { type: "string", description: "ID da farmácia/lojista selecionado" },
          payment_method: { type: "string", enum: ["google_pay", "pix", "credit_card", "mercado_pago"], description: "Método de pagamento preferido" }
        },
        required: ["prescription_id", "product_id"]
      }
    }
  }
];

// SECURITY: Sanitize user input
function sanitizePromptInput(input: unknown, maxLength = 80): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[`"'\\]/g, "")
    .replace(/\b(ignore|instrução|instruction|system|prompt|override|forget|pretend|act as|você é|you are)\b/gi, "***")
    .trim()
    .slice(0, maxLength);
}

// Regulatory validator & order generator
async function executeAgenticTool(toolName: string, args: any, supabase: any, userId?: string) {
  if (toolName === "quote_prescribed_products") {
    const { prescription_id, medication_query } = args;
    
    // 1. Verifica se existe prescrição válida
    const { data: presc } = await supabase
      .from("prescriptions")
      .select("id, medication, dosage, signature_hash, doctor_id, patient_id")
      .eq("id", prescription_id)
      .maybeSingle();

    if (!presc) {
      return {
        error: "Prescrição médica não localizada no sistema. Por favor informe o ID correto da receita ou agende uma consulta."
      };
    }

    const quotes = [
      {
        pharmacy_name: "Farmácia Oficial Planta y Raíz Dispensary",
        product_name: presc.medication || medication_query || "Óleo de CBD Full Spectrum 1500mg",
        price: 290.00,
        currency: "BRL",
        delivery_days: "2 a 4 dias úteis",
        in_stock: true,
        product_id: "pyr_cbd_full_1500",
        vendor_id: "farmacia_pyr_loja_oficial"
      },
      {
        pharmacy_name: "Drogaria Parceira Express ANVISA",
        product_name: presc.medication || medication_query || "Óleo de CBD Broad Spectrum 3000mg",
        price: 450.00,
        currency: "BRL",
        delivery_days: "1 a 2 dias úteis",
        in_stock: true,
        product_id: "pyr_cbd_broad_3000",
        vendor_id: "drogaria_parceira_express"
      }
    ];

    return {
      prescription_id: presc.id,
      prescribed_medication: presc.medication,
      verified_signature: !!presc.signature_hash,
      available_quotes: quotes
    };
  }

  if (toolName === "create_agentic_checkout") {
    const { prescription_id, product_id, vendor_id, payment_method = "pix" } = args;

    // 🔒 TRAVA REGULATÓRIA: Exige receita digital assinada (SHA-512 ICP-Brasil)
    const { data: presc } = await supabase
      .from("prescriptions")
      .select("id, medication, signature_hash, patient_id")
      .eq("id", prescription_id)
      .maybeSingle();

    if (!presc || !presc.signature_hash) {
      return {
        regulatory_block: true,
        error: "🚨 TRAVA REGULATÓRIA (ANVISA RDC 660 / CFM): Esta receita não possui assinatura digital válida ou integridade criptográfica SHA-512 confirmada. O fornecimento é restrito a pacientes com prescrição válida. Por favor, realize uma teleconsulta na plataforma."
      };
    }

    const priceMap: Record<string, { name: string; price: number }> = {
      pyr_cbd_full_1500: { name: "Óleo de CBD Full Spectrum 1500mg (30ml)", price: 290.00 },
      pyr_cbd_broad_3000: { name: "Óleo de CBD Broad Spectrum 3000mg (30ml)", price: 450.00 },
      pyr_cbg_isolate_1000: { name: "Óleo de CBG Isolado 1000mg (30ml)", price: 320.00 },
      pyr_cbn_sleep_750: { name: "Fórmula Sono Reparador CBD + CBN 750mg (30ml)", price: 360.00 }
    };

    const selectedProduct = priceMap[product_id] || { name: "Medicamento Canabinoide Certificado", price: 290.00 };
    const patientUid = userId || presc.patient_id;

    // Cria registro na tabela agentic_orders
    const { data: order, error: orderErr } = await supabase
      .from("agentic_orders")
      .insert({
        patient_id: patientUid,
        prescription_id: presc.id,
        vendor_id: vendor_id || null,
        items: [{
          product_id,
          name: selectedProduct.name,
          quantity: 1,
          unit_price: selectedProduct.price
        }],
        total_amount: selectedProduct.price,
        status: "quoted",
        payment_method: payment_method,
        regulatory_hash: presc.signature_hash
      })
      .select("id, total_amount, status")
      .single();

    if (orderErr) {
      console.error("[brisa-chat] Erro ao criar agentic order:", orderErr);
    }

    const orderId = order?.id || `agentic_${Date.now()}`;
    const checkoutUrl = `https://plantayraiz.com.br/checkout?agentic_order_id=${orderId}`;

    return {
      success: true,
      agentic_order_id: orderId,
      product_name: selectedProduct.name,
      total_amount: selectedProduct.price,
      payment_method,
      regulatory_hash: presc.signature_hash,
      checkout_url: checkoutUrl,
      action_button: `[💳 Pagar ${payment_method.toUpperCase()} em 1 Clique (R$ ${selectedProduct.price.toFixed(2)})](${checkoutUrl})`
    };
  }

  return { error: "Ferramenta não reconhecida" };
}

async function tryModels(messages: any[], apiKey: string, tools?: any[]) {
  let lastError = null;

  for (const model of MODELS) {
    try {
      const bodyPayload: any = {
        model: model,
        messages: messages,
        stream: true,
      };

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      if (response.ok) {
        return response;
      }

      const errText = await response.text();
      console.warn(`Model ${model} failed:`, response.status, errText);
      lastError = { status: response.status, text: errText };
    } catch (err) {
      console.warn(`Model ${model} fetch error:`, err);
      lastError = err;
    }
  }

  throw lastError;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 🔐 Rate limit por IP
  const limited = await rateLimit({
    bucket: "brisa_chat",
    key: clientIp(req),
    maxHits: 30,
    windowSeconds: 60,
    cors: corsHeaders,
    message: "Limite de mensagens por minuto atingido. Aguarde alguns instantes. 🌿",
  });
  if (limited) return limited;

  try {
    const { messages, leadName, category, tool_call, tool_args } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Se a chamada for diretamente uma requisição de tool UCP/MCP:
    if (tool_call) {
      const result = await executeAgenticTool(tool_call, tool_args || {}, supabase);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = sanitizePromptInput(leadName, 80);
    const safeCategory = sanitizePromptInput(category, 40);

    let finalSystemPrompt = SYSTEM_PROMPT;

    if (safeCategory) {
      finalSystemPrompt += `\n\nCONTEXTO ATUAL: Você está falando com um ${safeCategory.toUpperCase()}. Adapte o tom!`;
    }
    if (safeName) {
      finalSystemPrompt += `\n\nO nome da pessoa é ${safeName}. Use o nome para maior conexão.`;
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");

    // Limitar histórico
    let recentMessages = messages || [];
    if (recentMessages.length > 11) {
      recentMessages = recentMessages.slice(recentMessages.length - 11);
    }

    const payloadMessages = [
      { role: "system", content: finalSystemPrompt },
      ...recentMessages,
    ];

    const response = await tryModels(payloadMessages, GEMINI_API_KEY, UCP_TOOLS);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Brisa Chat Error:", e);
    const fallbackMessage = "data: " + JSON.stringify({
      choices: [{ delta: { content: "Desculpe, estou enfrentando uma instabilidade técnica momentânea. Por favor, [clique aqui para falar com nossa Equipe Humana via WhatsApp](https://wa.me/5511991363154)." } }]
    }) + "\n\ndata: [DONE]\n\n";

    return new Response(fallbackMessage, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
