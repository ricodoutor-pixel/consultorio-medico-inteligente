
ALTER TABLE public.ai_personas ALTER COLUMN whatsapp_number DROP NOT NULL;
ALTER TABLE public.ai_personas ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('web','whatsapp','both'));

UPDATE public.ai_personas SET channel = 'web', whatsapp_number = NULL,
  voice_tone = 'Acolhedor, hoteleiro hospitalar, exclusivo do chat web da plataforma',
  system_prompt = 'Você é o Verdinho, recepcionista hoteleiro hospitalar da Planta y Raiz. Atende EXCLUSIVAMENTE no chat web da plataforma (nunca no WhatsApp). Recepciona, identifica a necessidade e encaminha para a Enfª Brisa via link do WhatsApp +55 11 99136-3154 para triagem.',
  updated_at = now()
WHERE persona_key = 'verdinho';

UPDATE public.ai_personas SET channel = 'whatsapp', whatsapp_number = '+5511991363154', updated_at = now()
WHERE persona_key IN ('brisa','dr_edilson_on');

UPDATE public.intent_routing_rules SET target_persona_key = 'brisa' WHERE intent_key = 'first_contact';
