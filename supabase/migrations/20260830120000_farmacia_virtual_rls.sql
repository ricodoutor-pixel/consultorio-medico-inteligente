-- ============================================================
-- SCRIPT CONSOLIDADO: FARMÁCIA VIRTUAL & DISPENSAÇÃO COMPLETA
-- Execute este script completo no Supabase SQL Editor
-- ============================================================

-- 1. Tabela VENDORS (Lojas / Farmácias)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    store_name TEXT NOT NULL DEFAULT 'Farmácia Planta y Raíz',
    store_description TEXT DEFAULT 'Farmácia de manipulação e dispensação de fitocanabinoides regulados ANVISA.',
    store_logo_url TEXT DEFAULT '/dr-verdinho.png',
    store_banner_url TEXT,
    balance NUMERIC(12,2) DEFAULT 0.00,
    total_sales INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT true,
    razao_social TEXT,
    nome_fantasia TEXT,
    cnpj VARCHAR(20),
    responsavel_tecnico TEXT,
    crf_numero TEXT,
    crf_uf VARCHAR(2),
    anvisa_afe TEXT,
    anvisa_ae TEXT,
    telefone_whatsapp TEXT,
    endereco_completo JSONB,
    is_kyc_approved BOOLEAN DEFAULT true,
    pix_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir colunas na tabela vendors caso ela já existisse
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT 'Farmácia Planta y Raíz',
  ADD COLUMN IF NOT EXISTS store_description TEXT DEFAULT 'Farmácia de manipulação e dispensação regulada.',
  ADD COLUMN IF NOT EXISTS store_logo_url TEXT DEFAULT '/dr-verdinho.png',
  ADD COLUMN IF NOT EXISTS store_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pix_key TEXT;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors select policy" ON public.vendors;
CREATE POLICY "Vendors select policy" ON public.vendors
    FOR SELECT TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Vendors manage own profile" ON public.vendors;
CREATE POLICY "Vendors manage own profile" ON public.vendors
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');

-- 2. Tabela VENDOR_PRODUCTS (Produtos da Farmácia - Limite 10)
CREATE TABLE IF NOT EXISTS public.vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    compare_price NUMERIC(10,2),
    category TEXT NOT NULL DEFAULT 'oleo',
    image_url TEXT NOT NULL,
    image_url_2 TEXT,
    image_url_3 TEXT,
    stock INTEGER DEFAULT 50 NOT NULL,
    sold_count INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir colunas em vendor_products
ALTER TABLE public.vendor_products
  ADD COLUMN IF NOT EXISTS compare_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS image_url_2 TEXT,
  ADD COLUMN IF NOT EXISTS image_url_3 TEXT,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON public.vendor_products;
CREATE POLICY "Public can view active products" ON public.vendor_products
    FOR SELECT TO authenticated, anon
    USING (is_active = true);

DROP POLICY IF EXISTS "Vendors can manage own products" ON public.vendor_products;
CREATE POLICY "Vendors can manage own products" ON public.vendor_products
    FOR ALL TO authenticated
    USING (
        vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
        OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    );

-- 3. Tabela VENDOR_TRANSACTIONS (Extrato e Splits 95% / 5%)
CREATE TABLE IF NOT EXISTS public.vendor_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.vendor_products(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES auth.users(id),
    type TEXT DEFAULT 'venda',
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    vendor_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'completed',
    payment_method TEXT DEFAULT 'PIX',
    payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vendor_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view transactions" ON public.vendor_transactions;
CREATE POLICY "Vendors can view transactions" ON public.vendor_transactions
    FOR ALL TO authenticated
    USING (
        vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
        OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    );

-- 4. Tabela NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view their notifications" ON public.notifications;
CREATE POLICY "Users view their notifications" ON public.notifications
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br');

-- 5. Atualizar Colunas na Tabela PRESCRIPTIONS
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS sent_to_vendor_id UUID REFERENCES public.vendors(id),
  ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispensed_by_vendor_id UUID REFERENCES public.vendors(id),
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT;

-- Políticas RLS para Prescriptions
DROP POLICY IF EXISTS "Vendors view prescriptions sent to them" ON public.prescriptions;
CREATE POLICY "Vendors view prescriptions sent to them"
  ON public.prescriptions FOR SELECT TO authenticated
  USING (
    sent_to_vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
    OR auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br'
    OR patient_id = auth.uid()
    OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
  );

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

-- 6. Trigger: Limite de 10 produtos ativos por Farmácia
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

-- 7. View de Rastreamento 360
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

-- 8. Trigger de Notificação em Tempo Real ao receber receita
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

-- 9. Auto-Provisionamento de Vendor Oficial para contato@plantayraiz.com.br
DO $$
DECLARE
  v_user_id UUID;
  v_vendor_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'contato@plantayraiz.com.br' LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE user_id = v_user_id) THEN
      INSERT INTO public.vendors (
        user_id,
        store_name,
        store_description,
        store_logo_url,
        balance,
        total_sales,
        rating,
        is_active,
        is_kyc_approved
      ) VALUES (
        v_user_id,
        'Farmácia Planta y Raíz (Oficial)',
        'Farmácia de manipulação e dispensação de fitocanabinoides regulados ANVISA.',
        '/dr-verdinho.png',
        14250.00,
        38,
        5.00,
        true,
        true
      ) RETURNING id INTO v_vendor_id;

      -- Inserir produtos de amostra para a vitrine
      INSERT INTO public.vendor_products (vendor_id, name, description, price, compare_price, category, image_url, stock)
      VALUES 
      (v_vendor_id, 'Óleo CBD Full Spectrum 1000mg', 'Concentração 1000mg/30ml. Extração supercrítica com laudo COA.', 320.00, 380.00, 'oleo', '/dr-verdinho.png', 50),
      (v_vendor_id, 'Cápsulas CBD 25mg (60 un)', 'Cápsulas moles de liberação prolongada para tratamento contínuo.', 290.00, 340.00, 'capsula', '/dr-verdinho.png', 35),
      (v_vendor_id, 'Pomada Tópica CBD + Arnica 50g', 'Ação analgésica e anti-inflamatória localizada para dores musculares.', 180.00, 220.00, 'topico', '/dr-verdinho.png', 40);
    END IF;
  END IF;
END $$;
