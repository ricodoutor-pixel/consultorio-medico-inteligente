# Recebedor do Pix — Investigação "Doutor Rico Ltda" (08/11/2026)

Pedido: descobrir a origem do nome "Doutor Rico Ltda" na tela do Pix, identificar a conta
recebedora em uso, levantar o caminho oficial para usar o CNPJ (Bezerra Med Soluções
Integradas Ltda., 30.740.319/0001-14) e propor correção — **sem alterar nada sem ordem**.

## 1. De onde vem "Doutor Rico Ltda" (com prova)

O nome **vem da própria conta do Mercado Pago** (campo `first_name`/`last_name` da resposta
de `/users/me`). Ele foi consultado em 08/11/2026 e escrito à mão no código em dois lugares:

- `src/pages/OrientacaoTecnicaAgente.tsx:1201` — linha da tela do Pix:
  `Recebedor: <strong>Doutor Rico Ltda</strong>` (texto fixo no código).
- `supabase/functions/_shared/payment-catalog.ts:19` — constante
  `PAYMENT_RECEIVER_NAME = "Doutor Rico Ltda"` (definida, mas **não usada** em nenhum
  outro ponto do código; verificado por busca em todo o projeto).

Não está no banco de dados nem em variável de ambiente. Não é inventado: é o nome que o
provedor devolve para a conta em uso.

## 2. Conta recebedora hoje (consulta ao vivo em 08/11/2026 17:36 UTC)

Via função `mp-account-info` (que chama `/users/me` do Mercado Pago com o acesso em uso,
sem expor tokens), resposta:

- **receiver_name: "Doutor Rico Ltda"**
- nickname: PLANTAYRAIZLTDA
- e-mail: contato@plantayraiz.com.br
- site: MLB (Brasil)
- tipo de documento: **CPF** (pessoa física)
- user_type: normal

Ou seja: a conta em uso é de pessoa física, e o nome "Doutor Rico Ltda" está cadastrado
no próprio provedor como nome do titular — por isso aparece ao pagador. Não há conta de
teste misturada: existe um único acesso configurado (`MERCADO_PAGO_ACCESS_TOKEN`) e ele é
o que cria os pagamentos reais.

## 3. CPF → CNPJ na mesma conta (fonte oficial)

O Mercado Pago tem página oficial de ajuda sobre exatamente isso:
"Como mudo a titularidade da minha conta para Pessoa Jurídica (PJ) ou MEI?"
— https://www.mercadopago.com.br/ajuda/Como-mudo-a-titularidade-da-minha-conta-para-PJ-ou-MEI_32245

E artigo oficial do blog (24/07/2026) com o passo a passo:
— https://www.mercadopago.com.br/blog/beneficios-de-ter-cnpj-e-como-mudar-sua-titularidade-no-mercado-pago

Resumo do que consta nas fontes oficiais: **existe mudança de titularidade na mesma conta**
(de CPF para CNPJ/MEI), feita pelo próprio titular no app/site do Mercado Pago, com envio de
documentos (documento de identidade, comprovante de CNPJ ativo/contrato social, comprovante
de endereço da empresa). A página de ajuda é renderizada por JavaScript e não consegui ler
o texto completo dela aqui; o passo a passo detalhado, prazos e custo exatos devem ser
confirmados na página oficial acima ou no atendimento do Mercado Pago. **Não encontrei
fonte oficial informando custo** — não vou supor.

Ponto de atenção: ao mudar a titularidade, confirmar com o Mercado Pago se o **access token
da API continua o mesmo**. Se mudar, a troca da credencial será feita somente com sua ordem.

## 4. Plano de troca sem parar os pagamentos

Cenário A — mudança de titularidade na mesma conta (caminho preferido, sem abrir conta nova):
1. O senhor faz a mudança de titularidade no app/site do Mercado Pago (etapa fora do código).
2. Eu consulto `mp-account-info` de novo e confirmo o nome novo do recebedor.
3. Crio um Pix de teste pendente (sem cobrança) e confiro o nome na resposta.
4. Se o token deixar de valer, aviso e só troco a credencial com sua ordem.

Cenário B — se o Mercado Pago exigir conta nova (Conta Negócio separada):
1. O senhor cria a conta da empresa e gera as credenciais em modo de teste.
2. Eu configuro o acesso de teste e faço um pagamento de teste (sem cobrança real).
3. Troca do acesso de produção **somente com sua ordem**.
4. Conta antiga permanece ativa para pagamentos pendentes e histórico.
5. Confiro valores, pedidos e avisos de WhatsApp após a troca.

## 5. Pagamentos anteriores, pedidos, relatórios e avisos

Nada muda retroativamente. Pedidos, relatórios e avisos de WhatsApp ficam gravados no nosso
banco de dados; o nome do recebedor na tela do Pix é apenas exibição. A troca da conta
recebedora não altera histórico, valores nem documentos já emitidos.

## 6. Correção proposta no código (AGUARDANDO SUA ORDEM)

Hoje o nome está fixo à mão na tela. Proposta, conforme seu item 2:
- Remover o texto fixo "Doutor Rico Ltda" da tela do Pix e a constante não usada.
- A tela passa a mostrar o recebedor **somente se o provedor informar** (consulta ao
  `mp-account-info` com cache); se não houver nome, mostra apenas
  "Pagamento: Orientação Técnica — Planta y Raiz · R$ 30,00", sem o campo recebedor.
- Nenhum valor, método, fluxo, identidade visual ou credencial é alterado.

## Testes de aceitação (provas)
1. Origem do nome: conta do Mercado Pago (campo do titular), escrito à mão em
   `OrientacaoTecnicaAgente.tsx:1201` e `payment-catalog.ts:19`. ✔
2. Conta atual: "Doutor Rico Ltda", CPF, e-mail contato@plantayraiz.com.br — consulta ao
   vivo em 08/11/2026 17:36 UTC. Sem conta de teste misturada. ✔
3. Fonte oficial CPF→CNPJ: links oficiais citados acima; custo não encontrado em fonte
   oficial (não suposto). ✔
4. Plano de troca sem parar pagamentos: seção 4. ✔
5. **Nenhuma alteração feita** — código, banco, valores e credenciais intactos. ✔
