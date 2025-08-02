-- Create the print_designs storage bucket (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'print_designs', 'print_designs', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'print_designs');

-- Update bucket to be public if it exists but isn't public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'print_designs' AND public = false;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload print design images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Print Design Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update print design images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete print design images" ON storage.objects;

-- Create policy to allow authenticated users to upload print design images
CREATE POLICY "Allow authenticated users to upload print design images"
ON "storage"."objects"
AS permissive
FOR insert
TO public
WITH CHECK (((bucket_id = 'print_designs'::text) AND (auth.role() = 'authenticated'::text)));

-- Create policy for public access to print design images
CREATE POLICY "Public Access to Print Design Images"
ON "storage"."objects"
AS permissive
FOR select
TO public
USING ((bucket_id = 'print_designs'::text));

-- Create policy to allow authenticated users to update print design images
CREATE POLICY "Allow authenticated users to update print design images"
ON "storage"."objects"
AS permissive
FOR update
TO public
USING (((bucket_id = 'print_designs'::text) AND (auth.role() = 'authenticated'::text)));

-- Create policy to allow authenticated users to delete print design images
CREATE POLICY "Allow authenticated users to delete print design images"
ON "storage"."objects"
AS permissive
FOR delete
TO public
USING (((bucket_id = 'print_designs'::text) AND (auth.role() = 'authenticated'::text)));
