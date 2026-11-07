# Roadmap

## Relatório do teste de Orientação — 07/11/2026
- [x] Confirmar ausência de ot_messages/ot_reports no banco e aplicar criação protegida; corrigir persistência fragmentada e erros ocultos sem alterar pagamento primeiro
- [x] Mostrar falhas e estados de geração na sala, ajustar rolagem e ocultar balão na Orientação; adicionar download PDF aprovado
- [x] Executar 10 testes de triagem/stream/revisão; compilação aprovada e introdução no celular sem transbordamento ou erros de execução
- [ ] Validar envio real de mensagem e geração/revisão/PDF — sessão autorizada abre introdução, sem sala ativa; não prolongar sessão nem aprovar relatório automaticamente

## Saída segura das contas — 06/11/2026
- [x] Unificar logout, menus de conta e limpeza de sessão sem apagar registros
- [x] Restringir Chave Mestra, proteger painéis e adicionar saída global e aviso de inatividade administrativa
- [x] Testar saída real, Perfil, painel, recarregamento e Voltar em celular/computador; testes das regras passam
- [ ] Validar saída global entre aparelhos e expiração administrativa real — conta autorizada disponível não possui papel admin no servidor; não atribuir automaticamente

## Sobreposição da página inicial — 05/11/2026
- [x] Corrigir distância do título usando a altura completa do cabeçalho e da faixa superior
- [x] Verificar título e ausência de cortes em oito larguras (320–1920px); menu abre e fecha, sem erros de execução

## Pix Orientação Técnica — 04/11/2026
- [x] Conferir ordem nos demais serviços; corrigido sucesso do agendamento por falha de checkout, com testes
- [ ] Validar benefícios pagos e entrega Shopping com conta real e pagamento — bloqueado por sessão de teste indisponível
- [x] Diagnosticar validação e erro de gravação do Pix de R$30 — WhatsApp obrigatório recusava pedidos sem número
- [x] Implementar pagamento primeiro, autorizado pelo usuário; triagem persistida após aprovação e sala protegida
- [ ] Testar geração de Pix com conta real — bloqueado: não há conta de teste identificada na prévia
- [ ] Pagar, concluir 10 perguntas, entrar na sala e aprovar relatório — depende de pagamento e revisão humana

## Auditoria WhatsApp Brisa — 03/11/2026
- [ ] Atualização da VPS solicitada às 05:18 UTC — acesso rechecado: porta SSH acessível, chave armazenada não carregável pelo cliente SSH e API Hostinger retorna 403; nenhum arquivo ou serviço remoto alterado. Requer correção do acesso no cofre seguro.
- [x] Conferir regras implantadas e registros disponíveis sem divulgar dados pessoais
- [x] Corrigir regras centrais e preparar proteção de envio, mídia e encaminhamento humano na VPS
- [x] Testar oito regras e chamadas reais no Cloud; registrar limites em docs/AUDITORIA_BRISA_2026-11-03.md
- [ ] Atualizar e validar envio real no WhatsApp Hostinger — bloqueado pelo acesso administrativo à VPS; proteção distribuída e recuperação transacional não comprovadas

## Card do Dr. Amir sem foto — 27/10/2026

- [x] Criar card vinculado ao cadastro real e comprovante CFM, sem alterar aprovação KYC ou presença online
- [x] Retirar a foto gerada e deixar o card sem imagem, com as iniciais, até chegar a foto feita por outra agente
- [x] Incluir o card nos links enviados ao Google e limpar endereços antigos (med-0, mock-olivia, mock-suelen)
- [ ] Anexar a foto oficial quando chegar e reexibir o card com imagem
- [ ] Disponibilizar o novo card no site publicado — depende de publicação autorizada

## Retirada autorizada de dois cards — 26/10/2026

- [x] Retirar Leuma e Ana Paula da vitrine e dos links SEO, preservando históricos e documentos
- [x] Validar ausência dos dois cards e dos links no sitemap — navegador e dois testes passaram
- [ ] Disponibilizar retirada no site publicado — depende de publicação autorizada

## Organização das orientações dos agentes — 20/10/2026

- [x] Centralizar fonte oficial, limites e procedimento de incidente sem alterar conexões ou dados
- [x] Sinalizar documentação histórica e eliminar instruções conflitantes do prompt operacional
- [x] Confirmar disponibilidade do Lovable Cloud e conferir conexão efetiva — oficial saudável; prévia usa oficial, site publicado usa legado
- [x] Conferir totais de registros oficiais — 38 profissionais, 147 documentos KYC, 57 perfis e 1 vendor; sem inferir aprovações ou pacientes
- [ ] Corrigir conexão do site publicado para o oficial — aguarda confirmação explícita do Dr. Edilson e ajuste autorizado no ambiente de publicação; não migrar dados automaticamente

## Reinicialização do site — 11/10/2026

- [ ] Otimizar o reaproveitamento de arquivos e evitar recarregamentos automáticos durante o uso
- [ ] Verificar reabertura e atualização sem alterar a aparência

## Achados de pagamentos e agendamento — 10/10/2026

- [ ] Corrigir encaminhamento para médicos e horários reais, sem identificadores fictícios
- [ ] Conferir e corrigir cobrança de vídeo R$150 / chat R$100
- [ ] Impedir avanço por erro de pagamento ou declaração de PIX sem confirmação

- [ ] Validar e completar o cadastro KYC da Dra. Mariana sem autoaprovação
- [ ] Anexar a comprovação oficial do CRM e preparar foto padronizada preservando marcas oficiais
- [ ] Criar o card offline em vermelho até completar os anexos obrigatórios
- [ ] Ordenar os médicos por completude, preservando Dra. Suelen e Dr. Daniel no topo

## Fluxo Orientação Técnica — correções do teste

- [x] Renderizar e exigir respostas nas 10 perguntas da triagem
- [x] Validar CPF e salvar a triagem real ligada ao paciente
- [x] Vincular pedido de R$ 30 à triagem e consultar seu status
- [x] Liberar WhatsApp somente após pagamento aprovado
- [x] Confirmar pagamento e iniciar automaticamente o atendimento da Brisa
- [x] Preservar TCLE auditável e revisar separação humano/veterinário
- [ ] Validar o fluxo central sem contaminar dados reais
## Verificação da automação Hostinger

- [x] Verificar endereços e certificados da Evolution e do n8n sem alterar serviços
- [ ] Acessar a VPS Hostinger com as credenciais existentes — bloqueado: API retorna 403 e SSH recusa a credencial atualizada
- [ ] Ativar e validar o webhook de produção do n8n — bloqueado pelo acesso administrativo; POST retornou 404
- [ ] Validar entrada e resposta real da Brisa na Hostinger — depende do fluxo n8n ativo

- [x] Agendamento: modalidade → pagamento → escolha do horário do médico após pagamento aprovado (30/10)

## Compra de créditos

- [ ] Usuário quer comprar 20 créditos — abrir cartão de compra de créditos no chat (01/11)

- [x] Corrigir 3 erros de compilação (MedicalDashboard isMock, doctor-schedule.test.ts mock, Profissionais proSlots) — build OK (01/11)
