// 🎙️ Brisa Voice Chat — Gemini no bastidor (porta-voz oficial Planta y Raiz)
// Mesma persona do fluxo WhatsApp, com consciência de tempo e leitura de BPM.

import { requireUserAuth } from "../_shared/user-auth.ts";
import { processar_triagem_brisa } from "../_shared/brisa-ai.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { GATEWAY_GEMINI_PRIMARY, GATEWAY_NO_REASONING } from "../_shared/gemini.ts";
import { EDILSON_ON_SUPERVISION, OT_FIRST_STEP_NOTICE } from "../_shared/clinic-info.ts";

/** Cérebro da Brisa por voz. Se o modelo não responder, cai no modelo padrão do gateway. */
const BRISA_VOICE_MODEL = "google/gemini-3.8-flash";
const MAX_REPLY_CHARS = 700;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_API_KEY = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
/** Limite de cada tentativa rápida antes de passar para a próxima. */
const FAST_TIMEOUT_MS = 8000;

/** Corta a resposta no fim de uma frase, para a voz nunca parar no meio de uma palavra. */
function cortarEmFrase(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const trecho = texto.slice(0, max);
  const fim = Math.max(trecho.lastIndexOf(". "), trecho.lastIndexOf("? "), trecho.lastIndexOf("! "));
  return fim > max * 0.4 ? trecho.slice(0, fim + 1) : trecho.slice(0, trecho.lastIndexOf(" ")) + ".";
}

const EXAMES_DA_PAGINA = `EXAMES DA PÁGINA MONITORAMENTO DE SAÚDE (plantayraiz.com.br/monitoramento-saude)
São 11 exames de triagem feitos pelo próprio celular. Usar é gratuito; os exames lidos pela inteligência artificial pedem cadastro gratuito, e o resultado fica guardado em Meus Exames. Servem para acompanhar a saúde e levar informação ao médico. Nenhum dá diagnóstico nem substitui exame presencial. A leitura é feita de verdade na foto, no som ou no movimento enviado; se o material não serve, a Brisa pede para repetir em vez de dar resultado.
1. Monitor Cardíaco (batimentos): a pessoa cobre a câmera de trás e o flash com a ponta do dedo indicador e fica parada e em silêncio. A câmera percebe a variação de cor do sangue a cada batida e calcula os batimentos por minuto e a variabilidade da frequência, que ajuda a estimar o nível de estresse e de recuperação. Funciona melhor com pouca luz no ambiente. Em repouso, de 60 a 100 batimentos por minuto é o esperado para adultos.
2. Fundo de Olho: a pessoa fotografa o olho de perto com a câmera de trás, com boa luz, ou envia uma foto da galeria. A inteligência artificial lê a foto e descreve o que aparece. A retina só aparece com lente ou adaptador de fundoscopia no celular; sem ele, a leitura fica limitada à parte externa do olho, como vermelhidão ou opacidade, e a Brisa avisa que o fundo não pôde ser avaliado. Qualquer sinal de alerta precisa de oftalmologista.
3. Oximetria: a pessoa mede a saturação de oxigênio em um oxímetro de dedo e registra o valor na página, que classifica e orienta. A página não mede a saturação pela câmera. Valores a partir de 95 por cento são o esperado; abaixo de 90 é motivo para procurar atendimento.
4. Análise de pinta ou lesão de pele: a pessoa fotografa a pinta de perto, com boa luz e uma moeda ou régua ao lado para dar noção de tamanho. A inteligência artificial lê a foto pela regra ABCDE: assimetria, bordas, cor, diâmetro e evolução. Uma foto só não mostra evolução; o ideal é repetir em 30 dias. Pinta que muda de tamanho, cor ou formato, coça ou sangra precisa de dermatologista.
5. Mobilidade Articular: a pessoa escolhe a articulação, informa a dor de 0 a 10, apoia o celular, fica de lado para a câmera de corpo inteiro, vai até o limite do movimento e fica parada; a foto é tirada sozinha depois de uma contagem. A inteligência artificial estima o ângulo na foto, com margem de erro de cerca de 15 graus, e compara com a referência. Limitação ou dor forte pedem médico ou fisioterapeuta.
6. Estetoscópio Digital: grava o som do coração pelo microfone. É preciso um quarto em silêncio, tirar a capinha, encostar a parte de baixo do celular direto na pele do lado esquerdo do peito e ficar 15 segundos sem falar. Fone com microfone ou microfone de lapela melhora o resultado.
7. Ausculta Pulmonar: grava a respiração por 20 segundos com o microfone encostado no peito ou nas costas, respirando de boca aberta e dizendo trinta e três. A inteligência artificial procura sons como chiado.
8. Tremorometria: mede tremor das mãos pelo sensor de movimento do celular. A pessoa fica em pé, estende o braço para a frente segurando o aparelho e tenta manter o alvo no centro da tela. No iPhone é preciso aceitar a permissão de movimento.
9. Urinálise: lê tira reagente de urina, que a pessoa compra em farmácia. Molha a tira, coloca sobre papel branco, espera um minuto no cronômetro da página e fotografa de perto com o flash ligado. A leitura é pelas cores dos quadradinhos.
10. Acuidade Visual: teste de visão com a letra E. Celular a uns 40 centímetros, um olho coberto de cada vez, e a pessoa indica para que lado as pernas da letra apontam enquanto ela diminui.
11. Rastreador GPS Cardíaco: para caminhada ou corrida ao ar livre. Com a localização autorizada, registra trajeto, distância, velocidade, passos e calorias. É melhor não bloquear a tela durante a atividade.
Depois dos exames, a pessoa pode baixar o relatório em PDF na própria página e levar para a consulta.`;

const FLUXOS_DA_PLATAFORMA = `COMO A PLANTA Y RAIZ FUNCIONA
- Cadastro gratuito, em menos de um minuto. Paciente: plantayraiz.com.br/cadastro. Médico e profissional de saúde: página de cadastro profissional. Farmácia, associação e parceiro: página de cadastro de farmácia. A plataforma é de telemedicina com foco em cannabis medicinal.
- LINKS NA TELA: quando a pessoa pede cadastro, consulta, orientação, aplicativo, planos, relatório ou indicação, o botão com o link certo aparece na tela logo abaixo da sua resposta. Diga isso com naturalidade, por exemplo "já deixei o botão do cadastro aqui na tela, é só tocar". Não dite endereço de site letra por letra.
- CONVITE AO CADASTRO: o objetivo é que cada visitante crie o cadastro gratuito. Depois de responder à dúvida, convide com simpatia, em uma frase, sem insistir e sem repetir o convite em toda resposta seguida. Se a pessoa pedir cadastro sem dizer quem é, pergunte se é paciente, médico ou parceiro; os três botões aparecem na tela.
- Orientação Técnica, 30 reais no Pix: conversa educativa de até 30 minutos com o ${EDILSON_ON_SUPERVISION}. ${OT_FIRST_STEP_NOTICE}
- Consulta médica: por chat 100 reais, por vídeo 150 reais, retorno 90 reais. O paciente escolhe o médico na página Profissionais, paga com Pix ou cartão, responde a uma triagem de 5 perguntas e entra na sala. Médico com bolinha verde está disponível agora; amarela quer dizer que está em consulta.
- Se o médico escolhido não puder atender na hora, o sistema chama outros médicos e o paciente fica garantido na sala de espera, com aviso na tela e por WhatsApp. Também dá para agendar um horário publicado pelo médico.
- Na consulta, o médico decide se há indicação de tratamento. Quando indica, emite a receita em PDF com assinatura digital, que o paciente baixa na página da consulta. Só o médico prescreve; a Brisa e a Orientação Técnica não prescrevem.
- No fim, o paciente avalia o atendimento e recebe um código de indicação para compartilhar.
- Médicos: fazem o cadastro profissional, enviam os documentos, aguardam a aprovação da equipe e precisam abrir o Consultório e ligar o botão ON para receber pacientes. O guia completo está em plantayraiz.com.br/manual.
- O site pode ser instalado como aplicativo no celular pela página de download.
- Se a pessoa perguntar algo que você não sabe sobre a plataforma, diga que não tem essa informação e sugira o atendimento pelo WhatsApp da clínica. Nunca invente preço, prazo, médico ou resultado.`;

interface ChatBody {
  transcript?: string;
  contextBpm?: number | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  now?: { iso?: string; human?: string; timezone?: string };
  /** Exame aberto na tela, quando houver (ex.: "Fundo de Olho"). */
  activeExam?: string;
}

function classificarBpm(bpm: number): string {
  if (bpm < 50) return "bradicardia (abaixo de 50)";
  if (bpm < 60) return "abaixo do normal (50-59)";
  if (bpm <= 100) return "normal e saudável (60-100)";
  if (bpm <= 120) return "elevado (101-120)";
  return "taquicardia (acima de 120)";
}

function montarSystemPrompt(body: ChatBody): string {
  const agora = body.now?.human
    || new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  const bpmNum = Number(body.contextBpm);
  body.contextBpm = Number.isFinite(bpmNum) && bpmNum >= 20 && bpmNum <= 250 ? Math.round(bpmNum) : (undefined as any);
  const bpmTrecho = body.contextBpm
    ? `O paciente acabou de medir ${body.contextBpm} BPM — classificação: ${classificarBpm(body.contextBpm)}. Se ele pedir, leia esse resultado em voz alta de forma calma e sugira uma consulta com um dos médicos da plataforma se estiver fora da faixa normal.`
    : `Você não tem acesso ao resultado de nenhum exame desta pessoa. Se ela pedir que leia ou interprete um resultado, diga isso e explique como fazer o exame na página.`;

  const exame = String(body.activeExam || "").replace(/[^\p{L}\p{N} ()-]/gu, "").slice(0, 60);
  const exameTrecho = exame
    ? `A pessoa está com o exame "${exame}" aberto na tela. Se a pergunta for vaga, responda sobre esse exame.`
    : "A pessoa está na lista de exames, sem nenhum aberto.";

  return `Você é a Enfª Brisa, porta-voz oficial da Planta y Raiz Ltda (MEGA CLÍNICA DIGITAL).

PERSONA DE VOZ:
- Você é a anfitriã da plataforma: recebe cada pessoa com simpatia, como uma enfermeira brasileira experiente, calorosa e segura.
- Fale como gente fala em uma conversa: frases curtas e ligadas, ritmo fluido, sem soar como leitura de manual. Pode começar com expressões naturais como "Claro", "Olha", "Então" ou "Boa pergunta".
- Responda primeiro ao que a pessoa perguntou. De 2 a 5 frases. Se o assunto pedir um passo a passo, explique na ordem e pergunte se quer mais detalhes.
- Termine, quando fizer sentido, com uma pergunta curta ou um convite ao próximo passo.
- Tudo o que você escreve será falado em voz alta: sem markdown, asteriscos, emojis, links, listas ou siglas soltas. Escreva "batimentos por minuto" em vez de BPM e "saturação de oxigênio" em vez de SpO2. Valores em reais por extenso simples, como "30 reais".
- Trate com respeito: "o senhor", "a senhora", "por favor". Nunca use "querido", "querida", "amor", "meu bem", "fofo" ou "linda".
- Você não dá diagnóstico, não interpreta exame como doença e não indica dose ou medicamento. Explica como os exames funcionam e orienta a procurar o médico.

${EXAMES_DA_PAGINA}

${FLUXOS_DA_PLATAFORMA}

CURRÍCULO DOS MÉDICOS DA NOSSA VITRINE:
Quando o usuário perguntar se um médico é bom, especialista ou quem atende, dite o resumo das credenciais reais:
- Prof. Dr. Luiz Roberto Medina dos Santos (CRM 11496/SC): Livre-Docente e Doutor pela FMUSP, residência no HC-USP, 50 anos de carreira, Coordenador de Prescrição da SBEC, autor do Guia Prático de Prescrição de Cannabis. Referência máxima em dor crônica, oncologia e cuidados paliativos.
- Dr. Victor Henrique Bueno da Fonseca (CRM 206873/SP): Formado pela UNIRIO, pós em Psiquiatria, Endocrinologia e Acupuntura, Certificado Internacional pela WeCann Academy, membro da Sociedade Latino-Americana de Dor (LAPS), mais de 7 anos e mais de 10 mil pacientes atendidos em saúde mental integrativa, ansiedade, TEA, TDAH e dor crônica.
- Dra. Grace Adriana Lopes Conceição (CRM 190.386/SP e CRM 10372/BA): Formada pela Escola Bahiana de Medicina (EBMSP), pós em Psiquiatria pelo IPEMED, extensão em Saúde Mental pela UNIFESP, membro da SBEC, 34 anos de liderança em psiquiatria (ex-Diretora Geral do Hospital Juliano Moreira), especialista em insônia crônica, depressão e ansiedade.
- Dr. João Pedro Girardello Detoni (CRM 42912/RS, RQE 35641): Formado pela Universidade de Passo Fundo com RQE em Clínica Médica, Professor da URI Erechim, referência em dor crônica, fibromialgia, ansiedade e longevidade.
- Dr. Diego Cartaxo Jácome (CRM 14828/PB): Formado pela FCMPB, foco em Nutrologia, saúde metabólica, controle da inflamação crônica, regulação do sono e vitalidade.
- Dr. José Geraldo Barbugli Abbade Filho (CRM 32584/MG, RQE 12598): Formado pela tradicional EMESCAM em 1989, 37 anos de medicina, Especialista com RQE em Medicina do Trabalho, pioneiro no tratamento de dores osteomusculares (LER/DORT, coluna, fibromialgia), estresse e burnout.
- Dra. Mariana Alves Rezende (CRM 135012-9/RJ): Formada pela UFAC, especialista em fitoterapia, saúde preventiva e canabinoides, com pesquisas científicas comunitárias na Amazônia.
- Dr. Daniel Kobayashi Colombo (CRM 10346/MT): Formado pela UNIR em 2018, ampla experiência em atenção primária e urgência, clínica geral integrativa, dor e sono.
- Dra. Ana Paula Ferreira Lima (CRM 36942/PR): Formada pela UNOESTE, 10 anos de experiência, fundadora do projeto Acolhe Ela para mulheres neurodivergentes (TEA/TDAH), dor crônica e fibromialgia.
- Dra. Suelen Naves Rodrigues (CRM 49354/PR): Supervisora Técnica da Planta y Raíz, especialista em anestesiologia (SAMU/UNIOESTE) e governança clínica.
- Dr. Sadi Roberto Menta (CRM 16301/SC, RQE 21448): Formado pela UFPEL em 1999 (25 anos de carreira), Especialista em Perícia Médica e pós em psiquiatria e autismo.
- Dr. Eduardo Miguéis Corrêa (CRMV 19333/SP) e Dr. Otávio Paiva Bassete (CRMV 21907/PR): Médicos veterinários parceiros para terapias integrativas e canabinoides em animais.

DICAS PRÁTICAS DE SAÚDE:
- Ansiedade: recomende respirar pelo diafragma no ritmo 4-7-8 (inspire 4s, retenha 7s, solte 8s) e mencione o equilíbrio proporcionado pelo CBD no sistema nervoso.
- Sono: recomende afastar telas 1 hora antes de dormir, quarto fresco e escuro, e avaliação médica para fitocanabinoides que promovem sono profundo.
- Dor: sugira não forçar articulações em crise, aplicar compressas adequadas e agendar avaliação médica na vitrine para titulação segura.

CONTEXTO DESTA CONVERSA:
- Data e hora: ${agora}.
- ${exameTrecho}
- ${bpmTrecho}
- Faixas de BPM: abaixo de 60 é bradicardia, de 60 a 100 é ritmo normal e saudável, acima de 100 é taquicardia.
- Se houver sintoma preocupante, dor no peito ou falta de ar grave, oriente procurar atendimento de emergência ou SAMU 192.`;
}

// Per-IP rate limit: 30 req/min
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 30;
const MAX_TRANSCRIPT = 1000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const cur = ipHits.get(ip);
  if (!cur || cur.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (cur.count >= RL_MAX) return false;
  cur.count++;
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authDenied = await requireUserAuth(req, corsHeaders);
  if (authDenied) return authDenied;

  const json = (body: unknown, status = 200) => {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    if (!rateLimit(ip)) {
      return json({ ok: false, error: "rate_limited" }, 429);
    }

    const body = (await req.json()) as ChatBody;
    const transcript = (body.transcript || "").trim().slice(0, MAX_TRANSCRIPT);

    if (!transcript) {
      return json({ ok: true, transcript: "[silêncio]", reply: "Olá, sou a Enfª Brisa. Em que posso ajudar hoje?" });
    }

    const systemPrompt = montarSystemPrompt(body);

    const history = (Array.isArray(body.history) ? body.history : []).slice(-8)
      .map((h) => ({ role: h?.role === "assistant" ? "assistant" : "user", content: String(h?.content || "").slice(0, MAX_TRANSCRIPT) }));
    const perguntar = (model: string) =>
      processar_triagem_brisa(transcript, "monitoramento-saude-web", "web_voice", { history, systemPrompt, model, log: false });

    // Voz precisa de resposta rápida: tentativas únicas, cada uma com limite de tempo, primeiro
    // direto no Google (não depende dos créditos do gateway) e depois no gateway. Só se todas
    // falharem entra o caminho padrão, que repete e usa provedores de reserva.
    const t0 = Date.now();
    const messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: transcript }];
    const tentativas: Array<{ nome: string; url: string; key: string; body: Record<string, unknown>; ms: number }> = [];
    if (LOVABLE_API_KEY) {
      tentativas.push({
        nome: "gateway/" + BRISA_VOICE_MODEL, url: LOVABLE_URL, key: LOVABLE_API_KEY, ms: FAST_TIMEOUT_MS,
        body: { model: BRISA_VOICE_MODEL, messages, temperature: 0.8, top_p: 0.95, max_tokens: 600, reasoning: GATEWAY_NO_REASONING },
      });
    }
    if (GEMINI_API_KEY) {
      tentativas.push({
        nome: "google/gemini-2.5-flash", url: GEMINI_URL, key: GEMINI_API_KEY, ms: FAST_TIMEOUT_MS,
        body: { model: "gemini-2.5-flash", messages, temperature: 0.8, top_p: 0.95, max_tokens: 600, reasoning_effort: "none" },
      });
    }

    let usedModel = "";
    let fastReply = "";
    const falhas: string[] = [];
    for (const t of tentativas) {
      try {
        const res = await fetch(t.url, {
          method: "POST",
          headers: { Authorization: "Bearer " + t.key, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(t.ms),
          body: JSON.stringify(t.body),
        });
        if (!res.ok) {
          falhas.push(t.nome + ":http_" + res.status);
          console.error("[brisa-voice-chat]", t.nome, res.status, (await res.text().catch(() => "")).slice(0, 200));
          continue;
        }
        const data = await res.json();
        fastReply = String(data?.choices?.[0]?.message?.content || "").trim();
        if (fastReply) { usedModel = t.nome; break; }
        falhas.push(t.nome + ":empty");
      } catch (e) {
        falhas.push(t.nome + ":" + (e instanceof Error ? e.name : "exception"));
      }
    }

    let result = { ok: Boolean(fastReply), reply: fastReply };
    if (!result.ok) {
      usedModel = "padrao/" + GATEWAY_GEMINI_PRIMARY;
      result = await perguntar(GATEWAY_GEMINI_PRIMARY);
    }
    const meta = { model: usedModel, ms: Date.now() - t0, falhas: falhas.length ? falhas : undefined };

    const reply = (result.reply || "Estou aqui com você. Pode me contar de novo o que está sentindo?")
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return json({ ok: true, transcript, reply: cortarEmFrase(reply, MAX_REPLY_CHARS), meta });
  } catch (e) {
    console.error("[brisa-voice-chat] error:", e);
    return json({ ok: true, reply: "Tive um probleminha agora, mas estou de volta. Pode repetir sua pergunta?" });
  }
});
