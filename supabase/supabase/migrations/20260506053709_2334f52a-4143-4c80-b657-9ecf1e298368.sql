UPDATE public.brand_assets
SET description = regexp_replace(description, '\s*·?\s*CPF\s*[0-9.\-]+', '', 'gi')
WHERE description ILIKE '%CPF%';

UPDATE public.ai_personas
SET system_prompt = regexp_replace(system_prompt, '\s*[·,\-]?\s*CPF\s*[0-9.\-]+', '', 'gi')
WHERE system_prompt ILIKE '%CPF%';