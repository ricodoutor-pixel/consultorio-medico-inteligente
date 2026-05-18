
-- 1. consultation_queue: lock status to waiting/cancelled on patient update
DROP POLICY IF EXISTS "Patients can cancel own queue" ON public.consultation_queue;
CREATE POLICY "Patients can cancel own queue"
ON public.consultation_queue
FOR UPDATE
USING (auth.uid() = patient_id AND status = 'waiting')
WITH CHECK (
  auth.uid() = patient_id
  AND status IN ('waiting','cancelled')
  AND payment_confirmed = (SELECT q.payment_confirmed FROM public.consultation_queue q WHERE q.id = consultation_queue.id)
  AND NOT (payment_id IS DISTINCT FROM (SELECT q.payment_id FROM public.consultation_queue q WHERE q.id = consultation_queue.id))
  AND amount = (SELECT q.amount FROM public.consultation_queue q WHERE q.id = consultation_queue.id)
  AND NOT (matched_doctor_id IS DISTINCT FROM (SELECT q.matched_doctor_id FROM public.consultation_queue q WHERE q.id = consultation_queue.id))
);

-- 2. clinic_profiles: prevent owner from changing owner_user_id (and email/whatsapp/domain require explicit owner check)
DROP POLICY IF EXISTS "Owners can update their own clinic" ON public.clinic_profiles;
CREATE POLICY "Owners can update their own clinic"
ON public.clinic_profiles
FOR UPDATE
USING (owner_user_id = auth.uid())
WITH CHECK (
  owner_user_id = auth.uid()
  AND owner_user_id = (SELECT c.owner_user_id FROM public.clinic_profiles c WHERE c.id = clinic_profiles.id)
);

-- 3. conversion_events: tighten INSERT WITH CHECK
DROP POLICY IF EXISTS "Anyone can insert conversion events" ON public.conversion_events;
CREATE POLICY "Anyone can insert conversion events"
ON public.conversion_events
FOR INSERT
WITH CHECK (
  event_type IS NOT NULL
  AND length(event_type) BETWEEN 1 AND 80
  AND event_type ~ '^[a-z0-9_\-]+$'
  AND (session_id IS NULL OR length(session_id) BETWEEN 8 AND 128)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- 4. dr_edilson_messages: allow authenticated users to insert their own messages
CREATE POLICY "Users insert own messages"
ON public.dr_edilson_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. orientacao_tecnica_orders: authenticated users must own their orders
DROP POLICY IF EXISTS "OT orders: authenticated insert own" ON public.orientacao_tecnica_orders;
CREATE POLICY "OT orders: authenticated insert own"
ON public.orientacao_tecnica_orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
