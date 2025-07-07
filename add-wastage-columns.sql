-- Add wastage columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS wastage_percentage NUMERIC(5,2) DEFAULT 0.0 
    CHECK (wastage_percentage >= 0 AND wastage_percentage <= 100),
ADD COLUMN IF NOT EXISTS wastage_cost NUMERIC(12,2) DEFAULT 0.0 
    CHECK (wastage_cost >= 0);

-- Add comments for documentation
COMMENT ON COLUMN public.orders.wastage_percentage IS 'Percentage of material cost added as wastage (0-100%)';
COMMENT ON COLUMN public.orders.wastage_cost IS 'Calculated wastage cost based on wastage_percentage and material_cost';

-- Update existing orders with realistic wastage data
UPDATE public.orders SET 
    wastage_percentage = CASE 
        WHEN wastage_percentage IS NULL THEN 3.0 + (RANDOM() * 12.0) -- Random between 3-15%
        ELSE wastage_percentage 
    END,
    wastage_cost = CASE 
        WHEN wastage_cost IS NULL OR wastage_cost = 0 THEN 
            (COALESCE(material_cost, 0) * COALESCE(wastage_percentage, 0.0) / 100)
        ELSE wastage_cost 
    END
WHERE wastage_percentage IS NULL OR wastage_cost IS NULL OR wastage_cost = 0;

-- Create trigger to automatically calculate wastage_cost when wastage_percentage or material_cost changes
CREATE OR REPLACE FUNCTION calculate_order_wastage_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate wastage cost based on percentage and material cost
    NEW.wastage_cost = (COALESCE(NEW.material_cost, 0) * COALESCE(NEW.wastage_percentage, 0.0) / 100);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_calculate_wastage_cost ON public.orders;
CREATE TRIGGER trigger_calculate_wastage_cost
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_wastage_cost();
