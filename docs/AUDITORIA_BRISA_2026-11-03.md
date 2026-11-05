# Auditoria Brisa — 03/11/2026

## Confirmado
- Antes da implantação, chamadas reais a chat-brisa ainda retornavam “Enfermeira Brisa”, personalização “Dr. Franciscopego263” e divulgação em vez de aviso de áudio. Urgência junto com pedido humano não acionava SAMU.
- chat-brisa e brisa-bot foram implantadas neste turno. Novas chamadas reais confirmaram saudação sem nome de usuário, aviso de áudio, limite para remédio para dormir e prioridade SAMU 192.
- Oito testes locais passaram: nome, emergência, humano/identidade, saudação, mídia, recebimento de documentos, semelhança >80% e janela de 24h, silêncio para ofertas de serviço.
- Compilação da plataforma: build OK. Correções dos erros preexistentes: crossOrigin e comparação de categoria em brisa-bot.
- brisa-bot não gera mais uma segunda resposta de IA depois de enviar uma resposta imediata.

## Correções preparadas para Hostinger
- Removidos roteiros locais extensos de médicos/farmácias que contornavam o prompt central e prometiam ativação/conformidade.
- Eliminada a dupla checagem que registrava uma resposta antes de enviar e depois bloqueava o próprio envio.
- Somente texto pelo caminho protegido, histórico persistido de envios por 24h, confirmação de recebimento sem aprovação, rechecagem de pausa antes do disparo.
- Pedido de humano usa pausa persistente até reativação explícita; nomes de pacientes só personalizam quando confirmados.
- Processo serial protegido por arquivo de exclusividade na mesma instalação. Isso não coordena n8n/outros servidores ou instalações independentes.

Arquivos necessários na VPS, com os caminhos relativos preservados:
- scripts/agent_evolution_brisa_live_responder.mjs
- scripts/lib/brisa_security.mjs
- supabase/functions/_shared/brisa-response-policy.mjs

## Não comprovado / bloqueios
- Sem acesso administrativo válido à VPS: não foi possível copiar arquivos, reiniciar o serviço ou testar recebimento/envio real no WhatsApp. Não afirmar implantação completa do WhatsApp.
- Não há mensagens desde 31/10 nas tabelas whatsapp_brisa_log e brisa_unified_conversations consultadas no Cloud oficial. Isso não prova ausência de mensagens na VPS.
- A trava de 24h da função depende do histórico enviado pelo chamador; a proteção persistente de envio fica no responder. Não há trava distribuída entre todos os possíveis agentes.
- Os eventos já são marcados como processados antes de concluir o envio no responder; recuperação transacional de falhas/reinícios não foi implementada.
- Modelo existente e chamadas de IA foram preservados. Não houve comprovação de Gemini 3.8 nem troca de modelo.
- Preservados preços e fluxo clínico real: escolha de modalidade, pagamento aprovado e depois horário persistido do médico. O roteiro não autoriza inverter esse fluxo.