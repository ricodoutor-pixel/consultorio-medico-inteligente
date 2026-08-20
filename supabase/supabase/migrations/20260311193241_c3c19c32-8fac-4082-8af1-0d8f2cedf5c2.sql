
-- Fix PRIVILEGE_ESCALATION: Add is_verified check to doctor-scoped policies on medical_records and prescriptions

-- Drop existing doctor INSERT/SELECT/UPDATE policies on medical_records
DROP POLICY IF EXISTS "Doctors can create records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can view own records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can update own records" ON public.medical_records;

-- Recreate with is_verified = true check
CREATE POLICY "Doctors can create records" ON public.medical_records
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
        AND doctors.id = medical_records.doctor_id
        AND doctors.is_verified = true
    )
  );

CREATE POLICY "Doctors can view own records" ON public.medical_records
  FOR SELECT TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM public.doctors
      WHERE user_id = auth.uid() AND is_verified = true
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Doctors can update own records" ON public.medical_records
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
        AND doctors.id = medical_records.doctor_id
        AND doctors.is_verified = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
        AND doctors.id = medical_records.doctor_id
        AND doctors.is_verified = true
    )
  );

-- Drop existing doctor INSERT/SELECT/UPDATE policies on prescriptions
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can view own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can update prescriptions" ON public.prescriptions;

-- Recreate with is_verified = true check
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
        AND doctors.id = prescriptions.doctor_id
        AND doctors.is_verified = true
    )
  );

CREATE POLICY "Doctors can view own prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM public.doctors
      WHERE user_id = auth.uid() AND is_verified = true
    )
    OR patient_id = auth.uid()
  );

CREATE POLICY "Doctors can update prescriptions" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
        AND doctors.id = prescriptions.doctor_id
        AND doctors.is_verified = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.user_id = auth.uid()
        AND doctors.id = prescriptions.doctor_id
        AND doctors.is_verified = true
    )
  );

-- Fix EXPOSED_SENSITIVE_DATA: Add user_id to btc_subscriptions and restrict INSERT
ALTER TABLE public.btc_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create subscriptions" ON public.btc_subscriptions;
DROP POLICY IF EXISTS "Users can insert btc subscriptions" ON public.btc_subscriptions;

-- Find and drop any INSERT policy with WITH CHECK (true)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'btc_subscriptions' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.btc_subscriptions', pol.policyname);
  END LOOP;
END $$;

-- Create restricted INSERT policy
CREATE POLICY "Users can insert own btc subscriptions" ON public.btc_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update SELECT policy to only see own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.btc_subscriptions;
DROP POLICY IF EXISTS "Users can view btc subscriptions" ON public.btc_subscriptions;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'btc_subscriptions' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.btc_subscriptions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view own btc subscriptions" ON public.btc_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
