# Correções finais da Orientação Técnica

Auditoria e implementação: 07/11/2026, 21:26–21:52 UTC. Fonte: Lovable Cloud oficial e código do projeto. Nenhum novo pagamento, envio manual, aprovação médica, exclusão ou repasse foi executado.

## Resultado por item

1. **Encerramento:** causa confirmada em `shouldAutoClose`: exigia pergunta anterior. Agora despedida clara basta; mensagem com nova pergunta prevalece e não fecha. Servidor verifica falha de gravação antes de anunciar encerramento. Testes concretos com as frases do arquivo passaram. Não foi executada despedida em uma nova sala ativa paga; atendimento atual já está encerrado.
2. **Avaliação:** tela podia manter `ratingDone` de atendimento anterior e não havia confirmação do resultado gravado. Novo atendimento limpa o estado; encerramento expõe a avaliação com rolagem; envio retorna nota e comentário lidos no servidor, com erro e retentativa. Consulta real ao atendimento encerrado retornou `completed`, `rating=3`. Navegador exibiu “Obrigado pela avaliação! Satisfeito (3/3)”. Nova gravação no fluxo completo ainda exige novo teste pago.
3. **Código:** corpo usava ID da sessão, topo/PDF usavam ID do relatório. Novos relatórios usam código derivado do pedido persistido, gravado em `verification_code`, também nos avisos. Aprovação conserva o código. Documento histórico usa seu código original no topo/PDF, sem modificar conteúdo ou hash. Testes comprovaram OT-BB3DEE98 sem divergência de renderização. Novo PDF gerado/baixado não foi repetido neste ciclo.
4. **Indicação:** `profiles.referral_code` não existe no banco; atualização falhava, mas orientação mostrava o código aleatório não salvo. Outro painel inventava PLR por ID. As três telas agora usam `referral_links` e `ensure_referral_code`, com validação do proprietário e trava transacional. Banco: nenhuma conta com múltiplos códigos oficiais. PRZ-TZSUE e PRZ-AW1CB eram valores exibidos sem persistência nesse campo inexistente; nenhuma comissão foi apagada ou reatribuída. Com respostas reais do Cloud, três recarregamentos mantiveram o mesmo código e painel abriu com ele.
5. **Estudos:** RPC usava índice português com consulta em inglês e termos obrigatoriamente combinados; muitos DOIs tinham prefixo `doi:` e falhavam na validação. RPC agora suporta inglês/português e sinônimos CBD/cannabidiol/canabidiol com anxiety/ansiedade; prefixos normalizados; autores preservados; URL arbitrária não equivale a link validado. Busca real retornou três registros, PMIDs 35112940, 39452013 e 40854502, confirmados no NCBI. Existência de um PMID não certifica que todos os metadados locais coincidem; inconsistências históricas não foram corrigidas silenciosamente.
6. **WhatsApp:** último teste teve pagamento aceito 18:13:10, início 18:14:32, fim 18:20:16 (São Paulo), todos HTTP 201, uma tentativa. Isso não comprova entrega. Versão anterior descartava ID do provedor; agora grava ID em cada tentativa e permite conferência administrativa de DELIVERY_ACK/READ. Painel `/notificacoes` mostra horário/status/tentativas/erro/ID. Aviso de fim espera até 40 segundos por avaliação, ou envia antes quando a nota é registrada; deduplicação impede dois avisos de fim. Avaliação feita depois desse prazo não altera mensagem já enviada: sem nota naquele momento, aviso informa que ainda não avaliou.

## Auditoria científica (21:48:23 UTC)

- Total: 5.348 registros; 5.070 com DOI preenchido; 5.348 com URL PubMed.
- Conferência completa NCBI esummary, lotes de 200: 5.337 PMIDs existentes; 11 não encontrados; zero lotes sem resposta.
- Os DOIs dos 11 registros não encontrados não foram conferidos integralmente. Portanto **não há total certificado de registros sem qualquer DOI/PMID válido**. Não confundir DOI preenchido com DOI válido.
- Cada link selecionado durante a conversa passa por validação de DOI/PMID antes de ser apresentado como confirmado.

## Provas e limites

- 25 testes Vitest passaram (despedida, código, indicação, busca/identificador e triagem).
- Última compilação automática: build OK.
- Funções implantadas: ot-edilson-web, mercadopago-webhook, payment-notify-resend, payment-notify-history.
- Verificação visual com conta autorizada real, sem mocks: confirmação de nota e link estável/painel. O navegador local teve falha de acesso direto ao Cloud; teste visual usou retransmissão HTTP das respostas reais dentro do sandbox, sem alterar a aplicação ou dados. Isso não comprova conectividade normal em todos os aparelhos.
- Sem nova cobrança: não é possível certificar nesta rodada despedida ativa em ≤5s, avaliação recém-gravada, nova geração/PDF e entrega de três avisos no celular em ≤1min.
- Histórico antigo não contém ID de mensagem, impossibilitando conferir sua entrega por ID. Consulta nova de recibos exige acesso administrativo e novo aviso real.
- Persona/CRM, preços, Jitsi, documentos históricos e redação do bloco final de indicação preservados.
- Frontend ainda precisa ser publicado para o dono repetir o teste no site oficial. Não declarar o teste integral aprovado antes disso.