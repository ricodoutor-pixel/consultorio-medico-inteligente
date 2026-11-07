# Agente científico compartilhado — 07/11/2026

## Confirmado
- Logs do Gateway às 21:17–21:19 UTC confirmam chamadas bem-sucedidas a `google/gemini-3.8-flash`; catálogo do workspace confirma disponibilidade e Chat Completions.
- Antes desta alteração a Orientação consultava `scientific_articles` e validava PMIDs, mas não pesquisava todo PubMed. O importador usava ESummary e substituía abstracts por título/revista: não é texto científico integral.
- Orientação e `clinical-copilot` agora compartilham biblioteca interna + ESearch/EFetch com resumos reais e tipos de publicação; SOAP apenas formata notas. Copiloto usa Gemini 3.8 pelo Gateway, sem fallback silencioso.
- `PUBMED_API_KEY` configurada é consumida somente no servidor, em POST. Nenhuma mensagem original/nome/contato vai a NCBI: consulta utiliza vocabulário clínico fixo. Cache de 5 minutos por consulta, resultados limitados, falha externa explícita.
- Busca real às 21:59 UTC: consulta expandida Title/Abstract medical cannabis OR cannabinoids OR cannabidiol OR therapeutic cannabis = 22.062 resultados; acrescida de anxiety AND sleep = 297. Tais valores correspondem SOMENTE às consultas executadas, não confirmam estimativas de outros filtros.
- EFetch retornou PMIDs 26103030, 38385885, 39299947 e 35093949 com títulos, anos, tipos e abstracts reais.
- 18 testes de recuperação, privacidade e preservação do encerramento passaram. Funções Orientação/copiloto implantadas.

## Limites
- Pesquisa dinâmica não equivale a importar 30–50 mil publicações, acessar texto integral protegido, treinar o modelo ou comprovar eficácia clínica. Não foi executada importação em massa nem alterado documento histórico.
- Vocabulário clínico externo é restrito; casos sem termos reconhecidos não enviam texto livre a PubMed. Expandir o vocabulário exige testes de privacidade e pertinência.
- Infraestrutura NCBI permanece sujeita a disponibilidade e limites; cache por instância não é um limitador global para milhares de consultas simultâneas.
- Consulta real por vídeo, acesso de médico aprovado e resultado pela tela durante atendimento permanecem sem teste nesta tarefa: não existe atendimento consentido/ativo fornecido para essa verificação. Não alterar Jitsi, pagamentos ou aprovações para simular sucesso.