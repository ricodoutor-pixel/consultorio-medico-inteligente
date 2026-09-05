ALTER TABLE public.vendor_products
  ADD COLUMN IF NOT EXISTS is_featured_offer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_label text NOT NULL DEFAULT 'oferta';

ALTER TABLE public.vendor_products
  DROP CONSTRAINT IF EXISTS vendor_products_offer_label_check;

ALTER TABLE public.vendor_products
  ADD CONSTRAINT vendor_products_offer_label_check CHECK (offer_label IN ('oferta','promocao'));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_vendor_featured_offer
  ON public.vendor_products (vendor_id)
  WHERE is_featured_offer = true;