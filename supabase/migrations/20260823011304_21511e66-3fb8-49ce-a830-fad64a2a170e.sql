-- Políticas RLS de acesso total para administradores
-- Usa has_role() para garantir que apenas usuários com role 'admin' tenham acesso

-- Consultations
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin_Full_Access_Consultations" ON public.consultations;
CREATE POLICY "Admin_Full_Access_Consultations"
  ON public.consultations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin_Full_Access_Payments" ON public.payments;
CREATE POLICY "Admin_Full_Access_Payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Doctor wallets
ALTER TABLE public.doctor_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin_Full_Access_Wallets" ON public.doctor_wallets;
CREATE POLICY "Admin_Full_Access_Wallets"
  ON public.doctor_wallets
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin financial ledger
ALTER TABLE public.admin_financial_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin_Full_Access_Ledger" ON public.admin_financial_ledger;
CREATE POLICY "Admin_Full_Access_Ledger"
  ON public.admin_financial_ledger
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- SaaS subscriptions
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin_Full_Access_Saas" ON public.saas_subscriptions;
CREATE POLICY "Admin_Full_Access_Saas"
  ON public.saas_subscriptions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Garantir permissões mínimas para que as políticas funcionem via Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_financial_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saas_subscriptions TO authenticated;

GRANT ALL ON public.consultations TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.doctor_wallets TO service_role;
GRANT ALL ON public.admin_financial_ledger TO service_role;
GRANT ALL ON public.saas_subscriptions TO service_role;
