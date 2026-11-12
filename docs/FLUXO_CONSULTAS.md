# Fluxo oficial das consultas — Planta y Raiz

Definido pelo Dr. Edilson em 12/11/2026. Vale para **consulta por chat, consulta por vídeo, retorno e Orientação Técnica**: todos usam a mesma interface estilo WhatsApp. Muda apenas quem atende; na Orientação Técnica, é o agente Dr. Edilson.

A coluna **Situação** separa o que está pronto no código, o que existe mas difere da regra e o que ainda falta. A situação foi conferida no código em 12/11/2026. Nada aqui vale como teste com pagamento real.

## 1. Jornada do paciente

| # | Etapa | Regra | Situação |
|---|---|---|---|
| 1 | Escolha | O paciente escolhe o médico e a categoria (chat, vídeo, retorno). | ✅ `/consulta/:sku?doctor=` |
| 2 | Pagamento | Pix ou cartão por `mp-checkout`, com preço definido no servidor. Só o webhook do Mercado Pago confirma o pagamento; botão de comprovante e URL de retorno não confirmam. | ✅ |
| 3 | Triagem | As mesmas 5 perguntas da Orientação Técnica, com sinais de emergência primeiro. | ✅ A triagem fica ligada à consulta. |
| 4 | Aviso ao médico | Durante a triagem, o médico recebe WhatsApp e e-mail ("o senhor tem uma consulta agora…"), sem dado de saúde, com envio único por evento. | ✅ `consultation-offer` + `_shared/payment-notify.ts` |
| 5 | Atendimento | O médico abre o Consultório. A consulta passa a "em andamento" e a sala abre para o paciente. A sala tem chat em tempo real nos dois sentidos, vídeo e limite de 45 minutos. | ✅ chat (`consultation_chats`, migração 0022) · ⚠️ vídeo no `meet.jit.si` até o Jitsi próprio (seção 4) |
| 6 | Encerramento | O médico ou o paciente encerra. A consulta passa a "concluída". | ✅ |
| 7 | Avaliação | O paciente avalia com as carinhas. A avaliação libera o repasse. | ✅ |
| 8 | Receita | O paciente recebe a receita em PDF com assinatura digital do médico. | ✅ No Workspace, "Emitir & Assinar" grava a receita, gera o PDF timbrado e abre a assinatura gov.br (assinador.iti.br). A imagem da assinatura do médico enviada no KYC (documento "Assinatura Digital") é carimbada no PDF como elemento visual; a validade vem da assinatura gov.br. O médico envia o PDF assinado, que só é aceito se tiver assinatura digital. O paciente baixa na página da consulta por link temporário (`prescription-download`) e recebe aviso por WhatsApp. ⚠️ A assinatura gov.br é **avançada**; receita de controle especial exige **ICP-Brasil qualificada** (certificado A1/A3 ou nuvem: VIDaaS, BirdID). |
| 9 | Indicação | Ao final, o paciente recebe o código permanente de indicação. | ✅ |

## 2. Repasse e saque do médico

| Etapa | Regra | Situação |
|---|---|---|
| Crédito | Com a avaliação, 93% do valor vai para o saldo do médico, com aviso no painel e no WhatsApp ("pagamento disponível"). | ✅ gatilho `release_appointment_payout_on_rating`. ⚠️ Confirmar que a migração 0021 foi aplicada. |
| Saque em 1 clique | O médico clica em "Sacar" e o sistema transfere por Pix automaticamente. | ⚙️ **Código pronto com o Mercado Pago Payouts** (`POST /v1/transaction-intents/process`, `_shared/mp-pix-payout.ts`). Envio real **desligado** até o proprietário cadastrar o segredo `MP_PIX_PAYOUT_ENABLED=true`, depois que o Mercado Pago habilitar o Payouts na conta (painel de desenvolvedores → aplicação → transferências; em produção o Mercado Pago pode exigir a assinatura de requisição `X-Signature`). Recusa explícita do Mercado Pago devolve o valor ao saldo. Timeout ou erro 5xx **não** devolve: o saque fica "processing" para conferência no painel, evitando pagar duas vezes. Opcional: `MP_PIX_PAYOUT_NOTIFICATION_URL`. Chaves de telefone devem estar com `+55`. |

## 3. Rodízio quando o médico escolhido não atende

**Regra pedida:**
1. Médico escolhido.
2. Médicos **assinantes**.
3. Médico **online**: Consultório aberto, logado e com o botão ON.
4. Antes de procurar outros médicos, o paciente é avisado e recebe a sugestão de uma **Orientação Técnica gratuita** enquanto o sistema chama o médico de plantão.
5. Sem nenhum médico, a consulta é **agendada** e o paciente é avisado de que ela acontece **em até 12 horas**, ou **em até 1 hora** em emergências. Esses pacientes ficam na **sala de espera**.

**Como o código faz** (`supabase/functions/consultation-offer` + `_shared/consultation-queue.ts`, desde 12/11/2026):
1. Médico escolhido → assinantes → online (Consultório aberto, botão ON e batimento ≤ 2 min). Cada um tem 5 minutos para aceitar e recebe WhatsApp e e-mail. ✅
2. Assim que o escolhido recusa ou não responde, a sala de espera mostra: "Já estamos chamando o próximo médico… você pode fazer uma Orientação Técnica gratuita". O botão libera a Orientação gratuita **sem cancelar** a consulta. ✅
3. Se ninguém aceita no ciclo, a consulta fica **garantida na sala de espera**:
   - Caso comum: nova chamada aos médicos a cada **60 min**, com prazo de **12 h**.
   - Caso **urgente**: nova chamada a cada **15 min**, com prazo de **1 h**.
   - O paciente é avisado na tela e por notificação, uma única vez. ✅
4. Se o prazo acaba sem nenhum médico, a consulta é encaminhada à Orientação Técnica gratuita, e o médico escolhido recebe o relatório. ✅
5. **Urgente** quer dizer intensidade 8 ou mais na triagem, **sem** sinais de alarme. Sinais de alarme continuam bloqueando o atendimento e encaminhando ao SAMU ou pronto-socorro (decisão de 12/11/2026). ✅
6. A fila avança sozinha a cada minuto pelo cron `consultation_queue_sweep` (migração 0024), mesmo com a página do paciente fechada. ✅

**Ainda falta:** avisar o paciente por **WhatsApp** quando ele entra na sala de espera e quando o médico entra. Hoje o aviso aparece na tela e na notificação da plataforma.

## 4. Vídeo

- A função `consultation-video-token` entrega a sala só ao paciente e ao médico da consulta paga e em andamento.
- Com o Jitsi próprio configurado, a função gera um token por pessoa (o médico entra como moderador). Sem ele, usa o `meet.jit.si`.
- Para instalar o Jitsi próprio na VPS Hostinger, siga `infra/jitsi/README.md`. Depois, cadastre os segredos `JITSI_DOMAIN`, `JITSI_APP_ID` e `JITSI_APP_SECRET` no Lovable Cloud.
- **Instalado em 12/11/2026** em `meet.plantayraiz.com.br` (VPS Hostinger, `/opt/jitsi`), com teste de dois participantes aprovado e acesso sem token bloqueado.
- O vídeo abre **dentro da página da consulta**, com botão **Tela cheia**. Se alguém desligar a chamada, aparece "Voltar ao vídeo" ou "Encerrar consulta", para que um toque acidental não encerre a consulta. Ao encerrar, o paciente vai direto para a avaliação (3 carinhas), recebe os documentos assinados e o seu link de indicação, como na Orientação Técnica.
- Vigia da VPS: `infra/jitsi/watchdog.sh` roda pelo cron a cada 2 minutos. Ele sobe serviços parados e reinicia o `web` após 3 falhas de HTTPS, mexendo só em `/opt/jitsi`.

## 5. Link personalizado do médico

**Regra:** cada médico tem um link para enviar a pacientes e colegas. Com ele, o paciente se cadastra e é atendido pelo médico, e o colega se cadastra como médico. A ideia é dar mais consultas aos médicos mais populares.

**Situação:** ✅ No Consultório, aba **Perfil → "Meus links personalizados"**, o médico copia três links, todos com o código permanente de indicação (`ensure_referral_code`):
- **Consulta por chat** e **consulta por vídeo** com ele já escolhido (`/consulta/<tipo>?doctor=<id>&ref=<código>`). Se ele não puder atender na hora, o paciente segue a fila oficial da seção 3.
- **Convite a colegas** (`/cadastro-profissional?ref=<código>`). O cadastro de médico agora liga o colega à árvore de indicações, como já acontecia no cadastro de paciente.

A página de indicações deixou de gerar código no navegador, um código que nunca era registrado e que ainda usava um domínio com erro de digitação.

**Retorno de consulta:** usa a mesma página e o mesmo fluxo, por chat (`/consulta/retorno_consulta`).

## 6. Interface única (estilo WhatsApp)

A sala da consulta já segue o cabeçalho e as bolhas da Orientação Técnica (#075E54). O Workspace do médico usa o mesmo estilo no chat. Regra: **todo novo serviço reutiliza esses componentes**, sem criar interfaces paralelas.

## 7. Pendências (atualizado em 12/11/2026)

**Concluídos no código** (dependem do Lovable aplicar as migrações 0022 a 0026, implantar as funções e publicar o site):
- Chat ao vivo nos dois sentidos, com **anexos de exames e fotos** (bucket privado `consultation-files`, até 10 MB, só durante a consulta).
- **Documentos assinados da consulta:** receita, atestado e solicitação de exames. Todos usam o mesmo fluxo: PDF timbrado → assinatura gov.br → download pelo paciente.
- Botões do Workspace sem ação real: "Atestado" e "Solicitar exames" agora emitem documentos de verdade, e "Cobrança extra" foi removido.
- **WhatsApp ao paciente** quando entra na sala de espera e quando o médico entra (`consultation-patient-notify`, envio único por evento).
- Rodízio com sala de espera (12 h, ou 1 h se urgente), sugestão de Orientação gratuita e cron a cada minuto.

**Dependem do Dr. Edilson ou de terceiros:**
1. **Assinatura ICP-Brasil qualificada** para receitas de controle especial (contratar VIDaaS, BirdID ou certificado A1/A3).
2. **Saque com Pix automático:** pedir ao Mercado Pago a habilitação do Payouts (Pix de saída) na conta e então cadastrar `MP_PIX_PAYOUT_ENABLED=true`.
3. **Jitsi próprio na VPS** (DNS, porta UDP 10000 e segredos; ver `infra/jitsi/README.md`).
4. **Médico de teste aprovado** e **paciente de teste** para o teste ponta a ponta (seção 8).

## 8. Teste ponta a ponta (roteiro)

1. Médico de teste com cadastro aprovado, logado no Consultório com o botão ON.
2. Paciente de teste em janela anônima: `/consulta/<sku>?doctor=<id>`.
3. Pagamento real de valor mínimo, com consentimento. Conferir se a triagem abre sozinha.
4. Conferir o WhatsApp do médico (1 aviso).
5. O médico abre a consulta. Trocar mensagens nos dois sentidos e, na consulta por vídeo, ficar mais de 10 minutos na chamada.
6. O médico encerra. O paciente avalia. Conferir o saldo do médico (93%) e o WhatsApp "pagamento disponível".
7. Registrar data, hora e resultado de cada passo no `roadmap.md`.

## 9. Guardião das consultas (auditoria 24h)

A função `consultation-guardian` roda pelo cron a cada 5 minutos (migração 0032). Cada problema vira **um** alerta em `consultation_guardian_events` e uma notificação para os administradores. O painel "Guardião das consultas" do /admin lista os alertas e tem os botões "Verificar agora" e "Resolvido".

| Verificação | Ação |
|---|---|
| Servidor de vídeo próprio não responde | Alerta crítico (no máximo um por hora). O vigia da VPS reinicia sozinho. |
| Consulta "em andamento" há mais de 3 h e sem conversa há 1 h | **Corrige sozinho**: encerra a consulta com a marca `[ENCERRADA_PELO_GUARDIAO]`. O paciente ainda avalia e o repasse continua dependendo da avaliação. |
| Pagou e não foi atendido em 13 h (prazo da sala de espera + folga) | Alerta crítico para contato humano (atendimento, remarcação ou reembolso). |
| Avaliou e o repasse de 93% não foi liberado em 15 min | Alerta para conferir a carteira do médico. |
| Saque Pix "em processamento" há mais de 1 h | Alerta crítico: conferir no painel do Mercado Pago antes de devolver o saldo (evita pagar duas vezes). |

O guardião não altera dinheiro, receitas nem dados clínicos sozinho. Correções automáticas se limitam a casos seguros e ficam registradas para auditoria.
