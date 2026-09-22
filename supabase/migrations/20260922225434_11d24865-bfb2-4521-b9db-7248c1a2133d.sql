create or replace function public.normalize_doctor_title(n text)
returns text
language sql
stable
as $$
  select case
    when n is null or btrim(n) = '' then n
    when upper(btrim(n)) ~ '^(DR|DRA)\.\s' then n
    else 'Dr. ' || btrim(n)
  end;
$$;

create or replace function public.ensure_doctor_title()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.doctors where user_id = new.id) then
    new.full_name := public.normalize_doctor_title(new.full_name);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_doctor_title on public.profiles;
create trigger trg_ensure_doctor_title
before insert or update of full_name on public.profiles
for each row execute function public.ensure_doctor_title();

create or replace function public.sync_doctor_title_from_doctors()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  select full_name into v_name from public.profiles where id = new.user_id;
  if v_name is not null and upper(btrim(v_name)) !~ '^(DR|DRA)\.\s' then
    update public.profiles set full_name = public.normalize_doctor_title(v_name) where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ensure_doctor_title_on_doctors on public.doctors;
create trigger trg_ensure_doctor_title_on_doctors
before insert on public.doctors
for each row execute function public.sync_doctor_title_from_doctors();

update public.profiles set full_name = 'Dra. Barbara Eliane Matos' where id = '7eb1d705-ec87-4379-a4ba-eca03dfcab15';
update public.profiles set full_name = 'Dra. Geovana Torres Mozaner' where id = '8e818411-c1ec-425d-8edf-81e2d4f21024';
update public.profiles set full_name = 'Dra. Grace Adriana Lopes Conceicao' where id = 'd878fcea-84d9-46db-a828-2347328e9c48';
update public.profiles set full_name = 'Dr. Albert Machado Tenório' where id = '7cc3100e-1171-43d6-acbc-7f3cec25f372';
update public.profiles set full_name = 'Dr. Diego Cartaxo Jacome' where id = '36f95180-fafc-46d0-9591-f8b246f9f1d1';
update public.profiles set full_name = 'Dr. Eduardo Migueis Correa' where id = 'c721d762-b7e6-4d24-854d-e9c4f6a19a09';
update public.profiles set full_name = 'Dr. Leuma Leao Netta' where id = '9285b761-b960-4562-839c-cab53ec54c67';
update public.profiles set full_name = 'Dr. Luiz Roberto Medina dos Santos' where id = 'fada664c-4f05-4b35-97e5-22744285da1e';

update public.doctors_public dp
set full_name = p.full_name
from public.doctors d
join public.profiles p on p.id = d.user_id
where dp.id = d.id
  and p.full_name is not null
  and p.full_name <> dp.full_name;