# Prompt para o agente externo (Antigravity) — BANCO ÚNICO DE CADASTROS

Copie e cole o texto abaixo inteiro para o agente.

---

## 0. Regra número 1 — banco único

Existe **um único banco oficial** da Planta y Raiz, que é o banco usado pelo site em produção
(https://www.plantayraiz.com.br):

- Projeto oficial (ÚNICO permitido): `shmbwdjuddvquszwkvuq`
  - URL: `https://shmbwdjuddvquszwkvuq.supabase.co`
  - Chave pública (anon): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ`

- Projeto legado (PROIBIDO escrever): `tkxxoghzhvhjzdoomgss`.
  Contém apenas dados de semente/demonstração de uma fase antiga. Nada ali é cadastro real.

Toda leitura e escrita de cadastro — médicos, prescritores, farmácias, pacientes — acontece
**somente** no projeto `shmbwdjuddvquszwkvuq`. Zero escritas no projeto legado.

A chave de serviço (service role) do projeto legado foi exposta em texto: **rotacione/revogue hoje**.
Nunca colar chave de serviço em prompt, log, commit ou mensagem; apenas variável de ambiente do servidor.

## 1. Onde gravar cada cadastro novo

Para cada novo médico/prescritor, na ordem:

1. Criar o usuário de autenticação (Auth) no projeto oficial.
2. `public.profiles` → `id` (= id do usuário), `full_name`, `phone`, `cpf`, `date_of_birth`,
   `avatar_url`, `city`, `region`, `country`, `cep`, endereço, `pix_key`.
3. `public.doctors` → `user_id`, `crm`, `crm_state`, `specialty`, `document_type`, `country`, `city`,
   `is_verified = false`, `is_approved_by_admin = false`.
4. `public.doctor_kyc_documents` → um registro por documento anexado, com `doctor_user_id`,
   `document_kind`, `storage_path`, `mime_type`, `size_bytes`, `verification_status = 'pending'`.

Regras rígidas:

- Arquivos vão para o bucket privado de KYC. Nunca gravar arquivo/base64 em coluna de texto.
- Avatar: subir o arquivo e salvar a URL. Nunca `data:` na coluna `avatar_url`.
- Nunca marcar `is_verified = true` nem `is_approved_by_admin = true`. A verificação é feita
  manualmente pelo Dr. Edilson em `/admin/aprovacoes-medicas`.
- Nunca inventar dados. Campo sem informação fica nulo.
- Antes de inserir, checar duplicidade por CRM + UF e por CPF. Se já existir, **atualizar** o
  registro existente (completando campos vazios) em vez de criar outro.
- Nunca apagar registro real nem documento KYC.

## 2. Todo cadastro novo tem que aparecer na página KYC

Critério de aceite de cada inserção: abrir `/admin/aprovacoes-medicas` no site e ver o médico novo
na lista, com os documentos abríveis em um clique. Se não aparecer, o cadastro está incompleto —
faltou `profiles`, faltou `doctors.user_id` correto, ou os documentos não foram gravados em
`doctor_kyc_documents` apontando para o `storage_path` certo.

Ordem de exibição é automática: quem tem mais documentos anexados sobe de nível
(Inicial → Intermediário → Avançado → VIP). Não mexer nessa ordenação.

## 3. Limpeza: eliminar cadastros fictícios / de teste

Objetivo: o banco oficial deve conter **somente cadastros reais**.

Considere fictício/teste quando qualquer item abaixo for verdadeiro:

- nome contém "Teste", "Test", "E2E", "Demo", "Exemplo", "Lorem", "Fulano", "Mock";
- e-mail em domínio de teste (`example.com`, `test.com`, `mailinator`, `+teste@`);
- CRM inexistente, sequencial ou claramente inventado (`00000`, `12345`, `123456`), sem UF válida;
- perfis de semente de outras categorias importados da fase antiga (listas de COREN, CRP,
  acupuntura, jardineiros, cuidadores, auxiliares) que não têm CRM/CRMV real;
- sem CPF, sem telefone, sem documento anexado **e** sem nenhum atendimento/pedido/pagamento ligado.

Procedimento obrigatório antes de remover qualquer coisa:

1. Gerar um relatório em CSV/JSON com todos os candidatos a exclusão: `user_id`, nome, e-mail, CRM/UF,
   nº de documentos, data de criação e o motivo da classificação.
2. **Não excluir nada direto.** Marcar primeiro de forma reversível:
   `doctors.kyc_status = 'duplicate'` (ou o campo de status usado) e `is_active = false`,
   deixando o registro fora da vitrine.
3. Enviar o relatório para aprovação do Dr. Edilson.
4. Só após aprovação explícita, apagar — e apenas os itens aprovados, um a um, nunca em lote cego.
   Nunca usar `DELETE` sem `WHERE`. Nunca apagar documento KYC de cadastro real.

Registros reais que estão fora da vitrine por falta de verificação **não** são fictícios: eles
permanecem no banco e visíveis na página KYC aguardando validação manual.

## 4. Rotina do agente 24h

- Verificar novos cadastros a cada ciclo e completar campos faltantes (telefone, CPF, endereço, Pix).
- Cobrar documentos pendentes pelo WhatsApp do próprio médico, quando houver telefone.
- Reportar diariamente: total de médicos, quantos verificados, quantos pendentes, quantos com
  documentação completa, e quais entraram nas últimas 24h.
- Nunca alterar aparência do site, nunca mexer em preços, nunca mexer em políticas de segurança (RLS).

## 5. Critério de aceite final

- Zero escritas no projeto `tkxxoghzhvhjzdoomgss`.
- Zero cadastros fictícios ativos no projeto oficial.
- Nenhum cadastro real perdido e nenhum documento KYC apagado.
- Todo cadastro novo visível em `/admin/aprovacoes-medicas` com documentos abríveis em um clique.
- Nenhum médico auto-aprovado pelo agente.
