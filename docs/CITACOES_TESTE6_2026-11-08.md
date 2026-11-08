# Orientação Técnica — ajustes finais das citações (teste 6)

Verificado em **08/11/2026, 06:21:58 UTC (03:21:58 São Paulo)**.

## 1. Corpo contraditório

A identificação válida de um PMID não comprova a interpretação feita pelo modelo. Agora, os parágrafos que contêm citações são descartados antes de inserir a bibliografia canônica do PubMed, incluindo descrições em várias linhas. Esta opção é deliberadamente conservadora: não reescreve resultados clínicos por inferência.

**Prova:** o teste usa “estudo piloto aberto de Berger et al. (2022)”, link ao PMID 35112940 e uma alegação de benefício em linhas sucessivas. O resultado não contém Berger, estudo piloto, benefício nem “link confirmado”; a referência, quando a pergunta é apenas bibliográfica, contém a autoria Roberts JM e os metadados recebidos do PubMed.

## 2. Pertinência ao tema

Antes de construir o contexto científico, registros internos com PMID são substituídos pelos metadados reais do PubMed. Registros sem relação com CBD/canabidiol/cannabinoid e ansiedade são excluídos nessa pergunta. O mesmo filtro é aplicado às referências finais, evitando que um PMID antigo do histórico volte como resposta pertinente.

Para perguntas que solicitam ensaios randomizados, é exigido o tipo de publicação **Randomized Controlled Trial**; revisão ou estudo aberto não vira ensaio randomizado. Ausência de registro pertinente gera resposta limitada aos registros conferidos — nunca declaração de inexistência em todo o PubMed. Totais de buscas permanecem totais brutos da API, não quantidade de estudos aceitos pelo filtro. Palavras-chave não comprovam eficácia: por isso interpretações bibliográficas do modelo são removidas, não certificadas.

**Provas:** testes rejeitam artigo só sobre CBD/dor e artigo só sobre ansiedade/trauma; aceitam título/resumo que abordam ambos os termos; rejeitam revisão que menciona ensaios e aceitam tipo de publicação randomizado. O PMID 35112940 é excluído da resposta sobre CBD/ansiedade mesmo quando pertence à biblioteca interna.

**Consulta real, sem dados de paciente:** EFetch retornou Roberts JM para 35112940, MacCallum CA para 29307505 e Han K para 38924898; 99999999 esteve ausente. A saída produzida com o registro real 35112940 não contém Berger nem apresenta o artigo como evidência de CBD/ansiedade. Teste ao vivo passou.

## 3. Redação dos novos relatórios

O modelo recebe instrução específica para perguntas ao médico (“você recomenda”). Um saneador aplicado antes da gravação e do cálculo do hash remove tratamentos com artigos ou barras, incluindo “o você/a você” e “o senhor/a senhora”. Documentos históricos não foram reescritos.

**Prova:** a pergunta “Quais alternativas terapêuticas seguras o você/a você recomenda?” retorna “Quais alternativas terapêuticas seguras você recomenda?”. A primeira execução identificou falha de delimitação em “você” acentuado; foi corrigida com delimitação Unicode e o teste repetido passou.

## Execução e disponibilização

- **37 testes de regressão aprovados**, em oito arquivos: PMID, pertinência/relatório, contexto científico, PubMed, copiloto, política, código do atendimento e leitura da resposta.
- **1 teste adicional com PubMed real aprovado**, habilitado explicitamente por `RUN_PUBMED_LIVE=1`.
- Compilação da prévia: última entrada **build OK**.
- Funções `ot-edilson-web` e `clinical-copilot` implantadas com sucesso; o copiloto recebeu o contexto científico compartilhado atualizado, sem alteração no seu verificador de respostas.
- Nenhum preço, conta recebedora, método/fluxo de pagamento, persona/CRM, aparência, receita ou aprovação foi alterado.
- Nenhum pagamento, mensagem WhatsApp, nova sala ou atendimento artificial foi criado.

## Limites e próximo teste

Esta entrega verifica a transformação determinística e consulta metadados reais. **Não foi repetida uma conversa paga na sala, nem gerado um relatório novo pela tela**: isso permanece dependente do próximo teste consentido do usuário. Não se declara aprovação desse fluxo completo.

As correções deste pedido estão nas funções já implantadas e não exigem nova publicação do visual para serem usadas pela página atual `/orientacao-tecnica` conectada ao Cloud oficial. No próximo teste de cinco minutos, repetir a pergunta de ensaios de canabidiol/ansiedade e gerar relatório com perguntas ao médico; conferir o texto integral, não só o bloco de referências.