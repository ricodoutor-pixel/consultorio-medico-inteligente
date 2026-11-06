# Saída das contas — verificação de 06/11/2026

## Alterações
- Cabeçalho e menu móvel oferecem saída com texto; Perfil abre menu sem navegar diretamente.
- Saída aguarda confirmação, trata falhas e limpa cache/dados locais da conta, preservando preferências públicas e registros no servidor.
- Painéis do paciente exigem login; controles administrativos usam papel do servidor, sem autorização por lista de e-mails.
- Chave Mestra fica restrita às páginas administrativas na prévia e oculta em produção.
- Menu de administrador oferece saída global com confirmação, aviso aos 29 minutos e saída aos 30 minutos de inatividade.
- Entrada administrativa e solicitação de saída registram horário e aparelho na auditoria existente. Uma solicitação não é registrada como saída concluída; a revogação pertence ao serviço de autenticação.

## Testes solicitados
1. Celular: menu de conta e saída real verificados com conta autorizada, sem erro de execução; nome desaparece após saída. Papel admin **não verificado**: a conta disponível não tem `admin` no servidor.
2. Computador: mesmo resultado da saída real. Papel admin não verificado.
3. Após sair, `/dashboard` redireciona ao login. Saída pelo botão interno do painel: verificação adicional necessária.
4. Perfil móvel abre menu e mantém a página atual: verificado.
5. Recarregar após sair e acessar painel: verificado sem restauração da conta. Botão Voltar: verificação adicional necessária.
6. Chave Mestra não aparece na página inicial da conta disponível; condições exigem admin, página administrativa e ambiente não produtivo. Visitante verificado; conta de paciente distinta não disponível.
7. Saída global implementada com confirmação; revogação entre dois aparelhos reais ainda não testada, sem conta administrativa autorizada disponível.
8. Limites de 29/30 minutos verificados por testes unitários; espera real em conta administrativa ainda não executada.

## Limites
A conta autorizada usada nos testes não possui o papel administrativo no banco oficial. Nenhum papel foi atribuído automaticamente. Publicação e testes em dois aparelhos não foram executados nesta verificação.