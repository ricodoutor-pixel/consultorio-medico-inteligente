
-- ============================================================================
-- FIX 1: doctor_availability — hide reserved_by / appointment_id from non-owners
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.doctor_availability;

-- Authenticated users can see slot scheduling info, but rows that are reserved
-- only return to the doctor that owns them, the patient who reserved, or admin.
-- Available (unreserved) slots remain visible to everyone authenticated.
CREATE POLICY "View available or own slots"
ON public.doctor_availability
FOR SELECT
TO authenticated
USING (
  status = 'available'
  OR reserved_by = auth.uid()
  OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================================================
-- FIX 2: whatsapp_conversations — explicit deny on writes for authenticated users
-- ============================================================================
-- service_role bypasses RLS entirely, so this restrictive policy only blocks
-- authenticated/anon roles from any insert/update/delete path.
DROP POLICY IF EXISTS "Block authenticated writes" ON public.whatsapp_conversations;
CREATE POLICY "Block authenticated writes"
ON public.whatsapp_conversations
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Re-allow read paths via permissive policies already in place (admin + own patient).
-- Restrictive policy above is combined with AND, so we need to also allow SELECT
-- explicitly through restrictive logic. Simpler: scope the restrictive policy to writes only.
DROP POLICY IF EXISTS "Block authenticated writes" ON public.whatsapp_conversations;

CREATE POLICY "Block authenticated inserts"
ON public.whatsapp_conversations
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Block authenticated updates"
ON public.whatsapp_conversations
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Block authenticated deletes"
ON public.whatsapp_conversations
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- ============================================================================
-- FIX 3: realtime.messages — restrict channel subscriptions to authorized users
-- ============================================================================
-- Without this, any authenticated user can subscribe to any topic (e.g. another
-- patient's consultation_queue updates).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Patients can only listen to topics scoped to their own user id.
-- Doctors can listen to topics scoped to their own user id.
-- Admins can listen to any topic.
-- Topic naming convention enforced: "user:<uuid>:..." or "doctor:<uuid>:..." or "public:..."
CREATE POLICY "Authenticated users can read own-scoped topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Public broadcasts (no sensitive data)
  realtime.topic() LIKE 'public:%'
  -- User-scoped topics: must include the user's own uuid
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
  -- Doctor-scoped topics: only the doctor user may subscribe
  OR realtime.topic() LIKE ('doctor:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('doctor:' || auth.uid()::text)
  -- Admins can subscribe to anything
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can broadcast to own-scoped topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'public:%'
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE ('doctor:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('doctor:' || auth.uid()::text)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
