import { getCorsHeaders } from "../_shared/cors.ts";
import { GEMINI_PRIMARY_MODEL, callGeminiApiWithFallback } from "../_shared/gemini.ts";

const SYSTEM_PROMPT = `Você é o **Guia Regulatório e Direitos do Paciente** da Planta y Raíz, um assistente especializado em esclarecer dúvidas de pacientes, familiares e prescritores sobre a legislação sanitária brasileira de Cannabis Medicinal e direitos de saúde.

### DIRETRIZ REGULATÓRIA OBRIGATÓRIA (CÓDIGO DE ÉTICA DA OAB & CFM):
- Você atua com caráter **estritamente educativo, explicativo e informativo** sobre normas sanitárias públicas e regulamentação da Anvisa.
- NUNCA utilize termos como "Assistência Jurídica", "Advogado Virtual" ou "Consultoria Jurídica".
- Esclareça que suas respostas não substituem a consulta com advogado habilitado ou com médico especialista.

### TOM DE VOZ E ESTILO:
- Acolhedor, didático, seguro, objetivo e fundamentado na legislação vigente.
- Use formatação Markdown limpa: tópicos curtos com marcadores, destaques em **negrito** e espaçamento agradável.
- Evite blocos de texto maçantes. Máximo de 3 a 5 parágrafos curtos ou lista com tópicos.

### BASE DE CONHECIMENTO REGULATÓRIO & TÉCNICO:

1. **RDC 660/2022 da Anvisa (Importação Direta por Pessoa Física)**:
   - Permite a importação de produtos de Cannabis para uso próprio e exclusivo para tratamento de saúde.
   - Requisitos obrigatórios: prescrição médica emitida por médico legalmente habilitado no Brasil e solicitação eletrônica no portal gov.br (serviço "Importar produto derivado de Cannabis").
   - A autorização da Anvisa é individual, gratuita, com emissão automatizada e validade de 2 anos.
   - A compra e frete internacional ocorrem em nome e CPF do próprio paciente.

2. **RDC 327/2019 da Anvisa (Produtos em Farmácias Brasileiras)**:
   - Regulamenta produtos com Autorização Sanitária comercializados em drogarias e farmácias convencionais.
   - Exigência de Notificação de Receita C1 (branca especial em duas vias) para produtos com THC até 0,2%.
   - Exigência de Notificação de Receita B1 (azul) para produtos com THC acima de 0,2% (indicados para cuidados paliativos ou refratariedade comprovada).
   - Não requer autorização prévia de importação no gov.br quando comprado na farmácia nacional.

3. **Viagens de Avião e Transporte pelo Brasil (Voos Domésticos e Internacionais)**:
   - **Voos Nacionais**: É 100% legal e seguro transportar o medicamento em bagagem de mão ou despachada dentro do território nacional, desde que o paciente porte: (a) Receita médica original válida; (b) Autorização de importação da Anvisa (se o produto for importado via RDC 660); (c) Produto em sua embalagem original rotulada com identificação do paciente.
   - **Voos Internacionais**: Sempre verificar a legislação específica do país de escala e de destino, pois as leis sobre Cannabis variam amplamente em cada jurisdição. Recomenda-se obter declaração do médico em inglês/espanhol.

4. **Planos de Saúde e SUS (Cobertura e Ações Judiciais)**:
   - Jurisprudência consolidada do Superior Tribunal de Justiça (STJ) e Tribunais Estaduais (TJSP, TJRJ, TJMG, etc.): o plano de saúde não pode determinar o tratamento que o médico assistente prescreveu.
   - Requisito fundamental: **Laudo Médico Circunstanciado** detalhado, atestando o esgotamento ou ineficácia das terapias convencionais (refratariedade clínica), CID da patologia e justificativa técnica da necessidade do fitocanabinoide.
   - A negativa indevida do plano ou do SUS pode ser contestada judicialmente com suporte de advogado ou Defensoria Pública.

5. **Habeas Corpus Preventivo para Cultivo Terapêutico (Salvo-Conduto)**:
   - Ação constitucional que impede a prisão ou apreensão de plantas de quem realiza auto-cultivo para fins medicinais.
   - Documentos essenciais: (1) Prescrição médica com dosagem e relação CBD/THC; (2) Laudo médico circunstanciado comprovando evolução e refratariedade; (3) Comprovação de hipossuficiência financeira diante do alto custo contínuo de importação; (4) Certificado de capacitação em cultivo e laudo/projeto agronômico.

### GATILHO DE CONVERSÃO OBRIGATÓRIO (CTA):
- Em TODAS as respostas, finalize convidando o usuário de maneira natural para agendar uma teleconsulta na plataforma Planta y Raíz para obter sua prescrição médica digital, laudo circunstanciado ou renovação do tratamento com médicos especialistas.
- Inclua a menção: *"Você pode agendar sua teleconsulta com nossos médicos prescritores pelo link abaixo ou na aba /telemedicina."*`;

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json().catch(() => ({ messages: [] }));

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Lista de mensagens vazia ou inválida" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()?.content || "";
    const lowerQuestion = lastUserMessage.toLowerCase();

    // 1. Tentar chamada à API do Google Gemini
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (GEMINI_API_KEY) {
      try {
        const geminiContents = [
          { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nHistórico da conversa:\n${messages.map((m: any) => `${m.role === 'user' ? 'Paciente' : 'Assistente'}: ${m.content}`).join('\n')}\n\nResponda à última dúvida do paciente:` }] }
        ];

        const geminiRes = await callGeminiApiWithFallback(
          GEMINI_API_KEY,
          {
            contents: geminiContents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1024,
            },
          },
          GEMINI_PRIMARY_MODEL
        );

        if (geminiRes.ok && geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const aiReply = geminiRes.data.candidates[0].content.parts[0].text;
          return new Response(
            JSON.stringify({
              reply: aiReply,
              source: "gemini_ai",
            }),
            { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
      } catch (geminiErr) {
        console.warn("[regulatory-assistant] Gemini API error, using knowledge fallback:", geminiErr);
      }
    }

    // 2. Fallback Base de Conhecimento Especializada caso offline ou sem chave
    let reply = "";
    if (lowerQuestion.includes("importar") || lowerQuestion.includes("rdc 660") || lowerQuestion.includes("autorização") || lowerQuestion.includes("gov.br")) {
      reply = `### Como funciona a autorização da Anvisa para importar (RDC 660/2022)?

A importação de derivados de Cannabis medicinal para uso próprio por pessoa física é regulamentada pela **RDC 660/2022 da Anvisa**. O processo é 100% digital e gratuito:

1. **Consulta Médica & Prescrição**: Você passa por atendimento com um médico habilitado que emite a receita médica digital contendo nome do paciente, produto, posologia e justificativa clínica.
2. **Cadastro no Portal Gov.br**: Você acessa o serviço *"Solicitar Autorização para Importação de Produto derivado de Cannabis"* com sua conta gov.br.
3. **Emissão da Autorização**: O sistema da Anvisa gera a autorização em seu nome com validade de **2 anos**.
4. **Despacho e Entrega**: Com a receita e autorização, o medicamento é despachado internacionalmente direto para o seu endereço residencial no Brasil.

👉 **Precisa de receita ou renovação?** Nossos médicos especialistas em Cannabis Medicinal atendem por telemedicina com emissão de receita padrão Anvisa.`;
    } else if (lowerQuestion.includes("avião") || lowerQuestion.includes("viagem") || lowerQuestion.includes("viajar") || lowerQuestion.includes("aeroporto") || lowerQuestion.includes("voo")) {
      reply = `### Posso viajar de avião pelo Brasil com meu medicamento?

**Sim! O porte do medicamento em voos domésticos dentro do Brasil é totalmente legal e garantido.**

Para uma viagem 100% tranquila, siga estas orientações:
- 📄 **Receita Médica Original**: Mantenha uma cópia legível (digital ou impressa) da receita médica válida.
- 🏛️ **Autorização da Anvisa**: Caso o produto seja importado pela RDC 660/2022, leve o documento de autorização em PDF no celular.
- 📦 **Embalagem Original**: Mantenha o medicamento no frasco original rotulado com seu nome e lote.
- 🎒 **Bagagem de Mão**: Transporte sempre na mala de mão para evitar variações extremas de temperatura no porão da aeronave e facilitar eventual apresentação na inspeção de raio-X.

*Nota para viagens internacionais:* Cada país possui legislação própria sobre substâncias controladas. Nunca embarque para o exterior sem consultar previamente o consulado do país de destino.

👉 **Precisa atualizar seu laudo ou receita médica antes de viajar?** Nossos médicos realizam consultas online imediatas.`;
    } else if (lowerQuestion.includes("plano") || lowerQuestion.includes("sus") || lowerQuestion.includes("obrigado") || lowerQuestion.includes("cobrir") || lowerQuestion.includes("justiça")) {
      reply = `### O plano de saúde ou o SUS são obrigados a cobrir o tratamento?

**Sim, de acordo com a jurisprudência consolidada do Superior Tribunal de Justiça (STJ) e dos Tribunais Estaduais.**

Entenda os critérios fundamentais:
- 🩺 **Autonomia Médica**: Os tribunais entendem que cabe ao médico especialista, e não à operadora do plano, definir a melhor conduta terapêutica para o paciente.
- 📋 **Refratariedade Clínica**: É necessário que o médico ateste em **Laudo Circunstanciado** que as alternativas farmacológicas convencionais já foram utilizadas e foram ineficazes ou causaram efeitos colaterais intoleráveis.
- ⚖️ **Ação de Obrigação de Fazer**: Havendo recusa formal do plano ou do SUS, o paciente pode acionar a Justiça (por meio de advogado particular ou Defensoria Pública) solicitando tutela de urgência (liminar) para fornecimento contínuo.

👉 **O ponto de partida é um Laudo Médico detalhado.** Nossos médicos na Planta y Raíz emitem laudos completos para instrução de pedidos e acompanhamento clínico.`;
    } else if (lowerQuestion.includes("habeas") || lowerQuestion.includes("cultivo") || lowerQuestion.includes("plantar") || lowerQuestion.includes("salvo")) {
      reply = `### Quais laudos e documentos são exigidos para Habeas Corpus de Cultivo?

O Habeas Corpus Preventivo (Salvo-Conduto) é a via constitucional que protege o paciente que realiza o auto-cultivo terapêutico. Para concessão da ordem judicial, os tribunais exigem prova pré-constituída sólida:

1. 📄 **Laudo Médico Circunstanciado**: Emitido por médico prescritor, comprovando a patologia (CID), a eficácia demonstrada do tratamento com fitocanabinoides e a ineficácia das medicações alopáticas tradicionais.
2. 💊 **Prescrição Médica Detalhada**: Com indicação clara da dosagem diária, concentração e posologia necessária.
3. 💰 **Comprovação de Hipossuficiência / Custo**: Demonstrar a desproporção financeira do custo contínuo de importação dos óleos em relação à renda familiar.
4. 🌱 **Projeto Agronômico & Certificados**: Laudo de engenheiro agrônomo sobre a quantidade de plantas necessárias e certificado de cursos de extração/cultivo terapêutico.

👉 **Inicie pelo acompanhamento médico regular.** Nossos especialistas fornecem o suporte clínico e os laudos técnicos necessários para o seu histórico de saúde.`;
    } else {
      reply = `### Guia Regulatório e Direitos do Paciente — Planta y Raíz

Acesso a tratamentos com Cannabis Medicinal no Brasil é respaldado por sólida regulamentação sanitária:

- **RDC 660/2022 (Anvisa)**: Autoriza a importação direta para pessoa física mediante prescrição e cadastro no gov.br.
- **RDC 327/2019 (Anvisa)**: Disponibiliza produtos nas farmácias brasileiras com receita de controle especial (C1 ou B1).
- **Transporte em Viagens**: Permitido em território nacional portando receita válida, autorização da Anvisa e embalagem identificada.
- **Direito à Saúde**: Jurisprudência reconhece o direito ao fornecimento pelo plano de saúde ou SUS em casos de refratariedade comprovada por laudo médico.

*Assistente informativo. Para orientações jurídicas específicas, consulte um advogado habilitado.*

👉 **Deseja iniciar seu tratamento ou obter sua receita digital?** Agende uma teleconsulta com nossos médicos especialistas na plataforma.`;
    }

    return new Response(
      JSON.stringify({
        reply,
        source: "regulatory_knowledge_base",
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[regulatory-assistant] Handler error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro no assistente regulatório" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
