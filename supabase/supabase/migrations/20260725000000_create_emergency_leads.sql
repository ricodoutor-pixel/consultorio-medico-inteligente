-- Migration para a tabela de leads de emergência
create table public.emergency_leads (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    phone text not null,
    category text not null,
    chat_history jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.emergency_leads enable row level security;

-- Política de leitura: usuários autenticados (admin) podem ver todos os leads
create policy "Admins podem visualizar leads de emergencia"
    on public.emergency_leads for select
    to authenticated
    using (true);

-- Política de inserção: anônimos e autenticados podem inserir novos leads via chat de emergência
create policy "Qualquer um pode inserir leads de emergencia"
    on public.emergency_leads for insert
    to anon, authenticated
    with check (true);

-- Política de atualização: permitir atualização do chat_history pela edge function ou usuário autenticado
create policy "Admins ou functions podem atualizar leads"
    on public.emergency_leads for update
    to anon, authenticated
    using (true);
