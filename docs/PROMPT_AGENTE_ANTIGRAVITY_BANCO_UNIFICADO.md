# Prompt para o agente Antigravity — BANCO UNIFICADO E ATIVO (09/09/2026)

Copie e cole o texto abaixo inteiro para o agente.

---

## 0. Situação atual (confirmada hoje)

O banco de cadastros da Planta y Raiz está **unificado, limpo e atualizado**. Existe um único
banco oficial, o mesmo usado pelo site em produção (https://www.plantayraiz.com.br):

- Projeto oficial e ÚNICO permitido: `shmbwdjuddvquszwkvuq`
  - URL: `https://shmbwdjuddvquszwkvuq.supabase.co`
  - Chave pública (anon): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ`

- Projeto legado `tkxxoghzhvhjzdoomgss`: **desativado para cadastros**. Zero leituras para fins de
  cadastro e zero escritas. Nada ali é cadastro real.

Situação em 09/09/2026 no banco oficial:

- 23 registros profissionais em `public.doctors` (17 médicos ativos na vitrine + 1 veterinário +
  registros pendentes/duplicados fora da vitrine)
- 18 profissionais com `kyc_status = 'verified'` (conferidos um a um no conselho pelo Dr. Edilson)
- 35 documentos reais em `public.doctor_kyc_documents`, todos abríveis em um clique na página KYC
- 1 farmácia: Planta y Raiz Ltda (farmácia modelo, até entrar a primeira farmácia real)
- 13 cadastros de paciente reais, sem duplicatas e sem contas de teste órfãs
- Catálogo estático de profissionais fictícios eliminado; a vitrine lê somente o banco

**Regra a partir de hoje: todo cadastro novo — médico, prescritor, veterinário, farmácia ou
paciente — é armazenado exclusivamente no projeto `shmbwdjuddvquszwkvuq` (Lovable Cloud).**

## 1. Acesso do agente para auditorias

O agente tem acesso de leitura/escrita ao banco oficial via chave de serviço, guardada apenas em
variável de ambiente do servidor. Nunca colar chave de serviço em prompt, log, commit ou mensagem.
A chave antiga do projeto legado que apareceu em texto deve ser considerada comprometida e
revogada.

Consultas de auditoria autorizadas (somente leitura):

```sql
-- panorama geral
select
  (select count(*) from public.doctors) as profissionais,
  (select count(*) from public.doctors where kyc_status = 'verified') as verificados,
  (select count(*) from public.doctor_kyc_documents) as documentos,
  (select count(*) from public.vendors) as farmacias,
  (select count(*) from public.profiles p
     where not exists (select 1 from public.doctors d where d.user_id = p.id)) as pacientes;

-- cadastros das últimas 24h
select d.id, d.user_id, p.full_name, d.crm, d.crm_state, d.kyc_status, d.created_at,
       (select count(*) from public.doctor_kyc_documents k where k.doctor_user_id = d.user_id) as docs
from public.doctors d
left join public.profiles p on p.id = d.user_id
where d.created_at > now() - interval '24 hours'
order by d.created_at desc;
```

## 2. Onde gravar cada cadastro novo

Para cada novo médico/prescritor, nesta ordem:

1. Criar o usuário de autenticação (Auth) no projeto oficial.
2. `public.profiles` → `id` (= id do usuário), `full_name`, `phone`, `cpf`, `date_of_birth`,
   `avatar_url`, `city`, `region`, `state`, `country`, `cep`, endereço, `pix_key`.
3. `public.doctors` → `user_id`, `crm`, `crm_state`, `specialty`, `document_type`, `country`,
   `city`, `is_verified = false`, `is_approved_by_admin = false`, `kyc_status = 'pending'`.
4. `public.doctor_kyc_documents` → um registro por documento anexado, com `doctor_user_id`,
   `document_kind`, `storage_path`, `mime_type`, `size_bytes`, `verification_status = 'pending'`.

Para farmácia/lojista: `public.profiles` (dados da empresa: `company_name`, `trade_name`, `cnpj`,
`crf`, `anvisa_auth`) + `public.vendors` com `is_active = false` e `is_kyc_approved = false`,
aguardando termo assinado e conta de recebimento (`mp_collector_id`).

Para paciente: apenas `public.profiles` com `user_type = 'patient'`.

Regras rígidas:

- Arquivos vão para os buckets privados de KYC. Nunca gravar arquivo/base64 em coluna de texto.
- Avatar: subir o arquivo e salvar a URL. Nunca `data:` na coluna `avatar_url`.
- Nunca marcar `is_verified`, `is_approved_by_admin` ou `kyc_status = 'verified'`. A verificação é
  manual, feita pelo Dr. Edilson em `/admin/aprovacoes-medicas`.
- Nunca inventar dados. Campo sem informação fica nulo.
- Antes de inserir, checar duplicidade por CRM + UF e por CPF/CNPJ. Se já existir, **atualizar** o
  registro (completando campos vazios) em vez de criar outro.
- Nunca apagar registro real nem documento KYC.
- Nunca criar cadastro de teste no banco oficial. A única conta de referência é
  `contato@plantayraiz.com.br`.

## 3. Todo cadastro novo tem que aparecer nas páginas KYC

Critério de aceite de cada inserção:

- Médicos/prescritores: aparecer em `/admin/aprovacoes-medicas`, com documentos abríveis em um
  clique e badge de nível por quantidade de anexos.
- Pacientes: aparecer em `/admin/aprovacoes-pacientes`, com dados reais (CPF, telefone, cidade,
  consultas, pagamentos e pedidos vindos do banco — a tela não usa mais nenhum dado fictício).
- Farmácias: aparecer em `/admin/aprovacoes-farmacias`, inativa até aprovação.

Se não aparecer, o cadastro está incompleto: faltou `profiles`, faltou `doctors.user_id` correto,
ou os documentos não foram gravados apontando para o `storage_path` certo.

A ordenação é automática (mais documentos anexados → nível mais alto: Inicial → Intermediário →
Avançado → VIP), com Dr. Edilson, Dra. Suelen e Dr. Daniel fixados no topo. Não mexer nisso.

## 4. Limpeza contínua

O banco já foi limpo. A partir de agora, o trabalho é preventivo:

- Sinalizar (não apagar) qualquer registro suspeito de teste/ficção: nome com "Teste", "Demo",
  "Exemplo", "Fulano"; e-mail em domínio de teste; CRM inventado ou sequencial; sem CPF, sem
  telefone, sem documento e sem nenhum atendimento/pedido/pagamento ligado.
- Marcar de forma reversível (`kyc_status = 'duplicate'`, `is_active = false`) e reportar.
- Só apagar após aprovação explícita do Dr. Edilson, item por item. Nunca `DELETE` sem `WHERE`.

## 5. Rotina do agente 24h

- Verificar novos cadastros a cada ciclo e completar campos faltantes (telefone, CPF, endereço, Pix).
- Cobrar documentos pendentes pelo WhatsApp do próprio profissional, quando houver telefone.
- Reportar diariamente: total de profissionais, verificados, pendentes, com documentação completa,
  entradas nas últimas 24h, total de pacientes e de farmácias.
- Nunca alterar aparência do site, preços ou políticas de segurança (RLS).

## 6. Critério de aceite final

- Zero escritas no projeto `tkxxoghzhvhjzdoomgss`.
- Todo cadastro novo, de qualquer tipo, gravado somente em `shmbwdjuddvquszwkvuq`.
- Zero cadastros fictícios ativos.
- Nenhum cadastro real perdido e nenhum documento KYC apagado.
- Todo cadastro novo visível na página KYC correspondente, com documentos abríveis em um clique.
- Nenhum profissional autoaprovado pelo agente.
