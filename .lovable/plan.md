# Corrigir o fluxo da Orientação Técnica

## Resultado
O paciente só avança com TCLE e triagem completos, paga pelo Mercado Pago e recebe o atendimento da Brisa após a confirmação real.

## Implementação
- Exibir campos adequados nas 10 perguntas, bloquear respostas vazias e validar corretamente o CPF.
- Salvar a triagem completa no banco oficial, vinculada à conta autenticada.
- Vincular a triagem ao pedido de R$ 30 e guardar a referência para acompanhar o pagamento.
- Criar uma consulta segura de status e impedir o atalho do WhatsApp antes da aprovação.
- Na confirmação do Mercado Pago, registrar o pagamento, abrir a sessão de Orientação Técnica e enviar a mensagem inicial com transparência sobre o uso de IA.
- Manter o TCLE auditável, o número oficial centralizado e separar veterinários dos médicos para atendimento humano.
- Preservar o visual, o Jitsi, os dados reais e as aprovações manuais.

## Validação
- Confirmar que o site compila sem erros.
- Testar TCLE, dez respostas, criação do pedido e bloqueio de atendimento ainda não pago.
- Testar a consulta de status sem criar cobrança nem alterar registros reais.
- Conferir registros e mensagens do fluxo no banco oficial.

## Limites
- A conta Mercado Pago continua recebendo na conta associada à chave atual; migrar para CNPJ exige a credencial PJ do titular.
- O pagamento continuará no ambiente seguro do Mercado Pago nesta etapa; o checkout incorporado ficará para uma etapa posterior.
