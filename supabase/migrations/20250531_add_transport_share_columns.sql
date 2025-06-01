-- Migration to add transport charge allocation columns to purchase_items table
-- This enables tracking of how transport charges are allocated based on weight

-- Add transport_share column to track per-item transport charge allocation
ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS transport_share DECIMAL(18,2) DEFAULT 0;

-- Add true_unit_price column to track unit price including transport cost
ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS true_unit_price DECIMAL(18,2) DEFAULT 0;

-- Add true_line_total column to track line total including transport cost
ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS true_line_total DECIMAL(18,2) DEFAULT 0;

-- Add comment to explain the purpose of the columns
COMMENT ON COLUMN public.purchase_items.transport_share IS 'Portion of transport charge allocated to this item based on weight';
COMMENT ON COLUMN public.purchase_items.true_unit_price IS 'Unit price including allocated transport charge';
COMMENT ON COLUMN public.purchase_items.true_line_total IS 'Line total including allocated transport charge';
