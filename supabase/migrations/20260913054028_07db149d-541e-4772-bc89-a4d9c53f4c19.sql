create or replace function public.upsert_doctor_pix(
  p_doctor_id uuid,
  p_pix_key text,
  p_pix_type text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  if p_pix_key is null or length(btrim(p_pix_key)) < 5 then
    raise exception 'Chave Pix inválida';
  end if;

  select user_id into v_owner from public.doctors where id = p_doctor_id;
  if v_owner is null then
    raise exception 'Profissional não encontrado';
  end if;

  if not (v_owner = auth.uid() or public.has_role(auth.uid(), 'admin')) then
    raise exception 'Sem permissão para alterar esta chave Pix';
  end if;

  insert into public.doctors_financial (doctor_id, pix_key)
  values (p_doctor_id, btrim(p_pix_key))
  on conflict (doctor_id) do update
    set pix_key = excluded.pix_key, updated_at = now();

  update public.doctor_wallets
     set pix_key = btrim(p_pix_key),
         pix_type = coalesce(p_pix_type, pix_type),
         updated_at = now()
   where doctor_id = p_doctor_id;

  if not found then
    insert into public.doctor_wallets (doctor_id, user_id, pix_key, pix_type)
    values (p_doctor_id, v_owner, btrim(p_pix_key), p_pix_type);
  end if;
end;
$$;

revoke all on function public.upsert_doctor_pix(uuid, text, text) from public;
grant execute on function public.upsert_doctor_pix(uuid, text, text) to authenticated;