
-- Create strain_images table to cache generated images
CREATE TABLE public.strain_images (
  id SERIAL PRIMARY KEY,
  strain_id INTEGER NOT NULL UNIQUE,
  strain_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strain_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access (images are public content)
CREATE POLICY "Anyone can view strain images"
  ON public.strain_images FOR SELECT
  USING (true);

-- Create storage bucket for strain images
INSERT INTO storage.buckets (id, name, public)
VALUES ('strain-images', 'strain-images', true);

-- Allow public read access to strain images bucket
CREATE POLICY "Public read access for strain images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'strain-images');

-- Allow service role to insert images (edge functions)
CREATE POLICY "Service role can upload strain images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'strain-images');
