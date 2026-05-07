/**
 * 📈 GROWTH & VIRALITY ENGINE
 * Indicação premiada, prova social automática, conteúdo evergreen
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireServiceAuth } from "../_shared/service-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MANYCHAT_API = "https://api.manychat.com/fb";

async function manychatRequest(endpoint: string, body: Record<string, unknown>) {
  const key = Deno.env.get("MANYCHAT_API_KEY");
  if (!key) throw new Error("MANYCHAT_API_KEY not configured");
  const res = await fetch(`${MANYCHAT_API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function findSubscriber(phone: string) {
  const formatted = phone.startsWith("+") ? phone : phone.startsWith("55") ? `+${phone}` : `+55${phone}`;
  return manychatRequest("/subscriber/findBySystemField", { field_name: "phone", field_value: formatted });
}

async function sendContent(subscriberId: string, messages: Array<{ type: string; text?: string }>) {
  return manychatRequest("/sending/sendContent", { subscriber_id: subscriberId, data: { version: "v2", content: { messages } } });
}

async function tagSubscriber(subscriberId: string, tagName: string) {
  return manychatRequest("/subscriber/addTag", { subscriber_id: subscriberId, tag_name: tagName });
}

// Conteúdo evergreen - 52 semanas de mensagens educativas
const EVERGREEN_CONTENT = [
  "🌿 Sabia que o sistema endocanabinoide foi descoberto em 1988? Ele regula dor, sono, humor e apetite! Saiba mais na nossa Biblioteca Científica.",
  "💡 CBD vs THC: O CBD não causa efeitos psicoativos e é usado para ansiedade, epilepsia e dor crônica. Agende sua consulta para saber qual é ideal para você!",
  "📊 Estudo publicado no JAMA: Cannabis medicinal reduziu em 64% o uso de opioides em pacientes com dor crônica.",
  "🧠 Cannabis e Saúde Mental: Estudos mostram eficácia do CBD para ansiedade generalizada, TEPT e insônia.",
  "⚖️ Legislação 2026: A RDC 660 simplificou a prescrição de cannabis medicinal. Seus pacientes podem se beneficiar!",
  "🏥 Telemedicina Cannabis: 92% dos pacientes relatam melhora significativa após 3 meses de tratamento guiado.",
  "💰 Dica de Faturamento: Médicos na Planta y Raiz faturam em média R$ 15k/mês com teleconsultas. Taxa Zero para VIP!",
  "🎓 Novo curso disponível: 'Farmacologia dos Canabinoides' - 10 módulos gratuitos na plataforma.",
  "🌱 Dose-resposta: Começar com doses baixas e aumentar gradualmente é a chave do sucesso no tratamento.",
  "📱 Sabia que você pode prescrever cannabis medicinal 100% online? Receita digital com assinatura ICP-Brasil.",
  "🔬 Pesquisa brasileira: USP confirma eficácia do CBD para fibromialgia em estudo duplo-cego.",
  "👥 Comunidade: Já são 500+ médicos prescritores na Planta y Raiz. Junte-se ao maior hub de cannabis medicinal!",
  "💊 Interações medicamentosas: CBD inibe CYP3A4 e CYP2D6. Sempre verifique com nosso sistema de alertas.",
  "🏆 Top prescritores do mês recebem bônus de até 1.5x sobre a distribuição de lucros!",
  "📋 Checklist ANVISA: Diagnóstico CID-10 + Justificativa + Dosagem + Via de administração. Nós automatizamos tudo!",
  "🌍 Cannabis medicinal é legal em 50+ países. A Planta y Raiz opera com compliance total.",
  "🤖 Nossa IA Brisa faz triagem inteligente e encaminha pacientes qualificados direto para sua agenda.",
  "💡 Caso clínico: Paciente com epilepsia refratária teve 80% de redução nas crises com CBD.",
  "📈 Seu NPS importa! Médicos com NPS > 9 recebem multiplicador Platina (1.5x) nos bônus.",
  "🎯 Meta do mês: 20 consultas = Plano Premium automático com multiplicador 1.5x!",
  "🧬 Genômica e Cannabis: Variações no gene CNR1 influenciam a resposta ao tratamento.",
  "📞 Dica: Ative notificações WhatsApp para nunca perder um agendamento de paciente.",
  "🏅 Badges desbloqueáveis: Estreante, Dedicado, Expert, Mestre, Lenda. Qual é o seu nível?",
  "💸 Split automático: 93% do valor da consulta cai direto na sua conta. Sem burocracia!",
  "🌿 Terpenos importam! Mirceno (sedativo), Limoneno (ansiolítico), Pineno (anti-inflamatório).",
  "📊 Dashboard em tempo real: Acompanhe faturamento, NPS e ranking no seu painel.",
  "🎥 Webinar esta semana: 'Cannabis para Dor Crônica' com especialistas convidados.",
  "💡 Pacientes informados aderem melhor: Compartilhe nossos e-books com seus pacientes!",
  "🔒 LGPD: Todos os prontuários são criptografados AES-256. Segurança total para você e seus pacientes.",
  "📱 App-like: Nossa plataforma PWA funciona como app no celular. Adicione à tela inicial!",
  "🏥 Parceria com farmácias: Prescrições enviadas automaticamente para dispensação.",
  "🎮 Gamificação: Complete metas semanais e desbloqueie bônus exclusivos!",
  "💰 Indique um colega e ganha boost temporário no bônus de 10%! Link exclusivo no seu dashboard.",
  "📋 RDC 327: Produtos à base de Cannabis com até 0,2% de THC. Conheça as regras atualizadas.",
  "🧪 Óleo Full Spectrum vs Isolado: Entenda o efeito entourage e prescreva com mais precisão.",
  "🌟 Depoimento: 'A Planta y Raiz mudou minha prática médica' - Dr. Ana, Neurologista.",
  "📈 Projeção 2026: Mercado de cannabis medicinal no Brasil deve atingir R$ 4 bilhões.",
  "💊 Formas farmacêuticas: Óleo sublingual, cápsulas, tópicos, vaporizadores. Qual indicar?",
  "🎯 Foco em resultados: Nosso sistema de follow-up automático garante adesão do paciente.",
  "🏆 Parabéns aos Top 10 do mês! Ranking atualizado em tempo real na plataforma.",
  "📞 Suporte 24/7: Enfermeira Brisa disponível via WhatsApp para qualquer dúvida.",
  "🌿 Cannabis e Oncologia: Evidências crescentes para manejo de náusea, dor e apetite.",
  "💡 Dica fiscal: Consultas por telemedicina têm o mesmo respaldo legal que presenciais.",
  "📊 Seu relatório semanal está disponível! Acesse o dashboard para ver seu desempenho.",
  "🎓 Certificação: Complete os 10 módulos e receba certificado de Cannabis Medicinal.",
  "💸 Saques automáticos: Configure sua chave Pix e receba todo final de mês.",
  "🔬 Ensaio clínico: CBD + THC para esclerose múltipla - resultados promissores.",
  "👥 Mentoria: Conecte-se com prescritores experientes na nossa plataforma.",
  "📱 Atualização: Nova funcionalidade de prescrição por voz com IA!",
  "🌱 Cannabis pediátrica: Protocolos especiais para epilepsia infantil refratária.",
  "🏅 Conquista desbloqueada! Verifique suas novas badges no dashboard.",
  "💰 Black Friday Cannabis: Desconto especial em planos VIP durante novembro!",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauth = requireServiceAuth(req, corsHeaders);
  if (unauth) return unauth;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { action } = await req.json().catch(() => ({ action: "health" }));

    switch (action) {
      // ═══════════════════════════════════════════════════
      // 1. INDICAÇÃO PREMIADA (Member-get-Member)
      // ═══════════════════════════════════════════════════
      case "referral_boost": {
        console.log("🔗 [Growth] Processando indicações com boost...");

        const { data: referrals } = await supabase
          .from("referral_links")
          .select("*, profiles:user_id(full_name, phone)")
          .gt("total_referrals", 0)
          .order("total_referrals", { ascending: false })
          .limit(50);

        let boosted = 0;
        for (const ref of referrals || []) {
          // Verificar se a última indicação foi nos últimos 7 dias
          const { data: recentCommissions } = await supabase
            .from("affiliate_commissions")
            .select("id, created_at")
            .eq("referrer_id", ref.user_id)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (recentCommissions?.length) {
            // Tem indicação recente - enviar mensagem de boost
            const phone = (ref as any).profiles?.phone;
            if (!phone) continue;

            const sub = await findSubscriber(phone);
            if (sub?.data?.id) {
              await sendContent(sub.data.id, [{
                type: "text",
                text: `🔥 Parabéns! Sua indicação foi um sucesso!\n\nSeu bônus de 10% recebeu um BOOST temporário de 48h! 🚀\n\nIndique mais colegas agora e maximize seus ganhos:\nhttps://consultorio-medico-inteligente.lovable.app/indicacoes\n\nSeu link exclusivo: https://consultorio-medico-inteligente.lovable.app/?ref=${ref.code}`
              }]);
              await tagSubscriber(sub.data.id, "Referral_Boost_Active");
              boosted++;
            }
          }
        }

        return new Response(JSON.stringify({ success: true, boosted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════════
      // 2. PROVA SOCIAL AUTOMÁTICA (NPS 9-10)
      // ═══════════════════════════════════════════════════
      case "social_proof": {
        console.log("⭐ [Growth] Buscando promotores NPS 9-10 para prova social...");

        const { data: promoters } = await supabase
          .from("nps_responses")
          .select("*, profiles:patient_id(full_name, phone)")
          .gte("score", 9)
          .eq("category", "promoter")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(20);

        let requested = 0;
        for (const nps of promoters || []) {
          const phone = (nps as any).profiles?.phone;
          if (!phone) continue;

          const sub = await findSubscriber(phone);
          if (sub?.data?.id) {
            await sendContent(sub.data.id, [{
              type: "text",
              text: `😊 Ficamos muito felizes com sua avaliação nota ${nps.score}!\n\nSua opinião ajuda outros pacientes a encontrarem o tratamento certo. 🌿\n\nPoderia compartilhar sua experiência? Leva menos de 1 minuto:\n\n⭐ Google: https://g.page/plantayraiz/review\n📸 Instagram: Marque @plantayraiz\n\nComo agradecimento, você ganha 10% de desconto na próxima consulta! 🎁`
            }]);
            await tagSubscriber(sub.data.id, "Social_Proof_Requested");
            requested++;
          }
        }

        return new Response(JSON.stringify({ success: true, requested }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ═══════════════════════════════════════════════════
      // 3. CONTEÚDO EVERGREEN (365 dias)
      // ═══════════════════════════════════════════════════
      case "evergreen_content": {
        console.log("📚 [Growth] Distribuindo conteúdo evergreen semanal...");

        // Calcular semana do ano para selecionar conteúdo
        const now = new Date();
        const weekOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const contentIndex = weekOfYear % EVERGREEN_CONTENT.length;
        const content = EVERGREEN_CONTENT[contentIndex];

        // Buscar todos os médicos verificados
        const { data: doctors } = await supabase
          .from("doctors")
          .select("user_id, profiles:user_id(full_name, phone)")
          .eq("is_verified", true);

        let sent = 0;
        for (const doc of doctors || []) {
          const phone = (doc as any).profiles?.phone;
          if (!phone) continue;

          const sub = await findSubscriber(phone);
          if (sub?.data?.id) {
            await sendContent(sub.data.id, [{
              type: "text",
              text: `📬 Conteúdo da Semana - Planta y Raiz\n\n${content}\n\n📖 Mais conteúdo na Biblioteca: https://consultorio-medico-inteligente.lovable.app/biblioteca`
            }]);
            sent++;
          }
        }

        console.log(`📚 [Growth] Conteúdo semana ${weekOfYear} enviado para ${sent} médicos`);
        return new Response(JSON.stringify({ success: true, sent, week: weekOfYear, contentIndex }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "health":
        return new Response(JSON.stringify({ status: "ok", service: "growth-engine", automations: ["referral_boost", "social_proof", "evergreen_content"] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("❌ [Growth Engine] Erro:", e);
    return new Response(JSON.stringify({ error: "Erro interno", details: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
