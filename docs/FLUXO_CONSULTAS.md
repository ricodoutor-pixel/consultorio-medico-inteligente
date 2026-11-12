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
| 8 | Receita | O paciente recebe a receita em PDF com assinatura digital do médico. | ❌ **Falta.** O botão "Emitir & Assinar Digitalmente" do Workspace não faz nada. Existem as funções `govbr-prescription-sign` e `prescription-upload-signed` e a tela `FreeSignatureModal`, mas nada disso está ligado à consulta. Receita de controle especial exige ICP-Brasil. |
| 9 | Indicação | Ao final, o paciente recebe o código permanente de indicação. | ✅ |

## 2. Repasse e saque do médico

| Etapa | Regra | Situação |
|---|---|---|
| Crédito | Com a avaliação, 93% do valor vai para o saldo do médico, com aviso no painel e no WhatsApp ("pagamento disponível"). | ✅ gatilho `release_appointment_payout_on_rating`. ⚠️ Confirmar que a migração 0021 foi aplicada. |
| Saque em 1 clique | O médico clica em "Sacar" e o sistema transfere por Pix automaticamente. | ❌ **Hoje o saque é só registrado** ("simulado, aguardando autorização"). O envio está desligado de propósito (`MONEY_OUT_READY = false`). Além disso, o código usa `POST /v1/payments` do Mercado Pago, que **cria uma cobrança**, e não envia dinheiro. Para Pix automático é preciso um provedor com API de transferência (Asaas, Efí, Banco Inter, Stark Bank ou o Money Out do Mercado Pago, se aprovado para a conta). Até lá, o administrador paga manualmente. |

## 3. Rodízio quando o médico escolhido não atende

**Regra pedida:**
1. Médico escolhido.
2. Médicos **assinantes**.
3. Médico **online**: Consultório aberto, logado e com o botão ON.
4. Antes de procurar outros médicos, o paciente é avisado e recebe a sugestão de uma **Orientação Técnica gratuita** enquanto o sistema chama o médico de plantão.
5. Sem nenhum médico, a consulta é **agendada** e o paciente é avisado de que ela acontece **em até 12 horas**, ou **em até 1 hora** em emergências. Esses pacientes ficam na **sala de espera**.

**O que o código faz hoje** (`supabase/functions/consultation-offer`):
1. Escolhido → assinantes → online (batimento ≤ 2 min). Cada um tem 5 minutos para aceitar. ✅
2. Se ninguém aceita no 1º ciclo, reagenda para **+1 hora** com aviso na tela. ⚠️ Não há a regra de 12 horas, nem diferença entre caso comum e emergência.
3. Se ninguém aceita no 2º ciclo, encaminha para a Orientação Técnica gratuita e entrega o relatório ao médico escolhido. ⚠️ Na regra pedida, a sugestão vem **antes**, em paralelo ao chamado do plantão, e não como último recurso.
4. Sala de espera: existe a rota `/sala-espera`. ⚠️ Não está ligada ao reagendamento.

**A fazer:** ajustar os passos 2 a 4 à regra pedida.

## 4. Vídeo

- A função `consultation-video-token` entrega a sala só ao paciente e ao médico da consulta paga e em andamento.
- Com o Jitsi próprio configurado, a função gera um token por pessoa (o médico entra como moderador). Sem ele, usa o `meet.jit.si`.
- Para instalar o Jitsi próprio na VPS Hostinger, siga `infra/jitsi/README.md`. Depois, cadastre os segredos `JITSI_DOMAIN`, `JITSI_APP_ID` e `JITSI_APP_SECRET` no Lovable Cloud.

## 5. Link personalizado do médico

**Regra:** cada médico tem um link para enviar a pacientes e colegas. Com ele, o paciente se cadastra e é atendido pelo médico, e o colega se cadastra como médico. A ideia é dar mais consultas aos médicos mais populares.

**Situação:** existem as telas `ConviteMedico` e `Indicacoes` e o cadastro canônico em `referral_links` / `ensure_referral_code`. ⚠️ Ainda não foi verificado de ponta a ponta se o link do médico leva o paciente direto à consulta com ele.

## 6. Interface única (estilo WhatsApp)

A sala da consulta já segue o cabeçalho e as bolhas da Orientação Técnica (#075E54). O Workspace do médico usa o mesmo estilo no chat. Regra: **todo novo serviço reutiliza esses componentes**, sem criar interfaces paralelas.

## 7. Pendências que afetam o atendimento real

1. **Receita em PDF assinada** (etapa 8), o item mais importante para a consulta ter valor clínico.
2. **Saque automático** (seção 2). Depende da escolha de um provedor de transferência.
3. **Rodízio** conforme a seção 3.
4. **Jitsi próprio** (seção 4).
5. **Botões que só mostram aviso**, sem ação real, no Workspace (`DoctorQuickActions`): "Atestado", "Solicitar exames" e "Enviar link de pagamento". Eles avisam que algo foi feito sem fazer. Precisam ser implementados ou escondidos.
6. **Anexos no chat:** o paciente não consegue enviar exames ao médico durante a consulta. É preciso armazenamento privado por consulta.

## 8. Teste ponta a ponta (roteiro)

1. Médico de teste com cadastro aprovado, logado no Consultório com o botão ON.
2. Paciente de teste em janela anônima: `/consulta/<sku>?doctor=<id>`.
3. Pagamento real de valor mínimo, com consentimento. Conferir se a triagem abre sozinha.
4. Conferir o WhatsApp do médico (1 aviso).
5. O médico abre a consulta. Trocar mensagens nos dois sentidos e, na consulta por vídeo, ficar mais de 10 minutos na chamada.
6. O médico encerra. O paciente avalia. Conferir o saldo do médico (93%) e o WhatsApp "pagamento disponível".
7. Registrar data, hora e resultado de cada passo no `roadmap.md`.
