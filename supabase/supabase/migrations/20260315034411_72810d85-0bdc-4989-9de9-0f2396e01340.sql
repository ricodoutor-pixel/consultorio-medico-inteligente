ALTER TABLE public.payment_webhooks 
ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS doctor_payout numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS split_processed boolean DEFAULT false;