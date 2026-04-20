-- Storage RLS Policies for entry-photos bucket
-- Run this in Supabase SQL Editor to allow authenticated users to upload their own photos

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'entry-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'entry-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'entry-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access (since bucket is public)
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'entry-photos');

