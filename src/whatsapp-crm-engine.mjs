import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const WAHA_API_URL = process.env.WAHA_API_URL || 'http://localhost:3000';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash',
  systemInstruction: `Você é a Enfermeira Brisa, IA assistente e recrutadora da plataforma de telemedicina Planta y Raíz.
Sua missão é conversar com médicos que receberam nosso convite, quebrar objeções sobre medicina canabinoide e telemedicina, explicar nossos diferenciais (taxa de apenas 7%, repasse instantâneo via PIX, robô de IA no prontuário, plataforma robusta e gratuita) e guiá-los até o link de cadastro: https://plantayraiz.com.br.
Seja amigável, profissional e persuasiva. Responda de forma concisa.`
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const INVITE_MESSAGE = `Assunto: Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz | A Revolução da Medicina Canabinoide

Prezado(a) Doutor(a),

A medicina canabinoide no Brasil vive uma expansão sem precedentes. No entanto, sabemos que a grande maioria das plataformas tradicionais de telemedicina sufoca a autonomia médica com taxas comissionais abusivas, repasses demorados e ferramentas tecnológicas ultrapassadas.

É com grande honra que convidamos você para se tornar Médico Sócio Prescritor na Planta y Raíz — oficialmente desenvolvida para ser a melhor, mais rentável e mais completa plataforma de telemedicina canabinoide do planeta.

🏆 Planta y Raíz vs. Mercado Tradicional
Compilamos os nossos diferenciais para demonstrar por que a nossa plataforma é incomparável:
- Taxa da Plataforma: Apenas 7% (você retém 93%)
- Repasse Financeiro: PIX Instantâneo ao término da consulta
- Preço da Consulta: Total Liberdade para cobrar o valor que desejar
- Custo de Adesão: Cadastro 100% Gratuito

"Não seja apenas mais um médico cadastrado em plataformas que valorizam apenas a própria margem. Seja sócio da plataforma que valoriza o seu conhecimento e a sua liberdade."

🌿 Faça Parte Desta Revolução!
O cadastro é totalmente gratuito e leva menos de 2 minutos. Garanta sua posição como Sócio Prescritor e comece a atender com autonomia total e máxima rentabilidade.

👉 Clique no link abaixo para realizar seu cadastro gratuito:
https://plantayraiz.com.br

Seja muito bem-vindo(a) ao futuro da medicina canabinoide.
Atenciosamente,
Diretoria Médica & Conselho Executivo
Planta y Raíz`;

/**
 * Envia mensagens para os leads captados
 */
export async function processOutboundMessages() {
  console.log('[CRM Engine] Verificando leads para disparo...');
  
  // Busca leads com status 'scraped'
  const { data: leads, error } = await supabase
    .from('leads_crm')
    .select('*')
    .eq('status', 'scraped')
    .limit(10); // Processa em lotes de 10
    
  if (error) {
    console.error('[CRM Engine] Erro ao buscar leads:', error);
    return;
  }
  
  if (!leads || leads.length === 0) {
    console.log('[CRM Engine] Nenhum lead novo para disparo.');
    return;
  }
  
  for (const lead of leads) {
    try {
      console.log(`[CRM Engine] Enviando convite para ${lead.phone}...`);
      
      const payload = {
        chatId: `${lead.phone}@c.us`,
        text: INVITE_MESSAGE,
        session: WAHA_SESSION
      };
      
      await axios.post(`${WAHA_API_URL}/api/sendText`, payload);
      
      // Atualiza status no banco
      await supabase
        .from('leads_crm')
        .update({ 
          status: 'invited', 
          last_contact_at: new Date().toISOString()
        })
        .eq('id', lead.id);
        
      console.log(`[CRM Engine] Sucesso! Status atualizado para 'invited'.`);
      
      // Delay aleatório de 15 a 45 segundos (em milissegundos) para evitar ban
      const delay = Math.floor(Math.random() * (45000 - 15000 + 1) + 15000);
      console.log(`[CRM Engine] Aguardando ${delay/1000}s antes do próximo envio...`);
      await sleep(delay);
      
    } catch (err) {
      console.error(`[CRM Engine] Erro ao enviar para ${lead.phone}:`, err.message);
    }
  }
}

/**
 * Servidor Webhook para receber respostas dos médicos via WAHA
 */
export function startWebhookServer() {
  const app = express();
  app.use(express.json());
  
  app.post('/waha-webhook', async (req, res) => {
    res.status(200).send('OK');
    
    try {
      const { event, payload } = req.body;
      
      // Filtra apenas mensagens recebidas
      if (event === 'message.any' || event === 'message') {
        const message = payload;
        
        // Ignora mensagens enviadas pelo próprio bot
        if (message.fromMe) return;
        
        const phone = message.from.split('@')[0];
        const text = message.body;
        
        console.log(`[Webhook] Mensagem recebida de ${phone}: ${text}`);
        
        // Verifica se o número está no CRM
        const { data: lead } = await supabase
          .from('leads_crm')
          .select('*')
          .eq('phone', phone)
          .single();
          
        if (lead) {
          // Atualiza o status se for a primeira resposta
          if (lead.status === 'invited') {
            await supabase
              .from('leads_crm')
              .update({ status: 'responded', last_contact_at: new Date().toISOString() })
              .eq('id', lead.id);
          }
          
          // Chama o Gemini para formular a resposta
          console.log(`[Gemini] Gerando resposta para ${phone}...`);
          const chat = model.startChat();
          const result = await chat.sendMessage(text);
          const replyText = result.response.text();
          
          // Envia a resposta de volta
          await axios.post(`${WAHA_API_URL}/api/sendText`, {
            chatId: message.from,
            text: replyText,
            session: WAHA_SESSION
          });
          
          // Atualiza para in_progress
          await supabase
            .from('leads_crm')
            .update({ status: 'in_progress', last_contact_at: new Date().toISOString() })
            .eq('id', lead.id);
            
          console.log(`[Webhook] Resposta enviada e lead atualizado para 'in_progress'.`);
        }
      }
    } catch (error) {
      console.error('[Webhook] Erro no processamento:', error);
    }
  });
  
  const PORT = process.env.WEBHOOK_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[CRM Engine] Servidor de Webhook (Brisa) rodando na porta ${PORT}`);
  });
}

// Processamento de Follow-ups automáticos (leads 'invited' ou 'in_progress' há > 3 dias)
export async function processFollowUps() {
  console.log('[CRM Engine] Verificando follow-ups...');
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const { data: leads, error } = await supabase
    .from('leads_crm')
    .select('*')
    .in('status', ['invited', 'in_progress'])
    .lt('last_contact_at', threeDaysAgo.toISOString())
    .lt('follow_up_count', 3); // Max 3 follow-ups
    
  if (error || !leads) return;
  
  for (const lead of leads) {
    console.log(`[CRM Engine] Enviando follow-up para ${lead.phone}...`);
    
    const followupMsg = `Olá Dr(a), Enfermeira Brisa passando aqui para saber se você conseguiu dar uma olhada no nosso convite VIP para a Plataforma Planta y Raíz! Ficou alguma dúvida sobre como funciona o repasse imediato via PIX ou a nossa taxa de apenas 7%? Estou à disposição!`;
    
    try {
      await axios.post(`${WAHA_API_URL}/api/sendText`, {
        chatId: `${lead.phone}@c.us`,
        text: followupMsg,
        session: WAHA_SESSION
      });
      
      await supabase
        .from('leads_crm')
        .update({ 
          last_contact_at: new Date().toISOString(),
          follow_up_count: lead.follow_up_count + 1
        })
        .eq('id', lead.id);
        
      await sleep(15000); // Delay mínimo
    } catch(e) {
      console.error(`[CRM Engine] Erro no follow-up:`, e.message);
    }
  }
}
