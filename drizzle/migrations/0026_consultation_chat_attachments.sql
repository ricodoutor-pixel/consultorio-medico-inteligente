-- Exam/photo attachments in the paid consultation chat. Files live in the private `consultation-files` bucket under
-- <appointment_id>/..., readable only by that consultation's patient and doctor (and admins), uploadable only while
-- the paid consultation is in progress. The chat message stores the object path; files are opened via short signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('consultation-files', 'consultation-files', false, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- First folder of the object path as an appointment id (NULL when it is not a uuid).
CREATE OR REPLACE FUNCTION public.consultation_file_appointment(_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE folder text := split_part(_name, '/', 1);
BEGIN
  IF folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN folder::uuid;
  END IF;
  RETURN NULL;
END $$;

DROP POLICY IF EXISTS consultation_files_participants_read ON storage.objects;
DROP POLICY IF EXISTS consultation_files_participants_upload ON storage.objects;

CREATE POLICY consultation_files_participants_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'consultation-files'
    AND (
      public.consultation_chat_role(public.consultation_file_appointment(name)) IS NOT NULL
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY consultation_files_participants_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'consultation-files'
    AND public.consultation_chat_role(public.consultation_file_appointment(name)) IS NOT NULL
    AND public.consultation_chat_is_live(public.consultation_file_appointment(name))
  );
-- No UPDATE/DELETE policies: shared clinical files are kept as sent.

ALTER TABLE public.consultation_chats ADD COLUMN IF NOT EXISTS attachment_path text;
ALTER TABLE public.consultation_chats ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE public.consultation_chats DROP CONSTRAINT IF EXISTS consultation_chats_attachment_in_appointment;
ALTER TABLE public.consultation_chats ADD CONSTRAINT consultation_chats_attachment_in_appointment
  CHECK (attachment_path IS NULL OR attachment_path LIKE appointment_id::text || '/%');
