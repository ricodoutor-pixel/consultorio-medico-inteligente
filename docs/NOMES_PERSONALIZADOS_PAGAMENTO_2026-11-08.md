# Nomes personalizados de pagamentos — 08/11/2026

## Aplicado
- Descrição padronizada: `<nome do serviço ou produto> — Planta y Raiz`.
- Normalização compartilhada mantém a marca no final uma única vez e reserva espaço para o sufixo no limite de 255 caracteres.
- Shopping e carrinhos utilizam nomes dos produtos persistidos em pedidos do próprio usuário, com identificação comercial genérica quando não há nomes. Diagnóstico e nome do paciente não entram nessa identificação.
- Serviços, assinaturas, renovações e carga de carteira seguem o mesmo formato nos criadores identificados.
- O nome fixo “Doutor Rico Ltda” foi removido da tela e da constante. Novos Pix retornam a descrição comercial para exibição; Pix restaurados preservam a descrição da mesma cobrança quando disponível e usam a identificação da Orientação como fallback.
- Consulta somente leitura: os 26 serviços já cadastrados em payment_services têm o sufixo e descritor PLANTAYRAIZ; não houve necessidade de atualizar registros.

## Preservado
Preços, métodos, conta recebedora, credenciais, referências, repasses e históricos. Nenhum pagamento novo, mensagem ou transferência foi executado. Pedidos antigos não foram reescritos.

## Provas
- `bun run test src/lib/payment-catalog.test.ts src/lib/payment-order-name.test.ts src/lib/payment-checkout-result.test.ts`: 12 testes aprovados.
- Compilação automática: build OK às 17:45:47 UTC.
- Implantação confirmada de 11 funções: mp-checkout, create-payment, create-cart-payment, create-payment-split, create-doctor-subscription, create-subscription, process-saude-plus-subscription, load-wallet-pix, treatment-subscription-engine, plan-renewal-engine e saude-verde-subscribe.
- Navegação autenticada tentada em Pix pendente preexistente: não abriu a tela esperada, sem erros de execução; a conferência visual do Pix novo permanece pendente. Nenhuma sala ou cobrança foi criada para contornar esse limite.

## Limites
O nome do produto/serviço é uma descrição comercial enviada ao Mercado Pago, não o titular bancário do Pix. O aplicativo do banco decide quais campos mostra; esta mudança não altera o titular. A mudança para CNPJ será feita pelo usuário no Mercado Pago.

As funções estão implantadas. A alteração da tela está na prévia e ainda requer publicação para aparecer no site oficial. A conferência final no aplicativo bancário depende do próximo Pix realizado pelo usuário.