# Citações — revalidação final do teste 6

08/11/2026. Testes executados às 14:12 UTC (11:12 São Paulo).

## Resultado e mudanças desta entrega

As três correções solicitadas já estavam no código da entrega anterior. Foram conferidas novamente, sem reescrever pagamentos, persona/CRM ou aparência. Nesta entrega foi acrescentado um teste de integração da recuperação interna: um registro armazenado como CBD/ansiedade por Berger deve ser descartado quando seu PMID real corresponde a trauma forense por Roberts. As funções `ot-edilson-web` e `clinical-copilot` foram reimplantadas com sucesso.

## 1. Corpo contraditório

O servidor retém a resposta completa e descarta o parágrafo que contém a citação, incluindo descrição em várias linhas, antes de inserir os metadados recebidos do PubMed. Não certifica a interpretação do modelo só porque o link existe.

**Prova:** o teste em `src/lib/pmid-verify.test.ts` recebe “Estudo piloto aberto de Berger et al. (2022)”, link 35112940 e alegação de benefício. A saída não contém Berger, piloto, benefício ou “link confirmado”. Em uma consulta somente bibliográfica, apresenta Roberts JM e o registro conferido. Na pergunta de CBD/ansiedade, não apresenta esse artigo como resposta.

## 2. Pertinência

Título e resumo devem satisfazer ambos os grupos de termos solicitados: CBD/canabidiol/cannabidiol/cannabinoid e ansiedade/anxiety. Quando o usuário pede ensaio randomizado, o tipo PubMed precisa ser `Randomized Controlled Trial`. A existência de um PMID, a origem interna ou uma revisão que menciona ensaios não satisfazem esse filtro.

**Provas:**
- PMID 35112940 é excluído mesmo quando marcado como pertencente à biblioteca.
- Artigo só sobre CBD/dor ou só ansiedade/trauma é rejeitado.
- Revisão que menciona ensaios randomizados é rejeitada como ensaio.
- Novo teste em `src/lib/scientific-context.test.ts`: registro interno falsamente descrito como CBD/ansiedade por Berger é reconferido via resposta EFetch controlada e a recuperação retorna `[]` após receber metadados de trauma forense por Roberts. Nenhum banco real é acessado nesse teste.
- Consulta real à API pública do PubMed: autores 38924898 → Han K; 35112940 → Roberts JM; 29307505 → MacCallum CA. PMID 99999999 ausente. O registro real 35112940 não aparece como evidência para a pergunta solicitada.
- Sem ensaio pertinente, o resultado testado é: “Não encontrei ensaio randomizado sobre isso nos registros conferidos.” Não significa que nenhum ensaio exista em todo o PubMed.

## 3. Perguntas ao médico

Novos relatórios recebem a instrução “você recomenda” e passam pelo normalizador antes de gravar e calcular o hash. Relatórios históricos não são alterados.

**Prova:**

```text
Entrada: Quais alternativas terapêuticas seguras o você/a você recomenda?
Saída:   Quais alternativas terapêuticas seguras você recomenda?
```

O teste também transforma `O senhor(a) recomenda? O senhor/a senhora recomenda?` em `você recomenda? você recomenda?`.

## Execução

```text
bun run test -- src/lib/pmid-verify.test.ts src/lib/orientation-citation-relevance.test.ts src/lib/scientific-context.test.ts src/lib/pubmed-live.test.ts src/lib/copilot-citations.test.ts src/lib/orientation-policy.test.ts src/lib/orientation-code.test.ts src/lib/ot-stream.test.ts
8 arquivos aprovados; 38 testes aprovados.

RUN_PUBMED_LIVE=1 bun run test -- src/lib/orientation-pubmed-live.test.ts
1 arquivo aprovado; 1 teste com PubMed real aprovado.
```

Implantação confirmada pelas ferramentas para as duas funções. Hashes submetidos:
- `ot-edilson-web`: `d4e976fa4faec0aef141a8619683207cad4c6b4e7f2e60752479899cc2d5f410`
- `clinical-copilot`: `f307e475435e0379c6f7dc66b7ac8c2471647e6ae0f265f6d012744d59574262`

A captura auxiliar de saídas fora do executor de testes não rodou por incompatibilidade do import `npm:` no Bun; isso não afetou os 39 testes aprovados no executor do projeto e não é apresentado como prova.

## Publicação e teste de cinco minutos

Estas correções da Orientação estão nas funções já implantadas: não exigem publicar novamente a aparência do site para funcionar na página atual conectada ao Lovable Cloud oficial. Não houve publicação do frontend nem alteração da Hostinger nesta entrega.

Pode repetir a pergunta “Quais ensaios clínicos randomizados avaliaram canabidiol em transtorno de ansiedade?” e gerar um novo relatório com perguntas ao médico. Conferir a resposta inteira, não apenas a bibliografia.

**Limite:** a conversa paga e a geração de novo relatório pela tela não foram repetidas aqui. Esse aceite final depende do próximo atendimento consentido do usuário; nenhum pagamento, mensagem WhatsApp, sala artificial ou reabertura de sessão foi executado. Não se declara validação completa de uma consulta real.

As provas de pertinência e remoção integral descritas aqui são da Orientação Técnica. A reimplantação do copiloto não significa que seu verificador separado tenha recebido novos filtros neste pedido.