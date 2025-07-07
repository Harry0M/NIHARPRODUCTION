-- Add wastage percentage and wastage cost fields to orders table
-- This migration adds columns to track material wastage in orders

-- Check if columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add wastage_percentage column
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='wastage_percentage'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN wastage_percentage NUMERIC(5,2) DEFAULT 0.0 
        CHECK (wastage_percentage >= 0 AND wastage_percentage <= 100);
        
        COMMENT ON COLUMN public.orders.wastage_percentage 
        IS 'Percentage of material cost added as wastage (0-100%)';
    END IF;

    -- Add wastage_cost column
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='wastage_cost'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN wastage_cost NUMERIC(12,2) DEFAULT 0.0 
        CHECK (wastage_cost >= 0);
        
        COMMENT ON COLUMN public.orders.wastage_cost 
        IS 'Calculated wastage cost based on wastage_percentage and material_cost';
    END IF;
END $$;

-- Update existing orders with calculated wastage data
-- This will populate the wastage fields for existing orders
UPDATE public.orders 
SET 
    wastage_percentage = CASE 
        WHEN wastage_percentage IS NULL THEN 0.0 
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
    -- Calculate wastage cost based on material cost and wastage percentage
    IF NEW.material_cost IS NOT NULL AND NEW.wastage_percentage IS NOT NULL THEN
        NEW.wastage_cost = (NEW.material_cost * NEW.wastage_percentage / 100);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_calculate_wastage_cost ON public.orders;
CREATE TRIGGER trigger_calculate_wastage_cost
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_wastage_cost();

-- Add some sample data for testing (optional)
-- This creates some realistic wastage percentages for testing
DO $$
BEGIN
    -- Only run if there are orders in the table
    IF EXISTS (SELECT 1 FROM public.orders LIMIT 1) THEN
        -- Update some orders with varied wastage percentages for testing
        UPDATE public.orders 
        SET wastage_percentage = 
            CASE 
                WHEN id IN (SELECT id FROM public.orders ORDER BY RANDOM() LIMIT (SELECT COUNT(*)/4 FROM public.orders)) THEN 3.0 + (RANDOM() * 4.0) -- 3-7%
                WHEN id IN (SELECT id FROM public.orders ORDER BY RANDOM() LIMIT (SELECT COUNT(*)/4 FROM public.orders)) THEN 7.0 + (RANDOM() * 6.0) -- 7-13%
                WHEN id IN (SELECT id FROM public.orders ORDER BY RANDOM() LIMIT (SELECT COUNT(*)/4 FROM public.orders)) THEN 2.0 + (RANDOM() * 3.0) -- 2-5%
                ELSE 5.0 + (RANDOM() * 5.0) -- 5-10%
            END;
    END IF;
END $$;
