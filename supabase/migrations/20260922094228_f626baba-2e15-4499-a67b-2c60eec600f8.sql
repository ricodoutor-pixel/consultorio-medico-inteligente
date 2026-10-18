create table if not exists public.ot_web_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_reference text not null unique,
  mp_payment_id text,
  triage jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active',
  messages_count integer not null default 0,
  last_message_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

grant select on public.ot_web_sessions to authenticated;
grant all on public.ot_web_sessions to service_role;

alter table public.ot_web_sessions enable row level security;

drop policy if exists "ot_web_sessions_select_own" on public.ot_web_sessions;
create policy "ot_web_sessions_select_own"
on public.ot_web_sessions for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create index if not exists idx_ot_web_sessions_user_active
  on public.ot_web_sessions (user_id, status, expires_at desc);