# WhatsApp: envio único e aplicação na Hostinger

## Concluído no Cloud

Avisos de pagamento, início e encerramento usam uma chave única por pedido/evento. Corrigida uma brecha adicional: antes, uma tentativa publicava o estado “falhou” enquanto o mesmo emissor ainda faria outra tentativa; uma chamada concorrente podia assumir esse aviso e enviar também. Agora a reserva permanece ativa durante toda a rodada.

Cada tentativa registra intenção antes de contatar a Evolution; falha de armazenamento impede o envio. Aceitação do provedor encerra as tentativas. Timeout, queda de conexão ou erro 5xx deixam o aviso reservado com resultado desconhecido: não são repetidos automaticamente nem pelo reenvio manual. Somente rejeição explícita permite recuperação; 429 permite até três tentativas com a reserva mantida.

**Limite importante:** não existe garantia absoluta de exatamente uma entrega ao celular sem idempotência transacional do provedor. Esta implementação prioriza não duplicar; uma tentativa incerta pode precisar de conferência humana e permanecer sem confirmação. Aceitação pela Evolution não comprova entrega no telefone.

Provas: 19 testes unitários aprovados, incluindo oito cenários novos de envio; 32 verificações complementares aprovadas; sintaxe do responder válida; compilação OK. Nenhuma mensagem ou cobrança real criada. Consulta somente leitura encontrou 14 avisos registrados como enviados (nove com aceitação explícita), sem falhas pendentes nessa consulta; isso não prova ausência de duplicação no celular.

## O que falta na Hostinger

O bloqueio anterior de acesso SSH por formato inválido da chave permanece **não resolvido por esta entrega**. Não houve implantação nem reinicialização remota. Não envie chave privada, senha ou arquivo `.env` no chat. As etapas abaixo podem ser realizadas pelo responsável no terminal da VPS Hostinger, ou ele pode corrigir o acesso seguro já configurado para permitir a implantação assistida.

### 1. Conferir onde o agente realmente está

Execute na VPS:

```bash
pm2 list
pm2 describe brisa-live-responder
```

O arquivo de configuração deste projeto prevê o nome **brisa-live-responder**, pasta **/opt/plantayraiz** e arquivo **scripts/agent_evolution_brisa_live_responder.mjs**. Esses são os valores do projeto, não uma leitura atual da VPS. Se os detalhes no terminal forem diferentes, use a pasta efetivamente indicada e não crie uma segunda instalação.

### 2. Deixar apenas um responsável pelas respostas

Confira os fluxos ativos do n8n e o destino do webhook da instância Evolution. A configuração do projeto encaminha eventos ao n8n; é necessário verificar quais fluxos realmente respondem hoje.

Mantenha o responder Hostinger como único emissor de respostas gerais. Desative apenas a etapa/fluxo concorrente que responda ao mesmo evento recebido — não desligue Evolution, pagamentos, coleta de eventos, histórico ou atendimentos ativos. Confira também processos antigos em outra pasta, serviço, container ou máquina.

Avisos administrativos de pagamento/início/fim permanecem exclusivamente no Cloud; retire somente cópias desses mesmos avisos eventualmente configuradas no n8n/Hostinger. Não altere o webhook do Mercado Pago.

Se houver uma sessão ativa dependendo de um desses fluxos, coordene a mudança com o operador antes de parar o emissor. A trava local não impede outro programa ou outra máquina de responder.

### 3. Atualizar os arquivos corretos, preservando os históricos

Pare apenas o agente identificado:

```bash
pm2 stop brisa-live-responder
```

Pelo processo de implantação já utilizado, leve a versão atual destes arquivos à mesma pasta da VPS, preservando os caminhos:

- `scripts/agent_evolution_brisa_live_responder.mjs`
- `scripts/lib/brisa-worker-lock.mjs`
- `scripts/lib/brisa_security.mjs`
- `scripts/lib/brisa-response-policy.mjs`
- `scripts/brisa_onboarding_config.mjs`
- `ecosystem.config.cjs` (sem iniciar outros aplicativos da lista)

Preserve `.env` e todos os arquivos de memória/histórico: `evolution_processed_messages.json`, `brisa_conversation_memory.json`, `brisa_lid_phone_map.json`, `evolution_human_mode_contacts.json`, `evolution_optout_blacklist.json` e `n8n_active_orientation_contacts.json`. Não apague pausas humanas nem remova manualmente `brisa-responder.lock` enquanto existir um processo vivo. A trava cuida da limpeza após término normal e detecta proprietário encerrado.

Confirme que o usuário do processo consegue escrever na pasta `scripts`. Confira somente a presença das configurações existentes, sem mostrar valores: Evolution URL/chave/instância, conexão oficial do Cloud e configuração de IA. Não copie configurações de documentos antigos nem peça chave de serviço do Cloud.

### 4. Iniciar somente uma instância

Se a pasta real for a prevista no projeto:

```bash
node --check /opt/plantayraiz/scripts/agent_evolution_brisa_live_responder.mjs
pm2 startOrRestart /opt/plantayraiz/ecosystem.config.cjs --only brisa-live-responder --update-env
pm2 save
pm2 list
pm2 describe brisa-live-responder
```

O arquivo deve indicar `instances: 1`, `exec_mode: fork`, `watch: false`. Não execute o arquivo manualmente em paralelo, não use cluster e não inicie a lista inteira de aplicativos. Se aparecer “Brisa responder already running; duplicate worker stopped”, identifique a cópia ainda ativa antes de qualquer remoção da trava.

### 5. Comprovar com um próximo evento real autorizado

Depois da atualização, você pode enviar uma pergunta pelo WhatsApp para confirmar que chega uma única resposta. Confira o ID da mensagem recebida e o envio correspondente no histórico local/Evolution/n8n, sem divulgar conversas ou telefones. Para avisos de pagamento/início/encerramento, aguarde um atendimento autorizado: cada evento deve ter uma única aceitação de envio e um único aviso no celular. Não crie pagamento só para esta implantação.

Se houver resultado desconhecido, procure o envio no histórico da Evolution antes de solicitar recuperação; não apague a reserva e não force novo envio às cegas. Resultado desconhecido não significa rejeição.

## Pendências exatas

1. Aplicar os arquivos e manter um único emissor na VPS (acesso remoto não disponível nesta entrega).
2. Conferir os fluxos ativos n8n/Evolution e remover emissores duplicados dos mesmos eventos.
3. Confirmar resposta e avisos no telefone no próximo evento real autorizado.

A proteção dos avisos no Cloud não depende de republicar o visual do site. A proteção do responder na Hostinger depende das etapas acima.