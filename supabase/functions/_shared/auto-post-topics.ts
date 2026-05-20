// Tópicos e prompt unificados para posts automáticos (IG / FB / Threads).
// REGRA: Nunca mencionar Dr. Edilson, CRM, ou qualquer médico específico.
// Foco: vantagens da plataforma Planta y Raiz para pacientes, médicos, lojistas e parceiros.

export const AUTO_POST_TOPICS = [
  "Telemedicina canabinoide 100% legalizada pela ANVISA — atendimento em vídeo de qualquer lugar do Brasil",
  "Importação ANVISA RDC 660/2022 com frete grátis e rastreamento — a Planta y Raiz cuida de tudo",
  "Marketplace de Cannabis Medicinal: produtos selecionados, com receita digital integrada",
  "Orientação Técnica em vídeo por apenas R$ 30 (PIX) — acolhimento humanizado da Enfermeira Brisa 24h",
  "Plano de assinatura Club Planta y Raiz: tratamento contínuo, descontos e acompanhamento clínico",
  "Para médicos: cadastre-se grátis, receba pacientes prontos, prescreva digitalmente com selo gov.br",
  "Para lojistas e parceiros: vitrine integrada, comissão automática, split Mercado Pago instantâneo",
  "Programa de afiliados em 3 gerações (25% / 15% / 10%) — ganhe indicando saúde",
  "Sistema endocanabinoide e bem-estar: ciência, evidência e acompanhamento personalizado",
  "Receita digital com assinatura ICP-Brasil e QR Code verificável — segurança total",
  "Atendimento humanizado: a Enfermeira Brisa acolhe você por WhatsApp em minutos",
  "Saúde acessível: PIX, cartão e cripto — o Brasil inteiro tratando com Cannabis Medicinal",
  "Programa de fidelidade Planta-Coins: cada interação vira benefício real",
  "Plataforma omnichannel: WhatsApp, Instagram, Messenger, web — onde você estiver, a gente atende",
];

export const AUTO_POST_SYSTEM_PROMPT = `Você é a Enfermeira Brisa, voz oficial da Planta y Raiz — a maior plataforma digital de Cannabis Medicinal do Brasil.

REGRAS RÍGIDAS DE CONTEÚDO:
- NUNCA mencione nomes de médicos, "Dr." ou "Dra." específicos, números de CRM, nem destaque profissional individual.
- Foque SEMPRE nas vantagens da plataforma para todos: pacientes, médicos cadastrados, lojistas, afiliados, parceiros e usuários em geral.
- Destaque: tecnologia, ANVISA RDC 660/2022, atendimento 24h da Enf. Brisa, marketplace, programa de afiliados, frete grátis, PIX, segurança ICP-Brasil.
- Tom: acolhedor, científico, profissional, inclusivo.
- Sempre encerrar com o link plantayraiz.com.br e WhatsApp da Enf. Brisa (11) 99136-3154.
- Hashtags relevantes ao tema (8-12 para Instagram, 3-5 para Facebook).
- Emojis sutis (🌿 💚 🤍 ✨).
- Nunca prometa cura. Nunca cite paciente real. LGPD sempre.`;

export const PUBLIC_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1536819114556-1e10f967fb61?w=1080&h=1080&fit=crop&fm=jpg&q=80",
  "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=1080&h=1080&fit=crop&fm=jpg&q=80",
  "https://images.unsplash.com/photo-1611242320536-f12d3541249b?w=1080&h=1080&fit=crop&fm=jpg&q=80",
  "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1080&h=1080&fit=crop&fm=jpg&q=80",
  "https://images.unsplash.com/photo-1542736667-069246bdbc6d?w=1080&h=1080&fit=crop&fm=jpg&q=80",
  "https://images.unsplash.com/photo-1559757175-08f3a2c9b16f?w=1080&h=1080&fit=crop&fm=jpg&q=80",
  "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1080&h=1080&fit=crop&fm=jpg&q=80",
];

export function pickTopic(): string {
  return AUTO_POST_TOPICS[Math.floor(Math.random() * AUTO_POST_TOPICS.length)];
}

export function pickImage(): string {
  return PUBLIC_IMAGE_POOL[Math.floor(Math.random() * PUBLIC_IMAGE_POOL.length)];
}

// Remove qualquer menção a médico/CRM que possa ter vazado da fila manus_social_queue
export function sanitizeCaption(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bDr\.?\s*Edilson[^.\n]*/gi, "Equipe médica Planta y Raiz")
    .replace(/\bDra?\.?\s+[A-ZÁ-Ú][a-zá-ú]+(\s+[A-ZÁ-Ú][a-zá-ú]+)?/g, "Equipe médica Planta y Raiz")
    .replace(/\bCRM[\s:/-]*\d+[-/\w]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
