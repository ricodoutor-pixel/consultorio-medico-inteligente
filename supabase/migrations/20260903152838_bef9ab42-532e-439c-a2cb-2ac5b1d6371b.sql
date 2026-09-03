ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS mp_collector_id text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS shipping_carrier text,
  ADD COLUMN IF NOT EXISTS shipping_days integer,
  ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS vendor_net_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS split_details jsonb,
  ADD COLUMN IF NOT EXISTS settlement_receipt jsonb,
  ADD COLUMN IF NOT EXISTS tracking_url text;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS split_details jsonb,
  ADD COLUMN IF NOT EXISTS settlement_receipt jsonb;