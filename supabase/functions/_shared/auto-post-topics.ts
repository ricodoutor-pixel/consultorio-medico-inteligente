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

// Pool de imagens — Pexels CDN (mais confiável que Unsplash p/ Graph API).
// IG/FB exigem URL pública estável que responde 200 com content-type image/jpeg.
export const PUBLIC_IMAGE_POOL = [
  "https://images.pexels.com/photos/7667731/pexels-photo-7667731.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
  "https://images.pexels.com/photos/7668021/pexels-photo-7668021.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
  "https://images.pexels.com/photos/3825529/pexels-photo-3825529.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
  "https://images.pexels.com/photos/3735149/pexels-photo-3735149.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
  "https://images.pexels.com/photos/4021779/pexels-photo-4021779.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
  "https://images.pexels.com/photos/7615460/pexels-photo-7615460.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
  "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080&fit=crop",
];

export function pickTopic(): string {
  return AUTO_POST_TOPICS[Math.floor(Math.random() * AUTO_POST_TOPICS.length)];
}

export function pickImage(): string {
  return PUBLIC_IMAGE_POOL[Math.floor(Math.random() * PUBLIC_IMAGE_POOL.length)];
}

// Tenta pegar a imagem menos usada do pool dinâmico (brisa_image_pool); se vazio, cai no static.
export async function pickImageFromPool(supabase: any): Promise<string> {
  try {
    const { data } = await supabase
      .from("brisa_image_pool")
      .select("id, image_url, used_count")
      .order("used_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true })
      .limit(1)
      .maybeSingle();
    if (data?.image_url) {
      await supabase.from("brisa_image_pool")
        .update({ used_count: (data.used_count || 0) + 1, last_used_at: new Date().toISOString() })
        .eq("id", data.id);
      return data.image_url;
    }
  } catch (e) {
    console.error("[pickImageFromPool] fallback to static", e);
  }
  return pickImage();
}

// Aguarda container IG ficar FINISHED antes de publicar (resolve erro 9007 "Media ID is not available").
// Faz polling em /{containerId}?fields=status_code com timeout máximo de ~25s.
export async function waitIgContainerReady(
  containerId: string,
  accessToken: string,
  maxAttempts = 12,
): Promise<{ ready: boolean; finalStatus: string }> {
  const GRAPH = "https://graph.facebook.com/v19.0";
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 1500 : 2000));
    try {
      const r = await fetch(
        `${GRAPH}/${containerId}?fields=status_code&access_token=${accessToken}`,
      );
      const j = await r.json();
      const s = j?.status_code as string | undefined;
      if (s === "FINISHED") return { ready: true, finalStatus: s };
      if (s === "ERROR" || s === "EXPIRED") return { ready: false, finalStatus: s };
    } catch {
      // tenta de novo
    }
  }
  return { ready: false, finalStatus: "TIMEOUT" };
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
