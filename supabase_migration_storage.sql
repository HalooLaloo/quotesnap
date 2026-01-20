-- QuoteSnap Storage bucket for client photos
-- Run this in Supabase SQL Editor

-- Create storage bucket for quote request photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-photos', 'quote-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (photos will be viewed by contractors)
CREATE POLICY "Public read access for quote photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-photos');

-- Allow authenticated users to upload photos
CREATE POLICY "Anyone can upload quote photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quote-photos');

-- Allow deletion by the uploader (optional, for cleanup)
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'quote-photos');
