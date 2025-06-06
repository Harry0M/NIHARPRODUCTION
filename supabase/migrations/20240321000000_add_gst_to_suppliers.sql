-- Add gst column to suppliers table
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS gst text;

-- Add gst column to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS gst text; 