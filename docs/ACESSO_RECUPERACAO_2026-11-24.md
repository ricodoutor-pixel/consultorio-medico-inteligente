# Correção de acesso e recuperação — 24/11/2026

## Confirmado

- Serviço oficial e autenticação respondendo durante a verificação. Isso não estabelece sozinho a causa exata da falha histórica de 23/11.
- Médico citado: e-mail confirmado, conta sem bloqueio vigente, cadastro profissional aprovado e sem suspensão. Não houve mudança de senha, aprovação ou presença.
- Login nos quatro portais e na entrada administrativa separada diferencia credenciais explicitamente inválidas de falha de rede, timeout, 402, 408 e erros 5xx. Falhas desconhecidas não são apresentadas como senha incorreta.
- `auth_error_logs` recebe apenas horário do servidor, categoria do portal, operação, código limitado e status. Só administradores leem; visitantes registram somente valores permitidos pela função de diagnóstico. Sem senha, e-mail, token ou erro bruto. Se o banco inteiro estiver indisponível, não é possível gravar naquele instante; não há promessa de registro de falhas que não chegaram ao servidor.
- Recuperação usa `https://plantayraiz.com.br/redefinir-senha`. A rota pública existe e chama `updateUser({ password })`; o endereço antigo continua válido. Resposta neutra para evitar enumeração de contas.
- `health-check` foi implantada e executa RPC restrita ao serviço com `SELECT 1`; retorna disponibilidade e horário sem detalhes internos.
- `admin-access-support` foi implantada; valida identidade e papel de administrador no servidor. A lista mostra contas vinculadas aos registros da vitrine por CRM/UF, preservando perfis-base e retiradas explícitas. Nenhum e-mail é disponibilizado a visitantes.
- Painel real aberto como administrador autorizado: saúde online e 72 perfis da vitrine listados. Solicitação real de recuperação do médico citado foi aceita pelo serviço após confirmação pela tela. Isso não comprova entrega no aparelho/caixa postal, nem conclusão da redefinição.

## Testes

- `bun run test -- src/lib/auth-access.test.ts src/lib/auth-access-errors.test.ts src/lib/admin-auth.test.ts src/lib/account-session.test.ts src/lib/patient-journey.test.ts`: 34 testes aprovados.
- Navegador: indisponibilidade 503 simulada nas entradas médico, paciente, farmácia e admin, além de `/admin-login`: mensagem de instabilidade, sem atribuir a falha à senha.
- Navegador: resposta explícita `invalid_credentials` distingue senha/e-mail inválidos.
- Navegador: recuperação com serviço simulado indisponível usa aviso neutro e endereço canônico; página sem link de recuperação válido não autoriza redefinição.
- Chamada anônima real ao apoio administrativo: 401, sem lista de médicos.
- Registros mínimos lidos do banco após as simulações; categorias e códigos persistidos.
- Compilação automática: OK. Não houve pausa intencional do serviço real.

## Dependências e limites

1. **Site URL:** leitura da configuração mostrou o domínio hospedado Lovable como endereço principal. Os dois domínios oficiais já estão autorizados via `/**`. Alterar Site URL para `https://plantayraiz.com.br` exige ação em Mais → Usuários → Configurações de autenticação → Avançado; a ferramenta de leitura não altera esse campo.
2. **SMTP Brevo:** não foi alterado nem comprovado. A ferramenta de configuração disponível não recebe opções SMTP. A aceitação da solicitação de recuperação não identifica o provedor utilizado. Não foram solicitadas ou expostas credenciais.
3. **Alertas externos:** não implantados. Uma função/cron dentro do Cloud não pode detectar e enviar mensagens enquanto o Cloud inteiro está pausado. Um monitor independente precisa consultar a saúde e enviar email/WhatsApp com canais próprios; depende de acesso de implantação e envio nesse ambiente.
4. **Senha real e recebimento:** não foram testados login por senha dos titulares nem consumo do link enviado ao médico. Sessão administrativa autorizada comprova acesso autenticado ao painel, não validade da senha digitada.
5. **Publicação:** funções disponíveis no Cloud; as telas foram conferidas na prévia, sem publicação nesta entrega.
6. Nenhuma conexão, preço, dado clínico, aprovação ou configuração de cobrança foi alterada. Estas correções não eliminam os custos nem a possibilidade de pausa do serviço.