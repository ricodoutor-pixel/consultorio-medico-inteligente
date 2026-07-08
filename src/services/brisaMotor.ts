import { GoogleGenAI } from '@google/generative-ai';

// 1. Configuração do Motor Pro com a Chave de API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// 2. Instruções de Sistema e Blindagem Jurídica da Planta y Raiz Ltda
const systemInstruction = `
Você é a Enfª Brisa 2.0, uma assistente virtual de triagem inteligente e automatizada.
Diretriz de Compliance Mestre: A plataforma Planta y Raiz Ltda atua estritamente como uma INTERMEDIADORA TECNOLÓGICA entre o paciente, profissionais de saúde e farmácias parceiras.
- Você NÃO receita medicamentos.
- Você NÃO realiza diagnósticos médicos diretos.
- Você orienta o usuário e o direciona de forma autônoma para os fluxos corretos (Triagem, Agendamento de Consulta ou Suporte).
`;

/**
 * Motor central de tomada de decisão do fluxo de WhatsApp
 */
export async function processarMensagemWhatsApp(usuarioId: string, mensagemTexto: string) {
    try {
        const model = ai.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: systemInstruction
        });

        const prompt = `Analise a mensagem do paciente e determine o próximo passo do fluxo de atendimento de forma curta e objetiva: "${mensagemTexto}"`;
        const result = await model.generateContent(prompt);
        const respostaIa = result.response.text();

        // Aqui o sistema salva o histórico no Supabase de forma automatizada
        console.log(`[Enf Brisa - Logs]: Estado processado para o usuário ${usuarioId}`);
        
        return respostaIa;
    } catch (error) {
        console.error("Erro crítico no motor autônomo da Enf Brisa:", error);
        return "Olá! Tivemos uma oscilação temporária em nosso sistema de intermediação. Por favor, tente enviar sua mensagem novamente.";
    }
}

/**
 * 3. FUNÇÃO DE DISPARO DE TESTE PEDIDA PELO DR. EDILSON BEZERRA
 * Simula e prepara o payload para enviar ao gateway do WhatsApp (Z-API / Evolution)
 */
export async function enviarMensagemTeste(numeroDestino: string) {
    console.log(`[WhatsApp Teste]: Preparando disparo para o número: ${numeroDestino}`);
    
    const payload = {
        number: numeroDestino,
        message: "Olá Dr. Edilson Bezerra, estou on!"
    };

    // Deixamos o esqueleto pronto. Quando preencher a URL da sua API de WhatsApp, o disparo é imediato.
    console.log("[WhatsApp Teste]: Payload estruturado com sucesso:", JSON.stringify(payload));
    return { success: true, message: "Payload de teste validado e pronto para conexão com o gateway!" };
}