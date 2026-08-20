
-- Add clinical summary fields to whatsapp_conversations
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS clinical_summary text,
ADD COLUMN IF NOT EXISTS clinical_summary_at timestamptz,
ADD COLUMN IF NOT EXISTS sentiment text DEFAULT 'neutral';
