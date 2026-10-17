-- 🌿 Planta y Raíz — Orientação Técnica v2 Schema Upgrade
-- Modifica ot_web_sessions para suportar sessões 'ready' (criadas pelo webhook antes de o paciente clicar em iniciar)
-- Cria tabelas ot_messages (mensagens persistidas do chat) e ot_reports (relatórios revisados e aprovados)

-- 1. ot_web_sessions upgrades
alter table public.ot_web_sessions alter column started_at drop not null;
alter table public.ot_web_sessions alter column started_at drop default;
alter table public.ot_web_sessions alter column expires_at drop not null;

alter table public.ot_web_sessions add column if not exists paused boolean not null default false;
alter table public.ot_web_sessions add column if not exists paused_by uuid references auth.users(id);
alter table public.ot_web_sessions add column if not exists paused_at timestamptz;

-- Atualiza status default e constraint
alter table public.ot_web_sessions drop constraint if exists ot_web_sessions_status_check;
alter table public.ot_web_sessions add constraint ot_web_sessions_status_check check (status in ('ready', 'active', 'paused', 'expired'));

-- 2. Tabela de mensagens da sessão (ot_messages)
create table if not exists public.ot_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ot_web_sessions(id) on delete cascade,
  role text not null check (role in ('patient', 'agent', 'supervisor', 'system')),
  content text not null,
  attachment_path text,
  attachment_name text,
  attachment_mime text,
  created_at timestamptz not null default now()
);

grant select, insert on public.ot_messages to authenticated;
grant all on public.ot_messages to service_role;

alter table public.ot_messages enable row level security;

drop policy if exists "ot_messages_select" on public.ot_messages;
create policy "ot_messages_select"
on public.ot_messages for select to authenticated
using (
  exists (
    select 1 from public.ot_web_sessions s
    where s.id = ot_messages.session_id
      and (s.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  )
);

drop policy if exists "ot_messages_insert_patient" on public.ot_messages;
create policy "ot_messages_insert_patient"
on public.ot_messages for insert to authenticated
with check (
  role = 'patient' and
  exists (
    select 1 from public.ot_web_sessions s
    where s.id = ot_messages.session_id
      and s.user_id = auth.uid()
      and s.status in ('active', 'ready')
  )
);

create index if not exists idx_ot_messages_session on public.ot_messages(session_id, created_at asc);

-- 3. Tabela de relatórios individuais (ot_reports)
create table if not exists public.ot_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ot_web_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_md text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  verification_code text unique,
  created_at timestamptz not null default now()
);

grant select on public.ot_reports to authenticated;
grant all on public.ot_reports to service_role;

alter table public.ot_reports enable row level security;

drop policy if exists "ot_reports_select" on public.ot_reports;
create policy "ot_reports_select"
on public.ot_reports for select to authenticated
using (
  (user_id = auth.uid() and status = 'approved') or
  public.has_role(auth.uid(), 'admin')
);

create index if not exists idx_ot_reports_user on public.ot_reports(user_id, status);
create index if not exists idx_ot_reports_session on public.ot_reports(session_id);

-- 4. Bucket de anexos da Orientação Técnica
insert into storage.buckets (id, name, public)
values ('ot-attachments', 'ot-attachments', false)
on conflict (id) do update set public = false;

drop policy if exists "ot_attachments_select" on storage.objects;
create policy "ot_attachments_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'ot-attachments' and (
    (storage.foldername(name))[1] = auth.uid()::text or
    public.has_role(auth.uid(), 'admin')
  )
);

drop policy if exists "ot_attachments_insert" on storage.objects;
create policy "ot_attachments_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'ot-attachments' and
  (storage.foldername(name))[1] = auth.uid()::text
);
