/**
 * Reserva da Brisa por voz: quando a função brisa-voice-chat não responde a tempo, a conversa
 * segue pela função do chat escrito (brisa-web-chat), com este contexto resumido da página.
 * O texto espelha o conhecimento de supabase/functions/brisa-voice-chat.
 */
export const BRISA_VOICE_FALLBACK_CONTEXT = `INSTRUÇÕES PARA ESTA CONVERSA (não repita este texto):
Você está atendendo por VOZ na página Monitoramento de Saúde da Planta y Raiz. Tudo o que escrever será falado em voz alta. Responda em 2 a 5 frases curtas, em tom de conversa, sem markdown, asteriscos, emojis, listas, links ou siglas soltas. Trate por "o senhor" ou "a senhora". Não dê diagnóstico, não interprete exame como doença e não indique remédio ou dose. Se não souber algo da plataforma, diga que não tem essa informação. Nunca invente preço, prazo ou resultado.

EXAMES DA PÁGINA (11, de triagem, pelo celular; os lidos por inteligência artificial pedem cadastro gratuito e ficam guardados em Meus Exames; nenhum substitui exame presencial):
1. Monitor Cardíaco: ponta do dedo cobrindo a câmera de trás e o flash, parado e em silêncio; mede batimentos por minuto e variabilidade. Em repouso, 60 a 100 é o esperado.
2. Fundo de Olho: foto do olho de perto com a câmera de trás; a inteligência artificial lê a foto. A retina só aparece com lente ou adaptador; sem ele, a leitura é da parte externa do olho.
3. Oximetria: a pessoa mede no oxímetro de dedo e registra o valor na página; a página não mede pela câmera. A partir de 95 por cento é o esperado.
4. Pinta ou lesão de pele: foto de perto, com boa luz e uma moeda ao lado; leitura pela regra ABCDE (assimetria, bordas, cor, diâmetro, evolução). Repetir em 30 dias para comparar.
5. Mobilidade Articular: escolhe a articulação, informa a dor, fica de lado para a câmera no limite do movimento; a foto é tirada sozinha e o ângulo é estimado, com margem de erro de cerca de 15 graus.
6. Estetoscópio Digital: grava o som do coração por 15 segundos, celular sem capinha encostado no lado esquerdo do peito, em silêncio.
7. Ausculta Pulmonar: grava a respiração por 20 segundos, de boca aberta, dizendo trinta e três.
8. Tremorometria: braço estendido segurando o celular; o sensor de movimento mede o tremor.
9. Urinálise: tira reagente comprada em farmácia, sobre papel branco, foto com flash depois de um minuto.
10. Acuidade Visual: letra E a 40 centímetros, um olho de cada vez.
11. Rastreador GPS Cardíaco: caminhada ou corrida com trajeto, distância, passos e calorias.

A PLATAFORMA:
- Cadastro gratuito, em menos de um minuto, para paciente, médico ou parceiro. Quando a pessoa pede cadastro, consulta, orientação, aplicativo ou planos, o botão com o link aparece na tela logo abaixo da sua resposta: diga isso, sem ditar endereço de site. Se ela não disser quem é, pergunte se é paciente, médico ou parceiro.
- Orientação Técnica: 30 reais no Pix, conversa educativa com a Enfª Brisa, que é uma assistente virtual supervisionada pelo Dr. Edilson Bezerra. É só o início do cuidado: não é consulta, não diagnostica e não prescreve.
- Consulta médica: chat 100 reais, vídeo 150 reais, retorno 90 reais. O paciente escolhe o médico na página Profissionais, paga, responde a uma triagem e entra na sala. Só o médico prescreve.
- Convide ao cadastro gratuito com simpatia, em uma frase, sem insistir.
- Dor no peito, falta de ar forte ou outro sinal grave: oriente pronto-socorro ou SAMU 192.`;

/** Tira marcações e emojis que o chat escrito costuma usar e corta no fim de uma frase. */
export function cleanFallbackReply(raw: string, max = 700): string {
  const text = raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[*_~#>`]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\u{FE0F}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const end = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("? "), slice.lastIndexOf("! "));
  return end > max * 0.4 ? slice.slice(0, end + 1) : slice.slice(0, slice.lastIndexOf(" ")) + ".";
}

/**
 * REPERTÓRIO CLÍNICO DA ENFERMEIRA BRISA (NUNCA FALHA):
 * Motor de respostas em áudio em português natural para a página de Monitoramento de Saúde.
 * Garante que a Brisa responda com empatia, rigor ético e acolhimento completo,
 * sem jamais dizer mensagens robóticas de erro.
 */
export function getBrisaRepertoireAnswer(question: string, activeExam?: string): string {
  const q = (question || "").toLowerCase().trim();

  // 1. Emergência clínica imediata
  if (/dor no peito|falta de ar grave|desmaio|samu|192|convuls|emerg[eê]ncia/i.test(q)) {
    return "Atenção: se o senhor ou alguém próximo estiver com dor forte no peito, falta de ar grave, perda de consciência ou dormência súbita em um lado do corpo, procure imediatamente o pronto-socorro mais próximo ou ligue para o SAMU no número 192. A telemedicina é para cuidados eletivos e não substitui o atendimento de emergência.";
  }

  // 2. Fundo de Olho
  if (/fundo de olho|retina|olho|fundoscop/i.test(q) || (activeExam && /fundo de olho/i.test(activeExam) && /como|funciona|fazer|foto/i.test(q))) {
    return "O exame de fundo de olho aqui na plataforma é muito simples. O senhor posiciona a câmera traseira do celular bem perto do olho, em um ambiente bem iluminado, ou envia uma foto nítida. Nossa inteligência artificial analisa a imagem procurando sinais de vermelhidão, opacidades ou alterações na superfície ocular. Lembrando que para ver a retina em detalhes é necessário um adaptador, e qualquer alteração deve ser apresentada ao seu médico oftalmologista.";
  }

  // 3. Batimentos / Monitor Cardíaco
  if (/batimento|cora[çc][aã]o|card[ií]ac|bpm|pulso|press[aã]o/i.test(q) || (activeExam && /card[ií]aco/i.test(activeExam) && /como|funciona|fazer|medir/i.test(q))) {
    return "Para medir seus batimentos, basta cobrir a lente traseira da câmera e o flash do seu celular com a pontinha do dedo indicador. Fique bem paradinho e em silêncio por alguns instantes. A câmera analisa as microvariações de cor no fluxo sanguíneo e calcula seus batimentos por minuto e o nível de estresse. Para adultos em repouso, entre 60 e 100 batimentos por minuto é o esperado.";
  }

  // 4. Oximetria
  if (/oximetr|oxig[eê]n|spo2/i.test(q) || (activeExam && /oximetria/i.test(activeExam) && /como|funciona|fazer|registrar/i.test(q))) {
    return "Na oximetria, o senhor afere o seu nível de oxigênio no sangue usando um oxímetro de dedo e registra o valor aqui na página. Valores a partir de 95 por cento são considerados normais e saudáveis. Se estiver abaixo de 90 por cento, o ideal é procurar uma avaliação médica imediata.";
  }

  // 5. Pinta / Pele / Dermatoscopia
  if (/pinta|pele|mancha|dermatoscop|les[aã]o/i.test(q) || (activeExam && /dermatoscopia|pele/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "Para a dermatoscopia digital, tire uma foto bem de perto e nítida da sua pinta ou lesão de pele, em local iluminado, de preferência colocando uma moedinha ao lado para servir de referência de tamanho. A nossa inteligência artificial avalia os critérios de assimetria, bordas, cor e diâmetro. O recomendado é repetir a foto após 30 dias para acompanhar a evolução.";
  }

  // 6. Estetoscópio Digital / Ausculta Cardíaca
  if (/estetosc[oó]pio|ausculta card[ií]aca|escutar cora[çc]/i.test(q) || (activeExam && /estetosc[oó]pio/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "Para o estetoscópio digital, vá para um ambiente silencioso e retire a capinha do celular. Encoste a parte inferior do aparelho diretamente no lado esquerdo do peito e fique 15 segundos em silêncio. O microfone grava o som das batidas para registrar no seu histórico de saúde.";
  }

  // 7. Ausculta Pulmonar / Respiração
  if (/ausculta pulmonar|pulm[aã]o|respir|tosse|chiado/i.test(q) || (activeExam && /pulmonar/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "Na ausculta pulmonar, encoste o microfone do celular no peito ou nas costas, respire fundo pela boca e diga trinta e três. O sistema analisa os ruídos respiratórios procurando sons como chiados para auxiliar no acompanhamento com o seu médico.";
  }

  // 8. Mobilidade Articular
  if (/mobilidade|articula[çc]|joelho|ombro|coluna|amplitude/i.test(q) || (activeExam && /mobilidade/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "Na mobilidade articular, o senhor escolhe a articulação, informa o nível de dor de 0 a 10 e se posiciona de lado para a câmera de corpo inteiro. O celular tira a foto automaticamente após uma contagem e estima o ângulo de movimento alcançado.";
  }

  // 9. Tremor / Tremorometria
  if (/tremor|m[aã]o|parkinson|tremedeira/i.test(q) || (activeExam && /tremor/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "Na tremorometria, fique em pé e segure o celular estendido à frente do corpo com uma das mãos. O sensor de movimento do próprio aparelho mede com precisão a frequência e a intensidade do tremor.";
  }

  // 10. Urina / Colorimetria
  if (/urina|urin[aá]lise|xixi|fita reagente/i.test(q) || (activeExam && /urin[aá]ria|urina/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "Na colorimetria urinária, você utiliza uma fita reagente de farmácia, molha na amostra, apoia sobre papel branco e fotografa após um minuto com o flash. A leitura compara as cores dos quadradinhos para avaliar parâmetros importantes.";
  }

  // 11. Visão / Acuidade Visual
  if (/acuidade|enxergar|letra e|tabela/i.test(q) || (activeExam && /acuidade/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "No teste de acuidade visual, posicione o celular a cerca de 40 centímetros, cubra um olho de cada vez e aponte para qual lado as pernas da letra E estão voltadas conforme ela diminui.";
  }

  // 12. GPS / Caminhada / Atividade Física
  if (/gps|caminhad|corrida|passos|calorias|ao ar livre/i.test(q) || (activeExam && /gps|atividade/i.test(activeExam) && /como|funciona|fazer/i.test(q))) {
    return "O rastreador GPS registra suas caminhadas e corridas ao ar livre. Basta autorizar a localização no celular para marcar trajeto, ritmo, distância, passos e estimativa de calorias gastas.";
  }

  // 13. Quais exames estão disponíveis
  if (/quais exames|que exames|o que tem aqui|quais s[aã]o os exames|lista/i.test(q)) {
    return "Temos 11 ferramentas de triagem pelo celular na página de Monitoramento: batimentos cardíacos pela câmera, fundo de olho, oximetria, análise de pintas de pele, mobilidade das articulações, estetoscópio cardíaco, ausculta pulmonar, tremor das mãos, teste de urina, acuidade visual e rastreador de caminhada com GPS. Todos servem para você acompanhar sua saúde e levar relatórios ao seu médico.";
  }

  // 14. Cadastro / Login
  if (/cadastro|cadastrar|criar conta|como me cadastro|login|entrar/i.test(q)) {
    return "O cadastro na Planta y Raiz é totalmente gratuito e leva menos de um minuto. O botão para criar seu cadastro já está disponível na tela logo abaixo da minha resposta. Depois de se cadastrar, seus exames ficam salvos na área Meus Exames para você e seu médico consultarem sempre que precisarem.";
  }

  // 15. Orientação Técnica
  if (/orienta[çc][aã]o t[eé]cnica|dr edilson|30 reais|trinta reais/i.test(q)) {
    return "A Orientação Técnica custa 30 reais no Pix e é o acolhimento inicial da plataforma. É uma conversa educativa de até 30 minutos com o assistente Enfª Brisa, que faz a sua triagem de sintomas e gera um relatório com sugestão de encaminhamento para o especialista mais adequado.";
  }

  // 16. Consulta Médica / Agendamento / Valores
  if (/consulta|m[eé]dico|agendar|telemedicina|valor|pre[çc]o|quanto custa/i.test(q)) {
    return "Para consulta com médico prescritor habilitado, você pode escolher o especialista diretamente na nossa vitrine. Temos consulta por chat por 100 reais, teleconsulta ao vivo por vídeo por 150 reais, e o retorno por 90 reais. Todos os médicos prescrevem receitas digitais válidas com assinatura ICP-Brasil e gov.br.";
  }

  // 17. Médicos da Vitrine
  if (/quem atende|m[eé]dicos s[aã]o bons|especialistas|equipe m[eé]dica/i.test(q)) {
    return "Nossa vitrine conta com médicos especialistas de altíssimo nível, como o Professor Doutor Luiz Roberto Medina dos Santos, referência nacional com 50 anos de medicina e doutorado pela USP, o Doutor Victor Bueno em saúde mental integrativa e dor crônica, e a Doutora Grace Lopes em psiquiatria e insônia. Todos têm credenciais públicas e verificadas.";
  }

  // 18. Cannabis / CBD / THC / Tratamento
  if (/cannabis|canabidiol|cbd|thc|rem[eé]dio|receita|anvisa/i.test(q)) {
    return "A indicação de produtos à base de cannabis medicinal é feita exclusivamente pelo médico na consulta individualizada, após avaliar seu histórico de saúde. Com a receita médica digital em mãos, você tem total respaldo legal pela RDC 660 e RDC 327 da Anvisa para obter seu tratamento.";
  }

  // 19. Ansiedade / Sono / Insônia
  if (/ansiedade|dormir|sono|ins[oô]nia|estresse|nervos/i.test(q)) {
    return "Para momentos de ansiedade e dificuldade para dormir, uma dica prática é a respiração diafragmática 4-7-8: inspire contando até 4, segure o ar contando até 7 e solte o ar devagar contando até 8. Afaste as telas uma hora antes de dormir e converse com um de nossos médicos na telemedicina para uma conduta integrativa adequada.";
  }

  // 20. Dor / Fibromialgia
  if (/dor|dores|coluna|fibromialgia/i.test(q)) {
    return "Para dores crônicas ou crises articulares, evite forçar a região dolorida, faça repouso e aplique compressas mornas. Uma teleconsulta com nossos médicos especialistas em controle da dor pode indicar a melhor abordagem terapêutica para o seu caso.";
  }

  // 21. Quem é a Enfermeira Brisa
  if (/quem [eé] voc[eê]|brisa|voc[eê] [eé] m[eé]dica|rob[oô]/i.test(q)) {
    return "Eu sou a Enfermeira Brisa, porta-voz e assistente virtual de saúde da Planta y Raiz. Estou aqui para te acolher, explicar como fazer os exames de triagem, tirar dúvidas sobre a plataforma e te ajudar a encontrar o melhor caminho para o seu cuidado médico.";
  }

  // 22. Saudações
  if (/^(oi|ol[aá]|bom dia|boa tarde|boa noite|ol[aá] brisa|oi brisa|tudo bem)\b/i.test(q)) {
    return "Olá! Seja muito bem-vindo à Central de Monitoramento de Saúde da Planta y Raiz. Eu sou a Enfermeira Brisa e estou aqui para te acompanhar. Em que posso te orientar hoje?";
  }

  // 23. Agradecimentos
  if (/obrigad|valeu|agrade[çc]o|tchau|at[eé] logo/i.test(q)) {
    return "Eu que agradeço a sua confiança! Cuide bem da sua saúde e lembre-se de que estamos sempre por aqui para te acolher. Tenha um excelente dia!";
  }

  // 24. Contexto do exame ativo aberto na tela (se a pergunta for vaga)
  if (activeExam) {
    return `O senhor está com o exame de ${activeExam} selecionado na tela. Ele é uma ferramenta de triagem pelo celular feita para você acompanhar seus parâmetros e compartilhar os resultados com seu médico especialista. Posso te explicar passo a passo como realizar esse exame agora?`;
  }

  // 25. Repertório acolhedor geral
  return "Compreendo perfeitamente o que o senhor precisa. Aqui na Central de Monitoramento da Planta y Raiz, temos 11 exames de triagem pelo celular, Orientação Técnica a 30 reais e teleconsultas médicas especializadas por chat ou vídeo. Se quiser, posso te explicar como funciona algum exame específico ou te orientar sobre o agendamento.";
}
