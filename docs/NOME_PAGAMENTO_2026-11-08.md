# Nome que aparece no Pix — Relatório técnico (08/11/2026)

## Pedido
Em todo pagamento, exibir o nome do produto/serviço + empresa ("Orientação Técnica — Planta y Raiz"),
nunca o nome pessoal do dono, sem mudar método de pagamento, valores, banco, identidade visual ou fluxo.

## O que mudou

### 1. Tabela única de nomes (editável)
- Nova tabela `public.payment_services`: código do serviço, nome exibido ao pagador, valor, descritor
  da fatura, recorrência, ativo. Leitura pública (preços são públicos), escrita só interna.
- 27 serviços cadastrados: Orientação Técnica R$30, Retorno R$90, Chat R$100, Vídeo R$150,
  Consulta Premium R$180, Consulta Especializada R$250, 7 planos e 13 módulos do Consultório Digital.
- `supabase/functions/_shared/payment-catalog.ts`: lê a tabela; se o banco falhar, usa espelho
  embutido (nunca bloqueia cobrança). Serviço sem cadastro usa "Serviço Planta y Raiz" e grava
  aviso no log para o administrador.

### 2. Funções de pagamento atualizadas
- `mp-checkout`: nomes, valores e descritor vêm da tabela única (Pix na tela, cartão e assinaturas).
  Pedidos do Shopping e carrinhos de prescrição também ganharam "— Planta y Raiz".
- Descritor da fatura padronizado para `PLANTAYRAIZ` em: `create-payment`, `create-cart-payment`,
  `create-subscription` (antes havia "PLANTA Y RAIZ" e "PLANTA E RAIZ" divergentes).
- `brisa-payment-link`, `saude-verde-subscribe`, `load-wallet-pix`: descrições com "— Planta y Raiz".
- Referência externa continua sendo o código do atendimento/pedido, sem nome de paciente nem dado de saúde.

### 3. Tela do Pix
- Acima do QR Code: "Pagamento: Orientação Técnica — Planta y Raiz · R$ 30,00 · Recebedor: Doutor Rico Ltda".

### 4. Recibos e avisos
- O aviso de WhatsApp ao administrador já usava o nome do serviço (verificado em `_shared/payment-notify.ts`).

## Conta recebedora hoje (consulta ao provedor em 08/11/2026 05:29 UTC)
- Nome: **Doutor Rico Ltda** (apelido PLANTAYRAIZLTDA, e-mail contato@plantayraiz.com.br)
- Tipo de documento cadastrado: **CPF** (pessoa física), não o CNPJ 30.740.319/0001-14.
- Função `mp-account-info` criada para o administrador reconsultar quando quiser.

### O que depende de você fora do código
O nome do recebedor que o banco do pagador mostra vem do cadastro da conta Mercado Pago, não do código.
Para aparecer "Planta y Raiz" / o CNPJ da empresa:
1. Acesse o Mercado Pago (app ou site) com a conta contato@plantayraiz.com.br.
2. Em **Seus dados / Dados da conta**, altere a conta para conta de empresa (CNPJ
   Bezerra Med Soluções Integradas Ltda., nome fantasia Planta y Raiz) ou ajuste o nome fantasia.
3. Nada disso foi alterado por mim — exige sua ordem e acesso à conta.
Observação: alguns bancos mostram ao pagador também a descrição que enviamos ("Orientação Técnica —
Planta y Raiz"), outros mostram só o nome do recebedor. Isso varia por banco e não é controlável pelo código.

## Provas dos testes de aceitação
1. Pix da Orientação criado de verdade (pagamento 187398887513, pendente, sem cobrança):
   registro do envio ao provedor → `description: "Orientação Técnica — Planta y Raiz"`, R$ 30.
2. Um Pix de cada serviço (todos pendentes, sem cobrança):
   - Consulta por Chat — Planta y Raiz · R$ 100 (pagamento 188461961566)
   - Consulta por Vídeo — Planta y Raiz · R$ 150 (pagamento 188461961570)
   - Retorno — Planta y Raiz · R$ 90 (pagamento 188463110312)
   Nenhum levou nome pessoal.
3. Nome do Retorno alterado na tabela para "Retorno TESTE — Planta y Raiz" → o Pix seguinte
   (pagamento 187399209197) saiu com o nome novo. Nome oficial restaurado em seguida.
4. Conta recebedora: "Doutor Rico Ltda" (CPF) — troca para o CNPJ depende de você (acima).
5. Nenhum pagamento anterior foi alterado e nenhum valor mudou (testes: 108/108 passando;
   valores oficiais verificados em teste automatizado).

## Limites desta verificação
- Os 5 Pix de teste ficaram pendentes e expiram sozinhos; nenhum valor foi cobrado.
- A linha "Recebedor: Doutor Rico Ltda" na tela do Pix foi verificada no código e na compilação;
  não fiz o caminho visual completo até o QR no navegador.
- A exibição do nome no aplicativo do banco do pagador só pode ser confirmada com um pagamento real.
