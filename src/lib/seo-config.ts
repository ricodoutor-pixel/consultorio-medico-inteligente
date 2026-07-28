/**
 * Dynamic SEO config per route — titles, descriptions, keywords
 * Optimized for E-E-A-T, local SEO (São Paulo) and long-tail keywords
 *
 * Rules: title ≤ 60 chars, description 50–160 chars, único por rota.
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  h1?: string;
}

const BASE = "https://plantayraiz.com.br";

export const routeSEOMap: Record<string, PageSEO> = {
  // ===== 12 PÁGINAS PRIORITÁRIAS — E-E-A-T MÁXIMO (São Paulo + Brasil) =====
  "/": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "cannabis medicinal, telemedicina, CBD, THC, saúde digital, triagem IA, supervisão técnica Dra. Suelen Naves Rodrigues",
    canonical: `${BASE}/`,
    h1: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
  },
  "/nossa-historia": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "história Planta y Raiz, Bezerra Med Soluções Integradas, Dra. Suelen Naves Rodrigues (CRM-PR 49354) CRM PR, clínica cannabis medicinal Brasil, autoridade cannabis medicinal",
    canonical: `${BASE}/nossa-historia`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Nossa História e DNA",
  },
  "/profissionais": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "médico cannabis medicinal São Paulo, prescritor CBD Brasil, especialistas medicina canabinoide, CRM cannabis SP",
    canonical: `${BASE}/profissionais`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Médicos Prescritores Especialistas",
  },
  "/telemedicina": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "consulta telemedicina canabinoide, telemedicina cannabis São Paulo, videoconsulta cannabis Brasil, acesso seguro cannabis medicinal",
    canonical: `${BASE}/telemedicina`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Telemedicina 24/7 com Especialistas",
  },
  "/shopping": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "comprar cannabis medicinal São Paulo, óleo CBD Brasil, marketplace cannabis medicinal, produtos canabinoides ANVISA",
    canonical: `${BASE}/shopping`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Shopping Verificado e Seguro",
  },
  "/saude-verde": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "saúde verde cannabis medicinal, plano cannabis São Paulo, programa cannabis Brasil, assinatura cannabis medicinal",
    canonical: `${BASE}/saude-verde`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Programa Saúde Verde",
  },
  "/biblioteca": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "biblioteca cannabis medicinal, estudos canabinoides Brasil, farmacologia CBD, pesquisa cannabis medicinal São Paulo",
    canonical: `${BASE}/biblioteca`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Biblioteca Científica",
  },
  "/comunidade": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "comunidade cannabis medicinal Brasil, fórum cannabis São Paulo, grupo pacientes canabinoides, suporte cannabis medicinal",
    canonical: `${BASE}/comunidade`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Comunidade Oficial Planta y Raiz",
  },
  "/dashboard": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "painel paciente cannabis medicinal, dashboard cannabis São Paulo, gestão tratamento canabinoide Brasil",
    canonical: `${BASE}/dashboard`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Meu Painel de Tratamento",
  },
  "/afiliados": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "afiliados cannabis medicinal Brasil, indicação cannabis São Paulo, programa parceiros canabinoides",
    canonical: `${BASE}/afiliados`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Programa de Afiliados Planta y Raiz",
  },
  "/planos": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "planos cannabis medicinal São Paulo, assinatura cannabis Brasil, preço telemedicina canabinoide, club Planta y Raiz",
    canonical: `${BASE}/planos`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Planos e Assinaturas a partir de R$30",
  },
  "/tratamentos": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "tratamento cannabis medicinal Brasil, cannabis medicinal São Paulo, melhor tratamento canabinoide, indicações CBD ANVISA",
    canonical: `${BASE}/tratamentos`,
    h1: "Cannabis Medicinal em São Paulo e Brasil — Tratamentos e Indicações Clínicas",
  },

  // ===== Demais páginas (SEO padrão) =====
  "/como-funciona": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "como funciona cannabis medicinal, teleconsulta passo a passo, prescrição ANVISA",
    canonical: `${BASE}/como-funciona`,
  },
  "/faq": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "FAQ cannabis medicinal, perguntas CBD, cannabis legal Brasil, ANVISA cannabis",
    canonical: `${BASE}/faq`,
  },
  "/ebook": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "ebook cannabis medicinal, guia CBD grátis, curso cannabis medicinal, farmacologia",
    canonical: `${BASE}/ebook`,
  },
  "/tratamento-dor-cronica": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "dor crônica cannabis medicinal, fibromialgia CBD, artrite cannabis SP, dor neuropática",
    canonical: `${BASE}/tratamento-dor-cronica`,
    h1: "Tratamento de Dor Crônica com Cannabis Medicinal em São Paulo",
  },
  "/tratamento-ansiedade-saude-mental": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "ansiedade cannabis medicinal, CBD insônia, burnout CBD, saúde mental cannabis SP",
    canonical: `${BASE}/tratamento-ansiedade-saude-mental`,
    h1: "Tratamento com Cannabis Medicinal para Ansiedade e Insônia em São Paulo",
  },
  "/blog": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "blog cannabis medicinal, notícias CBD, artigos THC medicinal, ANVISA",
    canonical: `${BASE}/blog`,
  },
  "/contato": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "contato planta raiz, suporte cannabis medicinal, WhatsApp planta raiz",
    canonical: `${BASE}/contato`,
  },
  "/precos": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "preço cannabis medicinal, valor consulta CBD, planos telemedicina cannabis",
    canonical: `${BASE}/precos`,
  },
  "/club": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "club cannabis medicinal, assinatura CBD, benefícios planta raiz",
    canonical: `${BASE}/club`,
  },
  "/cadastro": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "cadastro cannabis medicinal, criar conta planta raiz, registro telemedicina",
    canonical: `${BASE}/cadastro`,
  },
  "/login": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "login planta raiz, acessar conta cannabis medicinal",
    canonical: `${BASE}/login`,
  },
  "/agendamento": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "agendar consulta cannabis, teleconsulta CBD, agendamento médico cannabis",
    canonical: `${BASE}/agendamento`,
  },
  "/legal": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "termos uso planta raiz, política privacidade, LGPD cannabis medicinal",
    canonical: `${BASE}/legal`,
  },
  "/pay": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "pagamento cannabis medicinal, checkout planta raiz, pix consulta CBD",
    canonical: `${BASE}/pay`,
  },
  "/carteira": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "carteira planta raiz, saldo cannabis medicinal, créditos consulta",
    canonical: `${BASE}/carteira`,
  },
  "/monitor-cardiaco": {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "monitor cardíaco IA, check-up rápido cannabis, saúde digital cannabis medicinal, PPG batimentos celular, plataforma saúde digital completa Brasil",
    canonical: `${BASE}/monitor-cardiaco`,
    h1: "Monitor Cardíaco IA — Saúde Digital Integrada à Cannabis Medicinal",
  },
};

/**
 * Get SEO config for a given pathname, with fallback
 */
export function getPageSEO(pathname: string): PageSEO {
  // Exact match
  if (routeSEOMap[pathname]) return routeSEOMap[pathname];

  // Match base route (e.g. /tratamentos/ansiedade → /tratamentos)
  const base = "/" + pathname.split("/").filter(Boolean)[0];
  if (routeSEOMap[base]) return routeSEOMap[base];

  // Default fallback — rota-aware no canonical para evitar duplicação
  const slug = pathname.replace(/^\//, "").replace(/\W+/g, " ").trim();
  const titleSuffix = slug ? ` — ${slug.charAt(0).toUpperCase() + slug.slice(1)}` : "";
  return {
    title: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
    description: "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
    keywords: "cannabis medicinal, telemedicina, CBD, THC, ANVISA, consulta online",
    canonical: `${BASE}${pathname}`,
  };
}
