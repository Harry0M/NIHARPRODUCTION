-- Add wastage percentage and wastage cost fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS wastage_percentage NUMERIC(5,2) DEFAULT 5.0 CHECK (wastage_percentage >= 0 AND wastage_percentage <= 100),
ADD COLUMN IF NOT EXISTS wastage_cost NUMERIC(12,2) DEFAULT 0.0 CHECK (wastage_cost >= 0);

-- Add comments for documentation
COMMENT ON COLUMN public.orders.wastage_percentage IS 'Percentage of material cost added as wastage (0-100%)';
COMMENT ON COLUMN public.orders.wastage_cost IS 'Calculated wastage cost based on wastage_percentage and material_cost';
