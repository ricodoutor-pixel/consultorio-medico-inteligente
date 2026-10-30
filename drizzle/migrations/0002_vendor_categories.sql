ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS vendor_category text NOT NULL DEFAULT 'farmacia';
ALTER TABLE public.vendors ADD CONSTRAINT vendors_vendor_category_check CHECK (vendor_category IN ('farmacia','importador','associacao'));
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS kyc_documents jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.vendors.vendor_category IS 'Shopping partner category: farmacia, importador or associacao; all list in the same Shopping page';
COMMENT ON COLUMN public.vendors.kyc_documents IS 'Map of KYC document kind -> storage path in pharmacy-kyc-documents bucket';