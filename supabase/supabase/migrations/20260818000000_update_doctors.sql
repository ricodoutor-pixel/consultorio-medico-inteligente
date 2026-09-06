-- Migration para corrigir prefixos, status de online e aprovações (Tarefa 3)

-- 1. Prefixos Dr./Dra. na tabela profiles
UPDATE public.profiles
SET full_name = 'Dr. ' || TRIM(REPLACE(REPLACE(full_name, 'Dr. ', ''), 'Dra. ', ''))
WHERE role IN ('medico', 'veterinario')
  AND full_name ILIKE '%João Pedro Girardello%';

UPDATE public.profiles
SET full_name = 'Dr. ' || TRIM(REPLACE(REPLACE(full_name, 'Dr. ', ''), 'Dra. ', ''))
WHERE role IN ('medico', 'veterinario')
  AND full_name ILIKE '%Eduardo Migueis%';

UPDATE public.profiles
SET full_name = 'Dra. ' || TRIM(REPLACE(REPLACE(full_name, 'Dr. ', ''), 'Dra. ', ''))
WHERE role IN ('medico', 'veterinario')
  AND full_name ILIKE '%Suelen%';

UPDATE public.profiles
SET full_name = 'Dra. ' || TRIM(REPLACE(REPLACE(full_name, 'Dr. ', ''), 'Dra. ', ''))
WHERE role IN ('medico', 'veterinario')
  AND full_name ILIKE '%Olivia%';

UPDATE public.profiles
SET full_name = 'Dr. ' || TRIM(full_name)
WHERE role IN ('medico', 'veterinario')
  AND full_name NOT ILIKE 'Dr.%' 
  AND full_name NOT ILIKE 'Dra.%'
  AND full_name NOT ILIKE '%Suelen%'
  AND full_name NOT ILIKE '%Olivia%';

-- 2. Dr. João Pedro Girardello — marcar is_approved_by_admin = true / approval_status = 'approved'
UPDATE public.doctors
SET is_approved_by_admin = true, approval_status = 'approved'
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE full_name ILIKE '%João Pedro Girardello%'
);

-- 3. Dra. Suelen e Dra. Olivia — is_online = true, is_available = true
UPDATE public.doctors
SET is_online = true, is_available = true
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE full_name ILIKE '%Suelen%' OR full_name ILIKE '%Olivia%'
);

-- 4. Eduardo Migueis — manter specialty = 'Cannabis Veterinária / Pet'
UPDATE public.doctors
SET specialty = 'Cannabis Veterinária / Pet'
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE full_name ILIKE '%Eduardo Migueis%'
);

-- 5. Todos os demais médicos em OFF — is_online = false, is_available = false
UPDATE public.doctors
SET is_online = false, is_available = false
WHERE user_id NOT IN (
  SELECT id FROM public.profiles WHERE full_name ILIKE '%Suelen%' OR full_name ILIKE '%Olivia%'
);
