-- ============================================================
-- FARMÁCIA VIRTUAL: Permissões RLS para acesso a receitas
-- A farmácia só pode ver prescrições que foram enviadas a ela
-- ============================================================

-- 1. Adicionar coluna vendor_id na tabela prescriptions (se não existir)
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS sent_to_vendor_id UUID REFERENCES public.vendors(id),
  ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispensed_by_vendor_id UUID REFERENCES public.vendors(id),
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT;

-- 2. Criar política RLS: farmácia vê apenas receitas enviadas a ela
DROP POLICY IF EXISTS "Vendors view prescriptions sent to them" ON public.prescriptions;
CREATE POLICY "Vendors view prescriptions sent to them"
  ON public.prescriptions FOR SELECT TO authenticated
  USING (
    sent_to_vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
    OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
  );

-- 3. Farmácia pode atualizar status de receitas enviadas a ela (dispensar)
DROP POLICY IF EXISTS "Vendors can dispense prescriptions" ON public.prescriptions;
CREATE POLICY "Vendors can dispense prescriptions"
  ON public.prescriptions FOR UPDATE TO authenticated
  USING (
    sent_to_vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
    OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
  )
  WITH CHECK (
    sent_to_vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
    OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
  );

-- 4. Limite de 10 produtos por vendor (constraint)
CREATE OR REPLACE FUNCTION check_vendor_product_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.vendor_products
    WHERE vendor_id = NEW.vendor_id AND is_active = true
  ) >= 10 THEN
    RAISE EXCEPTION 'Limite de 10 produtos ativos por farmácia atingido.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendor_product_limit ON public.vendor_products;
CREATE TRIGGER trg_vendor_product_limit
  BEFORE INSERT ON public.vendor_products
  FOR EACH ROW EXECUTE FUNCTION check_vendor_product_limit();

-- 5. View de rastreamento 360 para a farmácia
CREATE OR REPLACE VIEW vendor_tracking_360 AS
SELECT
  vt.id AS transaction_id,
  vt.vendor_id,
  vt.product_id,
  vp.name AS product_name,
  vt.buyer_id,
  p.full_name AS buyer_name,
  p.email AS buyer_email,
  pr.id AS prescription_id,
  pr.status AS prescription_status,
  pr.medications,
  pr.valid_until,
  pr.pdf_url,
  vt.amount,
  vt.platform_fee,
  vt.vendor_amount,
  vt.status AS transaction_status,
  vt.payment_method,
  vt.created_at AS sale_date
FROM vendor_transactions vt
LEFT JOIN vendor_products vp ON vp.id = vt.product_id
LEFT JOIN profiles p ON p.id = vt.buyer_id
LEFT JOIN prescriptions pr ON pr.sent_to_vendor_id = vt.vendor_id
  AND pr.patient_id = vt.buyer_id;

-- 6. Trigger: quando receita é enviada para farmácia, criar notificação
CREATE OR REPLACE FUNCTION notify_vendor_new_prescription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sent_to_vendor_id IS NOT NULL AND
     (OLD.sent_to_vendor_id IS NULL OR OLD.sent_to_vendor_id != NEW.sent_to_vendor_id) THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT
      v.user_id,
      'prescription_received',
      '📋 Nova receita recebida',
      'Uma receita médica foi enviada para dispensação em sua farmácia.',
      jsonb_build_object(
        'prescription_id', NEW.id,
        'patient_name', NEW.patient_name,
        'medications', NEW.medications
      )
    FROM vendors v WHERE v.id = NEW.sent_to_vendor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_vendor_prescription ON public.prescriptions;
CREATE TRIGGER trg_notify_vendor_prescription
  AFTER UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION notify_vendor_new_prescription();
