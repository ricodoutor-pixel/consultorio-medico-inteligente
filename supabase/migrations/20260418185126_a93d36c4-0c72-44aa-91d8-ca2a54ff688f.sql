-- 1. whatsapp_conversations: add defense-in-depth patient-scoped SELECT
CREATE POLICY "Patients can view their own conversations"
ON public.whatsapp_conversations
FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

-- Admins can also read for support
CREATE POLICY "Admins can view all conversations"
ON public.whatsapp_conversations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. triage_abandonment_tracking: tighten INSERT policy to enforce ownership
DROP POLICY IF EXISTS "Authenticated insert triage tracking" ON public.triage_abandonment_tracking;

CREATE POLICY "Users insert own triage tracking"
ON public.triage_abandonment_tracking
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to view their own abandonment records
CREATE POLICY "Users view own triage tracking"
ON public.triage_abandonment_tracking
FOR SELECT
TO authenticated
USING (user_id = auth.uid());