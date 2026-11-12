# Prompt para o agente Antigravity — convite aos médicos para testar o Consultório Virtual

Cole o texto abaixo no Antigravity, aberto na pasta do projeto.

---

**Missão:** enviar aos médicos verificados da vitrine da Planta y Raíz um convite para testarem as novas ferramentas do Consultório Virtual: Meu Kit do Assinante, Copiloto de Evidências, Assistente Jurídico, Escriba de IA, prontuário com CID-10, Financeiro, vídeo próprio e lembretes. O envio usa o caminho oficial da plataforma, uma única vez por médico, e **só depois da confirmação do Dr. Edilson**.

**Leia antes:** `AGENTS.md`, `docs/ORIENTACAO_ATUAL_AGENTES.md`, `docs/KIT_ASSINANTE.md` e `supabase/functions/doctor-flow-briefing/index.ts`, que é o modelo a seguir.

## Regras obrigatórias
1. **Não use o projeto Supabase antigo** `tkxxoghzhvhjzdoomgss`. O único backend é o Lovable Cloud (`shmbwdjuddvquszwkvuq`).
2. **Não mande mensagem por fora** (WhatsApp Web, número pessoal, script local). O envio sai só pela função nova da plataforma, com o WhatsApp oficial (`_shared/evolution.ts`) e o e-mail via Brevo, com Resend como reserva, igual à `doctor-flow-briefing`.
3. **Destinatários:**
   - Só médicos com `is_verified = true` em `doctors_public`.
   - Exclua a lista `WITHDRAWN` da `doctor-flow-briefing` (inclui o Dr. Edilson, cujo card está retirado).
   - Não use telefone escrito no código e **não grave telefone em `profiles`**. Médico sem telefone no perfil recebe só o e-mail e o aviso no painel, com o pedido para cadastrar o WhatsApp.
4. **Uma vez por médico por canal:**
   - **WhatsApp:** `check_edge_rate_limit` com o bucket `doctor-kit-test-invite-v1`, chave = id do médico, 1 envio em 30 dias.
   - **E-mail:** registro em `audit_log` com a ação `doctor_kit_test_invite_email_sent`.
   - **Painel:** só insira se ainda não existir uma notificação com o mesmo título.
5. **Ritmo:** no máximo 15 médicos por chamada e 2,5 s de pausa entre médicos. `dry_run` vem **ligado por padrão**.
6. **Nada de dados de pacientes**, preços novos ou promessas de ganho na mensagem. Não altere planos, preços, vitrine, CRM nem nenhuma outra função.
7. **Alteração já existente:** a alteração ainda não commitada em `supabase/functions/doctor-flow-briefing/index.ts` não faz parte desta tarefa. Não a inclua no commit. Se for sua, conclua-a em um commit separado, sem gravar telefones em `profiles`, e explique ao Dr. Edilson.
8. **Segredos:** nunca cole segredos, telefones completos ou e-mails no chat. No relatório, mostre só nome e os 4 últimos dígitos do telefone.

## Passos
1. **Função nova.** Crie `supabase/functions/doctor-kit-test-invite/index.ts`, copiando a estrutura da `doctor-flow-briefing`:
   - **Acesso:** só serviço ou cron (`requireServiceAuth` / `authenticateCronRequest`).
   - **Parâmetros:** `{ offset = 0, limit = 15, dry_run = true }`.
   - **Em `dry_run`:** devolva a lista de nome, se tem telefone (sim/não) e se tem e-mail (sim/não), sem enviar nada.
   - **Aviso no painel:**
     - título: "Teste o seu Consultório Virtual";
     - mensagem: "Novas ferramentas no seu Kit do Assinante. Abra o Consultório e teste.";
     - `type: "info"`;
     - `action_url: "/consultorio"`.
   - **Mensagem de WhatsApp e e-mail.** Use exatamente este texto, trocando `{nome}` pelo nome com "Dr(a)." quando faltar. No e-mail, use o mesmo texto em HTML simples com o botão "Abrir meu Consultório" e o assunto **"Novidades no seu Consultório Virtual — teste e nos conte"**.

     > {nome}, aqui é a equipe Planta y Raiz. 🌿 Seu Consultório Virtual ganhou ferramentas novas e queremos que o(a) senhor(a) seja um dos primeiros a testar:
     >
     > • *Meu Kit do Assinante*: tudo o que o seu plano inclui, num só lugar.
     > • *Copiloto de Evidências*: perguntas clínicas com estudos do PubMed conferidos pelo PMID.
     > • *Assistente Jurídico*: dúvidas sobre CFM, telemedicina, publicidade, LGPD e Anvisa (planos pagos).
     > • *Escriba de IA*: dite o resumo ou grave a consulta (com autorização do paciente) e receba o rascunho do SOAP.
     > • *Prontuário*: CID-10 oficial, modelos de anamnese, alergias no topo, linha do tempo e gráfico de evolução.
     > • *Financeiro*: repasses do mês, saques e relatório para o contador.
     > • Vídeo próprio da Planta y Raiz em tela cheia, lembretes automáticos ao paciente e lista de espera.
     >
     > 👉 Como testar (10 minutos): entre em https://plantayraiz.com.br/consultorio, abra a aba *🧰 Meu Kit do Assinante* e experimente o Copiloto e o Assistente Jurídico. No Workspace de uma consulta, teste o *Escriba de IA* com "Ditar resumo".
     >
     > Responda esta mensagem com o que funcionou, o que achou difícil e o que sentiu falta. Sua opinião define as próximas melhorias. Se preferir não receber estes avisos, responda SAIR.

2. **Teste local.** Rode `npm run test` e o type check, e confira que nada mais mudou com `git status`. Faça o commit **só** da função nova, com uma mensagem em português, e dê push na `main`.
3. **Implantação.** No chat do Lovable, peça exatamente: *"Implante a função doctor-kit-test-invite com o código atual do main, sem alterar o código."* Espere a confirmação.
4. **Simulação.** Peça ao Lovable para chamar a função com `{"dry_run": true, "limit": 50}`. Mostre ao Dr. Edilson a lista de nomes que vão receber, quantos têm telefone e quantos têm e-mail. **Pare e espere ele escrever "pode enviar".**
5. **Envio.** Depois da confirmação, peça ao Lovable para chamar a função com `{"dry_run": false, "offset": 0, "limit": 15}` e repita com `offset` 15, 30... até acabar a lista. Se algum lote der erro de envio, pare e mostre o erro. Não tente outro caminho.
6. **Relatório final ao Dr. Edilson, em português simples:**
   - quantos médicos receberam por WhatsApp, por e-mail e no painel;
   - quem ficou sem telefone (só o nome), para ele pedir o cadastro;
   - erros, se houver.
7. **Respostas.** Nos próximos dias, quando médicos responderem, resuma para o Dr. Edilson o que funcionou, as dificuldades e os pedidos de melhoria. Quem responder SAIR não recebe mais nenhuma campanha: registre isso numa nota para o Dr. Edilson e não invente mecanismo novo sem a aprovação dele.
