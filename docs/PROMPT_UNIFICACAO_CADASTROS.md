# Prompt para o agente externo (Antigravity) — Banco único de cadastros

## Contexto obrigatório

A plataforma **Planta y Raiz** (site em produção: https://www.plantayraiz.com.br) usa **um único banco de dados oficial**:

- Projeto oficial (produção, usado pelo site): `shmbwdjuddvquszwkvuq`
  - URL: `https://shmbwdjuddvquszwkvuq.supabase.co`
  - Chave pública (anon): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ`

- Projeto legado (NÃO usar mais): `tkxxoghzhvhjzdoomgss` — contém apenas dados de semente/demonstração de uma fase antiga. Nada ali deve ser tratado como cadastro real.

**Regra número 1:** todo cadastro novo de médico/prescritor deve ser gravado **somente** no projeto `shmbwdjuddvquszwkvuq`. Nunca escrever no projeto legado. Nunca apagar registros nem documentos existentes.

## Tarefa do agente 24h

1. Trabalhar exclusivamente no projeto `shmbwdjuddvquszwkvuq`.
2. Para cada novo médico, criar o usuário de autenticação e, em seguida, gravar:
   - `public.profiles` → `id` (= id do usuário), `full_name`, `phone`, `cpf`, `avatar_url`, cidade/estado/país.
   - `public.doctors` → `user_id`, `crm`, `crm_state`, `specialty`, `document_type`, `country`, `city`, `is_verified = false`, `is_approved_by_admin = false`.
   - `public.doctor_kyc_documents` → um registro por documento anexado, com `doctor_user_id`, `document_kind`, `storage_path`, `mime_type`, `size_bytes`, `verification_status = 'pending'`.
   - Arquivos vão para o bucket privado de KYC; nunca gravar arquivo em coluna de texto.
3. Nunca marcar `is_verified = true` por conta própria. A verificação é feita manualmente pelo Dr. Edilson na página `/admin/aprovacoes-medicas`.
4. Antes de inserir, checar duplicidade por CRM + UF e por CPF. Se existir, atualizar o registro existente em vez de criar outro.
5. Nunca inventar dados. Campo sem informação fica nulo.
6. Nunca gravar imagem em base64 nas colunas de avatar — sempre subir o arquivo e salvar a URL pública.

## Migração de dados do projeto legado

Só migrar um cadastro do projeto legado se **todas** as condições forem verdadeiras:
- tem CRM real e UF válida;
- tem CPF ou telefone real;
- não é semente/demonstração (ex.: "Teste E2E", nomes fictícios, listas de COREN/CRP/acupuntura/jardineiros/cuidadores).

Caso contrário, ignorar.

## Segurança

- A chave de serviço (service role) do projeto legado foi exposta em texto. **Revogar/rotacionar imediatamente** no projeto legado.
- Nunca colar chave de serviço em prompt, log, commit ou mensagem.
- Chave de serviço apenas em variável de ambiente do lado servidor.

## Critério de aceite

- Nenhum cadastro real perdido.
- Nenhum documento KYC apagado.
- Todo cadastro novo aparece em `/admin/aprovacoes-medicas` do site com os documentos abríveis em um clique.
- Zero escritas no projeto `tkxxoghzhvhjzdoomgss`.
