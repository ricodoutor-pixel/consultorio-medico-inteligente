-- =======================================================================================
-- ADD B2B & PRODUCTS TABLES FOR E-COMMERCE / MARKETPLACE
-- =======================================================================================

-- 1. Table: products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  compare_price numeric(10,2),
  category text,
  image_url text,
  image_url_2 text,
  image_url_3 text,
  stock integer NOT NULL DEFAULT 0,
  sold_count integer NOT NULL DEFAULT 0,
  rating numeric(3,2),
  review_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  requires_prescription boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Table: b2b_orders
CREATE TABLE IF NOT EXISTS public.b2b_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  vendor_id uuid REFERENCES auth.users(id),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. RLS Setup
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_orders ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "Public can view active products" 
  ON public.products FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Vendors can manage their own products" 
  ON public.products FOR ALL 
  USING (auth.uid() = vendor_id);

-- B2B Orders Policies
CREATE POLICY "Users can view their own orders" 
  ON public.b2b_orders FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = vendor_id);

CREATE POLICY "Users can insert their own orders" 
  ON public.b2b_orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update their orders" 
  ON public.b2b_orders FOR UPDATE 
  USING (auth.uid() = vendor_id);

-- 4. Initial Seed for Products (To avoid empty state)
INSERT INTO public.products (name, description, price, category, stock, image_url, is_active, requires_prescription)
VALUES 
  ('Óleo de CBD Full Spectrum 10%', 'Óleo premium para alívio de dor e ansiedade. 100% orgânico.', 299.90, 'Óleos e Extratos', 50, '/src/assets/products/oleo-cbd-1.jpg', true, true),
  ('Cápsulas de CBD+CBN', 'Cápsulas para indução de sono profundo e reparador.', 189.50, 'Cápsulas', 30, '/src/assets/products/capsulas-1.jpg', true, true),
  ('Gummies de CBD - Sabor Frutas Vermelhas', 'Balas de goma com CBD para bem-estar diário.', 149.00, 'Comestíveis', 100, '/src/assets/products/gummies-1.jpg', true, false)
ON CONFLICT DO NOTHING;
