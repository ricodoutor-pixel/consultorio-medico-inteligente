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

## Parte 2 — próximas (código, sem depender de terceiros)

1. **Modelos de anamnese** por especialidade (incluindo cannabis medicinal), alergias e medicamentos sempre visíveis no topo do prontuário.
2. **Gráfico de evolução** dos escores da triagem (dor e ansiedade, 0 a 10) por consulta.
3. **Agenda que trabalha pelo médico:** confirmação e lembrete no WhatsApp 24 h e 1 h antes; retorno sugerido em 30 dias; lista de espera.
4. **Financeiro do consultório:** ganhos do mês, saques e relatório para o carnê-leão.
5. **Perfil público no Google:** página do médico com avaliações reais e dados estruturados, dentro das regras de publicidade do CFM.

## Parte 3 — dependem de contrato ou decisão

1. **Escriba de IA:** a consulta vira rascunho do SOAP. Exige termo de consentimento do paciente (LGPD) e escolha do serviço de transcrição.
2. **Assinatura ICP-Brasil em 1 clique** (BirdID ou VIDaaS via parceiro). Resolve a receita de controle especial e tira o vai e vem do gov.br.
3. **Base de medicamentos** com posologia e interações (licença de base farmacológica).
4. **Certificação SBIS/CFM** do prontuário (NGS1/NGS2), que serve como selo de confiança.

## Assinatura digital: estado atual

- **gov.br (assinador.iti.br):** em uso nas consultas. Assinatura avançada, válida para receita simples, atestado e pedido de exames.
- **ClickSign:** a integração existe (`clicksign-prescription`) e o token está cadastrado no servidor (testado em 12/11/2026), mas o fluxo de consultas não a usa. Só o painel da ClickSign confirma se a conta está ativa e paga. A assinatura eletrônica da ClickSign **não é ICP-Brasil** e não substitui a assinatura qualificada exigida para receita de controle especial. Serve para contratos, termos e documentos administrativos.
