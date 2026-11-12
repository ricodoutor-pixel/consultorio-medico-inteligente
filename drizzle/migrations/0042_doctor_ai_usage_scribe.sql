-- Escriba de IA (Kit do Assinante): o uso da transcrição e da geração do SOAP entra no mesmo registro de limites.
-- O áudio nunca é gravado; a tabela guarda só a ação usada.
ALTER TABLE public.doctor_ai_usage DROP CONSTRAINT IF EXISTS doctor_ai_usage_tool_check;
ALTER TABLE public.doctor_ai_usage
  ADD CONSTRAINT doctor_ai_usage_tool_check CHECK (tool IN ('copiloto', 'juridico', 'escriba'));
