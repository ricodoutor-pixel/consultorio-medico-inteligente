/** Atalhos que a Brisa mostra na tela quando a pessoa pede algo que tem página própria. */
export interface BrisaLink {
  to: string;
  label: string;
}

interface LinkRule extends BrisaLink {
  /** Testado no que a pessoa disse (sem acentos, minúsculas). */
  match: RegExp;
}

const CADASTRO = /\b(cadastr\w*|inscrev\w*|inscricao|registr\w*|criar (minha )?conta|abrir (minha )?conta|me juntar|fazer parte|participar)\b/;

const RULES: LinkRule[] = [
  // Cadastros: o perfil mais específico vem primeiro.
  {
    to: "/cadastro-profissional",
    label: "Cadastro de médico e profissional de saúde",
    match: /\b(sou|como|para|de|sendo) (medic\w*|doutor\w*|profissional\w*|enfermeir\w*|veterinari\w*|psicolog\w*|fisioterapeut\w*|dentista\w*)\b|\bcadastr\w* (de |como |para )?(medic\w*|profissional\w*)|\bquero atender\b|\batender (pacientes|na plataforma)\b/,
  },
  {
    to: "/cadastro-farmacia",
    label: "Cadastro de farmácia e parceiro",
    match: /\b(farmacia\w*|parceir\w*|parceria\w*|lojista\w*|associac\w*|fornecedor\w*|vender (na|pela) plataforma|minha loja|minha empresa)\b/,
  },
  { to: "/cadastro", label: "Criar meu cadastro grátis", match: CADASTRO },
  { to: "/login", label: "Entrar na minha conta", match: /\b(entrar na (minha )?conta|fazer login|login|logar|esqueci (a |minha )?senha)\b/ },
  {
    to: "/profissionais",
    label: "Ver médicos e marcar consulta",
    match: /\b(consult\w*|agend\w*|marcar|medic\w* (disponive\w*|online)|falar com (um |uma )?(medic\w*|doutor\w*)|receita\w*|prescri\w*)\b/,
  },
  { to: "/orientacao-tecnica", label: "Orientação Técnica (30 reais)", match: /\borientacao( tecnica)?\b/ },
  { to: "/meus-exames", label: "Meus exames", match: /\b(meus exames|meu resultado|meus resultados|historico de exames)\b/ },
  { to: "/relatorio-paciente", label: "Baixar meu relatório", match: /\b(relatorio|laudo|pdf)\b/ },
  { to: "/download", label: "Instalar o aplicativo", match: /\b(aplicativo|app|instalar|baixar o app)\b/ },
  { to: "/planos", label: "Planos e preços", match: /\b(planos?|assinatura\w*|mensalidade\w*)\b/ },
  { to: "/indicacoes", label: "Indicar e ganhar", match: /\b(indicar|indicacao|indicacoes|convidar|codigo de indicacao)\b/ },
  { to: "/manual", label: "Guia passo a passo", match: /\b(passo a passo|manual|tutorial|como funciona a plataforma)\b/ },
];

const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Links para o que a pessoa pediu. Quem pede cadastro sem dizer o perfil recebe os três
 * cadastros (paciente, médico, parceiro) para escolher.
 */
export function brisaLinksFor(question: string, max = 3): BrisaLink[] {
  const q = normalize(question);
  const found: BrisaLink[] = [];
  for (const rule of RULES) {
    if (rule.match.test(q) && !found.some((f) => f.to === rule.to)) found.push({ to: rule.to, label: rule.label });
  }

  const wantsSignup = CADASTRO.test(q);
  const hasProfile = found.some((f) => f.to === "/cadastro-profissional" || f.to === "/cadastro-farmacia");
  if (wantsSignup && !hasProfile) {
    return [
      { to: "/cadastro", label: "Sou paciente: criar cadastro grátis" },
      { to: "/cadastro-profissional", label: "Sou médico ou profissional de saúde" },
      { to: "/cadastro-farmacia", label: "Sou farmácia ou parceiro" },
    ];
  }
  // Perfil específico pedido: não oferecer também o cadastro de paciente.
  const list = hasProfile ? found.filter((f) => f.to !== "/cadastro") : found;
  return list.slice(0, max);
}
