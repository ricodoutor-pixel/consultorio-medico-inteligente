# Roadmap

## Vitrine — 09/11/2026
- [x] Foto correta da Dra. Ana Karoliny; Dr. Milton 1º e Dr. Victor 2º; fotos dos médicos 20 MB → 1,2 MB
- [ ] Publicar no site oficial

## Ativação automática do VIP médico — 09/11/2026
- [ ] Encerrar benefícios no vencimento, enviar oferta de renovação e analisar recorrência autorizada no Mercado Pago sem cobrança automática não consentida
- [ ] Reconciliar pagamento confirmado de Milton e identificar a segunda assinatura real, preservando vigência e KYC
- [ ] Unificar ativação automática e reconhecimento VIP no painel, vitrine, prontuário e copiloto
- [ ] Enviar boas-vindas com benefícios ao médico e aviso administrativo uma única vez
- [ ] Executar testes e conferir dados persistidos e acesso autenticado; registrar limites da entrega no celular

## Fechamento da Orientação e aviso de pagamento — 08/11/2026
- [x] Mostrar sucesso e continuação após confirmação real nos retornos compartilhados, Orientação, compras/planos em /pay e consulta; sem liberar serviço por retorno do checkout
- [x] Executar regressões: 90 testes e 1 consulta PubMed real aprovados; compilação OK; três funções implantadas
- [x] Conferir retomada autenticada disponível, parâmetros falsos bloqueados e aviso de Pix aprovado preexistente pela tela; sem criar atendimento ou pagamento artificial
- [ ] Publicação solicitada; versão oficial ainda não confirmada: /payment-success mostrou 404 após redirecionamento para domínio sem www. Fonte operacional oficial confirmada antes da publicação
- [ ] Concluir implantação Hostinger — bloqueio confirmado: sem acesso SSH/SFTP utilizável; roteiro preservado, nenhum processo remoto alterado
- [ ] Aceite integral com próximo pagamento e atendimento consentido; confirmar avisos no celular e Pix no banco

## Nomes personalizados dos pagamentos — 08/11/2026
- [x] Padronizar descrições nos criadores de pagamento identificados, incluindo produtos dos carrinhos, planos, carteira e renovações; 11 funções implantadas, sem alterar valores ou conta
- [x] Retirar recebedor fixo da Orientação; novos Pix exibem descrição retornada pelo pagamento, sem substituir titular bancário
- [x] 12 testes aprovados e compilação OK; consulta confirma 26 serviços existentes já com sufixo; nenhuma cobrança criada
- [ ] Conferir novo Pix na tela e no banco — conta autorizada não abriu tela de Pix pendente; depende do próximo Pix do usuário
- [ ] Publicar alteração da tela no site oficial — funções já implantadas; frontend ainda não publicado nesta entrega

## Citações — ajustes finais do teste 6 (08/11/2026)
- [x] Pedido reiterado às 14:10 UTC revalidado: 38 regressões + 1 consulta real PubMed aprovadas; teste adicional comprova exclusão do registro interno incorreto antes do prompt; funções reimplantadas; provas em docs/CITACOES_TESTE6_REVALIDACAO_2026-11-08.md
- [x] Remover parágrafos bibliográficos contraditórios antes de anexar metadados reais
- [x] Exigir relação com CBD/ansiedade e tipo randomizado quando solicitado; canonicalizar registros internos via PubMed
- [x] Corrigir tratamento "você" nos novos relatórios sem formas com barra
- [x] 37 regressões + 1 consulta real PubMed aprovadas; funções implantadas; provas em docs/CITACOES_TESTE6_2026-11-08.md; compilação OK
- [ ] Repetir pergunta e gerar relatório na sala paga pela tela — depende do próximo teste consentido do usuário; nenhum atendimento artificial criado

## Mensagens WhatsApp duplicadas — 08/11/2026
- [x] Concluir exclusão mútua durante retentativas dos avisos e impedir repetição em resultado incerto; 19 testes + 32 verificações passam; três funções implantadas, sem mensagens reais
- [x] Entregar passos da Hostinger em docs/WHATSAPP_ENVIO_UNICO_HOSTINGER_2026-11-08.md; caminho/processo previstos no projeto distinguem-se da VPS não acessada
- [x] Corrigir proteção ausente no Cloud: tabela de IDs não existia; agora somente uma inserção atômica inicia a resposta e falha de armazenamento bloqueia o envio. brisa-bot implantado; permissões servidor-only conferidas
- [x] Preparar trava de processo Hostinger, histórico canônico e checagem sem registrar envio antecipadamente; 11 testes + 32 verificações passam, sintaxe válida, compilação OK
- [ ] Implantar alterações Hostinger — API administrativa acessível (HTTP 200), mas SSH rejeita a chave armazenada por formato inválido; nenhum serviço remoto foi alterado
- [ ] Comprovar ausência de duplicação no WhatsApp real — logs antigos do bot não registram mensagens atuais; avisos recentes de pagamento/início/fim têm um único envio aceito por evento. Depende de implantação Hostinger e próximo evento real

## Copiloto e leituras protegidas — 08/11/2026
- [x] Copiloto implantado: resposta retida até conferir PMID; linhas bibliográficas substituídas por autoria/metadados PubMed, citações indisponíveis omitidas; SOAP sem citações preservado
- [x] Acesso anônimo bloqueado nos quatro conjuntos (HTTP 401); leitura autenticada dos catálogos preservada (HTTP 200); experiências somente do titular/admin, leitura de outro titular vazia
- [x] 37 testes passam; chamada autenticada ao copiloto HTTP 200 com três PMIDs e autoria reconferidos no PubMed; nova varredura sem os quatro achados anteriores, mantendo informações de catálogo compartilhado entre contas logadas
- [ ] Testar pela tela durante consulta real — depende de médico participante e atendimento consentido; não criados pagamentos, salas ou atendimentos artificiais

## Unificação da Orientação Técnica — 08/11/2026
- [x] Direcionar entradas de orientação da vitrine, menu de serviços, painel, ações rápidas, download, quiz e retorno de pagamento à página atual; retirar OrientacaoRapida, BrisaOrientacaoRedirect e OfertaEspecial
- [x] Endereços antigos redirecionam preservando pedidos, indicação e sessão; relatórios e dados reais intactos; atalhos do app e sitemap atualizados
- [x] 16 testes passam; sete endereços antigos e botão da vitrine testados em celular e computador, sem cobranças nem erros de execução; compilação OK
- [ ] Disponibilizar unificação no site oficial — depende de publicação; teste pago permanece aguardando aviso do Dr. Edilson

## PubMed e agente compartilhado — 07/11/2026
- [x] Verificar Gemini 3.8 na Orientação (logs reais) e pesquisa PubMed real (ESearch/EFetch, resumos e contagens medidas)
- [x] Compartilhar recuperação científica segura com copiloto médico Gemini 3.8, preservando supervisão humana; remover triagem simulada enviada ao agente no Workspace
- [x] 18 testes passam; funções implantadas; chamada autenticada real ao copiloto retornou HTTP 200, Gemini 3.8 e referências PubMed; compilação OK
- [ ] Validar pela tela durante consulta real com médico aprovado — bloqueado: não há atendimento ativo/consentido fornecido; nenhuma cobrança/sala criada artificialmente

## Correções finais do teste 18:12–18:22 — 07/11/2026
- [x] 1. Despedida independente da pergunta anterior; nova dúvida impede fechamento (testes)
- [x] 2. Avaliação com rolagem imediata, confirmação da nota lida no servidor e erro com retentativa; nota real 3/3 exibida
- [x] 3. Código do pedido persistido nos novos relatórios/avisos; código original do corpo usado no PDF histórico, sem reescrita
- [x] 4. Código oficial referral_links reutilizado: três recarregamentos e painel iguais, sem perda de vínculos
- [x] 5. Busca bilíngue CBD/ansiedade, DOI normalizado e PMID validado; 5.337 PMIDs existentes, 11 não encontrados (DOIs destes ainda não auditados)
- [x] 6. Histórico administrativo com tentativas, identificação e aceitação separada de entrega; consulta de recibos somente para admin
- [x] Relatório técnico em docs/CORRECOES_ORIENTACAO_2026-11-07.md; 25 testes passam, build OK, funções implantadas
- [ ] Novo Pix/teste de despedida ativa e avaliação nova — depende do pagamento pelo dono; sessão atual já encerrada, sem reabrir artificialmente
- [ ] Confirmar três entregas no celular em até 1 minuto — avisos antigos sem ID do provedor; novos recibos dependem de evento real e acesso admin
- [ ] Publicar frontend — aguarda autorização após entrega; funções já implantadas

## Melhorias do relatório final da Orientação — 07/11/2026
- [x] Encerramento automático: despedida após "posso ajudar em mais algo?" fecha a sala no servidor e mostra as três carinhas; fim dos 30 min também encerra com aviso; 14 testes passam
- [x] Citações verdadeiras: DOI validado no Crossref antes de virar link; sem link confirmado o agente diz "não consegui confirmar o link"; contagem sem "exatamente"; DOI 10.1177/15347354241292978 confirmado inexistente (Crossref 404, ausente da base)
- [x] Sem continuidade falsa: bloco de continuidade conta atendimentos anteriores reais; primeira conversa proíbe "desde nossa última conversa"
- [x] Despedida curta sem nova pergunta (mensagem fixa no encerramento automático + regra no prompt)
- [x] Relatório com nome do paciente, código OT-XXXXXXXX e data/hora; "você" no lugar de "senhor(a)" (prompt + saneador); PDF com código no nome do arquivo
- [x] Triagem: sala não inicia mais após a 4ª resposta — a pergunta opcional aparece antes
- [x] Persona/CRM: texto centralizado em `agents.ts`/`clinic-info.ts`; texto do CRM NÃO alterado — decisão do dono/jurídico pendente
- [x] Indicação: texto sem promessa de ganho garantido (25/15/10 do líquido); link da conta logada mostrado na tela com botão copiar
- [x] Avisos WhatsApp de início e encerramento (com nota e duração), dedup por pedido+evento, registro de tentativa — entrega real no celular não verificada
- [x] Layout: cabeçalho da sala compacto; botão "Gerar relatório" dentro da sala com "Gerando… Ns" e "Baixar PDF"
- [ ] Conta de paciente de teste separada + acesso QA somente leitura — bloqueado: criação de usuário de autenticação exige ação do dono no cadastro
- [ ] Teste integral com pagamento real das novas regras + publicar

## Instalação direta pelo QR Code — 07/11/2026
- [x] Abrir a opção de instalar diretamente ao escanear, com confirmação do navegador e instruções específicas para iPhone, sem baixar atalho de computador no celular
- [x] Conferir entrada direta em Android, iPhone e computador; botão exercitado com evento de instalação simulado, instruções iPhone e ausência de transbordamento verificadas
- [ ] Instalação física pelo QR no site oficial — depende de publicação e confirmação do usuário no dispositivo; instalação nativa real não foi comprovada na prévia

## Revisão do teste e autorização condicionada da Fase 2 — 07/11/2026
- [x] Conferir pagamento, tentativa de WhatsApp, relatório, avaliações, fontes científicas e destino atual do site; entregar relatório técnico e prompt sem executar cobrança, mensagens ou repasses
- Teste real de vídeo não autorizado para execução nesta auditoria: depende de correção dos bloqueios, médico participante identificado e confirmação do Dr. Edilson.

## Prompt para novo teste integral — 07/11/2026
- [x] Entregar prompt do agente: novo pagamento, notificações, triagem, Orientação/consulta, três carinhas, encerramento, indicação, agenda e auditoria; divergências atuais documentadas, sem executar pagamento ou alterar plataforma
- Implementação e comprovação destes novos requisitos serão tarefas do agente executor; não considerar funcionalidades aprovadas apenas por constarem no roteiro.

## Orientação Técnica v3 — 07/11/2026
- [x] Liberar PDF educativo: download real verificado com conta proprietária; revisão não bloqueia, sem aprovação médica automática
- [x] Adicionar ampliar/minimizar e letra ampliável à sala; validação visual com sessão paga ainda bloqueada porque conta autorizada abre introdução
- [x] Diagnosticar tempo do agente, bloqueio do relatório e base científica real (5.348 registros medidos)
- [x] Confirmar mudança da entrega revisada para relatório educativo imediato sem alterar prescrição ou assinatura
- [x] Corrigir link `/profissionais/{id}`: instrução do agente reescrita + saneador de links nas respostas e no relatório
- [x] Avaliação por três carinhas + encerramento: tabela `avaliacoes_orientacao` (1 por atendimento), ações `close_session`/`submit_rating`/`skip_rating`, sala somente leitura, tela de próximos passos com indicação (25/15/10)
- [x] Triagem curta de 5 perguntas (emergência primeiro, queixa+tempo, intensidade 0–10, medicamentos com "Nenhum", expectativa opcional); nome/idade do cadastro; 9 testes passam
- [x] Aviso de pagamento ao Dr. Edilson com dedup e registro (`payment_notify_log`), ligado ao webhook E à confirmação direta; formato sem sintomas/CPF
- [x] Citações restritas à busca real: contagem medida injetada no prompt (5.348), regra "não encontrei estudo" quando a busca vem vazia
- [ ] Reutilizar resumo da triagem (30 dias) nas consultas pagas com médicos reais
- [ ] Consultas com médicos reais: avaliação antes de encerrar + liberação financeira só após avaliação
- [ ] Microfone para ditar mensagem na sala; chips dinâmicos por assunto
- [ ] Painel admin: aba "Relatórios para revisar" com média das avaliações; envio do PDF por e-mail e listagem em "Meu painel"
- [ ] Corrigir duplicidade de rotas `/afiliados` e `/indicacoes`
- [ ] Testar fluxo completo com pagamento real (seção 13 do prompt) e publicar
- [ ] Ajustar tempo, relatório com saída em 60s e revisão administrativa
- [ ] Testar conversa/ampliar/minimizar com sala paga acessível — conta autorizada não acessa sala existente; PDF real foi baixado sem erros

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

- [x] Resolver aviso de qualidade pendente no monitoramento (explicar causa e correção)
- [x] QR Code para instalar o app em qualquer aparelho + opção de baixar

## Últimos detalhes da Orientação Técnica (teste de 08/11/2026)

- [x] 1. Honestidade sobre a base: agente diz "consulto o PubMed em tempo real e uma biblioteca interna curada", sem número fixo nem "treinado"; citações rotuladas [PubMed]/[Biblioteca interna]
- [x] 2. Citações verificadas: PMID, primeiro autor, ano e revista vêm do registro do PubMed; cache de 24h; PMID 29307505 confirmado (MacCallum & Russo, Eur J Intern Med, 2018)
- [x] 3. Privacidade: só termos clínicos genéricos saem ao PubMed; auditoria por atendimento em pubmed_query_audit (termos, hora, total)
- [x] 4. Totais só de chamada real à API, com termo e data da busca
- [x] 5. Níveis de evidência sempre com desfecho e população; proibido "a ciência prova"/"comprovado"
- [x] 6. Painel de Notificações já mostra pagamento/início/encerramento com horário, status e tentativas
- [x] 7. Links antigos PRZ-/PLR-/PLANTA- mapeiam para o mesmo código; códigos de indicação só nascem no servidor (removidos geradores do navegador)
- [x] 8. PDF baixa como .pdf com o código do atendimento no nome (verificado no código)
- [x] 9. Sem pergunta após despedida ou resposta objetiva; "você" sempre; sem evidência → "não encontrei estudo confiável sobre isso" + sugerir médico
- [ ] Conta de paciente de teste separada — pendente: exige cadastro comum no site (não crio usuário de autenticação por fora)
- [ ] Publicar frontend e repetir o teste completo com Pix real — depende do Dr. Edilson
