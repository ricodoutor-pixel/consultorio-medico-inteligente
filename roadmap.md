# Roadmap

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

