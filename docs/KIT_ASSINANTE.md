# Kit do Assinante — plano de construção

Objetivo: o médico encontra na Planta y Raíz tudo para atender com segurança, eficiência e boa remuneração, com recursos iguais ou melhores que iClinic/Feegow/Amplimed (prontuário), Memed (receita), Doctoralia (perfil e agenda), Conexa/Docway (telemedicina) e escribas de IA (Doximity, Abridge).

Plano pago = qualquer `doctors.plan_tier` diferente de `free` (VIP R$ 99 em diante). Só admin ou sistema altera o plano.

## Parte 1 — pronta (12/11/2026, aguardando o Lovable aplicar e publicar)

| Item | Onde | Observações |
|---|---|---|
| Aba **Meu Kit do Assinante** | Consultório | Mostra o que o plano inclui, o uso de hoje e o que vem a seguir. |
| **Copiloto de Evidências (PubMed)** real | Consultório → Copiloto | Pergunta clínica, interações, titulação e SOAP pela função `clinical-copilot`, que busca no PubMed e confere cada PMID. **Substituiu a tela antiga, que usava respostas prontas por palavra-chave com doses fixas.** |
| Copiloto só para médicos, com limite diário | `clinical-copilot` | Antes, qualquer pessoa logada podia usar. Limites: 10/dia no plano free, 100/dia nos planos pagos. A auditoria registra só a ação usada, sem dados do paciente. |
| **Assistente Jurídico** | Consultório → Assistente Jurídico (`doctor-legal-assistant`) | 10 perguntas/dia nos planos pagos. Cobre CFM, telemedicina, publicidade, LGPD, prontuário e Anvisa/cannabis. Toda resposta termina com o aviso de que não substitui advogado com OAB. Perguntas e respostas ficam registradas (o médico vê as próprias; o admin vê todas). |
| **CID-10 oficial** no diagnóstico | Workspace → Evolução | Tabela DATASUS completa (14.496 códigos) em `public/data/cid10.json`, carregada só quando usada. Busca por código ou por palavra, sem acento. Grava `diagnosis_cid`. |
| **Linha do tempo do paciente** | Workspace → Histórico | Consultas, evoluções e documentos que o médico pode ver. Antes, a aba mostrava sempre "nenhum atendimento". |
| Salvar evolução honesto | Workspace | Antes, a tela dizia "salvo" mesmo quando o banco recusava a gravação. |

Migração: `0038_doctor_ai_usage.sql` (uso das ferramentas de IA, para limites e auditoria).

## Parte 2 — pronta (12/11/2026, aguardando o Lovable aplicar e publicar)

| Item | Onde | Observações |
|---|---|---|
| **Alertas fixos no topo do prontuário** | Workspace → Evolução | Medicamentos/alergias, queixa (com tempo) e intensidade da triagem. Intensidade 8 ou mais aparece em vermelho. |
| **Modelos de anamnese** | Workspace → Evolução → "Modelos" | Primeira consulta, Cannabis (dor crônica), Cannabis (ansiedade/insônia) e Retorno. São só estrutura: o modelo é acrescentado ao texto, sem apagar nada. |
| **Gráfico de evolução** | Workspace → Histórico | Intensidade (0 a 10) informada pelo paciente na triagem de cada consulta, com a variação desde a primeira. Aparece a partir de 2 consultas. |
| **Lembretes no WhatsApp** | Função `consultation-reminders` (cron a cada 10 min) | 24 h e 1 h antes da consulta agendada e paga; convite de retorno 30 dias após a consulta concluída, com o mesmo médico. Cada aviso sai uma vez, sem dados clínicos. Consultas na sala de espera ficam de fora, porque têm avisos próprios. |
| **Financeiro do consultório** | Consultório → Financeiro | Saldo, repasses do mês e de 12 meses, consultas liberadas, saques, taxas, gráfico mensal e CSV para o contador. Usa a função segura `doctor_finance_monthly` (migração 0039), que mostra só os números do próprio médico. |
| Perfil público no Google | `/profissionais/:id` | Já existia: dados estruturados Physician (CRM, especialidade) e presença no sitemap. Não foi alterado, por ser vitrine. |

| **Lista de espera** | Agendamento (quando o médico não tem horário livre) | Botão "Avise-me quando abrir". O cron confere a agenda real do médico (`get_available_days`, este mês e o próximo) e manda um único WhatsApp quando abre vaga. Não reserva horário: a vaga fica com quem agendar primeiro. Migração 0040. |
| **Resumo do dia para o médico** | WhatsApp às 7 h (Brasília) | Quantidade e horários das consultas pagas do dia, sem dados de pacientes, mais o lembrete de ligar o ON. Uma vez por dia. |

## Próximas (código)

1. Avaliações públicas no perfil (nota média real e número de avaliações), com aprovação do Dr. Edilson, porque mexe na vitrine.

## Parte 3 — dependem de contrato ou decisão

1. **Escriba de IA:** a consulta vira rascunho do SOAP. Exige termo de consentimento do paciente (LGPD) e escolha do serviço de transcrição.
2. **Assinatura ICP-Brasil em 1 clique** (BirdID ou VIDaaS via parceiro). Resolve a receita de controle especial e tira o vai e vem do gov.br.
3. **Base de medicamentos** com posologia e interações (licença de base farmacológica).
4. **Certificação SBIS/CFM** do prontuário (NGS1/NGS2), que serve como selo de confiança.

## Assinatura digital: estado atual

- **gov.br (assinador.iti.br):** em uso nas consultas. Assinatura avançada, válida para receita simples, atestado e pedido de exames.
- **ClickSign:** a integração existe (`clicksign-prescription`) e o token está cadastrado no servidor (testado em 12/11/2026), mas o fluxo de consultas não a usa. Só o painel da ClickSign confirma se a conta está ativa e paga. A assinatura eletrônica da ClickSign **não é ICP-Brasil** e não substitui a assinatura qualificada exigida para receita de controle especial. Serve para contratos, termos e documentos administrativos.
