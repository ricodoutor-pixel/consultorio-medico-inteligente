-- Tabela para armazenar o histórico do chat de telemedicina
CREATE TABLE IF NOT EXISTS public.consultation_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'doctor', 'brisa', 'system')),
  sender_id TEXT, -- ID do auth.users (paciente ou médico) ou NULL para brisa/system
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Habilita RLS
ALTER TABLE public.consultation_chats ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para consultation_chats
-- Pacientes e médicos podem ver as mensagens de suas consultas
CREATE POLICY "Users can view chats of their appointments" ON public.consultation_chats
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM public.appointments WHERE patient_id = auth.uid() OR doctor_id = (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert chats in their appointments" ON public.consultation_chats
  FOR INSERT WITH CHECK (
    appointment_id IN (
      SELECT id FROM public.appointments WHERE patient_id = auth.uid() OR doctor_id = (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    )
  );

-- Habilita a tabela consultation_chats no Realtime (caso não esteja, recria a publicação ou altera se existir)
-- Como o Supabase não suporta CREATE OR REPLACE PUBLICATION, a forma mais segura é fazer ALTER.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'consultation_chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE consultation_chats;
  END IF;
END $$;
