// 👁️ Brisa Exam Vision — leitura real de imagem dos exames de triagem (fundo de olho, pele, mobilidade).
// A IA descreve só o que está na foto enviada. Sem foto utilizável, não há resultado.
// A imagem não é armazenada: é enviada ao modelo e descartada.
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuthedUser, rateLimit, assertPayloadSize } from "../_shared/ai-guard.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || Deno.env.get("GEMINI_API_KEY") || "";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/** ~4,5 MB de imagem em base64. */
const MAX_IMAGE_CHARS = 6_000_000;

type ExamType = "fundoscopy" | "dermatoscopy" | "mobility";
type Attention = "sem_sinais" | "acompanhar" | "atencao" | "urgente" | "indeterminado";
const ATTENTION: Attention[] = ["sem_sinais", "acompanhar", "atencao", "urgente", "indeterminado"];

const JOINTS: Record<string, string> = {
  Ombro: "flexão ou abdução de 0 a 180 graus",
  Cotovelo: "flexão de 0 a 145 graus",
  Punho: "flexão de 0 a 80 graus e extensão de 0 a 70 graus",
  Quadril: "flexão de 0 a 120 graus",
  Joelho: "flexão de 0 a 135 graus",
  Tornozelo: "dorsiflexão de 0 a 20 graus e flexão plantar de 0 a 50 graus",
};

const REGRAS_GERAIS = `Você é a Enfª Brisa, da Planta y Raiz, fazendo a leitura de um exame de TRIAGEM enviado pelo paciente pelo celular.

REGRAS OBRIGATÓRIAS:
- Descreva somente o que está visível na imagem enviada. Nunca invente achado, medida ou número. Se não dá para ver, diga que não dá para ver.
- Primeiro avalie se a imagem serve para o exame. Se estiver escura, tremida, fora de foco, mostrar outra coisa ou não mostrar a estrutura necessária, responda com "image_ok": false, explique o problema em "image_problem", diga em "brisa_summary" como refazer a foto e deixe "observations" e "measurements" vazios, com "attention": "indeterminado".
- Você não dá diagnóstico e não cita nome de doença como conclusão. Fale em "sinais que merecem avaliação". Não indique remédio nem dose.
- Linguagem simples, acolhedora e respeitosa ("o senhor", "a senhora"), sem termos íntimos. "brisa_summary" será lido em voz alta: de 3 a 5 frases, sem siglas, listas, markdown ou emojis.
- "doctor_advice" sempre orienta procurar um médico e diz qual especialidade. Em sinal de urgência, oriente pronto-socorro ou SAMU 192.

Responda EXATAMENTE um JSON válido:
{
  "image_ok": true | false,
  "image_problem": "texto curto, vazio se a imagem serve",
  "attention": "sem_sinais" | "acompanhar" | "atencao" | "urgente" | "indeterminado",
  "observations": ["o que foi visto na imagem, uma frase por item"],
  "measurements": [{"label": "nome", "value": "valor ou avaliação"}],
  "brisa_summary": "explicação falada da Brisa",
  "orientation": ["cuidado ou próximo passo prático"],
  "doctor_advice": "frase final orientando procurar o médico"
}`;

function promptDoExame(exam: ExamType, context: Record<string, unknown>): string {
  if (exam === "fundoscopy") {
    return `EXAME: fundo de olho (fundoscopia) por foto de celular.
- A retina só aparece quando a foto é feita através da pupila, com lente ou adaptador próprio; ela aparece como um fundo alaranjado ou avermelhado com vasos e o disco óptico. Foto comum do olho mostra só a parte externa (pálpebras, íris, pupila, parte branca).
- Se a imagem mostrar a retina: descreva disco óptico, vasos, mácula e qualquer mancha, sangramento ou área esbranquiçada visível.
- Se a imagem mostrar apenas a parte externa do olho: use "image_ok": true, deixe claro em "observations" e em "brisa_summary" que a retina não aparece e que por isso o fundo de olho não pôde ser avaliado. Descreva só o que se vê por fora (vermelhidão, secreção, opacidade na pupila, diferença de tamanho entre pupilas, pálpebra caída). Sem sinal externo, use "attention": "indeterminado".
- Em "measurements" coloque: "Retina visível" (sim ou não) e "Qualidade da imagem".
- Especialidade para "doctor_advice": oftalmologista. Perda súbita de visão, dor forte no olho ou flashes de luz são urgência.`;
  }
  if (exam === "dermatoscopy") {
    return `EXAME: foto de pinta ou lesão de pele, avaliada pela regra ABCDE.
- Em "measurements" devolva exatamente estes cinco itens, com a avaliação do que se vê: "A - Assimetria", "B - Bordas", "C - Cor", "D - Diâmetro", "E - Evolução".
- Diâmetro: só estime se houver referência de tamanho na foto (régua, moeda, dedo). Sem referência, escreva "não dá para medir pela foto".
- Evolução: uma foto só não mostra mudança ao longo do tempo. Escreva "não avaliável em uma única foto" e oriente fotografar de novo em 30 dias para comparar.
- Assimetria, bordas irregulares, várias cores, ferida que não cicatriza ou sangramento visível pedem "attention": "atencao".
- Nunca diga que a lesão é benigna ou que está tudo bem; no máximo "não vi sinais de alerta nesta foto".
- Especialidade para "doctor_advice": dermatologista.`;
  }
  const joint = String(context.joint || "");
  const range = JOINTS[joint] || "amplitude de referência da articulação";
  const pain = Number(context.pain_level);
  return `EXAME: amplitude de movimento da articulação "${joint || "não informada"}", por uma foto da pessoa parada no ponto máximo do movimento.
- Referência para adultos: ${range}.
- Dor informada pelo paciente no movimento, de 0 a 10: ${Number.isFinite(pain) ? pain : "não informada"}.
- Se a articulação e os segmentos do corpo ao redor dela não estiverem visíveis e inteiros na foto, use "image_ok": false e peça nova foto de corpo inteiro, de lado, com boa luz.
- Estime o ângulo pela posição dos segmentos. É uma estimativa visual com margem de erro de cerca de 15 graus: diga isso em "brisa_summary".
- Em "measurements" coloque: "Ângulo estimado" (ex.: "cerca de 140 graus"), "Referência" e "Dor informada".
- Amplitude bem abaixo da referência ou dor de 7 para cima pedem "attention": "atencao". Não conclua causa.
- Especialidade para "doctor_advice": ortopedista, reumatologista ou fisioterapeuta.`;
}

async function chamarVisao(system: string, userText: string, imageBase64: string, mimeType: string): Promise<string | null> {
  const messages = [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ],
    },
  ];
  const attempts: Array<{ url: string; key: string; model: string }> = [];
  if (LOVABLE_API_KEY) {
    attempts.push({ url: LOVABLE_URL, key: LOVABLE_API_KEY, model: "google/gemini-3.8-flash" });
    attempts.push({ url: LOVABLE_URL, key: LOVABLE_API_KEY, model: "google/gemini-2.5-flash" });
  }
  if (GEMINI_API_KEY) {
    attempts.push({ url: GEMINI_URL, key: GEMINI_API_KEY, model: "gemini-2.5-flash" });
  }

  for (const a of attempts) {
    try {
      const res = await fetch(a.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${a.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: a.model, messages, temperature: 0.1, response_format: { type: "json_object" } }),
      });
      if (!res.ok) {
        console.error(`[brisa-exam-vision] ${a.model} HTTP ${res.status}`, (await res.text().catch(() => "")).slice(0, 200));
        continue;
      }
      const data = await res.json();
      const text = String(data?.choices?.[0]?.message?.content || "").trim();
      if (text) return text;
    } catch (e) {
      console.error(`[brisa-exam-vision] ${a.model} exception`, e);
    }
  }
  return null;
}

const texto = (v: unknown, max: number) => String(v ?? "").replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const lista = (v: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(v) ? v : []).map((x) => texto(x, maxLen)).filter(Boolean).slice(0, maxItems);

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  // 🔐 Sessão obrigatória + limite por usuário (protege a chave paga de IA).
  const authed = await requireAuthedUser(req, cors);
  if (authed instanceof Response) return authed;
  const limited = await rateLimit({ bucket: "exam_vision", key: authed.userId, maxHits: 8, windowSeconds: 60, cors });
  if (limited) return limited;

  try {
    const body = await req.json();
    const exam = String(body?.exam_type || "") as ExamType;
    if (!["fundoscopy", "dermatoscopy", "mobility"].includes(exam)) return json({ ok: false, error: "exam_type_invalido" }, 400);

    const imageBase64 = String(body?.image_base64 || "");
    const tooBig = assertPayloadSize(imageBase64, MAX_IMAGE_CHARS, cors);
    if (tooBig) return tooBig;
    if (imageBase64.length < 2000 || !/^[A-Za-z0-9+/=]+$/.test(imageBase64)) return json({ ok: false, error: "imagem_ausente" }, 400);
    const mimeType = ["image/jpeg", "image/png", "image/webp"].includes(body?.mime_type) ? body.mime_type : "image/jpeg";
    const context = (body?.context && typeof body.context === "object") ? body.context as Record<string, unknown> : {};

    const raw = await chamarVisao(
      `${REGRAS_GERAIS}\n\n${promptDoExame(exam, context)}`,
      "Faça a leitura desta imagem do exame de triagem seguindo as regras.",
      imageBase64,
      mimeType,
    );
    if (!raw) return json({ ok: false, error: "ia_indisponivel" }, 503);

    // deno-lint-ignore no-explicit-any
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch {
      return json({ ok: false, error: "resposta_invalida" }, 502);
    }

    const imageOk = parsed?.image_ok === true;
    const attention: Attention = imageOk && ATTENTION.includes(parsed?.attention) ? parsed.attention : "indeterminado";
    const doctorAdvice = texto(parsed?.doctor_advice, 400) ||
      "Procure um médico para avaliar pessoalmente. Este exame é só uma triagem.";

    return json({
      ok: true,
      analysis: {
        exam_type: exam,
        image_ok: imageOk,
        image_problem: imageOk ? "" : texto(parsed?.image_problem, 300) || "A imagem não serve para este exame.",
        attention,
        observations: imageOk ? lista(parsed?.observations, 8, 300) : [],
        measurements: imageOk
          ? (Array.isArray(parsed?.measurements) ? parsed.measurements : [])
            .map((m: { label?: unknown; value?: unknown }) => ({ label: texto(m?.label, 60), value: texto(m?.value, 160) }))
            .filter((m: { label: string; value: string }) => m.label && m.value)
            .slice(0, 8)
          : [],
        brisa_summary: texto(parsed?.brisa_summary, 900),
        orientation: lista(parsed?.orientation, 6, 300),
        doctor_advice: doctorAdvice,
        analyzed_at: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("[brisa-exam-vision] error:", e);
    return json({ ok: false, error: "erro_interno" }, 500);
  }
});
