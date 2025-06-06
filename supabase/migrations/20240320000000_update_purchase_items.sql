-- Add new columns to purchase_items table
ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS gst_percentage numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_amount numeric(10,2) DEFAULT 0;

-- Add comments to explain the new fields
COMMENT ON COLUMN public.purchase_items.gst_percentage IS 'GST percentage applied to this item';
COMMENT ON COLUMN public.purchase_items.gst_amount IS 'Calculated GST amount for this item';

-- Update existing records to have default values
UPDATE public.purchase_items 
SET 
  gst_percentage = 0,
  gst_amount = 0
WHERE gst_percentage IS NULL 
   OR gst_amount IS NULL; 